// Phase 3: Audit Engine Types
// Types for Inngest events, audit steps, and scoring

import { type StepError, type ErrorCategory } from '@/lib/dataforseo/types'
import { type HistoricalRankItem } from '@/lib/dataforseo/schemas'

// Re-export for convenience
export type { StepError, ErrorCategory }

/**
 * Audit status values - matches Prisma enum
 */
export const AuditStatus = {
  PENDING: 'PENDING',
  CRAWLING: 'CRAWLING',
  ANALYZING: 'ANALYZING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export type AuditStatusType = (typeof AuditStatus)[keyof typeof AuditStatus]

/**
 * Audit step identifiers
 */
export const AuditStep = {
  ONPAGE_CRAWL: 'onpage_crawl',
  SERP_ANALYSIS: 'serp_analysis',
  BACKLINKS_ANALYSIS: 'backlinks_analysis',
  COMPETITOR_ANALYSIS: 'competitor_analysis',
  BUSINESS_DATA: 'business_data',
} as const

export type AuditStepType = (typeof AuditStep)[keyof typeof AuditStep]

/**
 * Inngest event: Request a new audit
 */
export interface AuditRequestedEvent {
  name: 'audit/requested'
  data: {
    auditId: string
    domain: string
    userId: string
    options?: AuditOptions
    // Phase 6: Enhanced audit inputs
    businessName?: string
    location?: string
    gmbPlaceId?: string
    targetKeywords?: string[]
    competitorDomains?: string[]
  }
}

/**
 * Inngest event: Audit step completed
 */
export interface AuditStepCompleteEvent {
  name: 'audit/step.complete'
  data: {
    auditId: string
    step: AuditStepType
    success: boolean
    duration: number
    error?: string
  }
}

/**
 * Inngest event: Audit completed successfully
 */
export interface AuditCompletedEvent {
  name: 'audit/completed'
  data: {
    auditId: string
    score: number
    duration: number
  }
}

/**
 * Inngest event: Audit failed
 */
export interface AuditFailedEvent {
  name: 'audit/failed'
  data: {
    auditId: string
    step: AuditStepType
    error: string
    retryable: boolean
  }
}

/**
 * Union of all audit events for Inngest
 */
export type AuditEvent =
  | AuditRequestedEvent
  | AuditStepCompleteEvent
  | AuditCompletedEvent
  | AuditFailedEvent

/**
 * Phase 6: Enhanced audit creation form data
 */
export interface AuditFormData {
  /** Target domain to audit */
  domain: string
  /** Business name for GBP lookup (optional) */
  businessName?: string
  /** Location for local SERP targeting (City, State) */
  location?: string
  /** Google Place ID if known */
  gmbPlaceId?: string
  /** User-specified keywords to track */
  targetKeywords?: string[]
  /** Competitor domains to compare */
  competitorDomains?: string[]
}

/**
 * Options for running an audit
 */
export interface AuditOptions {
  /** Skip cache and force fresh data */
  skipCache?: boolean
  /** Priority level for queue ordering */
  priority?: 'low' | 'normal' | 'high'
  /** Max pages to crawl (default: 100) */
  maxPages?: number
  /** Keywords to track for SERP (default: dental keywords) */
  keywords?: string[]
  /** Include backlinks analysis */
  includeBacklinks?: boolean
  /** Include GMB/business data */
  includeBusinessData?: boolean
}

/**
 * Progress tracking for audit
 */
export interface AuditProgress {
  status: AuditStatusType
  currentStep: AuditStepType | null
  progress: number // 0-100
  stepsCompleted: AuditStepType[]
  startedAt: Date
  estimatedCompletion?: Date
  error?: string
}

/**
 * SERP Feature flags for a keyword
 */
export interface SerpFeatures {
  featuredSnippet: boolean
  localPack: boolean
  peopleAlsoAsk: boolean
  images: boolean
  video: boolean
  reviews: boolean
  sitelinks: boolean
  knowledgePanel: boolean
  shopping: boolean
}

/**
 * Search intent types (from DataForSEO Labs API)
 */
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional'

/**
 * Per-keyword tracking data
 * Enhanced with data from DataForSEO Labs Historical Keyword Data API
 */
export interface KeywordData {
  keyword: string
  position: number | null
  previousPosition?: number | null
  searchVolume: number | null
  cpc: number | null
  serpFeatures: SerpFeatures
  url: string | null // Which page ranks
  /** Competition value 0-1 (multiply by 100 for percentage) */
  competition?: number
  /** Competition level: LOW, MEDIUM, HIGH */
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  /** Estimated traffic value from this keyword */
  etv?: number
  /** Estimated paid traffic cost */
  trafficCost?: number
  /** Whether this is a new ranking */
  isNew?: boolean
  /** Whether position improved from previous */
  isUp?: boolean
  /** Monthly search volume history (last 12 months) */
  monthlySearches?: Record<string, number>
  /** Search volume trend percentages */
  searchVolumeTrend?: {
    monthly?: number
    quarterly?: number
    yearly?: number
  }
  /** Date when historical data was collected (YYYY-MM format) */
  historicalDataDate?: string
  /** Low estimate for top of page bid (Google Ads) */
  lowTopOfPageBid?: number
  /** High estimate for top of page bid (Google Ads) */
  highTopOfPageBid?: number
}

/**
 * Rating distribution (1-5 stars)
 */
export interface RatingDistribution {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
}

/**
 * Business attributes from GMB
 */
export interface BusinessAttributes {
  accessibility: string[]
  amenities: string[]
  offerings: string[]
  payments: string[]
}

/**
 * Competitor data from "people also search"
 */
export interface CompetitorData {
  name: string
  rating: number | null
  reviewCount: number
  cid: string
  domain?: string
}

/**
 * Top referring domain info
 */
export interface ReferringDomainData {
  domain: string
  backlinks: number
  domainRank: number
}

/**
 * Anchor text distribution
 */
export interface AnchorData {
  anchor: string
  count: number
  percentage: number
}

/**
 * Core Web Vitals
 */
export interface CoreWebVitals {
  lcp: number | null // Largest Contentful Paint (ms)
  fid: number | null // First Input Delay (ms)
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte (ms)
  fcp: number | null // First Contentful Paint (ms)
}

/**
 * Social media tags (Open Graph, Twitter Cards, etc.)
 */
export interface SocialMediaTags {
  [key: string]: string | undefined
}

/**
 * Spell check information from DataForSEO
 */
export interface SpellInfo {
  hunspellLanguage: string | null
  misspelledWords: string[] | null
}

/**
 * Last modified timestamps from DataForSEO
 */
export interface LastModified {
  header: string | null
  sitemap: string | null
  metaTag: string | null
}

/**
 * Page-level info from instant_pages API
 */
export interface OnPageInfo {
  resourceType: string | null
  statusCode: number | null
  location: string | null // redirect location header
  url: string | null
  acceptType: string | null
  clickDepth: number | null
  isResource: boolean
  lastModified: LastModified | null
  customJsResponse: unknown | null
}

/**
 * Individual Lighthouse audit result
 */
export interface LighthouseAudit {
  id: string
  title: string
  description: string
  score: number | null
  scoreDisplayMode: string
  displayValue?: string
  numericValue?: number
  numericUnit?: string
}

/**
 * Lighthouse category with score and audit refs
 */
export interface LighthouseCategory {
  id: string
  title: string
  score: number | null
  description?: string
}

/**
 * Full Lighthouse data from DataForSEO
 */
export interface LighthouseData {
  version: string | null
  fetchTime: string | null
  userAgent: string | null
  environment: {
    networkUserAgent: string | null
    hostUserAgent: string | null
    benchmarkIndex: number | null
  } | null
  categories: {
    performance: LighthouseCategory | null
    seo: LighthouseCategory | null
    accessibility: LighthouseCategory | null
  }
  audits: LighthouseAudit[]
}

/**
 * Full meta information from DataForSEO instant_pages API
 */
export interface OnPageMeta {
  // Basic meta
  title: string | null
  metaTitle: string | null
  description: string | null
  titleLength: number
  descriptionLength: number
  charset: number | null
  favicon: string | null
  follow: boolean

  // Heading tags
  htags: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4?: string[]
    h5?: string[]
    h6?: string[]
  }

  // Links & resources counts
  internalLinksCount: number
  externalLinksCount: number
  inboundLinksCount: number
  imagesCount: number
  imagesSize: number
  scriptsCount: number
  scriptsSize: number
  stylesheetsCount: number
  stylesheetsSize: number
  renderBlockingScriptsCount: number
  renderBlockingStylesheetsCount: number

  // Generator & CMS
  generator: string | null

  // SEO meta
  canonical: string | null
  metaKeywords: string | null
  socialMediaTags: SocialMediaTags | null

  // Content metrics in meta
  cumulativeLayoutShift: number | null

  // Deprecated/duplicate tags
  deprecatedTags: string[] | null
  duplicateMetaTags: string[] | null

  // Spell check
  spell: SpellInfo | null
}

/**
 * Content analysis metrics from DataForSEO
 */
export interface OnPageContent {
  plainTextSize: number
  plainTextRate: number
  plainTextWordCount: number
  automatedReadabilityIndex: number | null
  colemanLiauReadabilityIndex: number | null
  daleChallReadabilityIndex: number | null
  fleschKincaidReadabilityIndex: number | null
  smogReadabilityIndex: number | null
  descriptionToContentConsistency: number | null
  titleToContentConsistency: number | null
  metaKeywordsToContentConsistency: number | null
}

/**
 * Page timing metrics from DataForSEO
 */
export interface OnPageTiming {
  // Core Web Vitals timing
  timeToInteractive: number | null
  domComplete: number | null
  largestContentfulPaint: number | null
  firstInputDelay: number | null

  // Connection timing
  connectionTime: number | null
  timeToSecureConnection: number | null
  requestSentTime: number | null
  waitingTime: number | null // TTFB

  // Download timing
  downloadTime: number | null
  durationTime: number | null
  fetchStart: number | null
  fetchEnd: number | null
}

/**
 * SEO checks (boolean flags) from DataForSEO
 * ALL fields from instant_pages API checks object
 */
export interface OnPageChecks {
  // URL & Protocol checks
  isWww: boolean
  isHttps: boolean
  isHttp: boolean
  isBroken: boolean
  isRedirect: boolean
  is4xxCode: boolean
  is5xxCode: boolean
  seoFriendlyUrl: boolean
  seoFriendlyUrlCharactersCheck: boolean
  seoFriendlyUrlDynamicCheck: boolean
  seoFriendlyUrlKeywordsCheck: boolean
  seoFriendlyUrlRelativeLengthCheck: boolean

  // HTML Structure checks
  hasHtmlDoctype: boolean
  noDoctype: boolean
  frame: boolean
  flash: boolean
  deprecatedHtmlTags: boolean
  hasRenderBlockingResources: boolean
  hasMetaRefreshRedirect: boolean
  duplicateMetaTags: boolean
  duplicateTitleTag: boolean

  // Meta checks
  canonical: boolean
  noEncodingMetaTag: boolean
  metaCharsetConsistency: boolean
  hasMicromarkup: boolean
  hasMicromarkupErrors: boolean

  // Title checks
  titleTooShort: boolean
  titleTooLong: boolean
  noTitle: boolean
  hasMetaTitle: boolean
  duplicateTitle: boolean
  irrelevantTitle: boolean

  // Description checks
  noDescription: boolean
  irrelevantDescription: boolean
  duplicateDescription: boolean

  // Content checks
  lowContentRate: boolean
  highContentRate: boolean
  lowCharacterCount: boolean
  highCharacterCount: boolean
  lowReadabilityRate: boolean
  duplicateContent: boolean
  loremIpsum: boolean
  hasMisspelling: boolean
  noH1Tag: boolean
  irrelevantMetaKeywords: boolean

  // Image checks
  noImageAlt: boolean
  noImageTitle: boolean

  // Performance checks
  highLoadingTime: boolean
  highWaitingTime: boolean
  noContentEncoding: boolean

  // Size checks
  smallPageSize: boolean
  largePageSize: boolean
  sizeGreaterThan3mb: boolean

  // Security checks
  httpsToHttpLinks: boolean

  // Resource checks
  brokenResources: boolean
  brokenLinks: boolean
  noFavicon: boolean
}

/**
 * Resource warning from DataForSEO
 */
export interface OnPageWarning {
  line: number
  column: number
  message: string
  statusCode: number
}

/**
 * Resource info from DataForSEO
 */
export interface OnPageResources {
  totalDomSize: number
  size: number
  encodedSize: number
  totalTransferSize: number
  contentEncoding: string | null
  mediaType: string | null
  server: string | null
  urlLength: number
  relativeUrlLength: number
  cacheControl: {
    cachable: boolean
    ttl: number | null
  } | null
  warnings: OnPageWarning[]
  fetchTime: string | null
}

/**
 * Step result data structures
 */
export interface OnPageStepResult {
  // Basic metrics (existing)
  pagesAnalyzed: number
  issuesFound: number
  pageSpeed: number
  mobileScore: number
  hasSchema: boolean
  httpsEnabled: boolean
  brokenLinks: number
  missingAltTags: number
  missingMetaDescriptions: number

  // DataForSEO scores (existing in extended)
  onpageScore?: number
  lighthousePerformance?: number
  lighthouseSeo?: number
  lighthouseAccessibility?: number
  lighthouseBestPractices?: number

  // Core Web Vitals
  coreWebVitals?: CoreWebVitals

  // HTTPS Verification
  /** Direct HTTPS verification result (actual fetch test) */
  httpsVerified?: boolean
  /** True if DataForSEO flag doesn't match direct verification */
  httpsVerificationMismatch?: boolean

  // Full data from DataForSEO instant_pages API
  /** Page-level info (resource type, status code, URL info) */
  pageInfo?: OnPageInfo
  /** Full meta information (title, description, htags, links, images, social) */
  meta?: OnPageMeta
  /** Content analysis (word count, readability scores, consistency) */
  content?: OnPageContent
  /** Page timing metrics (TTI, DOM complete, connection times) */
  timing?: OnPageTiming
  /** SEO checks (boolean flags for various SEO issues) */
  checks?: OnPageChecks
  /** Resource info (DOM size, server, cache, warnings) */
  resources?: OnPageResources

  // Full Lighthouse data
  /** Complete Lighthouse audit data with individual audits */
  lighthouse?: LighthouseData
}

/**
 * SERP features summary with counts
 */
export interface SerpFeaturesSummary {
  localPack: number
  featuredSnippet: number
  peopleAlsoAsk: number
  images: number
  video: number
  reviews: number
  sitelinks: number
  knowledgePanel: number
  shopping: number
  aiOverview: number
}

export interface SerpStepResult {
  // SERP presence indicators
  localPackPresence: boolean
  featuredSnippets: number

  // Per-keyword details (legacy - kept for backward compatibility)
  keywords?: KeywordData[]

  // Discovery keywords (from Labs ranked_keywords API)
  // All keywords the domain currently ranks for with rich data
  discoveryKeywords?: KeywordData[]

  // Tracked keywords (from SERP API)
  // User-specified keywords to monitor over time
  trackedKeywords?: KeywordData[]

  // SERP features summary with counts
  serpFeaturesSummary?: SerpFeaturesSummary

  // Total estimated traffic
  totalEtv?: number

  // Total estimated traffic cost
  totalTrafficCost?: number

  // Historical keyword ranking trend (6 months)
  // Used for SEMrush-style keyword trend chart
  keywordTrend?: HistoricalRankItem[]
}

export interface BacklinksStepResult {
  // Existing metrics
  totalBacklinks: number
  referringDomains: number
  domainRank: number
  spamScore: number
  dofollowRatio: number

  // NEW: Extended metrics
  targetSpamScore?: number

  // NEW: Top referring domains (top 10)
  topReferringDomains?: ReferringDomainData[]

  // NEW: Anchor text distribution (top 10)
  anchorDistribution?: AnchorData[]
}

/**
 * SEO Competitor metrics for competitor analysis step
 * Note: Different from GBP CompetitorData which is for "people also search"
 */
export interface SEOCompetitorMetrics {
  /** Domain name */
  domain: string
  /** Domain rank (0-1000) from backlinks */
  rank: number
  /** Estimated monthly organic traffic (ETV) */
  organicTraffic: number
  /** Estimated traffic value in USD */
  trafficValue: number
  /** Total backlinks count */
  backlinks: number
  /** Number of referring domains */
  referringDomains: number
  /** Total ranking keywords */
  rankingKeywords: number
  /** Keywords in top 10 positions */
  top10Keywords: number
  /** Average position across keywords */
  avgPosition: number
  /** Number of keyword intersections with target */
  keywordIntersections: number
  /** Position distribution */
  positionDistribution?: {
    pos_1: number
    pos_2_3: number
    pos_4_10: number
    pos_11_20: number
    pos_21_30: number
    pos_31_40: number
    pos_41_50: number
    pos_51_60: number
    pos_61_70: number
    pos_71_80: number
    pos_81_90: number
    pos_91_100: number
  }
  /** Keyword movement stats */
  keywordMovement?: {
    isNew: number
    isUp: number
    isDown: number
    isLost?: number
  }
}

/**
 * Competitor analysis step result
 * Contains data for user-specified competitor domains
 */
export interface CompetitorStepResult {
  /** Target domain metrics (for comparison) */
  targetMetrics: SEOCompetitorMetrics
  /** Competitor metrics array */
  competitors: SEOCompetitorMetrics[]
  /** Auto-discovered competitors (from Labs API) */
  discoveredCompetitors?: SEOCompetitorMetrics[]
}

export interface BusinessStepResult {
  // Basic (existing)
  hasGmbListing: boolean
  gmbRating: number | null
  reviewCount: number
  napConsistent: boolean
  categoriesSet: boolean
  photosCount: number
  postsRecent: boolean

  // NEW: Full profile data
  businessName?: string
  description?: string
  address?: string
  phone?: string
  website?: string
  placeId?: string
  isClaimed?: boolean

  // NEW: Rating breakdown
  ratingDistribution?: RatingDistribution

  // NEW: Categories
  primaryCategory?: string
  additionalCategories?: string[]

  // NEW: Attributes
  attributes?: BusinessAttributes

  // NEW: Place topics (for review sentiment)
  placeTopics?: Record<string, number>

  // NEW: Competitors from "people also search"
  competitors?: CompetitorData[]

  // NEW: Work hours
  workHours?: Record<string, Array<{ open: string; close: string }>>
}

/**
 * Track errors from individual audit steps
 * Used to provide feedback when steps fail but audit continues
 */
export interface AuditStepErrors {
  onPage?: StepError
  serp?: StepError
  backlinks?: StepError
  competitors?: StepError
  business?: StepError
}

/**
 * Complete audit result with all step data
 */
export interface CompleteAuditResult {
  auditId: string
  domain: string
  onPage: OnPageStepResult | null
  serp: SerpStepResult | null
  backlinks: BacklinksStepResult | null
  competitors: CompetitorStepResult | null
  business: BusinessStepResult | null
  completedAt: Date
  duration: number
  /** Step errors if any steps failed but audit continued */
  warnings?: AuditStepErrors
}
