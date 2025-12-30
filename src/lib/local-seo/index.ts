/**
 * Local SEO Module
 *
 * SEMRush-style Map Rank Tracker for local business visibility tracking.
 * Provides 7x7 grid-based local rankings with competitor analysis.
 */

// Grid calculator
export {
  generateGridPoints,
  calculateDistance,
  calculateDestination,
  getGridCenter,
  isGridCenter,
  getGridStats,
  formatCoordinateForApi,
  gridPointsToApiFormat,
  type GridPoint,
  type GridConfig,
} from './grid-calculator'

// Grid scanner
export {
  scanGridPoint,
  scanGridForKeyword,
  scanGridForAllKeywords,
  estimateScanCost,
  calculateScanStats,
  type GridScanConfig,
} from './grid-scanner'

// Competitor aggregator
export {
  aggregateCompetitorStats,
  calculateRankChanges,
  groupByPerformanceTier,
  getTopCompetitors,
  calculateMarketShare,
  generateCompetitiveSummary,
} from './competitor-aggregator'

// Types
export {
  type CompetitorRanking,
  type GridPointScanResult,
  type KeywordScanResult,
  type FullScanResult,
  type AggregatedCompetitorStats,
  type ScanAggregationResult,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type CampaignSummary,
  type RatingDistribution,
  type DayHours,
  type AttributeCategory,
  type GBPDashboardData,
  type LocalSeoApiResponse,
  type GridDataResponse,
  type CompetitorListResponse,
  type RankColorCategory,
  getRankColorCategory,
  RANK_COLORS,
  RANK_COLOR_CLASSES,
} from './types'
