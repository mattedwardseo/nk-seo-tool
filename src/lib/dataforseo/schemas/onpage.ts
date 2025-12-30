/**
 * OnPage API Schemas
 *
 * Validation schemas for DataForSEO OnPage API requests and responses.
 */

import { z } from 'zod'
import { urlSchema, domainSchema, paginationSchema } from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Instant page audit input
 */
export const instantPageInputSchema = z.object({
  url: urlSchema,
  /** Enable JavaScript rendering (5× cost) */
  enableJavascript: z.boolean().default(false),
  /** Enable custom JavaScript execution */
  customJs: z.string().max(2000).optional(),
  /** Load resources like images/CSS (5× cost) */
  loadResources: z.boolean().default(false),
  /** Enable browser-based rendering */
  enableBrowserRendering: z.boolean().default(false),
  /** Custom user agent */
  customUserAgent: z.string().max(500).optional(),
  /** Accept-Language header */
  acceptLanguage: z.string().max(50).optional(),
})

/**
 * Lighthouse audit input
 */
export const lighthouseInputSchema = z.object({
  url: urlSchema,
  /** Device type for testing */
  device: z.enum(['desktop', 'mobile']).default('mobile'),
  /** Lighthouse audit categories */
  categories: z
    .array(z.enum(['performance', 'accessibility', 'best-practices', 'seo', 'pwa']))
    .default(['performance', 'accessibility', 'seo']),
  /** Version of Lighthouse to use */
  lighthouseVersion: z.string().optional(),
})

/**
 * Site crawl task input
 */
export const crawlTaskInputSchema = z.object({
  target: domainSchema,
  /** Maximum pages to crawl */
  maxCrawlPages: z.number().int().min(1).max(100000).default(100),
  /** Start URL (if different from domain root) */
  startUrl: urlSchema.optional(),
  /** Enable JavaScript rendering (5× cost) */
  enableJavascript: z.boolean().default(false),
  /** Load resources */
  loadResources: z.boolean().default(false),
  /** Custom user agent */
  customUserAgent: z.string().max(500).optional(),
  /** Crawl delay in milliseconds */
  crawlDelay: z.number().int().min(0).max(10000).default(0),
  /** Store raw HTML */
  storeRawHtml: z.boolean().default(false),
  /** Check spelling */
  checkSpell: z.boolean().default(false),
  /** Calculate keyword density */
  calculateKeywordDensity: z.boolean().default(false),
})

/**
 * Get crawl results input
 */
export const crawlResultsInputSchema = z.object({
  taskId: z.string().min(1),
  ...paginationSchema.shape,
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Page timing metrics
 */
export const pageTimingSchema = z.object({
  time_to_interactive: z.number().nullable(),
  dom_complete: z.number().nullable(),
  largest_contentful_paint: z.number().nullable(),
  first_input_delay: z.number().nullable(),
  connection_time: z.number().nullable(),
  time_to_secure_connection: z.number().nullable(),
  duration_time: z.number().nullable(),
  fetch_end: z.number().nullable(),
  fetch_start: z.number().nullable(),
})

/**
 * Page content metrics
 */
export const pageContentSchema = z.object({
  plain_text_size: z.number().nullable(),
  plain_text_rate: z.number().nullable(),
  plain_text_word_count: z.number().nullable(),
  automated_readability_index: z.number().nullable(),
  coleman_liau_readability_index: z.number().nullable(),
  dale_chall_readability_index: z.number().nullable(),
  flesch_kincaid_readability_index: z.number().nullable(),
  smog_readability_index: z.number().nullable(),
  description_to_content_consistency: z.number().nullable(),
  title_to_content_consistency: z.number().nullable(),
})

/**
 * Page meta information
 */
export const pageMetaSchema = z.object({
  title: z.string().nullable(),
  charset: z.number().nullable(),
  follow: z.boolean().nullable(),
  generator: z.string().nullable(),
  htags: z.record(z.string(), z.array(z.string())).nullable(),
  description: z.string().nullable(),
  favicon: z.string().nullable(),
  meta_keywords: z.string().nullable(),
  canonical: z.string().nullable(),
  internal_links_count: z.number().nullable(),
  external_links_count: z.number().nullable(),
  inbound_links_count: z.number().nullable(),
  images_count: z.number().nullable(),
  images_size: z.number().nullable(),
  scripts_count: z.number().nullable(),
  scripts_size: z.number().nullable(),
  stylesheets_count: z.number().nullable(),
  stylesheets_size: z.number().nullable(),
  title_length: z.number().nullable(),
  description_length: z.number().nullable(),
  cumulative_layout_shift: z.number().nullable(),
  content: pageContentSchema.nullable(),
})

/**
 * Instant page result
 */
export const instantPageResultSchema = z.object({
  resource_type: z.string(),
  status_code: z.number(),
  url: z.string(),
  meta: pageMetaSchema,
  page_timing: pageTimingSchema,
  onpage_score: z.number(),
  total_dom_size: z.number().nullable(),
  size: z.number().nullable(),
  encoded_size: z.number().nullable(),
  total_transfer_size: z.number().nullable(),
  fetch_time: z.string().nullable(),
  cache_control: z
    .object({
      cachable: z.boolean(),
      ttl: z.number(),
    })
    .nullable(),
  checks: z.record(z.string(), z.boolean()),
  media_type: z.string().nullable(),
  url_length: z.number(),
  relative_url_length: z.number(),
})

/**
 * Lighthouse category score
 */
export const lighthouseCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number().nullable(),
  description: z.string().nullable(),
})

/**
 * Lighthouse audit result
 */
export const lighthouseResultSchema = z.object({
  lighthouse_version: z.string(),
  fetch_time: z.string(),
  categories: z.record(z.string(), lighthouseCategorySchema),
})

/**
 * Microdata (schema.org) item
 */
export const microdataItemSchema = z.object({
  type: z.string(),
  fields: z.record(z.string(), z.unknown()),
})

// ============================================================================
// Task-Based Crawl Schemas (Full Site Audit)
// ============================================================================

/**
 * Site crawl task input (POST /v3/on_page/task_post)
 */
export const siteCrawlTaskInputSchema = z.object({
  target: domainSchema,
  maxCrawlPages: z.number().int().min(1).max(100000).default(100),
  startUrl: z.string().url().optional(),
  enableJavascript: z.boolean().default(true),
  enableBrowserRendering: z.boolean().default(true),
  loadResources: z.boolean().default(true),
  storeRawHtml: z.boolean().default(false),
  calculateKeywordDensity: z.boolean().default(false),
  crawlDelay: z.number().int().min(0).max(10000).default(2000),
  respectSitemap: z.boolean().default(false),
  customUserAgent: z.string().max(500).optional(),
  acceptLanguage: z.string().max(50).optional(),
  allowSubdomains: z.boolean().default(false),
  disableCookiePopup: z.boolean().default(true),
})

/**
 * Pagination options for fetching pages/resources/links
 */
export const fetchPaginationSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  filters: z.array(z.union([z.array(z.any()), z.string()])).optional(),
  orderBy: z.array(z.string()).optional(),
})

/**
 * Task ready result from tasks_ready endpoint
 */
export const taskReadyResultSchema = z.object({
  id: z.string(),
  tag: z.string().nullable().optional(),
  api: z.string().optional(),
})

/**
 * Crawl status object from Summary
 */
export const crawlStatusSchema = z.object({
  max_crawl_pages: z.number(),
  pages_in_queue: z.number(),
  pages_crawled: z.number(),
})

/**
 * Domain info from Summary
 */
export const domainInfoSchema = z.object({
  name: z.string().nullable(),
  cms: z.string().nullable(),
  ip: z.string().nullable(),
  server: z.string().nullable(),
  crawl_start: z.string().nullable(),
  crawl_end: z.string().nullable(),
  extended_crawl_status: z.string().nullable(),
  ssl_info: z
    .object({
      valid_certificate: z.boolean().nullable(),
      certificate_issuer: z.string().nullable(),
      certificate_subject: z.string().nullable(),
      certificate_version: z.string().nullable(),
      certificate_hash: z.string().nullable(),
      certificate_expiration_date: z.string().nullable(),
    })
    .nullable(),
  checks: z
    .object({
      sitemap: z.boolean().nullable(),
      robots_txt: z.boolean().nullable(),
      start_page_deny_flag: z.boolean().nullable(),
      ssl: z.boolean().nullable(),
      http2: z.boolean().nullable(),
      test_canonicalization: z.boolean().nullable(),
      test_www_redirect: z.boolean().nullable(),
      test_hidden_server_signature: z.boolean().nullable(),
      test_page_not_found: z.boolean().nullable(),
      test_directory_browsing: z.boolean().nullable(),
      test_https_redirect: z.boolean().nullable(),
    })
    .nullable(),
  total_pages: z.number().nullable(),
  page_not_found_status_code: z.number().nullable(),
  canonicalization_status_code: z.number().nullable(),
  directory_browsing_status_code: z.number().nullable(),
  www_redirect_status_code: z.number().nullable(),
  main_domain: z.string().nullable(),
})

/**
 * Page metrics from Summary
 */
export const pageMetricsFromSummarySchema = z.object({
  links_external: z.number().nullable(),
  links_internal: z.number().nullable(),
  duplicate_title: z.number().nullable(),
  duplicate_description: z.number().nullable(),
  duplicate_content: z.number().nullable(),
  broken_links: z.number().nullable(),
  broken_resources: z.number().nullable(),
  links_relation_conflict: z.number().nullable(),
  redirect_loop: z.number().nullable(),
  onpage_score: z.number().nullable(),
  non_indexable: z.number().nullable(),
  checks: z.record(z.string(), z.number()).nullable(),
})

/**
 * Crawl summary result
 */
export const crawlSummaryResultSchema = z.object({
  crawl_progress: z.enum(['in_progress', 'finished']),
  crawl_status: crawlStatusSchema,
  crawl_gateway_address: z.string().nullable(),
  crawl_stop_reason: z
    .enum(['limit_exceeded', 'empty_queue', 'force_stopped', 'unexpected_exception'])
    .nullable(),
  domain_info: domainInfoSchema.nullable(),
  page_metrics: pageMetricsFromSummarySchema.nullable(),
})

/**
 * Crawled page result
 */
export const crawledPageResultSchema = z.object({
  resource_type: z.string(),
  status_code: z.number(),
  location: z.string().nullable(),
  url: z.string(),
  meta: pageMetaSchema.nullable(),
  page_timing: pageTimingSchema.nullable(),
  onpage_score: z.number().nullable(),
  total_dom_size: z.number().nullable(),
  size: z.number().nullable(),
  encoded_size: z.number().nullable(),
  total_transfer_size: z.number().nullable(),
  fetch_time: z.string().nullable(),
  cache_control: z
    .object({
      cachable: z.boolean().nullable(),
      ttl: z.number().nullable(),
    })
    .nullable(),
  checks: z.record(z.string(), z.boolean()).nullable(),
  content_encoding: z.string().nullable(),
  media_type: z.string().nullable(),
  server: z.string().nullable(),
  is_resource: z.boolean().nullable(),
  url_length: z.number().nullable(),
  relative_url_length: z.number().nullable(),
  click_depth: z.number().nullable(),
})

/**
 * Crawled resource result
 */
export const crawledResourceResultSchema = z.object({
  resource_type: z.string(),
  url: z.string(),
  size: z.number().nullable(),
  encoded_size: z.number().nullable(),
  total_transfer_size: z.number().nullable(),
  fetch_time: z.string().nullable(),
  status_code: z.number().nullable(),
  cache_control: z
    .object({
      cachable: z.boolean().nullable(),
      ttl: z.number().nullable(),
    })
    .nullable(),
  checks: z.record(z.string(), z.boolean()).nullable(),
  content_encoding: z.string().nullable(),
  media_type: z.string().nullable(),
  last_modified: z.string().nullable(),
  accept_type: z.string().nullable(),
})

/**
 * Crawled link result
 */
export const crawledLinkResultSchema = z.object({
  type: z.string(),
  domain_from: z.string().nullable(),
  domain_to: z.string().nullable(),
  page_from: z.string().nullable(),
  page_to: z.string().nullable(),
  link_from: z.string().nullable(),
  link_to: z.string().nullable(),
  text: z.string().nullable(),
  anchor: z.string().nullable(),
  link_attribute: z.array(z.string()).nullable(),
  dofollow: z.boolean().nullable(),
  page_from_scheme: z.string().nullable(),
  page_to_scheme: z.string().nullable(),
  direction: z.string().nullable(),
  is_broken: z.boolean().nullable(),
  is_link_relation_conflict: z.boolean().nullable(),
})

// ============================================================================
// Type Exports
// ============================================================================

// Input types use z.input to make defaulted fields optional for callers
export type InstantPageInput = z.input<typeof instantPageInputSchema>
export type LighthouseInput = z.input<typeof lighthouseInputSchema>
export type CrawlTaskInput = z.input<typeof crawlTaskInputSchema>
export type CrawlResultsInput = z.input<typeof crawlResultsInputSchema>
export type InstantPageResult = z.infer<typeof instantPageResultSchema>
export type LighthouseResult = z.infer<typeof lighthouseResultSchema>
export type MicrodataItem = z.infer<typeof microdataItemSchema>
export type PageTiming = z.infer<typeof pageTimingSchema>
export type PageMeta = z.infer<typeof pageMetaSchema>

// Task-based crawl types
export type SiteCrawlTaskInput = z.input<typeof siteCrawlTaskInputSchema>
export type FetchPaginationOptions = z.input<typeof fetchPaginationSchema>
export type TaskReadyResult = z.infer<typeof taskReadyResultSchema>
export type CrawlSummaryResult = z.infer<typeof crawlSummaryResultSchema>
export type CrawledPageResult = z.infer<typeof crawledPageResultSchema>
export type CrawledResourceResult = z.infer<typeof crawledResourceResultSchema>
export type CrawledLinkResult = z.infer<typeof crawledLinkResultSchema>
export type DomainInfo = z.infer<typeof domainInfoSchema>
export type CrawlStatus = z.infer<typeof crawlStatusSchema>
export type PageMetricsFromSummary = z.infer<typeof pageMetricsFromSummarySchema>
