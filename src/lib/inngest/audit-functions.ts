/**
 * Inngest Audit Functions
 *
 * Background job functions for running SEO audits.
 * Orchestrates the multi-step audit process with retry handling.
 * Implements independent step execution - each step can fail without affecting others.
 */

import { inngest } from '@/lib/inngest'
import {
  startAudit,
  updateAuditProgress,
  saveStepResult,
  completeAudit,
  failAudit,
  getAudit,
} from '@/lib/db/audit-operations'
import { AuditStatus } from '@prisma/client'
import type {
  OnPageStepResult,
  SerpStepResult,
  BacklinksStepResult,
  BusinessStepResult,
  CompetitorStepResult,
  SEOCompetitorMetrics,
  AuditStepErrors,
  KeywordData,
  SerpFeatures,
  ReferringDomainData,
  AnchorData,
  SerpFeaturesSummary,
} from '@/types/audit'
import { getDataForSEOClient } from '@/lib/dataforseo'
import { OnPageModule } from '@/lib/dataforseo/modules/onpage'
import { SerpModule } from '@/lib/dataforseo/modules/serp'
import { BacklinksModule } from '@/lib/dataforseo/modules/backlinks'
import { BusinessModule } from '@/lib/dataforseo/modules/business'
import { LabsModule } from '@/lib/dataforseo/modules/labs'
import { createStepError } from '@/lib/dataforseo/types'
import { getGooglePlacesClient, type NormalizedGBPData } from '@/lib/google-places'
import { enrichKeywordsWithHistoricalData } from '@/lib/dataforseo/utils'

/** Default dental keywords for SERP tracking */
const DEFAULT_DENTAL_KEYWORDS = [
  'dentist near me',
  'dental clinic',
  'family dentist',
  'emergency dentist',
  'teeth whitening',
  'dental implants',
  'orthodontist near me',
  'pediatric dentist',
]

/**
 * Main audit orchestrator function
 * Coordinates the multi-step audit process with independent step execution.
 * Each step can fail without failing others - the audit completes with available data.
 */
export const runAuditOrchestrator = inngest.createFunction(
  {
    id: 'audit-orchestrator',
    retries: 3,
    // Note: Inngest handles backoff automatically with exponential delays
    // For custom delays, we use RetryAfterError in error handling
    onFailure: async ({ event, error }) => {
      const auditId = event.data.event.data.auditId
      const stepError = createStepError(error)
      await failAudit({
        auditId,
        error: stepError.message ?? 'Audit orchestration failed',
        errorCategory: stepError.category,
      })
    },
  },
  { event: 'audit/requested' },
  async ({ event, step }) => {
    const { auditId, domain, options, businessName, location, gmbPlaceId, targetKeywords, competitorDomains } = event.data
    const startTime = Date.now()

    // Verify audit exists
    const audit = await step.run('verify-audit', async () => {
      const result = await getAudit(auditId)
      if (!result) {
        throw new Error(`Audit ${auditId} not found`)
      }
      return result
    })

    // Start the audit
    await step.run('start-audit', async () => {
      await startAudit(auditId)
    })

    // Initialize DataForSEO client and modules
    const client = getDataForSEOClient()
    const onPageModule = new OnPageModule(client)
    const serpModule = new SerpModule(client)
    const labsModule = new LabsModule(client)
    const backlinksModule = new BacklinksModule(client)
    const businessModule = new BusinessModule(client)

    // Track errors from steps that fail but allow audit to continue
    const stepErrors: AuditStepErrors = {}

    // Step 1: OnPage Crawl (20% progress)
    // Critical step - if this fails with retryable error, retry the whole audit
    await step.run('onpage-crawl', async () => {
      await updateAuditProgress({
        auditId,
        progress: 10,
        current_step: 'onpage_crawl',
        status: AuditStatus.CRAWLING,
      })

      try {
        const result = await runOnPageStep(onPageModule, domain)
        await saveStepResult(auditId, 'onPage', result)
        await updateAuditProgress({ auditId, progress: 25 })
        return result
      } catch (error) {
        const stepError = createStepError(error)
        stepErrors.onPage = stepError

        // OnPage is critical - if retryable, let Inngest retry the whole function
        if (stepError.retryable) {
          throw error
        }

        // Permanent error - continue with null data
        console.error('OnPage step permanent error:', stepError.message)
        await updateAuditProgress({ auditId, progress: 25 })
        return null
      }
    })

    // Step 2: SERP Analysis (40% progress)
    // Uses Labs ranked_keywords API for rich data (intent, traffic, difficulty, etc.)
    await step.run('serp-analysis', async () => {
      await updateAuditProgress({
        auditId,
        progress: 30,
        current_step: 'serp_analysis',
        status: AuditStatus.ANALYZING,
      })

      try {
        // Use Labs ranked_keywords API for comprehensive keyword data
        // Pass user-specified targetKeywords for tracked keyword monitoring
        const result = await runSerpStepWithLabs(labsModule, serpModule, domain, targetKeywords, location)
        await saveStepResult(auditId, 'serp', result)
        await updateAuditProgress({ auditId, progress: 50 })
        return result
      } catch (error) {
        const stepError = createStepError(error)
        stepErrors.serp = stepError

        if (stepError.retryable) {
          throw error
        }

        console.error('SERP step permanent error:', stepError.message)
        await updateAuditProgress({ auditId, progress: 50 })
        return null
      }
    })

    // Step 3: Backlinks Analysis (60% progress) - if enabled
    if (options?.includeBacklinks !== false) {
      await step.run('backlinks-analysis', async () => {
        await updateAuditProgress({
          auditId,
          progress: 55,
          current_step: 'backlinks_analysis',
        })

        try {
          const result = await runBacklinksStep(backlinksModule, domain)
          await saveStepResult(auditId, 'backlinks', result)
          await updateAuditProgress({ auditId, progress: 70 })
          return result
        } catch (error) {
          const stepError = createStepError(error)
          stepErrors.backlinks = stepError

          if (stepError.retryable) {
            throw error
          }

          console.error('Backlinks step permanent error:', stepError.message)
          await updateAuditProgress({ auditId, progress: 70 })
          return null
        }
      })
    }

    // Step 4: Competitor Analysis (75% progress) - if competitors specified or auto-discover
    // Non-critical step - failures here don't affect other data
    // Result is saved via saveStepResult, local variable tracks completion
    const shouldRunCompetitors = competitorDomains?.length || options?.includeBacklinks !== false
    if (shouldRunCompetitors) {
      await step.run('competitor-analysis', async () => {
        await updateAuditProgress({
          auditId,
          progress: 72,
          current_step: 'competitor_analysis',
        })

        try {
          const result = await runCompetitorStep(
            labsModule,
            backlinksModule,
            domain,
            competitorDomains
          )
          await saveStepResult(auditId, 'competitors', result)
          await updateAuditProgress({ auditId, progress: 75 })
          return result
        } catch (error) {
          const stepError = createStepError(error)
          stepErrors.competitors = stepError

          // Competitor analysis is non-critical - don't retry, just continue
          console.error('Competitor step error:', stepError.message)
          await updateAuditProgress({ auditId, progress: 75 })
          return null
        }
      })
    }

    // Step 5: Business Data (85% progress) - if enabled
    // Non-critical step - failures here don't affect other data
    if (options?.includeBusinessData !== false) {
      await step.run('business-data', async () => {
        await updateAuditProgress({
          auditId,
          progress: 78,
          current_step: 'business_data',
        })

        try {
          const result = await runBusinessStep(businessModule, domain, {
            searchName: businessName || audit.domain,
            location,
            gmbPlaceId,
          })
          await saveStepResult(auditId, 'business', result)
          await updateAuditProgress({ auditId, progress: 88 })
          return result
        } catch (error) {
          const stepError = createStepError(error)
          stepErrors.business = stepError

          // Business data is non-critical - don't retry, just continue
          console.error('Business step error:', stepError.message)
          await updateAuditProgress({ auditId, progress: 88 })
          return null
        }
      })
    }

    // Complete the audit with any warnings from failed steps
    const hasWarnings = Object.keys(stepErrors).length > 0
    await step.run('complete-audit', async () => {
      await completeAudit({
        auditId,
        warnings: hasWarnings ? stepErrors : undefined,
      })
    })

    const duration = Date.now() - startTime

    // Send completion event
    await inngest.send({
      name: 'audit/completed',
      data: {
        auditId,
        duration,
      },
    })

    return {
      auditId,
      domain,
      duration,
    }
  }
)

/**
 * Verify HTTPS by attempting to fetch the domain directly
 * Returns true if HTTPS works, false otherwise
 */
async function verifyHttps(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    return response.ok || response.status < 400
  } catch {
    // Any error (network, certificate, timeout) means HTTPS doesn't work
    return false
  }
}

/**
 * Run OnPage crawl step
 * Returns extended data including DataForSEO's built-in scores
 * Throws on error - let orchestrator handle classification
 */
async function runOnPageStep(module: OnPageModule, domain: string): Promise<OnPageStepResult> {
  const url = `https://${domain}`

  // Run HTTPS verification in parallel with DataForSEO API calls
  const httpsVerificationPromise = verifyHttps(domain)

  // Get instant page audit (includes DataForSEO's onpage_score)
  const pageResult = await module.instantPageAudit({ url })

  // DEBUG: Log what we got from instant_pages API
  console.log('[OnPage DEBUG] pageResult for', domain, ':', JSON.stringify({
    hasResult: !!pageResult,
    url: pageResult?.url,
    statusCode: pageResult?.status_code,
    onpageScore: pageResult?.onpage_score,
    metaTitle: pageResult?.meta?.title,
    htags: pageResult?.meta?.htags,
  }, null, 2))

  // Get lighthouse audit for Core Web Vitals
  // Note: DataForSEO accepts: performance, seo, accessibility, pwa (not best-practices)
  const lighthouseResult = await module.lighthouseAudit({
    url,
    device: 'mobile',
    categories: ['performance', 'seo', 'accessibility'],
  })

  // Extract metrics from results (cast to access additional API fields)
  // Cast timing to Record to access all DataForSEO properties that may not be in SDK types
  const timing = pageResult?.page_timing as Record<string, unknown> | undefined
  const checks = (pageResult?.checks ?? {}) as Record<string, boolean>
  const meta = pageResult?.meta as Record<string, unknown> | undefined

  // Access extended fields from API response
  const extendedResult = pageResult as Record<string, unknown> | null

  // Extract Lighthouse category scores (0-1 scale -> 0-100)
  const lighthousePerformance = lighthouseResult?.categories?.performance?.score
    ? Math.round(lighthouseResult.categories.performance.score * 100)
    : undefined
  const lighthouseSeo = lighthouseResult?.categories?.seo?.score
    ? Math.round(lighthouseResult.categories.seo.score * 100)
    : undefined
  const lighthouseAccessibility = lighthouseResult?.categories?.accessibility?.score
    ? Math.round(lighthouseResult.categories.accessibility.score * 100)
    : undefined

  // Wait for HTTPS verification to complete
  const httpsVerified = await httpsVerificationPromise
  const httpsFromDataForSEO = Boolean(checks.is_https)

  // Check for mismatch between DataForSEO flag and direct verification
  const httpsVerificationMismatch = httpsFromDataForSEO !== httpsVerified

  if (httpsVerificationMismatch) {
    console.warn(
      `[OnPage] HTTPS verification mismatch for ${domain}: ` +
        `DataForSEO says ${httpsFromDataForSEO}, direct check says ${httpsVerified}`
    )
  }

  // Extract htags from meta
  const htags = meta?.htags as Record<string, string[]> | undefined

  // Extract content data
  const contentData = meta?.content as Record<string, unknown> | undefined

  // Extract resource errors/warnings
  const resourceErrors = extendedResult?.resource_errors as Record<string, unknown[]> | undefined

  // Extract cache control
  const cacheControl = extendedResult?.cache_control as Record<string, unknown> | undefined

  // Extract social media tags
  const socialMediaTags = meta?.social_media_tags as Record<string, string> | undefined

  // Extract spell data
  const spellData = meta?.spell as Record<string, unknown> | undefined
  const misspelledWords = spellData?.misspelled as Array<Record<string, unknown>> | undefined

  // Extract last_modified
  const lastModifiedData = extendedResult?.last_modified as Record<string, string | null> | undefined

  // Extract deprecated tags and duplicate meta tags
  const deprecatedTags = meta?.deprecated_tags as string[] | undefined
  const duplicateMetaTagsArray = meta?.duplicate_meta_tags as string[] | undefined

  // Extract Lighthouse audits - cast to Record for extended access
  const extendedLighthouse = lighthouseResult as Record<string, unknown> | null
  const lighthouseAudits = extendedLighthouse?.audits as Record<string, Record<string, unknown>> | undefined
  const auditsArray = lighthouseAudits
    ? Object.entries(lighthouseAudits).map(([id, audit]) => ({
        id,
        title: (audit.title as string) ?? '',
        description: (audit.description as string) ?? '',
        score: (audit.score as number) ?? null,
        scoreDisplayMode: (audit.scoreDisplayMode as string) ?? 'binary',
        displayValue: audit.displayValue as string | undefined,
        numericValue: audit.numericValue as number | undefined,
        numericUnit: audit.numericUnit as string | undefined,
      }))
    : []

  return {
    // Base metrics (keep for backwards compatibility)
    pagesAnalyzed: 1,
    issuesFound: countIssues(pageResult),
    pageSpeed:
      lighthousePerformance ??
      (timing?.dom_complete ? calculateSpeedScore(timing.dom_complete as number) : 50),
    mobileScore: checks.is_responsive ? 70 : 40,
    hasSchema: Boolean(checks.has_micromarkup || checks.deprecated_html_tags === false),
    httpsEnabled: httpsFromDataForSEO,
    brokenLinks: checks.broken_links ? 1 : 0,
    missingAltTags: checks.no_image_alt ? 1 : 0,
    missingMetaDescriptions: checks.no_description ? 1 : 0,

    // DataForSEO built-in scores
    onpageScore: pageResult?.onpage_score,
    lighthousePerformance,
    lighthouseSeo,
    lighthouseAccessibility,

    // HTTPS verification
    httpsVerified,
    httpsVerificationMismatch,

    // Page-level info
    pageInfo: {
      resourceType: (extendedResult?.resource_type as string) ?? null,
      statusCode: (extendedResult?.status_code as number) ?? null,
      location: (extendedResult?.location as string) ?? null,
      url: (extendedResult?.url as string) ?? url,
      acceptType: (extendedResult?.accept_type as string) ?? null,
      clickDepth: (extendedResult?.click_depth as number) ?? null,
      isResource: Boolean(extendedResult?.is_resource),
      lastModified: lastModifiedData
        ? {
            header: lastModifiedData.header ?? null,
            sitemap: lastModifiedData.sitemap ?? null,
            metaTag: lastModifiedData.meta_tag ?? null,
          }
        : null,
      customJsResponse: extendedResult?.custom_js_response ?? null,
    },

    // Full meta information
    meta: {
      title: (meta?.title as string) ?? null,
      metaTitle: (meta?.meta_title as string) ?? null,
      description: (meta?.description as string) ?? null,
      titleLength: (meta?.title_length as number) ?? 0,
      descriptionLength: (meta?.description_length as number) ?? 0,
      charset: (meta?.charset as number) ?? null,
      favicon: (meta?.favicon as string) ?? null,
      follow: Boolean(meta?.follow),
      htags: {
        h1: htags?.h1 ?? [],
        h2: htags?.h2 ?? [],
        h3: htags?.h3 ?? [],
        h4: htags?.h4,
        h5: htags?.h5,
        h6: htags?.h6,
      },
      internalLinksCount: (meta?.internal_links_count as number) ?? 0,
      externalLinksCount: (meta?.external_links_count as number) ?? 0,
      inboundLinksCount: (meta?.inbound_links_count as number) ?? 0,
      imagesCount: (meta?.images_count as number) ?? 0,
      imagesSize: (meta?.images_size as number) ?? 0,
      scriptsCount: (meta?.scripts_count as number) ?? 0,
      scriptsSize: (meta?.scripts_size as number) ?? 0,
      stylesheetsCount: (meta?.stylesheets_count as number) ?? 0,
      stylesheetsSize: (meta?.stylesheets_size as number) ?? 0,
      renderBlockingScriptsCount: (meta?.render_blocking_scripts_count as number) ?? 0,
      renderBlockingStylesheetsCount: (meta?.render_blocking_stylesheets_count as number) ?? 0,
      generator: (meta?.generator as string) ?? null,
      canonical: (meta?.canonical as string) ?? null,
      metaKeywords: (meta?.meta_keywords as string) ?? null,
      socialMediaTags: socialMediaTags ?? null,
      cumulativeLayoutShift: (meta?.cumulative_layout_shift as number) ?? null,
      deprecatedTags: deprecatedTags ?? null,
      duplicateMetaTags: duplicateMetaTagsArray ?? null,
      spell: spellData
        ? {
            hunspellLanguage: (spellData.hunspell_language_code as string) ?? null,
            misspelledWords: misspelledWords?.map((w) => w.word as string) ?? null,
          }
        : null,
    },

    // Content analysis
    content: {
      plainTextSize: (contentData?.plain_text_size as number) ?? 0,
      plainTextRate: (contentData?.plain_text_rate as number) ?? 0,
      plainTextWordCount: (contentData?.plain_text_word_count as number) ?? 0,
      automatedReadabilityIndex: (contentData?.automated_readability_index as number) ?? null,
      colemanLiauReadabilityIndex: (contentData?.coleman_liau_readability_index as number) ?? null,
      daleChallReadabilityIndex: (contentData?.dale_chall_readability_index as number) ?? null,
      fleschKincaidReadabilityIndex: (contentData?.flesch_kincaid_readability_index as number) ?? null,
      smogReadabilityIndex: (contentData?.smog_readability_index as number) ?? null,
      descriptionToContentConsistency: (contentData?.description_to_content_consistency as number) ?? null,
      titleToContentConsistency: (contentData?.title_to_content_consistency as number) ?? null,
      metaKeywordsToContentConsistency:
        (contentData?.meta_keywords_to_content_consistency as number) ?? null,
    },

    // Page timing
    timing: {
      timeToInteractive: (timing?.time_to_interactive as number) ?? null,
      domComplete: (timing?.dom_complete as number) ?? null,
      largestContentfulPaint: (timing?.largest_contentful_paint as number) ?? null,
      firstInputDelay: (timing?.first_input_delay as number) ?? null,
      connectionTime: (timing?.connection_time as number) ?? null,
      timeToSecureConnection: (timing?.time_to_secure_connection as number) ?? null,
      requestSentTime: (timing?.request_sent_time as number) ?? null,
      waitingTime: (timing?.waiting_time as number) ?? null,
      downloadTime: (timing?.download_time as number) ?? null,
      durationTime: (timing?.duration_time as number) ?? null,
      fetchStart: (timing?.fetch_start as number) ?? null,
      fetchEnd: (timing?.fetch_end as number) ?? null,
    },

    // SEO checks - ALL fields
    checks: {
      // URL & Protocol checks
      isWww: Boolean(checks.is_www),
      isHttps: Boolean(checks.is_https),
      isHttp: Boolean(checks.is_http),
      isBroken: Boolean(checks.is_broken),
      isRedirect: Boolean(checks.is_redirect),
      is4xxCode: Boolean(checks.is_4xx_code),
      is5xxCode: Boolean(checks.is_5xx_code),
      seoFriendlyUrl: Boolean(checks.seo_friendly_url),
      seoFriendlyUrlCharactersCheck: Boolean(checks.seo_friendly_url_characters_check),
      seoFriendlyUrlDynamicCheck: Boolean(checks.seo_friendly_url_dynamic_check),
      seoFriendlyUrlKeywordsCheck: Boolean(checks.seo_friendly_url_keywords_check),
      seoFriendlyUrlRelativeLengthCheck: Boolean(checks.seo_friendly_url_relative_length_check),

      // HTML Structure checks
      hasHtmlDoctype: Boolean(checks.has_html_doctype),
      noDoctype: Boolean(checks.no_doctype),
      frame: Boolean(checks.frame),
      flash: Boolean(checks.flash),
      deprecatedHtmlTags: Boolean(checks.deprecated_html_tags),
      hasRenderBlockingResources: Boolean(checks.has_render_blocking_resources),
      hasMetaRefreshRedirect: Boolean(checks.has_meta_refresh_redirect),
      duplicateMetaTags: Boolean(checks.duplicate_meta_tags),
      duplicateTitleTag: Boolean(checks.duplicate_title_tag),

      // Meta checks
      canonical: Boolean(checks.canonical),
      noEncodingMetaTag: Boolean(checks.no_encoding_meta_tag),
      metaCharsetConsistency: Boolean(checks.meta_charset_consistency),
      hasMicromarkup: Boolean(checks.has_micromarkup),
      hasMicromarkupErrors: Boolean(checks.has_micromarkup_errors),

      // Title checks
      titleTooShort: Boolean(checks.title_too_short),
      titleTooLong: Boolean(checks.title_too_long),
      noTitle: Boolean(checks.no_title),
      hasMetaTitle: Boolean(checks.has_meta_title),
      duplicateTitle: Boolean(checks.duplicate_title),
      irrelevantTitle: Boolean(checks.irrelevant_title),

      // Description checks
      noDescription: Boolean(checks.no_description),
      irrelevantDescription: Boolean(checks.irrelevant_description),
      duplicateDescription: Boolean(checks.duplicate_description),

      // Content checks
      lowContentRate: Boolean(checks.low_content_rate),
      highContentRate: Boolean(checks.high_content_rate),
      lowCharacterCount: Boolean(checks.low_character_count),
      highCharacterCount: Boolean(checks.high_character_count),
      lowReadabilityRate: Boolean(checks.low_readability_rate),
      duplicateContent: Boolean(checks.duplicate_content),
      loremIpsum: Boolean(checks.lorem_ipsum),
      hasMisspelling: Boolean(checks.has_misspelling),
      noH1Tag: Boolean(checks.no_h1_tag),
      irrelevantMetaKeywords: Boolean(checks.irrelevant_meta_keywords),

      // Image checks
      noImageAlt: Boolean(checks.no_image_alt),
      noImageTitle: Boolean(checks.no_image_title),

      // Performance checks
      highLoadingTime: Boolean(checks.high_loading_time),
      highWaitingTime: Boolean(checks.high_waiting_time),
      noContentEncoding: Boolean(checks.no_content_encoding),

      // Size checks
      smallPageSize: Boolean(checks.small_page_size),
      largePageSize: Boolean(checks.large_page_size),
      sizeGreaterThan3mb: Boolean(checks.size_greater_than_3mb),

      // Security checks
      httpsToHttpLinks: Boolean(checks.https_to_http_links),

      // Resource checks
      brokenResources: Boolean(checks.broken_resources),
      brokenLinks: Boolean(checks.broken_links),
      noFavicon: Boolean(checks.no_favicon),
    },

    // Resources
    resources: {
      totalDomSize: (extendedResult?.total_dom_size as number) ?? 0,
      size: (extendedResult?.size as number) ?? 0,
      encodedSize: (extendedResult?.encoded_size as number) ?? 0,
      totalTransferSize: (extendedResult?.total_transfer_size as number) ?? 0,
      contentEncoding: (extendedResult?.content_encoding as string) ?? null,
      mediaType: (extendedResult?.media_type as string) ?? null,
      server: (extendedResult?.server as string) ?? null,
      urlLength: (extendedResult?.url_length as number) ?? 0,
      relativeUrlLength: (extendedResult?.relative_url_length as number) ?? 0,
      cacheControl: cacheControl
        ? {
            cachable: Boolean(cacheControl.cachable),
            ttl: (cacheControl.ttl as number) ?? null,
          }
        : null,
      warnings: ((resourceErrors?.warnings ?? []) as Array<Record<string, unknown>>).map((w) => ({
        line: (w.line as number) ?? 0,
        column: (w.column as number) ?? 0,
        message: (w.message as string) ?? '',
        statusCode: (w.status_code as number) ?? 0,
      })),
      fetchTime: (extendedResult?.fetch_time as string) ?? null,
    },

    // Full Lighthouse data (use extendedLighthouse for snake_case API fields)
    lighthouse: {
      version: (extendedLighthouse?.lighthouse_version as string) ?? null,
      fetchTime: (extendedLighthouse?.fetch_time as string) ?? null,
      userAgent: (extendedLighthouse?.user_agent as string) ?? null,
      environment: extendedLighthouse?.environment
        ? {
            networkUserAgent:
              ((extendedLighthouse.environment as Record<string, unknown>)
                .network_user_agent as string) ?? null,
            hostUserAgent:
              ((extendedLighthouse.environment as Record<string, unknown>).host_user_agent as string) ??
              null,
            benchmarkIndex:
              ((extendedLighthouse.environment as Record<string, unknown>)
                .benchmark_index as number) ?? null,
          }
        : null,
      categories: {
        performance: lighthouseResult?.categories?.performance
          ? {
              id: 'performance',
              title: (lighthouseResult.categories.performance.title as string) ?? 'Performance',
              score: lighthouseResult.categories.performance.score ?? null,
              description: (lighthouseResult.categories.performance.description as string) ?? undefined,
            }
          : null,
        seo: lighthouseResult?.categories?.seo
          ? {
              id: 'seo',
              title: (lighthouseResult.categories.seo.title as string) ?? 'SEO',
              score: lighthouseResult.categories.seo.score ?? null,
              description: (lighthouseResult.categories.seo.description as string) ?? undefined,
            }
          : null,
        accessibility: lighthouseResult?.categories?.accessibility
          ? {
              id: 'accessibility',
              title: (lighthouseResult.categories.accessibility.title as string) ?? 'Accessibility',
              score: lighthouseResult.categories.accessibility.score ?? null,
              description: (lighthouseResult.categories.accessibility.description as string) ?? undefined,
            }
          : null,
      },
      audits: auditsArray,
    },
  }
}

/**
 * Convert user-entered location (e.g., "Boston, MA") to DataForSEO location name format
 * Format: "City,State,United States"
 */
function formatLocationName(location?: string): string | undefined {
  if (!location) return undefined

  // Parse "City, State" or "City, ST" format
  const parts = location.split(',').map((p) => p.trim())
  const city = parts[0]
  const stateRaw = parts[1]

  // Need at least city and state
  if (!city || !stateRaw) return undefined

  const stateAbbr = stateRaw.toUpperCase()

  // Map state abbreviations to full names
  const stateMap: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'District of Columbia',
  }

  const stateName = stateMap[stateAbbr] ?? stateAbbr
  return `${city},${stateName},United States`
}

/**
 * Run SERP analysis step with Labs API for discovery data
 * Combines Labs ranked_keywords (discovery) with SERP tracking (monitored keywords)
 * Returns rich keyword data including intent, traffic, difficulty, and movement.
 *
 * @param labsModule - Labs API module
 * @param serpModule - SERP API module
 * @param domain - Target domain
 * @param trackedKeywordsList - User-specified keywords to track
 * @param location - User's location (e.g., "Boston, MA") for local SERP results
 */
async function runSerpStepWithLabs(
  labsModule: LabsModule,
  serpModule: SerpModule,
  domain: string,
  trackedKeywordsList?: string[],
  location?: string
): Promise<SerpStepResult> {
  // Convert location to DataForSEO format
  const locationName = formatLocationName(location)
  console.log(`[SERP Step] Using location: ${locationName ?? 'United States (default)'}`)
  // Initialize aggregates
  let totalEtv = 0
  let totalTrafficCost = 0
  let localPackPresence = false
  let featuredSnippets = 0

  // SERP features summary
  const featureCounts: SerpFeaturesSummary = {
    localPack: 0,
    featuredSnippet: 0,
    peopleAlsoAsk: 0,
    images: 0,
    video: 0,
    reviews: 0,
    sitelinks: 0,
    knowledgePanel: 0,
    shopping: 0,
    aiOverview: 0,
  }

  // =========================================================================
  // PART 1: Labs Discovery - Get all keywords domain ranks for
  // =========================================================================
  const discoveryKeywords: KeywordData[] = []

  try {
    const rankedKeywords = await labsModule.getRankedKeywords({
      target: domain,
      limit: 100,
      itemTypes: ['organic', 'local_pack', 'featured_snippet'],
      // Use location-specific data if provided
      ...(locationName ? { locationName } : {}),
    })

    for (const item of rankedKeywords) {
      // Cast to access extended fields not in our strict schema
      const extItem = item as Record<string, unknown>
      const keywordData = extItem.keyword_data as Record<string, unknown> | undefined
      const rankedElement = extItem.ranked_serp_element as Record<string, unknown> | undefined
      const serpItem = rankedElement?.serp_item as Record<string, unknown> | undefined
      const keywordInfo = keywordData?.keyword_info as Record<string, unknown> | undefined
      // rank_changes is inside serp_item, not at root level
      const rankChanges = serpItem?.rank_changes as Record<string, unknown> | undefined
      // serp_info can be at rankedElement level or keyword_data level
      const serpInfo = (rankedElement?.serp_info ?? keywordData?.serp_info) as
        | Record<string, unknown>
        | undefined

      // Extract position
      const position = (serpItem?.rank_absolute as number) ?? null

      // Extract movement flags - these are inside rank_changes object
      const isNew = rankChanges?.is_new === true
      const isUp = rankChanges?.is_up === true
      const previousPosition = (rankChanges?.previous_rank_absolute as number) ?? null

      // Extract ETV and traffic cost
      const etv = (serpItem?.etv as number) ?? 0
      const trafficCost =
        (serpItem?.estimated_paid_traffic_cost as number) ??
        (keywordInfo?.cpc as number | null) ??
        0

      // Extract SERP features for this keyword
      // serp_item_types is directly on ranked_serp_element OR in keyword_data.serp_info
      const serpItemTypes =
        (rankedElement?.serp_item_types as string[]) ??
        (serpInfo?.serp_item_types as string[]) ??
        []
      const serpFeatures: SerpFeatures = {
        featuredSnippet: serpItemTypes.includes('featured_snippet'),
        localPack: serpItemTypes.includes('local_pack'),
        peopleAlsoAsk: serpItemTypes.includes('people_also_ask'),
        images: serpItemTypes.includes('images'),
        video: serpItemTypes.includes('video'),
        reviews: serpItemTypes.includes('reviews'),
        sitelinks: serpItemTypes.includes('site_links'),
        knowledgePanel: serpItemTypes.includes('knowledge_graph'),
        shopping: serpItemTypes.includes('shopping'),
      }

      // Build keyword entry
      const keyword: KeywordData = {
        keyword: (keywordData?.keyword as string) ?? '',
        position,
        previousPosition,
        searchVolume: (keywordInfo?.search_volume as number) ?? null,
        cpc: (keywordInfo?.cpc as number) ?? null,
        serpFeatures,
        url: (serpItem?.url as string) ?? null,
        etv,
        trafficCost,
        competition: (keywordInfo?.competition as number) ?? undefined,
        competitionLevel:
          (keywordInfo?.competition_level as 'LOW' | 'MEDIUM' | 'HIGH') ?? undefined,
        isNew,
        isUp,
      }

      discoveryKeywords.push(keyword)

      // Update aggregates
      totalEtv += etv
      totalTrafficCost += trafficCost

      // Update SERP features summary
      if (serpFeatures.featuredSnippet) {
        featureCounts.featuredSnippet++
        featuredSnippets++
      }
      if (serpFeatures.localPack) {
        featureCounts.localPack++
        localPackPresence = true
      }
      if (serpFeatures.peopleAlsoAsk) featureCounts.peopleAlsoAsk++
      if (serpFeatures.images) featureCounts.images++
      if (serpFeatures.video) featureCounts.video++
      if (serpFeatures.reviews) featureCounts.reviews++
      if (serpFeatures.sitelinks) featureCounts.sitelinks++
      if (serpFeatures.knowledgePanel) featureCounts.knowledgePanel++
      if (serpFeatures.shopping) featureCounts.shopping++
      if (serpItemTypes.includes('ai_overview')) featureCounts.aiOverview++
    }
  } catch (error) {
    console.error('Labs ranked keywords error:', error)
    // Continue without discovery data - we can still do tracked keywords
  }

  // =========================================================================
  // PART 2: Tracked Keywords - Monitor specific keywords over time
  // =========================================================================
  const trackedKeywords: KeywordData[] = []
  const keywords = trackedKeywordsList ?? DEFAULT_DENTAL_KEYWORDS

  // Build location options for SERP queries
  const locationOptions = locationName ? { locationName } : undefined

  for (const keyword of keywords.slice(0, 15)) {
    try {
      const ranking = await serpModule.findDomainRanking(keyword, domain, locationOptions)
      const features = await serpModule.analyzeSerpFeatures(keyword, locationOptions)

      const serpFeatures: SerpFeatures = {
        featuredSnippet: features.hasFeaturedSnippet ?? false,
        localPack: features.hasLocalPack ?? false,
        peopleAlsoAsk: false,
        images: features.hasImages ?? false,
        video: features.hasVideos ?? false,
        reviews: false,
        sitelinks: false,
        knowledgePanel: false,
        shopping: false,
      }

      trackedKeywords.push({
        keyword,
        position: ranking?.rank_absolute ?? null,
        searchVolume: null,
        cpc: null,
        serpFeatures,
        url: ranking?.url ?? null,
      })
    } catch (error) {
      console.warn(`Failed to track keyword "${keyword}":`, error)
      // Add with null position to indicate tracking failed
      trackedKeywords.push({
        keyword,
        position: null,
        searchVolume: null,
        cpc: null,
        serpFeatures: {
          featuredSnippet: false,
          localPack: false,
          peopleAlsoAsk: false,
          images: false,
          video: false,
          reviews: false,
          sitelinks: false,
          knowledgePanel: false,
          shopping: false,
        },
        url: null,
      })
    }
  }

  // =========================================================================
  // Update SERP features summary from tracked keywords
  // =========================================================================
  for (const kw of trackedKeywords) {
    const sf = kw.serpFeatures
    if (sf) {
      if (sf.featuredSnippet) featureCounts.featuredSnippet++
      if (sf.localPack) {
        featureCounts.localPack++
        localPackPresence = true
      }
      if (sf.peopleAlsoAsk) featureCounts.peopleAlsoAsk++
      if (sf.images) featureCounts.images++
      if (sf.video) featureCounts.video++
      if (sf.reviews) featureCounts.reviews++
      if (sf.sitelinks) featureCounts.sitelinks++
      if (sf.knowledgePanel) featureCounts.knowledgePanel++
      if (sf.shopping) featureCounts.shopping++
    }
  }

  // =========================================================================
  // PART 3: Enrich Keywords with Historical Data
  // =========================================================================
  // Some keywords (e.g., "dentist + city") no longer have Google Ads data.
  // We enrich them with historical data from the last available collection.
  // NOTE: Historical Keyword Data API only works with country-level locations,
  // so we always use "United States" regardless of the audit's city location.
  try {
    const enrichmentLocation = 'United States'
    console.log(`[SERP Step] Enriching keywords with historical data (location: ${enrichmentLocation})`)

    // Enrich discovery keywords
    if (discoveryKeywords.length > 0) {
      const discoveryResult = await enrichKeywordsWithHistoricalData(
        labsModule,
        discoveryKeywords,
        { locationName: enrichmentLocation }
      )
      console.log(
        `[SERP Step] Discovery keywords enriched: ${discoveryResult.enrichedCount}/${discoveryKeywords.length}`
      )
    }

    // Enrich tracked keywords
    if (trackedKeywords.length > 0) {
      const trackedResult = await enrichKeywordsWithHistoricalData(
        labsModule,
        trackedKeywords,
        { locationName: enrichmentLocation }
      )
      console.log(
        `[SERP Step] Tracked keywords enriched: ${trackedResult.enrichedCount}/${trackedKeywords.length}`
      )
    }
  } catch (error) {
    // Enrichment is optional - don't fail the entire step
    console.warn('[SERP Step] Historical enrichment failed:', error)
  }

  // =========================================================================
  // PART 4: Historical Rank Trend - Get 6 months of ranking distribution
  // =========================================================================
  let keywordTrend: Awaited<ReturnType<LabsModule['getHistoricalRankOverview']>> | undefined

  try {
    console.log('[SERP Step] Fetching historical rank overview for keyword trend chart...')
    // Historical Rank Overview API only supports country-level locations
    // Extract country from "City,State,Country" format, or default to "United States"
    const countryLocation = locationName?.split(',').pop()?.trim() || 'United States'
    keywordTrend = await labsModule.getHistoricalRankOverview({
      target: domain,
      locationName: countryLocation,
    })
    console.log(`[SERP Step] Got ${keywordTrend?.length ?? 0} months of historical data`)
  } catch (error) {
    // Historical trend is optional - don't fail the entire step
    console.warn('[SERP Step] Historical rank overview failed:', error)
  }

  // Note: Competition data is already included from Historical Keyword Data API
  // (extracted in PART 3 enrichment above)
  return {
    // SERP presence indicators
    localPackPresence,
    featuredSnippets,

    // Legacy keywords field (combine both for backward compatibility)
    keywords: [...discoveryKeywords, ...trackedKeywords],

    // Separate arrays for UI tabs
    discoveryKeywords: discoveryKeywords.length > 0 ? discoveryKeywords : undefined,
    trackedKeywords: trackedKeywords.length > 0 ? trackedKeywords : undefined,

    // SERP features summary
    serpFeaturesSummary: featureCounts,

    // Traffic estimates
    totalEtv,
    totalTrafficCost,

    // Historical rank trend (6 months) for keyword trend chart
    keywordTrend: keywordTrend && keywordTrend.length > 0 ? keywordTrend : undefined,
  }
}

/**
 * Run backlinks analysis step
 * Returns extended data including top referring domains and anchor distribution.
 * Throws on error - let orchestrator handle classification
 */
async function runBacklinksStep(
  module: BacklinksModule,
  domain: string
): Promise<BacklinksStepResult> {
  // Get backlinks summary (includes DataForSEO's rank and spam scores)
  const summary = await module.getSummary({ target: domain, includeSubdomains: true })

  if (!summary) {
    // No data but not an error - return zeros
    return {
      totalBacklinks: 0,
      referringDomains: 0,
      domainRank: 0,
      spamScore: 0,
      dofollowRatio: 0,
    }
  }

  // Calculate dofollow ratio
  const nofollowDomains = summary.referring_domains_nofollow ?? 0
  const totalDomains = summary.referring_domains
  const dofollowDomains = totalDomains - nofollowDomains
  const dofollowRatio = totalDomains > 0 ? dofollowDomains / totalDomains : 0

  // Get top referring domains (by rank)
  let topReferringDomains: ReferringDomainData[] = []
  try {
    const referringDomains = await module.getReferringDomains({
      target: domain,
      includeSubdomains: true,
      orderBy: 'rank_desc',
      limit: 10,
    })
    topReferringDomains = referringDomains.map((rd) => ({
      domain: rd.domain ?? '',
      backlinks: rd.backlinks ?? 0,
      domainRank: rd.rank ?? 0,
    }))
  } catch (error) {
    // Non-critical, continue without this data
    console.warn('Failed to fetch top referring domains:', error)
  }

  // Get anchor text distribution
  let anchorDistribution: AnchorData[] = []
  try {
    const anchors = await module.getAnchors({
      target: domain,
      includeSubdomains: true,
      limit: 10,
    })

    // Calculate total for percentage
    const totalAnchors = anchors.reduce((sum, a) => sum + (a.backlinks ?? 0), 0)

    anchorDistribution = anchors.map((a) => ({
      anchor: a.anchor ?? '',
      count: a.backlinks ?? 0,
      percentage:
        totalAnchors > 0 ? Math.round(((a.backlinks ?? 0) / totalAnchors) * 10000) / 100 : 0,
    }))
  } catch (error) {
    // Non-critical, continue without this data
    console.warn('Failed to fetch anchor distribution:', error)
  }

  return {
    // Base metrics
    totalBacklinks: summary.backlinks,
    referringDomains: summary.referring_domains,
    domainRank: summary.rank ?? 0,
    spamScore: summary.backlinks_spam_score ?? 0,
    dofollowRatio: Math.round(dofollowRatio * 100) / 100,

    // DataForSEO target spam score (for scoring engine)
    targetSpamScore: summary.info?.target_spam_score ?? undefined,

    // NEW: Top referring domains
    topReferringDomains: topReferringDomains.length > 0 ? topReferringDomains : undefined,

    // NEW: Anchor text distribution
    anchorDistribution: anchorDistribution.length > 0 ? anchorDistribution : undefined,
  }
}

/**
 * Business step options
 */
interface BusinessStepOptions {
  /** Name to search for (business name or domain) */
  searchName: string
  /** Optional location for better matching */
  location?: string
  /** Optional Google Place ID for direct lookup */
  gmbPlaceId?: string
}

/**
 * Run business data step (GMB analysis)
 * Uses Google Places API when available, falls back to DataForSEO.
 *
 * Priority order:
 * 1. If gmbPlaceId provided → Use Google Places API directly
 * 2. If businessName + location provided → Search via Google Places API
 * 3. Fall back to DataForSEO keyword search
 *
 * Throws on error - let orchestrator handle classification
 */
async function runBusinessStep(
  module: BusinessModule,
  domain: string,
  options: BusinessStepOptions
): Promise<BusinessStepResult> {
  const { searchName, location, gmbPlaceId } = options
  const normalizedDomain = domain.replace('www.', '').toLowerCase()

  // Try Google Places API first if configured and we have useful input
  const placesClient = getGooglePlacesClient()
  if (placesClient.isConfigured()) {
    try {
      let placesResult: NormalizedGBPData | null = null

      // Priority 1: Direct lookup by Place ID
      if (gmbPlaceId) {
        console.log(`[Business Step] Looking up GBP by Place ID: ${gmbPlaceId}`)
        placesResult = await placesClient.getBusinessByPlaceId(gmbPlaceId)
      }
      // Priority 2: Search by business name + location
      else if (searchName !== domain) {
        // Only use Places search if we have a real business name (not just domain)
        console.log(`[Business Step] Searching Places API for: ${searchName} ${location || ''}`)
        placesResult = await placesClient.lookupBusiness(searchName, location)
      }

      if (placesResult) {
        console.log(`[Business Step] Found GBP via Places API: ${placesResult.businessName}`)

        // Verify NAP consistency - check if website matches domain
        let napConsistent = placesResult.napConsistent
        if (placesResult.website) {
          try {
            const websiteDomain = new URL(placesResult.website).hostname
              .replace('www.', '')
              .toLowerCase()
            napConsistent = websiteDomain === normalizedDomain
          } catch {
            napConsistent = false
          }
        }

        return {
          ...placesResult,
          napConsistent,
          // Fields not available from Places API - set defaults
          postsRecent: false,
          description: undefined,
          isClaimed: undefined,
          ratingDistribution: undefined,
          attributes: undefined,
          placeTopics: undefined,
          competitors: undefined,
        }
      }
    } catch (error) {
      // Log but don't fail - fall back to DataForSEO
      console.warn('[Business Step] Google Places API error, falling back to DataForSEO:', error)
    }
  }

  // Fall back to DataForSEO keyword-based search
  console.log(`[Business Step] Using DataForSEO search for: ${searchName}`)
  return runBusinessStepWithDataForSEO(module, domain, searchName)
}

/**
 * Original DataForSEO-based business lookup
 * Used as fallback when Google Places API is not configured or fails
 */
async function runBusinessStepWithDataForSEO(
  module: BusinessModule,
  domain: string,
  searchName: string
): Promise<BusinessStepResult> {
  // Search for the business - use title for better matching
  const businessInfo = await module.getBusinessInfo({
    keyword: searchName,
    depth: 10, // Get more results for better matching
  })

  // Find the best matching business by domain
  const normalizedDomain = domain.replace('www.', '').toLowerCase()
  let business = businessInfo.find((b) => {
    if (!b.url && !b.domain) return false
    const bDomain = (b.domain || new URL(b.url!).hostname).replace('www.', '').toLowerCase()
    return bDomain === normalizedDomain || bDomain.includes(normalizedDomain)
  })

  // Fallback to first result if no domain match
  if (!business && businessInfo.length > 0) {
    business = businessInfo[0]
  }

  if (!business) {
    // No business found - not an error, just no data
    return {
      hasGmbListing: false,
      gmbRating: null,
      reviewCount: 0,
      napConsistent: false,
      categoriesSet: false,
      photosCount: 0,
      postsRecent: false,
    }
  }

  // Cast to access extended fields from API
  const extendedBusiness = business as Record<string, unknown>

  // Check if website matches domain
  const businessDomain = business.url
    ? new URL(business.url).hostname.replace('www.', '').toLowerCase()
    : (business.domain || '').replace('www.', '').toLowerCase()
  const napConsistent = businessDomain === normalizedDomain

  // Extract rating distribution
  const ratingDist = extendedBusiness.rating_distribution as Record<string, number> | undefined
  const ratingDistribution = ratingDist
    ? {
        '1': ratingDist['1'] ?? 0,
        '2': ratingDist['2'] ?? 0,
        '3': ratingDist['3'] ?? 0,
        '4': ratingDist['4'] ?? 0,
        '5': ratingDist['5'] ?? 0,
      }
    : undefined

  // Extract place topics for review sentiment
  const placeTopics = extendedBusiness.place_topics as Record<string, number> | undefined

  // Extract competitors from "people also search"
  const peopleAlsoSearch = extendedBusiness.people_also_search as
    | Array<{
        title?: string
        rating?: { value?: number; votes_count?: number }
        cid?: string
      }>
    | undefined

  const competitors = peopleAlsoSearch?.slice(0, 5).map((comp) => ({
    name: comp.title ?? '',
    rating: comp.rating?.value ?? null,
    reviewCount: comp.rating?.votes_count ?? 0,
    cid: comp.cid ?? '',
  }))

  // Extract attributes
  const attrs = extendedBusiness.attributes as
    | {
        available_attributes?: {
          accessibility?: string[]
          amenities?: string[]
          offerings?: string[]
          payments?: string[]
        }
      }
    | undefined

  const attributes = attrs?.available_attributes
    ? {
        accessibility: attrs.available_attributes.accessibility ?? [],
        amenities: attrs.available_attributes.amenities ?? [],
        offerings: attrs.available_attributes.offerings ?? [],
        payments: attrs.available_attributes.payments ?? [],
      }
    : undefined

  // Extract work hours
  const workTime = extendedBusiness.work_time as
    | {
        work_hours?: {
          timetable?: Record<
            string,
            Array<{
              open?: { hour: number; minute?: number }
              close?: { hour: number; minute?: number }
            }>
          >
        }
      }
    | undefined

  const workHours = workTime?.work_hours?.timetable
    ? Object.entries(workTime.work_hours.timetable).reduce(
        (acc, [day, hours]) => {
          acc[day] = hours.map((h) => ({
            open: `${h.open?.hour ?? 0}:${String(h.open?.minute ?? 0).padStart(2, '0')}`,
            close: `${h.close?.hour ?? 0}:${String(h.close?.minute ?? 0).padStart(2, '0')}`,
          }))
          return acc
        },
        {} as Record<string, Array<{ open: string; close: string }>>
      )
    : undefined

  // Extract additional categories
  const additionalCats = extendedBusiness.additional_categories as string[] | undefined

  // Full address from address_info
  const addressInfo = extendedBusiness.address_info as
    | {
        address?: string
        city?: string
        zip?: string
        region?: string
      }
    | undefined
  const fullAddress = addressInfo
    ? [addressInfo.address, addressInfo.city, addressInfo.region, addressInfo.zip]
        .filter(Boolean)
        .join(', ')
    : ((extendedBusiness.address as string) ?? undefined)

  return {
    // Basic fields (existing)
    hasGmbListing: true,
    gmbRating: business.rating?.value ?? null,
    reviewCount: business.rating?.votes_count ?? 0,
    napConsistent,
    categoriesSet: Boolean(business.category),
    photosCount: business.total_photos ?? 0,
    postsRecent: false, // TODO: Requires additional API call

    // NEW: Full profile data
    businessName: business.title ?? undefined,
    description: (extendedBusiness.description as string) ?? undefined,
    address: fullAddress,
    phone: business.phone ?? undefined,
    website: business.url ?? undefined,
    placeId: (extendedBusiness.place_id as string) ?? undefined,
    isClaimed: (extendedBusiness.is_claimed as boolean) ?? undefined,

    // NEW: Rating breakdown
    ratingDistribution,

    // NEW: Categories
    primaryCategory: business.category ?? undefined,
    additionalCategories: additionalCats,

    // NEW: Attributes
    attributes,

    // NEW: Place topics (for review sentiment)
    placeTopics,

    // NEW: Competitors
    competitors,

    // NEW: Work hours
    workHours,
  }
}

/**
 * Run competitor analysis step
 * Fetches SEO metrics for the target domain and specified competitors.
 * Uses Labs API for keyword/traffic data and Backlinks API for link metrics.
 *
 * @param labsModule - Labs API module for keyword data
 * @param backlinksModule - Backlinks API module for link metrics
 * @param targetDomain - The domain being audited
 * @param competitorDomains - Optional list of competitor domains to analyze (max 5)
 * @returns Competitor step result with target and competitor metrics
 */
async function runCompetitorStep(
  labsModule: LabsModule,
  backlinksModule: BacklinksModule,
  targetDomain: string,
  competitorDomains?: string[]
): Promise<CompetitorStepResult> {
  /**
   * Fetch metrics for a single domain
   */
  async function getDomainMetrics(domain: string): Promise<SEOCompetitorMetrics> {
    // Get Labs domain rank overview (keyword data + traffic)
    const labsData = await labsModule.getDomainRankOverview({
      target: domain,
      locationName: 'United States',
      languageCode: 'en',
    })

    // Get backlinks summary
    const backlinksData = await backlinksModule.getSummary({
      target: domain,
      includeSubdomains: true,
    })

    // Extract organic metrics from Labs data
    const organic = labsData?.metrics?.organic

    // Calculate top 10 keywords (pos_1 + pos_2_3 + pos_4_10)
    const top10Keywords =
      (organic?.pos_1 ?? 0) + (organic?.pos_2_3 ?? 0) + (organic?.pos_4_10 ?? 0)

    // Calculate total ranking keywords
    const rankingKeywords = organic?.count ?? 0

    // Calculate average position (rough estimate based on position distribution)
    let avgPosition = 0
    if (rankingKeywords > 0) {
      const weightedSum =
        (organic?.pos_1 ?? 0) * 1 +
        (organic?.pos_2_3 ?? 0) * 2.5 +
        (organic?.pos_4_10 ?? 0) * 7 +
        (organic?.pos_11_20 ?? 0) * 15 +
        (organic?.pos_21_30 ?? 0) * 25 +
        (organic?.pos_31_40 ?? 0) * 35 +
        (organic?.pos_41_50 ?? 0) * 45 +
        (organic?.pos_51_60 ?? 0) * 55 +
        (organic?.pos_61_70 ?? 0) * 65 +
        (organic?.pos_71_80 ?? 0) * 75 +
        (organic?.pos_81_90 ?? 0) * 85 +
        (organic?.pos_91_100 ?? 0) * 95
      avgPosition = Math.round(weightedSum / rankingKeywords)
    }

    return {
      domain,
      rank: backlinksData?.rank ?? 0,
      organicTraffic: Math.round(organic?.etv ?? 0),
      trafficValue: Math.round(organic?.estimated_paid_traffic_cost ?? 0),
      backlinks: backlinksData?.backlinks ?? 0,
      referringDomains: backlinksData?.referring_domains ?? 0,
      rankingKeywords,
      top10Keywords,
      avgPosition,
      keywordIntersections: 0, // Only populated for competitors via competitors_domain API
      positionDistribution: organic
        ? {
            pos_1: organic.pos_1 ?? 0,
            pos_2_3: organic.pos_2_3 ?? 0,
            pos_4_10: organic.pos_4_10 ?? 0,
            pos_11_20: organic.pos_11_20 ?? 0,
            pos_21_30: organic.pos_21_30 ?? 0,
            pos_31_40: organic.pos_31_40 ?? 0,
            pos_41_50: organic.pos_41_50 ?? 0,
            pos_51_60: organic.pos_51_60 ?? 0,
            pos_61_70: organic.pos_61_70 ?? 0,
            pos_71_80: organic.pos_71_80 ?? 0,
            pos_81_90: organic.pos_81_90 ?? 0,
            pos_91_100: organic.pos_91_100 ?? 0,
          }
        : undefined,
      keywordMovement: organic
        ? {
            isNew: organic.is_new ?? 0,
            isUp: organic.is_up ?? 0,
            isDown: organic.is_down ?? 0,
            isLost: (organic as Record<string, unknown>).is_lost as number | undefined,
          }
        : undefined,
    }
  }

  // Get target domain metrics first
  console.log(`[Competitor Step] Fetching metrics for target: ${targetDomain}`)
  const targetMetrics = await getDomainMetrics(targetDomain)

  // Fetch metrics for specified competitor domains
  const competitors: SEOCompetitorMetrics[] = []
  if (competitorDomains && competitorDomains.length > 0) {
    const domainsToFetch = competitorDomains.slice(0, 5) // Max 5 competitors

    for (const compDomain of domainsToFetch) {
      try {
        console.log(`[Competitor Step] Fetching metrics for competitor: ${compDomain}`)
        const metrics = await getDomainMetrics(compDomain)
        competitors.push(metrics)
      } catch (error) {
        // Log but continue with other competitors
        console.warn(`[Competitor Step] Failed to fetch metrics for ${compDomain}:`, error)
      }
    }
  }

  // Auto-discover competitors if none specified (or to supplement)
  let discoveredCompetitors: SEOCompetitorMetrics[] | undefined
  if (competitors.length < 5) {
    try {
      console.log(`[Competitor Step] Discovering competitors for: ${targetDomain}`)
      const discovered = await labsModule.getCompetitors({
        target: targetDomain,
        locationCode: 2840, // United States
        limit: 10,
        excludeTopDomains: true, // Exclude mapquest, yelp, etc.
      })

      // Filter out the target domain and already-specified competitors
      const existingDomains = new Set([targetDomain, ...competitors.map((c) => c.domain)])
      const newCompetitors = discovered
        .filter((c) => !existingDomains.has(c.domain ?? ''))
        .slice(0, 5 - competitors.length)

      discoveredCompetitors = newCompetitors.map((c) => {
        // full_domain_metrics: competitor's total organic metrics
        // metrics: competitor's metrics for keywords that intersect with target
        const fullOrganic = c.full_domain_metrics?.organic
        const intersectOrganic = c.metrics?.organic

        const top10 =
          (intersectOrganic?.pos_1 ?? 0) +
          (intersectOrganic?.pos_2_3 ?? 0) +
          (intersectOrganic?.pos_4_10 ?? 0)

        return {
          domain: c.domain ?? '',
          rank: 0, // Will be enriched below
          organicTraffic: Math.round(fullOrganic?.etv ?? 0),
          trafficValue: Math.round(fullOrganic?.estimated_paid_traffic_cost ?? 0),
          backlinks: 0, // Will be enriched below
          referringDomains: 0, // Will be enriched below
          rankingKeywords: fullOrganic?.count ?? 0,
          top10Keywords: top10,
          avgPosition: Math.round(c.avg_position ?? 0),
          keywordIntersections: c.intersections ?? 0,
          positionDistribution: intersectOrganic
            ? {
                pos_1: intersectOrganic.pos_1 ?? 0,
                pos_2_3: intersectOrganic.pos_2_3 ?? 0,
                pos_4_10: intersectOrganic.pos_4_10 ?? 0,
                pos_11_20: intersectOrganic.pos_11_20 ?? 0,
                pos_21_30: intersectOrganic.pos_21_30 ?? 0,
                pos_31_40: intersectOrganic.pos_31_40 ?? 0,
                pos_41_50: intersectOrganic.pos_41_50 ?? 0,
                pos_51_60: intersectOrganic.pos_51_60 ?? 0,
                pos_61_70: intersectOrganic.pos_61_70 ?? 0,
                pos_71_80: intersectOrganic.pos_71_80 ?? 0,
                pos_81_90: intersectOrganic.pos_81_90 ?? 0,
                pos_91_100: intersectOrganic.pos_91_100 ?? 0,
              }
            : undefined,
          keywordMovement: intersectOrganic
            ? {
                isNew: intersectOrganic.is_new ?? 0,
                isUp: intersectOrganic.is_up ?? 0,
                isDown: intersectOrganic.is_down ?? 0,
              }
            : undefined,
        }
      })

      // Enrich discovered competitors with backlinks data
      if (discoveredCompetitors.length > 0) {
        console.log(
          `[Competitor Step] Enriching ${discoveredCompetitors.length} discovered competitors with backlinks data`
        )

        const enrichmentPromises = discoveredCompetitors.map(async (comp) => {
          try {
            const backlinksData = await backlinksModule.getSummary({
              target: comp.domain,
              includeSubdomains: true,
            })

            if (backlinksData) {
              comp.rank = backlinksData.rank ?? 0
              comp.backlinks = backlinksData.backlinks ?? 0
              comp.referringDomains = backlinksData.referring_domains ?? 0
            }
          } catch (err) {
            console.warn(
              `[Competitor Step] Failed to enrich backlinks for ${comp.domain}:`,
              err
            )
          }
        })

        await Promise.all(enrichmentPromises)
        console.log(`[Competitor Step] Backlinks enrichment complete`)
      }
    } catch (error) {
      // Non-critical, continue without discovered competitors
      console.warn('[Competitor Step] Failed to discover competitors:', error)
    }
  }

  return {
    targetMetrics,
    competitors,
    discoveredCompetitors:
      discoveredCompetitors && discoveredCompetitors.length > 0 ? discoveredCompetitors : undefined,
  }
}

// Helper functions

function countIssues(pageResult: unknown): number {
  if (!pageResult) return 0

  const result = pageResult as Record<string, unknown>
  let issues = 0

  // Count various issues
  issues += (result.broken_links as number) ?? 0
  issues += (result.duplicate_content as boolean) ? 1 : 0

  const meta = result.meta as Record<string, unknown> | undefined
  if (meta) {
    issues += (meta.images_without_alt as number) ?? 0
  }

  const checks = result.checks as Record<string, boolean> | undefined
  if (checks) {
    if (!checks.has_meta_title) issues++
    if (!checks.has_meta_description) issues++
    if (!checks.is_https) issues++
    if (!checks.is_responsive) issues++
  }

  return issues
}

function calculateSpeedScore(domComplete: number): number {
  // DOM complete time in ms
  if (domComplete <= 1500) return 90
  if (domComplete <= 2500) return 75
  if (domComplete <= 4000) return 60
  if (domComplete <= 6000) return 45
  return 30
}

/** Export all audit functions for registration */
export const auditFunctions = [runAuditOrchestrator]
