// Core audit components
export { AuditStatusBadge } from './AuditStatusBadge'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { AuditFilters } from './AuditFilters'
export { AuditTable, type AuditRow } from './AuditTable'
export { NewAuditForm } from './NewAuditForm'
export { AuditProgress } from './AuditProgress'
export { ActionPlanTab } from './ActionPlanTab'

// Metric components
export { TrendIndicator } from './TrendIndicator'
export { CategoryBreakdown } from './CategoryBreakdown'

// Competitor analysis components
export {
  CompetitorComparison,
  CompetitorComparisonSkeleton,
  CompetitorComparisonEmpty,
  type CompetitorMetrics,
  type CompetitorComparisonProps,
} from './CompetitorComparison'

export {
  CompetitorRadar,
  SingleRadar,
  CompetitorRadarSkeleton,
  type RadarMetrics,
  type CompetitorRadarData,
  type CompetitorRadarProps,
} from './CompetitorRadar'

// Backlink components
export {
  BacklinkGap,
  BacklinkGapSummary,
  BacklinkGapSkeleton,
  type BacklinkGapDomain,
  type BacklinkGapProps,
} from './BacklinkGap'

// Keyword components
export {
  KeywordTable,
  KeywordTableSkeleton,
  type KeywordData,
  type KeywordTableProps,
} from './KeywordTable'

export {
  KeywordTrendChart,
  KeywordTrendChartSkeleton,
  type KeywordTrendChartProps,
} from './KeywordTrendChart'

// Local SEO components
export {
  GBPCompleteness,
  GBPSummary,
  GBPCompletenessSkeleton,
  type GBPFieldStatus,
  type GBPField,
  type GBPCompletenessData,
  type GBPCompletenessProps,
} from './GBPCompleteness'

export {
  ReviewSentiment,
  ReviewSummary,
  ReviewSentimentSkeleton,
  type SentimentType,
  type ReviewData,
  type SentimentStats,
  type ReviewSentimentProps,
} from './ReviewSentiment'

export {
  CitationConsistency,
  CitationSummary,
  CitationConsistencySkeleton,
  type CitationStatus,
  type NAPData,
  type CitationSource,
  type CitationConsistencyData,
  type CitationConsistencyProps,
} from './CitationConsistency'

// Technical/OnPage - Now using new tabbed structure in ./onpage/
// DEPRECATED: OnPageFullReport moved to OnPageFullReport.deprecated.tsx
// Use OnPageTabsContainer from '@/components/audit/onpage' instead
