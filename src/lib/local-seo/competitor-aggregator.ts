/**
 * Competitor Aggregator for Local SEO
 *
 * Aggregates competitor data across all grid points to produce
 * summary statistics like average rank, share of voice, etc.
 */

import type {
  KeywordScanResult,
  AggregatedCompetitorStats,
  ScanAggregationResult,
} from './types'

/**
 * Map to collect competitor data during aggregation
 */
interface CompetitorAccumulator {
  businessName: string
  gmbCid?: string
  rating?: number
  reviewCount?: number
  totalRank: number
  rankCount: number
  timesInTop3: number
  timesInTop10: number
  timesInTop20: number
}

/**
 * Aggregates competitor statistics from scan results
 *
 * Processes all grid point results to calculate per-competitor metrics:
 * - Average rank across all grid points
 * - Times appearing in top 3, 10, 20
 * - Share of voice (% of grid points in top 3)
 */
export function aggregateCompetitorStats(
  scanResults: KeywordScanResult[],
  targetBusinessName: string,
  _totalGridPoints: number
): ScanAggregationResult {
  // Map to accumulate competitor data
  const competitorMap = new Map<string, CompetitorAccumulator>()

  // Process all results
  for (const keywordResult of scanResults) {
    for (const pointResult of keywordResult.points) {
      if (!pointResult.success) continue

      // Process each ranking at this point
      for (const ranking of pointResult.topRankings) {
        const key = normalizeCompetitorKey(ranking.name)

        if (!competitorMap.has(key)) {
          competitorMap.set(key, {
            businessName: ranking.name,
            gmbCid: ranking.cid,
            rating: ranking.rating,
            reviewCount: ranking.reviewCount,
            totalRank: 0,
            rankCount: 0,
            timesInTop3: 0,
            timesInTop10: 0,
            timesInTop20: 0,
          })
        }

        const acc = competitorMap.get(key)!

        // Update accumulator
        acc.totalRank += ranking.rank
        acc.rankCount++

        if (ranking.rank <= 3) acc.timesInTop3++
        if (ranking.rank <= 10) acc.timesInTop10++
        if (ranking.rank <= 20) acc.timesInTop20++

        // Update rating/reviews if we have better data
        if (ranking.rating && (!acc.rating || ranking.reviewCount! > (acc.reviewCount ?? 0))) {
          acc.rating = ranking.rating
          acc.reviewCount = ranking.reviewCount
        }

        // Update CID if we have it
        if (ranking.cid && !acc.gmbCid) {
          acc.gmbCid = ranking.cid
        }
      }
    }
  }

  // Convert to final stats
  const allStats: AggregatedCompetitorStats[] = []
  let targetStats: AggregatedCompetitorStats | null = null

  // Total points scanned (for share of voice calculation)
  const totalSuccessfulPoints = scanResults.reduce(
    (sum, kr) => sum + kr.successfulScans,
    0
  )

  for (const acc of competitorMap.values()) {
    const avgRank = acc.rankCount > 0 ? Number((acc.totalRank / acc.rankCount).toFixed(2)) : 0
    const shareOfVoice =
      totalSuccessfulPoints > 0
        ? Number(((acc.timesInTop3 / totalSuccessfulPoints) * 100).toFixed(2))
        : 0

    const stats: AggregatedCompetitorStats = {
      businessName: acc.businessName,
      gmbCid: acc.gmbCid,
      rating: acc.rating,
      reviewCount: acc.reviewCount,
      avgRank,
      timesInTop3: acc.timesInTop3,
      timesInTop10: acc.timesInTop10,
      timesInTop20: acc.timesInTop20,
      shareOfVoice,
    }

    // Check if this is the target business
    if (isTargetMatch(acc.businessName, targetBusinessName)) {
      targetStats = stats
    } else {
      allStats.push(stats)
    }
  }

  // Sort competitors by average rank (ascending = better rank first)
  allStats.sort((a, b) => a.avgRank - b.avgRank)

  // If target wasn't found, create empty stats
  if (!targetStats) {
    targetStats = {
      businessName: targetBusinessName,
      avgRank: 0,
      timesInTop3: 0,
      timesInTop10: 0,
      timesInTop20: 0,
      shareOfVoice: 0,
    }
  }

  // Find top competitor (excluding target)
  const topCompetitor = allStats.length > 0 ? allStats[0]!.businessName : null

  // Calculate overall metrics (based on target business)
  const overallMetrics = {
    avgRank: targetStats.avgRank,
    shareOfVoice: targetStats.shareOfVoice,
    topCompetitor,
    totalCompetitorsFound: allStats.length,
  }

  return {
    scanId: '', // Will be set by caller
    targetStats,
    competitorStats: allStats,
    overallMetrics,
  }
}

/**
 * Creates a normalized key for competitor lookup
 * Handles variations in business name formatting
 */
function normalizeCompetitorKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim()
}

/**
 * Checks if a business name matches the target
 */
function isTargetMatch(businessName: string, targetName: string): boolean {
  const normalizedBusiness = normalizeCompetitorKey(businessName)
  const normalizedTarget = normalizeCompetitorKey(targetName)

  // Exact match
  if (normalizedBusiness === normalizedTarget) return true

  // Contains match (either direction)
  if (
    normalizedBusiness.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedBusiness)
  ) {
    // Ensure significant overlap (at least 50% of shorter string)
    const minLen = Math.min(normalizedBusiness.length, normalizedTarget.length)
    const overlap = Math.max(
      normalizedBusiness.includes(normalizedTarget) ? normalizedTarget.length : 0,
      normalizedTarget.includes(normalizedBusiness) ? normalizedBusiness.length : 0
    )
    return overlap >= minLen * 0.5
  }

  return false
}

/**
 * Compares current stats with previous scan to calculate changes
 */
export function calculateRankChanges(
  currentStats: AggregatedCompetitorStats[],
  previousStats: Map<string, { avgRank: number }> | null
): AggregatedCompetitorStats[] {
  if (!previousStats) return currentStats

  return currentStats.map((stats) => {
    const key = normalizeCompetitorKey(stats.businessName)
    const prevData = previousStats.get(key)

    if (prevData) {
      return {
        ...stats,
        prevAvgRank: prevData.avgRank,
        rankChange: Number((prevData.avgRank - stats.avgRank).toFixed(2)), // Positive = improved
      }
    }

    return stats
  })
}

/**
 * Groups competitors by performance tier
 */
export function groupByPerformanceTier(
  stats: AggregatedCompetitorStats[]
): {
  dominant: AggregatedCompetitorStats[] // Avg rank <= 3
  strong: AggregatedCompetitorStats[] // Avg rank 4-10
  moderate: AggregatedCompetitorStats[] // Avg rank 11-20
  weak: AggregatedCompetitorStats[] // Avg rank > 20 or rarely ranking
} {
  const dominant: AggregatedCompetitorStats[] = []
  const strong: AggregatedCompetitorStats[] = []
  const moderate: AggregatedCompetitorStats[] = []
  const weak: AggregatedCompetitorStats[] = []

  for (const s of stats) {
    if (s.avgRank <= 3) {
      dominant.push(s)
    } else if (s.avgRank <= 10) {
      strong.push(s)
    } else if (s.avgRank <= 20) {
      moderate.push(s)
    } else {
      weak.push(s)
    }
  }

  return { dominant, strong, moderate, weak }
}

/**
 * Gets the top N competitors by a specific metric
 */
export function getTopCompetitors(
  stats: AggregatedCompetitorStats[],
  n: number,
  sortBy: 'avgRank' | 'shareOfVoice' | 'timesInTop3' | 'reviewCount' = 'avgRank'
): AggregatedCompetitorStats[] {
  const sorted = [...stats].sort((a, b) => {
    switch (sortBy) {
      case 'avgRank':
        return a.avgRank - b.avgRank // Lower is better
      case 'shareOfVoice':
        return b.shareOfVoice - a.shareOfVoice // Higher is better
      case 'timesInTop3':
        return b.timesInTop3 - a.timesInTop3 // Higher is better
      case 'reviewCount':
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0) // Higher is better
      default:
        return 0
    }
  })

  return sorted.slice(0, n)
}

/**
 * Calculates market share distribution
 */
export function calculateMarketShare(
  stats: AggregatedCompetitorStats[],
  targetStats: AggregatedCompetitorStats
): Array<{ name: string; shareOfVoice: number; isTarget: boolean }> {
  // Get top 9 competitors + target
  const topCompetitors = getTopCompetitors(stats, 9, 'shareOfVoice')

  const result = topCompetitors.map((s) => ({
    name: s.businessName,
    shareOfVoice: s.shareOfVoice,
    isTarget: false,
  }))

  // Add target business
  result.push({
    name: targetStats.businessName,
    shareOfVoice: targetStats.shareOfVoice,
    isTarget: true,
  })

  // Sort by share of voice descending
  result.sort((a, b) => b.shareOfVoice - a.shareOfVoice)

  return result
}

/**
 * Generates a summary of competitive landscape
 */
export function generateCompetitiveSummary(
  aggregation: ScanAggregationResult
): {
  targetPosition: 'dominant' | 'strong' | 'moderate' | 'weak' | 'not_ranking'
  competitorsAhead: number
  mainThreats: string[]
  recommendation: string
} {
  const { targetStats, competitorStats, overallMetrics: _overallMetrics } = aggregation

  // Determine target position
  let targetPosition: 'dominant' | 'strong' | 'moderate' | 'weak' | 'not_ranking'
  if (targetStats.avgRank === 0 || targetStats.timesInTop20 === 0) {
    targetPosition = 'not_ranking'
  } else if (targetStats.avgRank <= 3) {
    targetPosition = 'dominant'
  } else if (targetStats.avgRank <= 10) {
    targetPosition = 'strong'
  } else if (targetStats.avgRank <= 20) {
    targetPosition = 'moderate'
  } else {
    targetPosition = 'weak'
  }

  // Count competitors with better average rank
  const competitorsAhead = competitorStats.filter(
    (c) => c.avgRank < targetStats.avgRank && c.avgRank > 0
  ).length

  // Identify main threats (top 3 competitors with higher share of voice)
  const mainThreats = competitorStats
    .filter((c) => c.shareOfVoice > targetStats.shareOfVoice)
    .slice(0, 3)
    .map((c) => c.businessName)

  // Generate recommendation
  let recommendation: string
  switch (targetPosition) {
    case 'dominant':
      recommendation = 'Maintain strong position. Focus on review acquisition and content updates.'
      break
    case 'strong':
      recommendation =
        'Good visibility. Optimize GBP profile and increase review velocity to reach dominant position.'
      break
    case 'moderate':
      recommendation =
        'Improve local signals. Focus on proximity optimization, review generation, and category relevance.'
      break
    case 'weak':
      recommendation =
        'Significant improvement needed. Audit GBP completeness, build citations, and implement local content strategy.'
      break
    case 'not_ranking':
      recommendation =
        'Not appearing in local results. Verify GBP listing is claimed, categories are correct, and NAP is consistent.'
      break
  }

  return {
    targetPosition,
    competitorsAhead,
    mainThreats,
    recommendation,
  }
}
