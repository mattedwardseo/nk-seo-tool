/**
 * OnPage API Module
 *
 * Technical SEO analysis - page speed, mobile-friendliness, schema markup.
 * Highest priority for dental practice audits.
 */

import {
  OnPageInstantPagesRequestInfo,
  OnPageLighthouseTaskPostRequestInfo,
  OnPageTaskPostRequestInfo,
  OnPagePagesRequestInfo,
  OnPageResourcesRequestInfo,
  OnPageLinksRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  instantPageInputSchema,
  lighthouseInputSchema,
  siteCrawlTaskInputSchema,
  fetchPaginationSchema,
  type InstantPageInput,
  type LighthouseInput,
  type InstantPageResult,
  type LighthouseResult,
  type SiteCrawlTaskInput,
  type FetchPaginationOptions,
  type TaskReadyResult,
  type CrawlSummaryResult,
  type CrawledPageResult,
  type CrawledResourceResult,
  type CrawledLinkResult,
} from '../schemas'

/**
 * OnPage API module for technical SEO analysis
 */
export class OnPageModule extends BaseModule {
  /**
   * Perform instant page audit for a single URL
   * Returns comprehensive page metrics including timing, content, and checks
   *
   * @param input - URL and optional settings
   * @param options - Execution options (caching, rate limiting)
   * @returns Page audit result or null
   *
   * @example
   * ```ts
   * const result = await onpage.instantPageAudit({
   *   url: 'https://example-dental.com',
   *   enableJavascript: false, // 5× cost if true
   * });
   * console.log(result?.onpage_score);
   * ```
   */
  async instantPageAudit(
    input: InstantPageInput,
    options?: ExecuteOptions
  ): Promise<InstantPageResult | null> {
    const validated = this.validateInput(instantPageInputSchema, input)

    const cacheKey = CacheKeys.onpage.instantPage(validated.url)

    // Skip cache to ensure fresh data during debugging
    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new OnPageInstantPagesRequestInfo()
        request.url = validated.url
        request.enable_javascript = validated.enableJavascript
        request.load_resources = validated.loadResources

        if (validated.customUserAgent) {
          request.custom_user_agent = validated.customUserAgent
        }
        if (validated.acceptLanguage) {
          request.accept_language = validated.acceptLanguage
        }
        if (validated.customJs) {
          request.custom_js = validated.customJs
        }

        return this.client.onPage.instantPages([request])
      },
      {
        ...options,
        skipCache: true, // Force fresh data - remove after debugging
        cache: { ttl: CacheTTL.ONPAGE, ...options?.cache },
      }
    )

    // DEBUG: Log full raw response structure to understand SDK format
    console.log('[OnPage SDK DEBUG] FULL raw response keys:', Object.keys(response || {}))
    console.log('[OnPage SDK DEBUG] FULL raw response:', JSON.stringify(response, null, 2).slice(0, 3000))

    // Extract first result from tasks array
    // Note: API returns { tasks: [{ items: [pageData] }] }
    // The actual page data is inside tasks[0].items[0] (no result wrapper)
    const task = response?.tasks?.[0] as { items?: unknown[]; result?: unknown[]; status_code?: number; status_message?: string } | undefined

    // Try both structures: task.items (expected) and task.result[0].items (legacy)
    let pageData = task?.items?.[0]
    if (!pageData && task?.result) {
      const resultWrapper = task.result[0] as { items?: unknown[] } | undefined
      pageData = resultWrapper?.items?.[0]
      console.log('[OnPage SDK DEBUG] Using legacy result wrapper structure')
    }

    // DEBUG: Log extracted data
    console.log('[OnPage SDK DEBUG] Extracted:', JSON.stringify({
      statusCode: response?.status_code,
      statusMessage: response?.status_message,
      taskStatusCode: task?.status_code,
      taskStatusMessage: task?.status_message,
      hasTaskItems: !!task?.items,
      hasTaskResult: !!task?.result,
      taskItemsCount: task?.items?.length,
      pageDataUrl: (pageData as Record<string, unknown>)?.url,
      pageDataMeta: !!(pageData as Record<string, unknown>)?.meta,
      pageDataMetaTitle: ((pageData as Record<string, unknown>)?.meta as Record<string, unknown>)?.title,
    }, null, 2))

    if (!pageData) return null
    return pageData as unknown as InstantPageResult
  }

  /**
   * Perform Lighthouse audit for Core Web Vitals
   * Returns performance, accessibility, SEO, and best practices scores
   *
   * @param input - URL and audit categories
   * @param options - Execution options
   * @returns Lighthouse audit result or null
   *
   * @example
   * ```ts
   * const result = await onpage.lighthouseAudit({
   *   url: 'https://example-dental.com',
   *   device: 'mobile',
   *   categories: ['performance', 'seo', 'accessibility'],
   * });
   * console.log(result?.categories.performance?.score);
   * ```
   */
  async lighthouseAudit(
    input: LighthouseInput,
    options?: ExecuteOptions
  ): Promise<LighthouseResult | null> {
    const validated = this.validateInput(lighthouseInputSchema, input)

    const cacheKey = CacheKeys.onpage.lighthouse(validated.url)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new OnPageLighthouseTaskPostRequestInfo()
        request.url = validated.url
        request.for_mobile = validated.device === 'mobile'
        request.categories = validated.categories

        if (validated.lighthouseVersion) {
          request.lighthouse_version = validated.lighthouseVersion
        }

        return this.client.onPage.lighthouseLiveJson([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.ONPAGE, ...options?.cache },
      }
    )

    // Extract first result from tasks array
    const task = response?.tasks?.[0]
    if (!task?.result?.[0]) return null
    return task.result[0] as unknown as LighthouseResult
  }

  /**
   * Batch audit multiple URLs at once
   * More cost-effective for auditing entire sites
   *
   * @param urls - Array of URLs to audit
   * @param options - Execution options
   * @returns Array of audit results
   *
   * @example
   * ```ts
   * const results = await onpage.batchInstantAudit([
   *   'https://example-dental.com/',
   *   'https://example-dental.com/services',
   *   'https://example-dental.com/contact',
   * ]);
   * ```
   */
  async batchInstantAudit(urls: string[], options?: ExecuteOptions): Promise<InstantPageResult[]> {
    // Validate all URLs
    const validatedUrls = urls.map((url) => this.validateInput(instantPageInputSchema, { url }).url)

    // Create requests for all URLs
    const requests = validatedUrls.map((url) => {
      const request = new OnPageInstantPagesRequestInfo()
      request.url = url
      request.enable_javascript = false
      request.load_resources = false
      return request
    })

    // Execute batch request (no caching for batch - individual results may vary)
    const response = await this.execute(
      () => this.client.onPage.instantPages(requests),
      options?.limiterType
    )

    // Extract all results from all tasks
    // Note: API returns { tasks: [{ items: [pageData1, pageData2, ...] }] }
    const results: InstantPageResult[] = []
    if (response?.tasks) {
      for (const task of response.tasks) {
        const taskWithItems = task as { items?: unknown[] }
        if (taskWithItems?.items) {
          results.push(...(taskWithItems.items as unknown as InstantPageResult[]))
        }
      }
    }
    return results
  }

  /**
   * Calculate technical SEO score from instant page results
   * Weighted score based on key metrics for dental practices
   *
   * @param result - Instant page audit result
   * @returns Score from 0-100
   */
  calculateTechnicalScore(result: InstantPageResult): number {
    if (!result) return 0

    let score = 0
    let maxScore = 0

    // OnPage score (base metric) - weight: 30
    if (result.onpage_score !== undefined) {
      score += result.onpage_score * 30
      maxScore += 30
    }

    // Page timing metrics - weight: 40
    const timing = result.page_timing
    if (timing) {
      // LCP under 2.5s is good, under 4s is okay
      if (timing.largest_contentful_paint !== null) {
        const lcp = timing.largest_contentful_paint
        if (lcp <= 2500) score += 15
        else if (lcp <= 4000) score += 8
        maxScore += 15
      }

      // TTI under 3.8s is good
      if (timing.time_to_interactive !== null) {
        const tti = timing.time_to_interactive
        if (tti <= 3800) score += 15
        else if (tti <= 7300) score += 8
        maxScore += 15
      }

      // FID under 100ms is good
      if (timing.first_input_delay !== null) {
        const fid = timing.first_input_delay
        if (fid <= 100) score += 10
        else if (fid <= 300) score += 5
        maxScore += 10
      }
    }

    // Key checks - weight: 30
    const checks = result.checks
    if (checks) {
      const importantChecks = [
        'is_https',
        'is_http2',
        'has_meta_title',
        'has_meta_description',
        'canonical',
        'is_responsive',
      ]

      for (const check of importantChecks) {
        if (checks[check] === true) score += 5
        maxScore += 5
      }
    }

    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }

  // ============================================================================
  // Task-Based Site Crawl Methods (Full Site Audit)
  // ============================================================================

  /**
   * Submit a site crawl task
   * POST /v3/on_page/task_post
   *
   * @param input - Crawl configuration
   * @param options - Execution options
   * @returns Task ID for tracking
   *
   * @example
   * ```ts
   * const { taskId } = await onpage.submitCrawlTask({
   *   target: 'example-dental.com',
   *   maxCrawlPages: 100,
   *   enableJavascript: true,
   *   enableBrowserRendering: true,
   * });
   * ```
   */
  async submitCrawlTask(
    input: SiteCrawlTaskInput,
    options?: ExecuteOptions
  ): Promise<{ taskId: string }> {
    const validated = this.validateInput(siteCrawlTaskInputSchema, input)

    const response = await this.execute(async () => {
      const request = new OnPageTaskPostRequestInfo()
      request.target = validated.target
      request.max_crawl_pages = validated.maxCrawlPages
      request.enable_javascript = validated.enableJavascript
      request.enable_browser_rendering = validated.enableBrowserRendering
      request.load_resources = validated.loadResources
      request.store_raw_html = validated.storeRawHtml
      request.calculate_keyword_density = validated.calculateKeywordDensity
      request.crawl_delay = validated.crawlDelay
      request.respect_sitemap = validated.respectSitemap
      request.allow_subdomains = validated.allowSubdomains
      request.disable_cookie_popup = validated.disableCookiePopup

      if (validated.startUrl) {
        request.start_url = validated.startUrl
      }
      if (validated.customUserAgent) {
        request.custom_user_agent = validated.customUserAgent
      }
      if (validated.acceptLanguage) {
        request.accept_language = validated.acceptLanguage
      }

      return this.client.onPage.taskPost([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    if (!task?.id) {
      throw new Error('Failed to submit crawl task: no task ID returned')
    }

    return { taskId: task.id }
  }

  /**
   * Get list of completed tasks ready for collection
   * GET /v3/on_page/tasks_ready
   *
   * RATE LIMIT: 20 requests/minute - poll sparingly!
   *
   * @param options - Execution options
   * @returns Array of ready task IDs
   */
  async getTasksReady(options?: ExecuteOptions): Promise<TaskReadyResult[]> {
    const response = await this.execute(
      () => this.client.onPage.onPageTasksReady(),
      options?.limiterType
    )

    const tasks: TaskReadyResult[] = []
    if (response?.tasks) {
      for (const task of response.tasks) {
        const taskResult = task as { result?: Array<{ id: string; tag?: string }> }
        if (taskResult?.result) {
          for (const item of taskResult.result) {
            tasks.push({ id: item.id, tag: item.tag ?? null })
          }
        }
      }
    }
    return tasks
  }

  /**
   * Get crawl summary for a completed task
   * GET /v3/on_page/summary/{taskId}
   *
   * @param taskId - Task ID from submitCrawlTask
   * @param options - Execution options
   * @returns Crawl summary with domain info and metrics
   */
  async getCrawlSummary(
    taskId: string,
    options?: ExecuteOptions
  ): Promise<CrawlSummaryResult | null> {
    const response = await this.execute(
      () => this.client.onPage.summary(taskId),
      options?.limiterType
    )

    const task = response?.tasks?.[0]
    const result = (task as { result?: unknown[] })?.result?.[0]
    if (!result) return null

    return result as unknown as CrawlSummaryResult
  }

  /**
   * Get crawled pages for a task
   * POST /v3/on_page/pages (task ID in body, NOT path)
   *
   * @param taskId - Task ID from submitCrawlTask
   * @param options - Pagination and filter options
   * @returns Paginated pages with crawl progress info
   */
  async getCrawledPages(
    taskId: string,
    paginationOptions?: FetchPaginationOptions,
    options?: ExecuteOptions
  ): Promise<{
    items: CrawledPageResult[]
    totalCount: number
    crawlProgress: string
    crawlStatus: { pagesCrawled: number; maxCrawlPages: number }
  }> {
    const validated = paginationOptions
      ? this.validateInput(fetchPaginationSchema, paginationOptions)
      : { limit: 100, offset: 0 }

    const response = await this.execute(async () => {
      const request = new OnPagePagesRequestInfo()
      request.id = taskId
      request.limit = validated.limit
      request.offset = validated.offset
      if (validated.filters) {
        request.filters = validated.filters as string[]
      }
      if (validated.orderBy) {
        request.order_by = validated.orderBy
      }

      return this.client.onPage.pages([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    const taskResult = task as {
      result?: Array<{
        crawl_progress?: string
        crawl_status?: { pages_crawled?: number; max_crawl_pages?: number }
        total_items_count?: number
        items?: unknown[]
      }>
    }
    const result = taskResult?.result?.[0]

    return {
      items: (result?.items ?? []) as unknown as CrawledPageResult[],
      totalCount: result?.total_items_count ?? 0,
      crawlProgress: result?.crawl_progress ?? 'unknown',
      crawlStatus: {
        pagesCrawled: result?.crawl_status?.pages_crawled ?? 0,
        maxCrawlPages: result?.crawl_status?.max_crawl_pages ?? 0,
      },
    }
  }

  /**
   * Get crawled resources for a task
   * POST /v3/on_page/resources (task ID in body, NOT path)
   *
   * @param taskId - Task ID from submitCrawlTask
   * @param options - Pagination and filter options
   * @returns Paginated resources (images, scripts, stylesheets)
   */
  async getCrawledResources(
    taskId: string,
    paginationOptions?: FetchPaginationOptions,
    options?: ExecuteOptions
  ): Promise<{
    items: CrawledResourceResult[]
    totalCount: number
  }> {
    const validated = paginationOptions
      ? this.validateInput(fetchPaginationSchema, paginationOptions)
      : { limit: 100, offset: 0 }

    const response = await this.execute(async () => {
      const request = new OnPageResourcesRequestInfo()
      request.id = taskId
      request.limit = validated.limit
      request.offset = validated.offset
      if (validated.filters) {
        request.filters = validated.filters as string[]
      }
      if (validated.orderBy) {
        request.order_by = validated.orderBy
      }

      return this.client.onPage.resources([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    const taskResult = task as {
      result?: Array<{ total_items_count?: number; items?: unknown[] }>
    }
    const result = taskResult?.result?.[0]

    return {
      items: (result?.items ?? []) as unknown as CrawledResourceResult[],
      totalCount: result?.total_items_count ?? 0,
    }
  }

  /**
   * Get crawled links for a task
   * POST /v3/on_page/links (task ID in body, NOT path)
   *
   * @param taskId - Task ID from submitCrawlTask
   * @param options - Pagination and filter options
   * @returns Paginated links (internal/external)
   */
  async getCrawledLinks(
    taskId: string,
    paginationOptions?: FetchPaginationOptions,
    options?: ExecuteOptions
  ): Promise<{
    items: CrawledLinkResult[]
    totalCount: number
  }> {
    const validated = paginationOptions
      ? this.validateInput(fetchPaginationSchema, paginationOptions)
      : { limit: 100, offset: 0 }

    const response = await this.execute(async () => {
      const request = new OnPageLinksRequestInfo()
      request.id = taskId
      request.limit = validated.limit
      request.offset = validated.offset
      if (validated.filters) {
        request.filters = validated.filters as string[]
      }
      if (validated.orderBy) {
        request.order_by = validated.orderBy
      }

      return this.client.onPage.links([request])
    }, options?.limiterType)

    const task = response?.tasks?.[0]
    const taskResult = task as {
      result?: Array<{ total_items_count?: number; items?: unknown[] }>
    }
    const result = taskResult?.result?.[0]

    return {
      items: (result?.items ?? []) as unknown as CrawledLinkResult[],
      totalCount: result?.total_items_count ?? 0,
    }
  }

  /**
   * Force stop a crawl task
   * POST /v3/on_page/force_stop
   *
   * @param taskId - Task ID to stop
   * @param options - Execution options
   */
  async forceStopTask(taskId: string, options?: ExecuteOptions): Promise<void> {
    await this.execute(
      () =>
        this.client.onPage.forceStop([
          { id: taskId } as Parameters<typeof this.client.onPage.forceStop>[0][number],
        ]),
      options?.limiterType
    )
  }

  /**
   * Fetch all pages from a completed task (handles pagination automatically)
   * Useful for small to medium sites (up to 500 pages)
   *
   * @param taskId - Task ID from submitCrawlTask
   * @param options - Execution options
   * @returns All crawled pages
   */
  async fetchAllPages(
    taskId: string,
    options?: ExecuteOptions
  ): Promise<CrawledPageResult[]> {
    const allPages: CrawledPageResult[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const result = await this.getCrawledPages(taskId, { limit, offset }, options)
      allPages.push(...result.items)

      if (result.items.length < limit || allPages.length >= result.totalCount) {
        break
      }
      offset += limit
    }

    return allPages
  }
}
