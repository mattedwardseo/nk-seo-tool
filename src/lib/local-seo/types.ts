/**
 * TypeScript types for Local SEO module
 *
 * These types are used internally by the local-seo library functions.
 */

import type { GridPoint } from './grid-calculator'

// ============================================================================
// Grid Scanning Types
// ============================================================================

/**
 * A competitor found at a grid point
 */
export interface CompetitorRanking {
  /** Business name */
  name: string
  /** Rank position at this point (1-20) */
  rank: number
  /** Google Maps CID (unique identifier) */
  cid?: string
  /** Google rating (1.0-5.0) */
  rating?: number
  /** Total review count */
  reviewCount?: number
  /** Business address */
  address?: string
  /** Business phone */
  phone?: string
  /** Business category */
  category?: string
}

/**
 * Result of scanning a single grid point
 */
export interface GridPointScanResult {
  /** Grid point that was scanned */
  point: GridPoint
  /** Keyword used for the search */
  keyword: string
  /** Target business rank at this point (null if not in top 20) */
  targetRank: number | null
  /** Top competitors at this point */
  topRankings: CompetitorRanking[]
  /** Total results returned by API */
  totalResults: number
  /** Whether the scan was successful */
  success: boolean
  /** Error message if scan failed */
  error?: string
  /** API response timestamp */
  scannedAt: Date
}

/**
 * Result of scanning all points for a single keyword
 */
export interface KeywordScanResult {
  /** Keyword that was scanned */
  keyword: string
  /** Results for each grid point */
  points: GridPointScanResult[]
  /** Number of successful scans */
  successfulScans: number
  /** Number of failed scans */
  failedScans: number
  /** Average rank across all points (null if never ranked) */
  avgRank: number | null
  /** Number of points where target ranked in top 3 */
  timesInTop3: number
  /** Number of points where target ranked in top 10 */
  timesInTop10: number
  /** Number of points where target ranked at all */
  timesRanked: number
}

/**
 * Complete scan result for a campaign
 */
export interface FullScanResult {
  /** Scan ID from database */
  scanId: string
  /** Campaign ID */
  campaignId: string
  /** Target business name */
  targetBusinessName: string
  /** Results per keyword */
  keywordResults: KeywordScanResult[]
  /** Overall statistics */
  stats: {
    totalPoints: number
    totalScans: number
    successfulScans: number
    failedScans: number
    apiCallsUsed: number
    estimatedCost: number
  }
  /** Timing */
  startedAt: Date
  completedAt: Date
}

// ============================================================================
// Competitor Aggregation Types
// ============================================================================

/**
 * Aggregated statistics for a competitor across all grid points
 */
export interface AggregatedCompetitorStats {
  /** Business name */
  businessName: string
  /** Google Maps CID */
  gmbCid?: string
  /** Google rating */
  rating?: number
  /** Review count */
  reviewCount?: number
  /** Average rank across all grid points */
  avgRank: number
  /** Number of times in top 3 */
  timesInTop3: number
  /** Number of times in top 10 */
  timesInTop10: number
  /** Number of times in top 20 */
  timesInTop20: number
  /** Share of voice (% of points in top 3) */
  shareOfVoice: number
  /** Previous scan's average rank (for comparison) */
  prevAvgRank?: number
  /** Rank change from previous scan */
  rankChange?: number
}

/**
 * Aggregation result for a full scan
 */
export interface ScanAggregationResult {
  /** Scan ID */
  scanId: string
  /** Target business stats */
  targetStats: AggregatedCompetitorStats
  /** All competitor stats (sorted by avg rank) */
  competitorStats: AggregatedCompetitorStats[]
  /** Overall metrics */
  overallMetrics: {
    avgRank: number
    shareOfVoice: number
    topCompetitor: string | null
    totalCompetitorsFound: number
  }
}

// ============================================================================
// Campaign Types
// ============================================================================

/**
 * Input for creating a new local campaign
 */
export interface CreateCampaignInput {
  /** Business name to track */
  businessName: string
  /** Google Place ID (optional) */
  gmbPlaceId?: string
  /** Google Maps CID (optional) */
  gmbCid?: string
  /** Center latitude */
  centerLat: number
  /** Center longitude */
  centerLng: number
  /** Grid size (default 7) */
  gridSize?: number
  /** Grid radius in miles (default 5) */
  gridRadiusMiles?: number
  /** Keywords to track */
  keywords: string[]
  /** Scan frequency: daily, weekly, monthly */
  scanFrequency?: 'daily' | 'weekly' | 'monthly'
}

/**
 * Input for updating a campaign
 */
export interface UpdateCampaignInput {
  /** Business name */
  businessName?: string
  /** Keywords to track */
  keywords?: string[]
  /** Campaign status */
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  /** Scan frequency */
  scanFrequency?: 'daily' | 'weekly' | 'monthly'
  /** Grid radius (changing this affects future scans) */
  gridRadiusMiles?: number
}

/**
 * Campaign summary for list views
 */
export interface CampaignSummary {
  id: string
  businessName: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  keywords: string[]
  gridSize: number
  gridRadiusMiles: number
  scanFrequency: string
  lastScanAt: Date | null
  nextScanAt: Date | null
  latestScan: {
    avgRank: number | null
    shareOfVoice: number | null
    rankChange?: number | null
  } | null
}

// ============================================================================
// GBP Types
// ============================================================================

/**
 * Rating distribution breakdown
 */
export interface RatingDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

/**
 * Business work hours for a single day
 */
export interface DayHours {
  day: string
  open: string
  close: string
  isOpen: boolean
}

/**
 * Business attribute category
 */
export interface AttributeCategory {
  category: string
  attributes: string[]
}

/**
 * Complete GBP data for dashboard
 */
export interface GBPDashboardData {
  /** Business identity */
  businessName: string
  gmbPlaceId?: string
  gmbCid?: string

  /** Rating & Reviews */
  rating: number | null
  reviewCount: number | null
  ratingDistribution: RatingDistribution | null

  /** Profile Completeness */
  completenessScore: number | null
  missingFields: string[]

  /** Contact Info */
  address: string | null
  phone: string | null
  website: string | null

  /** Categories */
  primaryCategory: string | null
  additionalCategories: string[]

  /** Attributes by category */
  attributes: AttributeCategory[]

  /** Work Hours */
  workHours: DayHours[]

  /** Photos */
  photoCount: number
  photoUrls: string[]

  /** Snapshot timestamp */
  snapshotDate: Date
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface LocalSeoApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

/**
 * Grid data for API response
 */
export interface GridDataResponse {
  scanId: string
  campaignId: string
  keyword: string
  gridSize: number
  points: Array<{
    row: number
    col: number
    lat: number
    lng: number
    rank: number | null
    topRankings: CompetitorRanking[]
  }>
  aggregates: {
    avgRank: number | null
    shareOfVoice: number
    timesInTop3: number
    timesNotRanking: number
  }
}

/**
 * Competitor list API response
 */
export interface CompetitorListResponse {
  scanId: string
  targetBusiness: AggregatedCompetitorStats
  competitors: AggregatedCompetitorStats[]
  totalCompetitors: number
}

// ============================================================================
// Color/Display Types
// ============================================================================

/**
 * Rank color category for UI
 */
export type RankColorCategory = 'excellent' | 'good' | 'average' | 'poor' | 'notRanking'

/**
 * Get rank color category
 */
export function getRankColorCategory(rank: number | null): RankColorCategory {
  if (rank === null) return 'notRanking'
  if (rank <= 3) return 'excellent'
  if (rank <= 10) return 'good'
  if (rank <= 20) return 'average'
  return 'poor'
}

/**
 * Rank color hex values
 */
export const RANK_COLORS: Record<RankColorCategory, string> = {
  excellent: '#22c55e', // green-500
  good: '#eab308', // yellow-500
  average: '#f97316', // orange-500
  poor: '#ef4444', // red-500
  notRanking: '#6b7280', // gray-500
}

/**
 * Rank color Tailwind classes (object format)
 */
export const RANK_COLOR_CLASSES_OBJ: Record<RankColorCategory, { bg: string; text: string }> = {
  excellent: { bg: 'bg-green-500', text: 'text-green-500' },
  good: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
  average: { bg: 'bg-orange-500', text: 'text-orange-500' },
  poor: { bg: 'bg-red-500', text: 'text-red-500' },
  notRanking: { bg: 'bg-gray-500', text: 'text-gray-500' },
}

/**
 * Simple Tailwind classes for grid cells (background only)
 */
export const RANK_COLOR_CLASSES = {
  top3: 'bg-green-500 text-white',
  top10: 'bg-yellow-500 text-black',
  top20: 'bg-orange-500 text-white',
  notRanking: 'bg-red-500 text-white',
} as const

// ============================================================================
// GBP Comparison Types (Phase 12)
// ============================================================================

/**
 * GBP profile data for comparison
 */
export interface GBPComparisonProfile {
  /** Business name */
  businessName: string
  /** Google Maps CID */
  gmbCid?: string

  // Ratings & Reviews
  rating: number | null
  reviewCount: number | null

  // Categories
  primaryCategory: string | null
  additionalCategories: string[]
  categoryCount: number

  // Name analysis
  nameHasKeyword: boolean
  nameHasCity: boolean

  // Description
  hasDescription: boolean
  descriptionLength: number
  description?: string

  // Contact info
  hasPhone: boolean
  phone?: string
  hasWebsite: boolean
  website?: string
  hasAddress: boolean
  address?: string

  // Attributes
  attributes: Record<string, string[]>
  attributeCategories: string[]
  attributeCount: number

  // Hours
  hasWorkHours: boolean
  hoursComplete: boolean
  workHours?: Record<string, string[]>

  // Media
  photoCount: number

  // Other profile indicators
  isClaimed: boolean
  hasServices: boolean
  hasProducts: boolean

  // Completeness
  completenessScore: number
}

/**
 * Gap identified between target and competitors
 */
export interface GBPGap {
  /** Field identifier */
  field: string
  /** Human-readable label */
  label: string
  /** Gap severity */
  severity: 'critical' | 'important' | 'nice-to-have'
  /** Target's current value */
  yourValue: string | number | boolean
  /** Best competitor's value */
  competitorBest: {
    name: string
    value: string | number | boolean
  }
  /** Average across competitors */
  competitorAvg: string | number | boolean
  /** Actionable recommendation */
  recommendation: string
}

/**
 * Manual check item (API can't fetch this data)
 */
export interface ManualCheckItem {
  field: string
  label: string
  description: string
  checkUrl?: string
}

/**
 * Comparison field for side-by-side display
 */
export interface ComparisonField {
  field: string
  label: string
  category: 'identity' | 'contact' | 'content' | 'engagement' | 'media'
  targetValue: string | number | boolean | null
  competitorValues: Array<{
    name: string
    value: string | number | boolean | null
  }>
  /** Higher is better (for numeric fields) */
  higherIsBetter?: boolean
  /** Target is winning on this field */
  targetWinning: boolean
}

/**
 * Full GBP comparison response
 */
export interface GBPComparisonResponse {
  target: GBPComparisonProfile
  competitors: GBPComparisonProfile[]
  comparison: ComparisonField[]
  gaps: GBPGap[]
  manualChecks: ManualCheckItem[]
  recommendations: string[]
  cacheAge: number
}

/**
 * Result from analyzing a business name
 */
export interface NameAnalysisResult {
  hasKeyword: boolean
  hasCity: boolean
  matchedKeyword?: string
  matchedCity?: string
}

/**
 * Competitor from map pack for keyword comparison
 */
export interface MapPackCompetitor {
  name: string
  rank: number
  cid?: string
  rating?: number
  reviewCount?: number
  address?: string
}
