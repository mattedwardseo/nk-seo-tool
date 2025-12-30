/**
 * Site Audit Inngest Functions
 *
 * Background job orchestration for full site crawls using DataForSEO OnPage API.
 * Uses task-based workflow: submit task -> poll for completion -> fetch results.
 */

import { inngest } from '../inngest';
import { getDataForSEOClient } from '../dataforseo';
import { OnPageModule } from '../dataforseo/modules/onpage';
import { SiteAuditStatus } from '@prisma/client';
import {
  updateScanStatus,
  updateScanProgress,
  updateScanTaskId,
  saveSiteAuditSummary,
  saveSiteAuditPages,
  completeScan,
  failScan,
  type SummaryData,
  type PageData,
} from '../db/site-audit-operations';
import { ISSUE_SEVERITY_CONFIG } from '../constants/seo-thresholds';

// Polling configuration
const POLLING_CONFIG = {
  initialDelaySeconds: 30,
  maxDelaySeconds: 60,
  backoffMultiplier: 1.2,
  maxWaitMinutes: 30,
  rateLimit: 20, // tasks_ready is limited to 20 req/min
};

/**
 * Main site audit orchestrator function
 *
 * Workflow:
 * 1. Update status to SUBMITTING
 * 2. Submit crawl task to DataForSEO
 * 3. Update status to CRAWLING
 * 4. Poll tasks_ready until complete (with exponential backoff)
 * 5. Update status to FETCHING_RESULTS
 * 6. Fetch summary, pages, resources, links
 * 7. Calculate CWV averages
 * 8. Save results to database
 * 9. Mark as COMPLETED
 */
export const runSiteAudit = inngest.createFunction(
  {
    id: 'site-audit-orchestrator',
    retries: 2,
    // Throttle to avoid overwhelming API
    throttle: { limit: 3, period: '1m' },
  },
  { event: 'site-audit/scan.requested' },
  async ({ event, step }) => {
    const { scanId, domain, config } = event.data;

    // Create DataForSEO client and OnPage module
    const client = getDataForSEOClient();
    const onpage = new OnPageModule(client);

    try {
      // Step 1: Update status to SUBMITTING
      await step.run('update-status-submitting', async () => {
        await updateScanStatus(scanId, SiteAuditStatus.SUBMITTING);
      });

      // Step 2: Submit crawl task to DataForSEO
      const taskId = await step.run('submit-crawl-task', async () => {
        const result = await onpage.submitCrawlTask({
          target: domain,
          maxCrawlPages: config.maxCrawlPages,
          enableJavascript: config.enableJavascript,
          enableBrowserRendering: config.enableBrowserRendering,
          loadResources: config.enableBrowserRendering, // Required for browser rendering
          storeRawHtml: config.storeRawHtml,
          calculateKeywordDensity: config.calculateKeywordDensity,
          startUrl: config.startUrl,
          disableCookiePopup: true,
        });

        await updateScanTaskId(scanId, result.taskId);
        return result.taskId;
      });

      // Step 3: Update status to CRAWLING
      await step.run('update-status-crawling', async () => {
        await updateScanStatus(scanId, SiteAuditStatus.CRAWLING);
        await updateScanProgress(scanId, 5);
      });

      // Step 4: Poll for completion with exponential backoff
      let isReady = false;
      let pollCount = 0;
      const maxPolls = Math.ceil(
        (POLLING_CONFIG.maxWaitMinutes * 60) / POLLING_CONFIG.initialDelaySeconds
      );

      while (!isReady && pollCount < maxPolls) {
        // Calculate delay with exponential backoff
        const delaySeconds = Math.min(
          POLLING_CONFIG.initialDelaySeconds *
            Math.pow(POLLING_CONFIG.backoffMultiplier, Math.floor(pollCount / 3)),
          POLLING_CONFIG.maxDelaySeconds
        );

        await step.sleep(`poll-delay-${pollCount}`, `${delaySeconds}s`);

        isReady = await step.run(`check-task-ready-${pollCount}`, async () => {
          const readyTasks = await onpage.getTasksReady();
          return readyTasks.some((t) => t.id === taskId);
        });

        pollCount++;

        // Update progress during crawl (5-50% range)
        await step.run(`update-progress-${pollCount}`, async () => {
          const progress = Math.min(5 + pollCount * 2, 50);
          await updateScanProgress(scanId, progress);
        });
      }

      if (!isReady) {
        throw new Error(
          `Crawl timed out after ${POLLING_CONFIG.maxWaitMinutes} minutes`
        );
      }

      // Step 5: Update status to FETCHING_RESULTS
      await step.run('update-status-fetching', async () => {
        await updateScanStatus(scanId, SiteAuditStatus.FETCHING_RESULTS);
        await updateScanProgress(scanId, 55);
      });

      // Step 6: Fetch summary
      const summary = await step.run('fetch-summary', async () => {
        const result = await onpage.getCrawlSummary(taskId);
        if (!result) {
          throw new Error('Failed to fetch crawl summary');
        }
        return result;
      });

      await step.run('update-progress-after-summary', async () => {
        await updateScanProgress(scanId, 65);
      });

      // Step 7: Fetch all pages (using pagination)
      const pages = await step.run('fetch-pages', async () => {
        return await onpage.fetchAllPages(taskId);
      });

      await step.run('update-progress-after-pages', async () => {
        await updateScanProgress(scanId, 80);
      });

      // Step 8: Calculate CWV averages from pages
      const cwvAverages = await step.run('calculate-cwv-averages', async () => {
        interface PageWithMeta {
          meta?: { cumulative_layout_shift?: number | null } | null;
          page_timing?: { largest_contentful_paint?: number | null } | null;
        }

        const pagesWithCls = pages.filter(
          (p: PageWithMeta) => p.meta?.cumulative_layout_shift != null
        );
        const pagesWithLcp = pages.filter(
          (p: PageWithMeta) => p.page_timing?.largest_contentful_paint != null
        );

        return {
          avgCls:
            pagesWithCls.length > 0
              ? pagesWithCls.reduce(
                  (sum: number, p: PageWithMeta) =>
                    sum + (p.meta?.cumulative_layout_shift ?? 0),
                  0
                ) / pagesWithCls.length
              : null,
          avgLcp:
            pagesWithLcp.length > 0
              ? pagesWithLcp.reduce(
                  (sum: number, p: PageWithMeta) =>
                    sum + (p.page_timing?.largest_contentful_paint ?? 0),
                  0
                ) / pagesWithLcp.length
              : null,
        };
      });

      await step.run('update-progress-after-cwv', async () => {
        await updateScanProgress(scanId, 90);
      });

      // Step 9: Calculate issue counts from pages
      const issueCounts = await step.run('calculate-issue-counts', async () => {
        return calculateIssueCounts(pages);
      });

      // Step 10: Save results to database
      await step.run('save-summary', async () => {
        const summaryData: SummaryData = {
          totalPages: summary.crawl_status?.max_crawl_pages ?? 0,
          crawledPages: summary.crawl_status?.pages_crawled ?? 0,
          crawlStopReason: summary.crawl_stop_reason ?? undefined,
          errorsCount: issueCounts.errors,
          warningsCount: issueCounts.warnings,
          noticesCount: issueCounts.notices,
          onpageScore: summary.page_metrics?.onpage_score ?? undefined,
          avgLcp: cwvAverages.avgLcp,
          avgCls: cwvAverages.avgCls,
          totalImages: 0, // From resources - skip for now
          brokenResources: summary.page_metrics?.broken_resources ?? 0,
          internalLinks: summary.page_metrics?.links_internal ?? 0,
          externalLinks: summary.page_metrics?.links_external ?? 0,
          brokenLinks: summary.page_metrics?.broken_links ?? 0,
          nonIndexable: summary.page_metrics?.non_indexable ?? 0,
          duplicateTitle: summary.page_metrics?.duplicate_title ?? 0,
          duplicateDescription: summary.page_metrics?.duplicate_description ?? 0,
          duplicateContent: summary.page_metrics?.duplicate_content ?? 0,
          domainInfo: summary.domain_info as Record<string, unknown>,
          sslInfo: summary.domain_info?.ssl_info as Record<string, unknown>,
          pageMetricsChecks: summary.page_metrics?.checks as Record<string, unknown>,
        };

        await saveSiteAuditSummary(scanId, summaryData);
      });

      await step.run('save-pages', async () => {
        const pageData: PageData[] = pages.map((page) => ({
          url: page.url,
          statusCode: page.status_code,
          onpageScore: page.onpage_score ?? undefined,
          title: page.meta?.title ?? undefined,
          description: page.meta?.description ?? undefined,
          h1Tags: extractH1Tags(page.meta?.htags),
          wordCount: page.meta?.content?.plain_text_word_count ?? undefined,
          redirectLocation: page.location ?? undefined,
          isRedirect: page.checks?.is_redirect === true,
          pageTiming: page.page_timing as Record<string, unknown>,
          checks: page.checks as Record<string, unknown>,
          meta: page.meta as Record<string, unknown>,
        }));

        await saveSiteAuditPages(scanId, pageData);
      });

      await step.run('update-progress-after-save', async () => {
        await updateScanProgress(scanId, 95);
      });

      // Step 10: Complete the scan
      await step.run('complete-scan', async () => {
        await completeScan(scanId, {
          totalPages: pages.length,
          // API cost would be tracked separately
        });
      });

      // Emit completion event
      await step.sendEvent('emit-completed', {
        name: 'site-audit/scan.completed',
        data: {
          scanId,
          domain,
          pagesScanned: pages.length,
          onpageScore: summary.page_metrics?.onpage_score ?? null,
          apiCost: 0, // Would need to track from API responses
        },
      });

      return {
        success: true,
        scanId,
        pagesScanned: pages.length,
        onpageScore: summary.page_metrics?.onpage_score,
      };
    } catch (error) {
      // Handle failure
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      await step.run('fail-scan', async () => {
        await failScan(scanId, errorMessage);
      });

      await step.sendEvent('emit-failed', {
        name: 'site-audit/scan.failed',
        data: {
          scanId,
          error: errorMessage,
          stage: 'orchestrator',
        },
      });

      throw error;
    }
  }
);

/**
 * Extract H1 tags from htags object
 */
function extractH1Tags(
  htags: Record<string, string[]> | null | undefined
): string[] {
  if (!htags) return [];
  return htags['h1'] ?? [];
}

/**
 * Check definitions indicating which checks fail when true vs when false
 * This is a subset of the full ISSUE_DEFINITIONS for the checks we care about
 */
const CHECK_FAIL_WHEN_TRUE: Set<string> = new Set([
  'isHttp', 'isBroken', 'isRedirect', 'is4xxCode', 'is5xxCode',
  'noDoctype', 'frame', 'flash', 'deprecatedHtmlTags', 'hasRenderBlockingResources',
  'hasMetaRefreshRedirect', 'duplicateMetaTags', 'duplicateTitleTag',
  'noEncodingMetaTag', 'hasMicromarkupErrors',
  'titleTooShort', 'titleTooLong', 'noTitle', 'duplicateTitle', 'irrelevantTitle',
  'noDescription', 'irrelevantDescription', 'duplicateDescription',
  'lowContentRate', 'highContentRate', 'lowCharacterCount', 'highCharacterCount',
  'lowReadabilityRate', 'duplicateContent', 'loremIpsum', 'hasMisspelling', 'noH1Tag',
  'irrelevantMetaKeywords', 'noImageAlt', 'noImageTitle',
  'highLoadingTime', 'highWaitingTime', 'noContentEncoding',
  'smallPageSize', 'largePageSize', 'sizeGreaterThan3mb',
  'httpsToHttpLinks', 'brokenResources', 'brokenLinks', 'noFavicon',
]);

/**
 * Determine if a check is failing based on its value
 */
function isCheckFailing(checkKey: string, value: boolean): boolean {
  // Checks in the set fail when true, otherwise they fail when false
  return CHECK_FAIL_WHEN_TRUE.has(checkKey) ? value === true : value === false;
}

/**
 * Calculate issue counts from all pages
 */
function calculateIssueCounts(
  pages: Array<{ checks?: Record<string, boolean> | null }>
): { errors: number; warnings: number; notices: number } {
  let errors = 0;
  let warnings = 0;
  let notices = 0;

  const errorChecks = new Set<string>(ISSUE_SEVERITY_CONFIG.errors);
  const warningChecks = new Set<string>(ISSUE_SEVERITY_CONFIG.warnings);
  const noticeChecks = new Set<string>(ISSUE_SEVERITY_CONFIG.notices);

  for (const page of pages) {
    const checks = page.checks;
    if (!checks) continue;

    for (const [key, value] of Object.entries(checks)) {
      if (!isCheckFailing(key, value)) continue;

      if (errorChecks.has(key)) {
        errors++;
      } else if (warningChecks.has(key)) {
        warnings++;
      } else if (noticeChecks.has(key)) {
        notices++;
      }
    }
  }

  return { errors, warnings, notices };
}

/**
 * All site audit functions to register with Inngest
 */
export const siteAuditFunctions = [runSiteAudit];
