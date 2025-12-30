// SEO Audit Types
// Extended in Phase 6 with full DataForSEO response types

// Re-export extended types from audit.ts for convenience
export type {
  KeywordData,
  SerpFeatures,
  RatingDistribution,
  BusinessAttributes,
  CompetitorData,
  ReferringDomainData,
  AnchorData,
  CoreWebVitals,
} from './audit'

/**
 * Audit status enum values
 */
export type AuditStatus = 'pending' | 'running' | 'complete' | 'failed'

/**
 * Keyword intent classification
 */
export type KeywordIntent = 'informational' | 'navigational' | 'transactional' | 'commercial'

/**
 * Extended keyword data with intent
 */
export interface KeywordWithIntent {
  keyword: string
  intent: KeywordIntent
  searchVolume: number
  difficulty: number
  cpc: number
}

/**
 * Competitor comparison metrics
 */
export interface CompetitorMetrics {
  domain: string
  name?: string
  overallScore?: number
  technicalScore?: number
  backlinksScore?: number
  contentScore?: number
  localScore?: number
  totalBacklinks?: number
  referringDomains?: number
  domainRank?: number
  organicTraffic?: number
  organicKeywords?: number
}

/**
 * Backlink opportunity from competitor analysis
 */
export interface BacklinkOpportunity {
  referringDomain: string
  domainRank: number
  competitorCount: number // How many competitors have this link
  competitors: string[]
  url?: string
}

/**
 * Local citation data
 */
export interface CitationData {
  source: string
  name: string
  address: string
  phone: string
  isConsistent: boolean
  url?: string
}

/**
 * NAP (Name, Address, Phone) consistency
 */
export interface NAPData {
  name: string
  address: string
  phone: string
  isConsistent: boolean
  sources: CitationData[]
}

/**
 * Review data for sentiment analysis
 */
export interface ReviewData {
  text: string
  rating: number
  date: Date
  author?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}

/**
 * Review sentiment summary
 */
export interface ReviewSentimentSummary {
  positive: number
  neutral: number
  negative: number
  total: number
  avgRating: number
  topThemes: Array<{ theme: string; count: number }>
}

/**
 * Result of a complete SEO audit
 */
export interface AuditResult {
  id: string
  domain: string
  status: AuditStatus
  score: number | null
  metrics: MetricResult[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Individual metric from an audit
 */
export interface MetricResult {
  id: number
  name: string
  value: number | null
  recordedAt: Date
  metadata?: Record<string, unknown>
}

/**
 * API response wrapper for consistent responses
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
