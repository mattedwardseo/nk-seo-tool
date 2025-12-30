/**
 * Thematic Report Calculations
 *
 * Calculates scores for the 6 thematic report cards:
 * - Crawlability
 * - HTTPS
 * - Core Web Vitals
 * - Site Performance
 * - Internal Linking
 * - Markup
 */

import type { OnPageStepResult, OnPageChecks, OnPageTiming, OnPageMeta } from '@/types/audit'
import { THEMATIC_SCORE_WEIGHTS, SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { ThematicReport, ThematicReports } from './types'

/**
 * Calculate weighted score from a set of boolean factors
 */
function calculateWeightedScore(
  factors: Array<{ value: boolean | undefined | null; weight: number }>
): number {
  let score = 0
  let totalWeight = 0

  for (const factor of factors) {
    if (factor.value !== undefined && factor.value !== null) {
      totalWeight += factor.weight
      if (factor.value) {
        score += factor.weight
      }
    }
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
}

/**
 * Determine status based on score
 */
function getStatus(score: number): 'good' | 'moderate' | 'poor' {
  if (score >= 80) return 'good'
  if (score >= 50) return 'moderate'
  return 'poor'
}

/**
 * Calculate Crawlability score
 */
export function calculateCrawlabilityScore(checks: OnPageChecks | undefined): ThematicReport {
  if (!checks) {
    return { id: 'crawlability', title: 'Crawlability', score: 0, status: 'poor' }
  }

  const weights = THEMATIC_SCORE_WEIGHTS.crawlability
  const score = calculateWeightedScore([
    { value: !checks.isBroken, weight: weights.notBroken },
    { value: !checks.is4xxCode, weight: weights.no4xxCode },
    { value: !checks.is5xxCode, weight: weights.no5xxCode },
    { value: !checks.isRedirect, weight: weights.notRedirect },
    { value: checks.canonical, weight: weights.hasCanonical },
    { value: !checks.hasMetaRefreshRedirect, weight: weights.noMetaRefresh },
  ])

  return {
    id: 'crawlability',
    title: 'Crawlability',
    score,
    status: getStatus(score),
  }
}

/**
 * Calculate HTTPS score
 */
export function calculateHttpsScore(
  checks: OnPageChecks | undefined,
  httpsVerified: boolean | undefined
): ThematicReport {
  if (!checks) {
    return { id: 'https', title: 'HTTPS', score: 0, status: 'poor' }
  }

  const weights = THEMATIC_SCORE_WEIGHTS.https
  const score = calculateWeightedScore([
    { value: checks.isHttps, weight: weights.isHttps },
    { value: !checks.httpsToHttpLinks, weight: weights.noMixedContent },
    { value: httpsVerified, weight: weights.httpsVerified },
  ])

  return {
    id: 'https',
    title: 'HTTPS',
    score,
    status: getStatus(score),
  }
}

/**
 * Calculate Core Web Vitals score
 */
export function calculateCoreWebVitalsScore(
  timing: OnPageTiming | undefined,
  meta: OnPageMeta | undefined
): ThematicReport {
  if (!timing) {
    return { id: 'coreWebVitals', title: 'Core Web Vitals', score: 0, status: 'poor' }
  }

  const thresholds = SEO_THRESHOLDS.coreWebVitals
  const weights = THEMATIC_SCORE_WEIGHTS.coreWebVitals

  let score = 0
  let totalWeight = 0

  // LCP
  if (timing.largestContentfulPaint !== null) {
    totalWeight += weights.lcp
    if (timing.largestContentfulPaint <= thresholds.lcp.good) {
      score += weights.lcp
    } else if (timing.largestContentfulPaint <= thresholds.lcp.moderate) {
      score += weights.lcp * 0.5
    }
  }

  // FID
  if (timing.firstInputDelay !== null) {
    totalWeight += weights.fid
    if (timing.firstInputDelay <= thresholds.fid.good) {
      score += weights.fid
    } else if (timing.firstInputDelay <= thresholds.fid.moderate) {
      score += weights.fid * 0.5
    }
  }

  // CLS
  const cls = meta?.cumulativeLayoutShift
  if (cls !== null && cls !== undefined) {
    totalWeight += weights.cls
    if (cls <= thresholds.cls.good) {
      score += weights.cls
    } else if (cls <= thresholds.cls.moderate) {
      score += weights.cls * 0.5
    }
  }

  const finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0

  return {
    id: 'coreWebVitals',
    title: 'Core Web Vitals',
    score: finalScore,
    status: getStatus(finalScore),
  }
}

/**
 * Calculate Site Performance score
 */
export function calculatePerformanceScore(checks: OnPageChecks | undefined): ThematicReport {
  if (!checks) {
    return { id: 'performance', title: 'Site Performance', score: 0, status: 'poor' }
  }

  const weights = THEMATIC_SCORE_WEIGHTS.performance
  const score = calculateWeightedScore([
    { value: !checks.highLoadingTime, weight: weights.noHighLoadTime },
    { value: !checks.highWaitingTime, weight: weights.noHighWaitTime },
    { value: !checks.hasRenderBlockingResources, weight: weights.noRenderBlocking },
    { value: !checks.noContentEncoding, weight: weights.hasCompression }, // Note: inverted
    { value: !checks.sizeGreaterThan3mb, weight: weights.underSizeLimit },
  ])

  return {
    id: 'performance',
    title: 'Site Performance',
    score,
    status: getStatus(score),
  }
}

/**
 * Calculate Internal Linking score
 */
export function calculateInternalLinkingScore(
  checks: OnPageChecks | undefined,
  meta: OnPageMeta | undefined
): ThematicReport {
  if (!checks || !meta) {
    return { id: 'internalLinking', title: 'Internal Linking', score: 0, status: 'poor' }
  }

  const weights = THEMATIC_SCORE_WEIGHTS.internalLinking
  const thresholds = SEO_THRESHOLDS.links

  // Calculate if has enough internal links
  const hasInternalLinks = meta.internalLinksCount >= thresholds.minInternalLinks

  // Calculate external ratio
  const totalLinks = meta.internalLinksCount + meta.externalLinksCount
  const externalRatio = totalLinks > 0 ? meta.externalLinksCount / totalLinks : 0
  const goodExternalRatio = externalRatio <= thresholds.maxExternalRatio

  const score = calculateWeightedScore([
    { value: !checks.brokenLinks, weight: weights.noBrokenLinks },
    { value: hasInternalLinks, weight: weights.hasInternalLinks },
    { value: goodExternalRatio, weight: weights.goodExternalRatio },
  ])

  return {
    id: 'internalLinking',
    title: 'Internal Linking',
    score,
    status: getStatus(score),
  }
}

/**
 * Calculate Markup score
 */
export function calculateMarkupScore(checks: OnPageChecks | undefined): ThematicReport {
  if (!checks) {
    return { id: 'markup', title: 'Markup', score: 0, status: 'poor' }
  }

  const weights = THEMATIC_SCORE_WEIGHTS.markup
  const score = calculateWeightedScore([
    { value: checks.hasHtmlDoctype, weight: weights.hasDoctype },
    { value: !checks.deprecatedHtmlTags, weight: weights.noDeprecatedTags },
    { value: !checks.frame, weight: weights.noFrames },
    { value: !checks.flash, weight: weights.noFlash },
    { value: checks.hasMicromarkup, weight: weights.hasSchema },
    { value: !checks.hasMicromarkupErrors, weight: weights.noSchemaErrors },
  ])

  return {
    id: 'markup',
    title: 'Markup',
    score,
    status: getStatus(score),
  }
}

/**
 * Calculate all thematic reports
 */
export function calculateAllThematicReports(data: OnPageStepResult): ThematicReports {
  return {
    crawlability: calculateCrawlabilityScore(data.checks),
    https: calculateHttpsScore(data.checks, data.httpsVerified),
    coreWebVitals: calculateCoreWebVitalsScore(data.timing, data.meta),
    performance: calculatePerformanceScore(data.checks),
    internalLinking: calculateInternalLinkingScore(data.checks, data.meta),
    markup: calculateMarkupScore(data.checks),
  }
}

/**
 * Calculate overall health score (average of all thematic reports)
 */
export function calculateOverallHealthScore(reports: ThematicReports): number {
  const scores = [
    reports.crawlability.score,
    reports.https.score,
    reports.coreWebVitals.score,
    reports.performance.score,
    reports.internalLinking.score,
    reports.markup.score,
  ]

  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round(sum / scores.length)
}
