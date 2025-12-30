/**
 * DataForSEO Labs API Module
 *
 * Advanced SEO analytics - domain rank, competitors, keyword difficulty.
 * Provides competitive intelligence for dental practices.
 */

import {
  DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo,
  DataforseoLabsGoogleRankedKeywordsLiveRequestInfo,
  DataforseoLabsGoogleCompetitorsDomainLiveRequestInfo,
  DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo,
  DataforseoLabsGoogleSearchIntentLiveRequestInfo,
  DataforseoLabsGoogleBulkTrafficEstimationLiveRequestInfo,
  DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo,
  DataforseoLabsGoogleHistoricalKeywordDataLiveRequestInfo,
  DataforseoLabsGoogleHistoricalRankOverviewLiveRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  domainRankOverviewInputSchema,
  rankedKeywordsInputSchema,
  competitorsDomainInputSchema,
  bulkKeywordDifficultyInputSchema,
  searchIntentInputSchema,
  bulkTrafficEstimationInputSchema,
  keywordSuggestionsInputSchema,
  historicalKeywordDataInputSchema,
  historicalRankOverviewInputSchema,
  type DomainRankOverviewInput,
  type RankedKeywordsInput,
  type CompetitorsDomainInput,
  type BulkKeywordDifficultyInput,
  type SearchIntentInput,
  type BulkTrafficEstimationInput,
  type KeywordSuggestionsInput,
  type HistoricalKeywordDataInput,
  type HistoricalRankOverviewInput,
  type DomainRankOverviewResult,
  type RankedKeywordItem,
  type CompetitorDomainItem,
  type KeywordDifficultyResult,
  type SearchIntentItem,
  type TrafficEstimationResult,
  type KeywordSuggestionItem,
  type HistoricalKeywordDataItem,
  type HistoricalRankItem,
} from '../schemas'

/** Default US location code */
const DEFAULT_LOCATION_CODE = 2840

/**
 * DataForSEO Labs API module for competitive intelligence
 */
export class LabsModule extends BaseModule {
  /**
   * Get domain rank overview
   * Returns ranking distribution and traffic estimates
   *
   * @param input - Target domain and location settings
   * @param options - Execution options (caching, rate limiting)
   * @returns Domain rank overview or null
   *
   * @example
   * ```ts
   * const overview = await labs.getDomainRankOverview({
   *   target: 'dentist-example.com',
   *   locationCode: 2840,
   * });
   * console.log(`Organic ETV: ${overview?.metrics.organic?.etv}`);
   * console.log(`Top 10 keywords: ${overview?.metrics.organic?.pos_4_10}`);
   * ```
   */
  async getDomainRankOverview(
    input: DomainRankOverviewInput,
    options?: ExecuteOptions
  ): Promise<DomainRankOverviewResult | null> {
    const validated = this.validateInput(domainRankOverviewInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.domainRank(validated.target, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo()
        request.target = validated.target
        request.language_code = validated.languageCode

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleDomainRankOverviewLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]) return null
    return task.result[0] as unknown as DomainRankOverviewResult
  }

  /**
   * Get ranked keywords for a domain
   * Returns keywords the domain ranks for with positions and metrics
   *
   * @param input - Target domain and filter options
   * @param options - Execution options
   * @returns Array of ranked keyword items
   *
   * @example
   * ```ts
   * const keywords = await labs.getRankedKeywords({
   *   target: 'dentist-example.com',
   *   itemTypes: ['organic'],
   *   limit: 100,
   * });
   * for (const kw of keywords) {
   *   console.log(`${kw.keyword_data.keyword}: #${kw.ranked_serp_element.serp_item.rank_group}`);
   * }
   * ```
   */
  async getRankedKeywords(
    input: RankedKeywordsInput,
    options?: ExecuteOptions
  ): Promise<RankedKeywordItem[]> {
    const validated = this.validateInput(rankedKeywordsInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.rankedKeywords(validated.target, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleRankedKeywordsLiveRequestInfo()
        request.target = validated.target
        request.language_code = validated.languageCode
        request.include_subdomains = validated.includeSubdomains
        request.item_types = validated.itemTypes
        request.limit = validated.limit
        request.offset = validated.offset

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleRankedKeywordsLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as RankedKeywordItem[]
  }

  /**
   * Get domain competitors
   * Returns domains competing for similar keywords
   *
   * @param input - Target domain and filter options
   * @param options - Execution options
   * @returns Array of competitor domain items
   *
   * @example
   * ```ts
   * const competitors = await labs.getCompetitors({
   *   target: 'dentist-example.com',
   *   excludeTopDomains: true,
   *   limit: 20,
   * });
   * for (const comp of competitors) {
   *   console.log(`${comp.domain}: ${comp.intersections} overlapping keywords`);
   * }
   * ```
   */
  async getCompetitors(
    input: CompetitorsDomainInput,
    options?: ExecuteOptions
  ): Promise<CompetitorDomainItem[]> {
    const validated = this.validateInput(competitorsDomainInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.competitors(validated.target, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleCompetitorsDomainLiveRequestInfo()
        request.target = validated.target
        request.language_code = validated.languageCode
        request.exclude_top_domains = validated.excludeTopDomains
        request.limit = validated.limit
        request.offset = validated.offset

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleCompetitorsDomainLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as CompetitorDomainItem[]
  }

  /**
   * Get keyword difficulty for multiple keywords
   * Returns difficulty scores (0-100) for ranking
   *
   * @param input - Keywords and location settings
   * @param options - Execution options
   * @returns Array of keyword difficulty results
   *
   * @example
   * ```ts
   * const difficulty = await labs.getBulkKeywordDifficulty({
   *   keywords: ['dentist austin', 'dental implants'],
   *   locationCode: 2840,
   * });
   * for (const kw of difficulty) {
   *   console.log(`${kw.keyword}: difficulty ${kw.keyword_difficulty}`);
   * }
   * ```
   */
  async getBulkKeywordDifficulty(
    input: BulkKeywordDifficultyInput,
    options?: ExecuteOptions
  ): Promise<KeywordDifficultyResult[]> {
    const validated = this.validateInput(bulkKeywordDifficultyInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.keywordDifficulty(validated.keywords, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo()
        request.keywords = validated.keywords
        request.language_code = validated.languageCode

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleBulkKeywordDifficultyLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORD_DIFFICULTY, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []
    // Result may be wrapped: [{items: [...]}] or direct array - handle both
    const firstResult = task.result[0] as { items?: unknown[] } | undefined
    if (firstResult?.items) {
      return firstResult.items as unknown as KeywordDifficultyResult[]
    }
    return task.result as unknown as KeywordDifficultyResult[]
  }

  /**
   * Get search intent for keywords
   * Returns intent classification (informational, transactional, etc.)
   *
   * @param input - Keywords and language settings
   * @param options - Execution options
   * @returns Array of search intent items
   *
   * @example
   * ```ts
   * const intents = await labs.getSearchIntent({
   *   keywords: ['how to whiten teeth', 'dentist near me', 'invisalign cost'],
   * });
   * for (const item of intents) {
   *   console.log(`${item.keyword}: ${item.search_intent_info.main_intent}`);
   * }
   * ```
   */
  async getSearchIntent(
    input: SearchIntentInput,
    options?: ExecuteOptions
  ): Promise<SearchIntentItem[]> {
    const validated = this.validateInput(searchIntentInputSchema, input)

    const cacheKey = CacheKeys.labs.searchIntent(validated.keywords, validated.languageCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleSearchIntentLiveRequestInfo()
        request.keywords = validated.keywords
        request.language_code = validated.languageCode

        return this.client.labs.googleSearchIntentLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []
    // Result is wrapped: [{items: [...]}] - extract the items array
    const resultWrapper = task.result[0] as { items?: unknown[] } | undefined
    return (resultWrapper?.items ?? []) as unknown as SearchIntentItem[]
  }

  /**
   * Get bulk traffic estimation for multiple targets
   * Returns estimated traffic metrics for domains/pages
   *
   * @param input - Target domains and location settings
   * @param options - Execution options
   * @returns Array of traffic estimation results
   *
   * @example
   * ```ts
   * const traffic = await labs.getBulkTrafficEstimation({
   *   targets: ['dentist1.com', 'dentist2.com', 'dentist3.com'],
   *   locationCode: 2840,
   * });
   * for (const site of traffic) {
   *   console.log(`${site.target}: ${site.metrics.organic?.etv} estimated visits`);
   * }
   * ```
   */
  async getBulkTrafficEstimation(
    input: BulkTrafficEstimationInput,
    options?: ExecuteOptions
  ): Promise<TrafficEstimationResult[]> {
    const validated = this.validateInput(bulkTrafficEstimationInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.trafficEstimation(validated.targets, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleBulkTrafficEstimationLiveRequestInfo()
        request.targets = validated.targets
        request.language_code = validated.languageCode

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleBulkTrafficEstimationLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []
    return task.result as unknown as TrafficEstimationResult[]
  }

  /**
   * Get keyword suggestions for a seed keyword
   * Returns related keywords with metrics
   *
   * @param input - Seed keyword and options
   * @param options - Execution options
   * @returns Array of keyword suggestions
   *
   * @example
   * ```ts
   * const suggestions = await labs.getKeywordSuggestions({
   *   keyword: 'dental implants',
   *   locationCode: 2840,
   *   limit: 50,
   * });
   * for (const kw of suggestions) {
   *   console.log(`${kw.keyword}: ${kw.keyword_info?.search_volume} volume`);
   * }
   * ```
   */
  async getKeywordSuggestions(
    input: KeywordSuggestionsInput,
    options?: ExecuteOptions
  ): Promise<KeywordSuggestionItem[]> {
    const validated = this.validateInput(keywordSuggestionsInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    // No specific cache key for suggestions - generate one based on keyword
    const cacheKey = `dfs:labs:suggestions:${validated.keyword}:${locationCode}`

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo()
        request.keyword = validated.keyword
        request.language_code = validated.languageCode
        request.include_seed_keyword = validated.includeSeedKeyword
        request.limit = validated.limit
        request.offset = validated.offset

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleKeywordSuggestionsLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as KeywordSuggestionItem[]
  }

  /**
   * Get historical keyword data for multiple keywords
   * Returns historical search volume, CPC, and bid data for each keyword
   * Useful for enriching keywords when current data is blocked by Google Ads
   *
   * @param input - Keywords and location settings (max 700 keywords)
   * @param options - Execution options
   * @returns Array of historical keyword data items
   *
   * @example
   * ```ts
   * const historical = await labs.getHistoricalKeywordData({
   *   keywords: ['dentist chicago', 'dental implants chicago'],
   *   locationName: 'United States',
   * });
   * for (const item of historical) {
   *   const latest = item.history?.[0]; // Most recent month
   *   console.log(`${item.keyword}: ${latest?.keyword_info?.search_volume} volume`);
   * }
   * ```
   */
  async getHistoricalKeywordData(
    input: HistoricalKeywordDataInput,
    options?: ExecuteOptions
  ): Promise<HistoricalKeywordDataItem[]> {
    const validated = this.validateInput(historicalKeywordDataInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.historicalKeywords(validated.keywords, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleHistoricalKeywordDataLiveRequestInfo()
        request.keywords = validated.keywords
        request.language_code = validated.languageCode

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleHistoricalKeywordDataLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.REFERENCE, ...options?.cache }, // 7-day TTL for historical data
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as HistoricalKeywordDataItem[]
  }

  /**
   * Get historical rank overview for a domain
   * Returns 6 months of ranking distribution data (position buckets over time)
   * Useful for building SEMrush-style keyword trend charts
   *
   * @param input - Target domain and location settings
   * @param options - Execution options
   * @returns Array of monthly ranking distribution items
   *
   * @example
   * ```ts
   * const history = await labs.getHistoricalRankOverview({
   *   target: 'dentist-example.com',
   *   locationName: 'United States',
   * });
   * for (const month of history) {
   *   console.log(`${month.year}-${month.month}: ${month.metrics.organic?.count} keywords`);
   * }
   * ```
   */
  async getHistoricalRankOverview(
    input: HistoricalRankOverviewInput,
    options?: ExecuteOptions
  ): Promise<HistoricalRankItem[]> {
    const validated = this.validateInput(historicalRankOverviewInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.labs.historicalRankOverview(validated.target, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new DataforseoLabsGoogleHistoricalRankOverviewLiveRequestInfo()
        request.target = validated.target
        request.language_code = validated.languageCode

        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.labs.googleHistoricalRankOverviewLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.REFERENCE, ...options?.cache }, // 7-day TTL for historical data
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as HistoricalRankItem[]
  }

  /**
   * Generate comprehensive competitive analysis
   * Combines multiple API calls for full picture
   *
   * @param domain - Target domain to analyze
   * @param locationCode - Location for analysis
   * @returns Competitive analysis object
   *
   * @example
   * ```ts
   * const analysis = await labs.getCompetitiveAnalysis('dentist-example.com', 2840);
   * console.log(analysis);
   * // {
   * //   domain: 'dentist-example.com',
   * //   domainAuthority: 45,
   * //   organicKeywords: 234,
   * //   estimatedTraffic: 1500,
   * //   topCompetitors: [...],
   * //   keywordGaps: [...],
   * // }
   * ```
   */
  async getCompetitiveAnalysis(
    domain: string,
    locationCode: number = DEFAULT_LOCATION_CODE
  ): Promise<{
    domain: string
    domainAuthority: number
    organicKeywords: number
    estimatedTraffic: number
    topCompetitors: Array<{
      domain: string
      overlap: number
      avgPosition: number
    }>
    topKeywords: Array<{
      keyword: string
      position: number
      volume: number
    }>
  }> {
    // Fetch data in parallel
    const [overview, competitors, rankedKeywords] = await Promise.all([
      this.getDomainRankOverview({ target: domain, locationCode }),
      this.getCompetitors({ target: domain, locationCode, limit: 10 }),
      this.getRankedKeywords({
        target: domain,
        locationCode,
        limit: 10,
        itemTypes: ['organic'],
      }),
    ])

    // Calculate domain authority (simplified score based on metrics)
    let domainAuthority = 0
    if (overview?.metrics.organic) {
      const org = overview.metrics.organic
      // Weight based on positions
      domainAuthority += (org.pos_1 ?? 0) * 10
      domainAuthority += (org.pos_2_3 ?? 0) * 5
      domainAuthority += (org.pos_4_10 ?? 0) * 2
      domainAuthority += (org.pos_11_20 ?? 0) * 1
      domainAuthority = Math.min(Math.round(domainAuthority / 10), 100)
    }

    return {
      domain,
      domainAuthority,
      organicKeywords: overview?.metrics.organic?.count ?? 0,
      estimatedTraffic: overview?.metrics.organic?.etv ?? 0,
      topCompetitors: competitors.map((c) => ({
        domain: c.domain,
        overlap: c.intersections,
        avgPosition: c.avg_position ?? 0,
      })),
      topKeywords: rankedKeywords.map((kw) => ({
        keyword: kw.keyword_data.keyword,
        position: kw.ranked_serp_element.serp_item.rank_group ?? 0,
        volume: kw.keyword_data.keyword_info?.search_volume ?? 0,
      })),
    }
  }
}
