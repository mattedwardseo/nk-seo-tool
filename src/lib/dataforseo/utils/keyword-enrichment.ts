/**
 * Keyword Enrichment Utility
 *
 * Enriches keywords with historical search volume data when current data is unavailable.
 * This handles cases where Google Ads no longer provides data for certain keyword patterns
 * (e.g., "dentist + city" combinations due to policy changes).
 */

import type { KeywordData } from '@/types/audit'
import type { HistoricalKeywordDataItem } from '../schemas/labs'
import type { LabsModule } from '../modules/labs'

/**
 * Result of keyword enrichment operation
 */
export interface EnrichmentResult {
  /** Keywords with enriched data */
  keywords: KeywordData[]
  /** Count of keywords that were enriched with historical data */
  enrichedCount: number
  /** Count of keywords that already had data */
  alreadyHadDataCount: number
  /** Count of keywords with no historical data available */
  noDataAvailableCount: number
}

/**
 * Options for keyword enrichment
 */
export interface EnrichmentOptions {
  /** Location name for historical data lookup (e.g., "United States") */
  locationName?: string
  /** Location code for historical data lookup (e.g., 2840 for US) */
  locationCode?: number
  /** Language code (default: "en") */
  languageCode?: string
  /** Maximum keywords per API call (default: 700, API limit: 1000) */
  batchSize?: number
}

/**
 * Enriches keywords with historical data when search volume is missing.
 *
 * Google Ads stopped providing data for certain keyword patterns (e.g., "dentist chicago").
 * The Historical Keyword Data API still has the last available data from when it was collected.
 *
 * @param labs - Labs module instance
 * @param keywords - Array of keywords to enrich
 * @param options - Enrichment options
 * @returns Enriched keywords with counts
 *
 * @example
 * ```ts
 * const result = await enrichKeywordsWithHistoricalData(labsModule, keywords, {
 *   locationName: 'United States',
 * });
 * console.log(`Enriched ${result.enrichedCount} keywords`);
 * ```
 */
export async function enrichKeywordsWithHistoricalData(
  labs: LabsModule,
  keywords: KeywordData[],
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  const { batchSize = 700 } = options

  // Track counts
  let enrichedCount = 0
  let alreadyHadDataCount = 0
  let noDataAvailableCount = 0

  // Find keywords that need enrichment (missing searchVolume OR volume is 0)
  // Note: SERP API returns 0 (not null) for keywords blocked by Google Ads
  const keywordsNeedingData = keywords.filter(
    (kw) => kw.searchVolume === null || kw.searchVolume === undefined || kw.searchVolume === 0
  )

  // Keywords that already have data
  alreadyHadDataCount = keywords.length - keywordsNeedingData.length

  // Debug logging
  console.log(`[Enrichment] Total keywords: ${keywords.length}`)
  console.log(`[Enrichment] Keywords needing data (null/undefined/0): ${keywordsNeedingData.length}`)
  console.log(`[Enrichment] Already have data: ${alreadyHadDataCount}`)
  if (keywordsNeedingData.length > 0) {
    console.log(`[Enrichment] Sample keywords needing data:`, keywordsNeedingData.slice(0, 3).map(k => k.keyword))
  }

  if (keywordsNeedingData.length === 0) {
    console.log(`[Enrichment] No keywords need enrichment, skipping API call`)
    return {
      keywords,
      enrichedCount: 0,
      alreadyHadDataCount,
      noDataAvailableCount: 0,
    }
  }

  // Create a map for quick lookup
  const keywordMap = new Map<string, KeywordData>()
  keywords.forEach((kw) => keywordMap.set(kw.keyword.toLowerCase(), kw))

  // Batch the keywords that need data
  const keywordStrings = keywordsNeedingData.map((kw) => kw.keyword)
  const batches: string[][] = []
  for (let i = 0; i < keywordStrings.length; i += batchSize) {
    batches.push(keywordStrings.slice(i, i + batchSize))
  }

  console.log(`[Enrichment] Fetching historical data for ${keywordStrings.length} keywords in ${batches.length} batch(es)`)

  // Fetch historical data for each batch
  for (const batch of batches) {
    try {
      console.log(`[Enrichment] Calling Historical API for batch of ${batch.length} keywords...`)
      const historicalData = await labs.getHistoricalKeywordData({
        keywords: batch,
        locationName: options.locationName,
        locationCode: options.locationCode,
        languageCode: options.languageCode || 'en',
      })

      console.log(`[Enrichment] Historical API returned ${historicalData.length} results`)
      if (historicalData.length > 0 && historicalData[0]) {
        // Log a sample of what we got back
        const sample = historicalData[0]
        const sampleLatest = sample.history?.[0]
        console.log(`[Enrichment] Sample result: "${sample.keyword}" - history length: ${sample.history?.length ?? 0}, latest month search_volume: ${sampleLatest?.keyword_info?.search_volume ?? 'N/A'}`)
      }

      // Merge historical data back into keywords
      for (const item of historicalData) {
        const normalizedKey = item.keyword.toLowerCase()
        const keyword = keywordMap.get(normalizedKey)

        if (keyword) {
          const enrichmentData = extractLatestHistoricalData(item)

          if (enrichmentData) {
            // Enrich the keyword with historical data
            keyword.searchVolume = enrichmentData.searchVolume
            keyword.cpc = enrichmentData.cpc ?? keyword.cpc
            keyword.competition = enrichmentData.competition ?? keyword.competition
            keyword.competitionLevel =
              enrichmentData.competitionLevel ?? keyword.competitionLevel
            keyword.monthlySearches =
              enrichmentData.monthlySearches ?? keyword.monthlySearches
            keyword.searchVolumeTrend =
              enrichmentData.searchVolumeTrend ?? keyword.searchVolumeTrend
            keyword.historicalDataDate = enrichmentData.dataDate
            keyword.lowTopOfPageBid = enrichmentData.lowTopOfPageBid ?? undefined
            keyword.highTopOfPageBid = enrichmentData.highTopOfPageBid ?? undefined
            enrichedCount++
          } else {
            noDataAvailableCount++
          }
        }
      }
    } catch (error) {
      // Log but don't fail - continue with other batches
      console.error('Error fetching historical keyword data:', error)
    }
  }

  // Count keywords that weren't found in any batch
  noDataAvailableCount =
    keywordsNeedingData.length - enrichedCount - noDataAvailableCount

  console.log(`[Enrichment] Final results: enriched=${enrichedCount}, alreadyHadData=${alreadyHadDataCount}, noDataAvailable=${Math.max(0, noDataAvailableCount)}`)

  return {
    keywords,
    enrichedCount,
    alreadyHadDataCount,
    noDataAvailableCount: Math.max(0, noDataAvailableCount),
  }
}

/**
 * Data extracted from historical API response
 */
interface ExtractedHistoricalData {
  searchVolume: number
  cpc: number | null
  /** Raw competition value 0-1 */
  competition: number | null
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null
  monthlySearches: Record<string, number> | null
  searchVolumeTrend: {
    monthly?: number
    quarterly?: number
    yearly?: number
  } | null
  lowTopOfPageBid: number | null
  highTopOfPageBid: number | null
  /** The date when this data was collected (YYYY-MM format) */
  dataDate: string
}

/**
 * Extracts the most recent historical data for a keyword.
 *
 * Walks through the history array to find the most recent month with valid data.
 *
 * @param item - Historical keyword data item from API
 * @returns Extracted data or null if no valid data found
 */
function extractLatestHistoricalData(
  item: HistoricalKeywordDataItem
): ExtractedHistoricalData | null {
  if (!item.history || item.history.length === 0) {
    return null
  }

  // History is typically ordered most recent first, but let's be safe
  // Sort by year and month descending
  const sortedHistory = [...item.history].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  // Find the first month with valid search volume data
  for (const month of sortedHistory) {
    const info = month.keyword_info

    if (info && info.search_volume !== null && info.search_volume !== undefined) {
      const monthStr = String(month.month).padStart(2, '0')
      const dataDate = `${month.year}-${monthStr}`

      return {
        searchVolume: info.search_volume,
        cpc: info.cpc ?? null,
        competition: info.competition ?? null,
        competitionLevel: info.competition_level ?? null,
        monthlySearches: info.monthly_searches ?? null,
        searchVolumeTrend: info.search_volume_trend ?? null,
        lowTopOfPageBid: info.low_top_of_page_bid ?? null,
        highTopOfPageBid: info.high_top_of_page_bid ?? null,
        dataDate,
      }
    }
  }

  return null
}

/**
 * Formats a historical data date for display.
 *
 * @param dataDate - Date in YYYY-MM format
 * @returns Formatted date string (e.g., "Nov 2023")
 */
export function formatHistoricalDataDate(dataDate: string): string {
  const parts = dataDate.split('-')
  const yearStr = parts[0] ?? '2024'
  const monthStr = parts[1] ?? '01'
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return `${monthNames[month - 1]} ${year}`
}

/**
 * Checks if a keyword's data is from historical sources (not current).
 *
 * @param keyword - Keyword data to check
 * @returns True if the data is from historical sources
 */
export function isHistoricalData(keyword: KeywordData): boolean {
  return keyword.historicalDataDate !== undefined
}
