/**
 * Grid Scanner for Local SEO Map Rankings
 *
 * Scans a grid of GPS coordinates using DataForSEO Google Maps SERP API
 * to determine business rankings at each location.
 */

import { SerpModule } from '@/lib/dataforseo/modules/serp'
import { getDataForSEOClient } from '@/lib/dataforseo'
import type { GridPoint } from './grid-calculator'
import type { CompetitorRanking, GridPointScanResult, KeywordScanResult } from './types'
import { formatCoordinateForApi } from './grid-calculator'

/**
 * Configuration for grid scanning
 */
export interface GridScanConfig {
  /** Target business name to find in results */
  targetBusinessName: string
  /** Maximum results to fetch per point (default 20) */
  depth?: number
  /** Skip caching (force fresh API calls) */
  skipCache?: boolean
}

/**
 * Normalizes business name for comparison
 * Handles common variations in how businesses are listed
 */
function normalizeBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'") // Normalize quotes
    .replace(/[–—]/g, '-') // Normalize dashes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\bdentistry\b/gi, 'dental') // Common synonym
    .replace(/\bdds\b/gi, '') // Remove credentials
    .replace(/\bdmd\b/gi, '')
    .replace(/\bllc\b/gi, '')
    .replace(/\binc\b/gi, '')
    .replace(/\bpc\b/gi, '')
    .replace(/[.,]/g, '') // Remove punctuation
    .trim()
}

/**
 * Checks if a result matches the target business
 */
function isTargetBusiness(resultTitle: string, targetName: string): boolean {
  const normalizedResult = normalizeBusinessName(resultTitle)
  const normalizedTarget = normalizeBusinessName(targetName)

  // Exact match
  if (normalizedResult === normalizedTarget) return true

  // Target is contained in result (e.g., "Fielder Park Dental" in "Fielder Park Dental - Dr. Smith")
  if (normalizedResult.includes(normalizedTarget)) return true

  // Result is contained in target (e.g., "Fielder Park" in "Fielder Park Dental")
  if (normalizedTarget.includes(normalizedResult) && normalizedResult.length > 5) return true

  return false
}

/**
 * Scans a single grid point for local rankings
 */
export async function scanGridPoint(
  serpModule: SerpModule,
  point: GridPoint,
  keyword: string,
  config: GridScanConfig
): Promise<GridPointScanResult> {
  const coordinates = formatCoordinateForApi(point.lat, point.lng)
  const scannedAt = new Date()

  try {
    const results = await serpModule.googleMapsSearch(
      {
        keyword,
        coordinates,
        depth: config.depth ?? 20,
      },
      { cache: { skipRead: config.skipCache ?? false } }
    )

    // Find target business rank
    let targetRank: number | null = null
    const topRankings: CompetitorRanking[] = []

    for (const result of results) {
      const ranking: CompetitorRanking = {
        name: result.title,
        rank: result.rank_absolute,
        cid: result.cid ?? undefined,
        rating: result.rating?.value ?? undefined,
        reviewCount: result.rating?.votes_count ?? undefined,
        address: result.address ?? undefined,
        phone: result.phone ?? undefined,
        category: result.category ?? undefined,
      }

      topRankings.push(ranking)

      // Check if this is the target business
      if (targetRank === null && isTargetBusiness(result.title, config.targetBusinessName)) {
        targetRank = result.rank_absolute
      }
    }

    return {
      point,
      keyword,
      targetRank,
      topRankings,
      totalResults: results.length,
      success: true,
      scannedAt,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      point,
      keyword,
      targetRank: null,
      topRankings: [],
      totalResults: 0,
      success: false,
      error: errorMessage,
      scannedAt,
    }
  }
}

/**
 * Scans all grid points for a single keyword
 *
 * Processes points sequentially to respect rate limits.
 * Uses the existing Bottleneck rate limiter in the DataForSEO client.
 */
export async function scanGridForKeyword(
  points: GridPoint[],
  keyword: string,
  config: GridScanConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<KeywordScanResult> {
  const serpModule = new SerpModule(getDataForSEOClient())
  const results: GridPointScanResult[] = []

  let successfulScans = 0
  let failedScans = 0
  let timesInTop3 = 0
  let timesInTop10 = 0
  let timesRanked = 0
  let totalRank = 0

  // Process points sequentially to respect rate limits
  for (let i = 0; i < points.length; i++) {
    const point = points[i]!
    const result = await scanGridPoint(serpModule, point, keyword, config)
    results.push(result)

    if (result.success) {
      successfulScans++

      if (result.targetRank !== null) {
        timesRanked++
        totalRank += result.targetRank

        if (result.targetRank <= 3) timesInTop3++
        if (result.targetRank <= 10) timesInTop10++
      }
    } else {
      failedScans++
    }

    // Report progress
    onProgress?.(i + 1, points.length)
  }

  // Calculate average rank (only for points where we ranked)
  const avgRank = timesRanked > 0 ? totalRank / timesRanked : null

  return {
    keyword,
    points: results,
    successfulScans,
    failedScans,
    avgRank,
    timesInTop3,
    timesInTop10,
    timesRanked,
  }
}

/**
 * Scans all grid points for multiple keywords
 */
export async function scanGridForAllKeywords(
  points: GridPoint[],
  keywords: string[],
  config: GridScanConfig,
  onProgress?: (
    keyword: string,
    keywordIndex: number,
    totalKeywords: number,
    pointsCompleted: number,
    totalPoints: number
  ) => void
): Promise<KeywordScanResult[]> {
  const results: KeywordScanResult[] = []

  for (let k = 0; k < keywords.length; k++) {
    const keyword = keywords[k]!

    const keywordResult = await scanGridForKeyword(points, keyword, config, (completed, total) => {
      onProgress?.(keyword, k, keywords.length, completed, total)
    })

    results.push(keywordResult)
  }

  return results
}

/**
 * Estimates API cost for a grid scan
 *
 * @param gridSize - Number of rows/columns (e.g., 7 for 7x7)
 * @param keywordCount - Number of keywords to scan
 * @param costPerCall - Cost per API call in USD (default $0.005)
 */
export function estimateScanCost(
  gridSize: number,
  keywordCount: number,
  costPerCall: number = 0.005
): { totalPoints: number; totalCalls: number; estimatedCost: number } {
  const totalPoints = gridSize * gridSize
  const totalCalls = totalPoints * keywordCount
  const estimatedCost = totalCalls * costPerCall

  return {
    totalPoints,
    totalCalls,
    estimatedCost: Number(estimatedCost.toFixed(4)),
  }
}

/**
 * Calculates scan statistics from results
 */
export function calculateScanStats(results: KeywordScanResult[]): {
  totalScans: number
  successfulScans: number
  failedScans: number
  overallAvgRank: number | null
  overallTimesInTop3: number
  overallTimesInTop10: number
  overallTimesRanked: number
  overallShareOfVoice: number
} {
  let totalScans = 0
  let successfulScans = 0
  let failedScans = 0
  let totalTimesInTop3 = 0
  let totalTimesInTop10 = 0
  let totalTimesRanked = 0
  let totalPoints = 0
  let sumAvgRank = 0
  let keywordsWithRank = 0

  for (const result of results) {
    totalScans += result.points.length
    successfulScans += result.successfulScans
    failedScans += result.failedScans
    totalTimesInTop3 += result.timesInTop3
    totalTimesInTop10 += result.timesInTop10
    totalTimesRanked += result.timesRanked
    totalPoints += result.successfulScans

    if (result.avgRank !== null) {
      sumAvgRank += result.avgRank
      keywordsWithRank++
    }
  }

  // Calculate overall average rank
  const overallAvgRank = keywordsWithRank > 0 ? sumAvgRank / keywordsWithRank : null

  // Calculate share of voice (% of successful scans where we're in top 3)
  const overallShareOfVoice =
    totalPoints > 0 ? Number(((totalTimesInTop3 / totalPoints) * 100).toFixed(2)) : 0

  return {
    totalScans,
    successfulScans,
    failedScans,
    overallAvgRank,
    overallTimesInTop3: totalTimesInTop3,
    overallTimesInTop10: totalTimesInTop10,
    overallTimesRanked: totalTimesRanked,
    overallShareOfVoice,
  }
}
