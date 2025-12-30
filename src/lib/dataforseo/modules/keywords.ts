/**
 * Keywords Data API Module
 *
 * Keyword research and search volume data.
 * Essential for dental practice content strategy.
 */

import {
  KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo,
  KeywordsDataGoogleAdsKeywordsForSiteLiveRequestInfo,
  KeywordsDataGoogleTrendsExploreLiveRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  searchVolumeInputSchema,
  keywordsForSiteInputSchema,
  keywordsTrendsInputSchema,
  type SearchVolumeInput,
  type KeywordsForSiteInput,
  type KeywordsTrendsInput,
  type KeywordInfo,
  type KeywordForSiteResult,
  type KeywordsTrendsResult,
} from '../schemas'

/** Default US location code */
const DEFAULT_LOCATION_CODE = 2840

/**
 * Keywords Data API module for keyword research
 */
export class KeywordsModule extends BaseModule {
  /**
   * Get search volume data for keywords
   * Returns monthly search volumes, competition, and CPC data
   *
   * @param input - Keywords and location/language settings
   * @param options - Execution options (caching, rate limiting)
   * @returns Array of keyword info results
   *
   * @example
   * ```ts
   * const keywords = await keywords.getSearchVolume({
   *   keywords: ['dentist near me', 'dental implants', 'teeth whitening'],
   *   locationCode: 2840, // United States
   * });
   * for (const kw of keywords) {
   *   console.log(`${kw.keyword}: ${kw.search_volume} monthly searches`);
   * }
   * ```
   */
  async getSearchVolume(
    input: SearchVolumeInput,
    options?: ExecuteOptions
  ): Promise<KeywordInfo[]> {
    const validated = this.validateInput(searchVolumeInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.keywords.searchVolume(validated.keywords, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo()
        request.keywords = validated.keywords
        request.language_code = validated.languageCode
        request.search_partners = validated.searchPartners
        request.include_adult_keywords = false

        // Set location
        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.keywords.googleAdsSearchVolumeLive([request])
      },
      {
        ...options,
        // Use Google Ads limiter for this endpoint
        limiterType: 'googleAds',
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []
    return task.result as unknown as KeywordInfo[]
  }

  /**
   * Get keywords relevant to a domain
   * Returns keywords that Google Ads suggests for the site
   *
   * @param input - Target domain and options
   * @param options - Execution options
   * @returns Array of keyword results
   *
   * @example
   * ```ts
   * const keywords = await keywords.getKeywordsForSite({
   *   target: 'dentist-example.com',
   *   sortBy: 'search_volume',
   *   limit: 100,
   * });
   * console.log(`Found ${keywords.length} relevant keywords`);
   * ```
   */
  async getKeywordsForSite(
    input: KeywordsForSiteInput,
    options?: ExecuteOptions
  ): Promise<KeywordForSiteResult[]> {
    const validated = this.validateInput(keywordsForSiteInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.keywords.forSite(validated.target, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new KeywordsDataGoogleAdsKeywordsForSiteLiveRequestInfo()
        request.target = validated.target
        request.language_code = validated.languageCode
        request.include_adult_keywords = false

        // Set location
        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        return this.client.keywords.googleAdsKeywordsForSiteLive([request])
      },
      {
        ...options,
        limiterType: 'googleAds',
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []

    // Apply sorting and limit
    let results = task.result as unknown as KeywordForSiteResult[]

    // Sort results
    if (validated.sortBy === 'search_volume') {
      results = results.sort((a, b) => (b.search_volume ?? 0) - (a.search_volume ?? 0))
    } else if (validated.sortBy === 'cpc') {
      results = results.sort((a, b) => (b.cpc ?? 0) - (a.cpc ?? 0))
    }

    // Apply limit
    if (validated.limit) {
      results = results.slice(0, validated.limit)
    }

    return results
  }

  /**
   * Get keyword trends data
   * Shows interest over time for keywords
   *
   * @param input - Keywords and time range
   * @param options - Execution options
   * @returns Trends result with data points
   *
   * @example
   * ```ts
   * const trends = await keywords.getKeywordsTrends({
   *   keywords: ['invisalign', 'dental braces'],
   *   timeRange: 'past_12_months',
   * });
   * console.log('Interest over time:', trends?.data);
   * ```
   */
  async getKeywordsTrends(
    input: KeywordsTrendsInput,
    options?: ExecuteOptions
  ): Promise<KeywordsTrendsResult | null> {
    const validated = this.validateInput(keywordsTrendsInputSchema, input)

    const cacheKey = CacheKeys.keywords.trends(validated.keywords)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new KeywordsDataGoogleTrendsExploreLiveRequestInfo()
        request.keywords = validated.keywords
        request.language_code = validated.languageCode
        request.time_range = validated.timeRange
        request.type = validated.type

        // Set location (Google Trends uses string for location_code)
        if (validated.locationCode) {
          request.location_code = String(validated.locationCode)
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = String(DEFAULT_LOCATION_CODE)
        }

        // Set date range if provided
        if (validated.dateFrom) {
          request.date_from = validated.dateFrom
        }
        if (validated.dateTo) {
          request.date_to = validated.dateTo
        }

        return this.client.keywords.googleTrendsExploreLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.KEYWORDS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]) return null
    return task.result[0] as unknown as KeywordsTrendsResult
  }

  /**
   * Get keyword difficulty score
   * Estimates how hard it would be to rank for keywords
   * Note: Uses DataForSEO Labs API, may need different rate limiting
   *
   * @param keywords - Keywords to analyze
   * @param locationCode - Location for analysis
   * @returns Map of keyword to difficulty score (0-100)
   *
   * @example
   * ```ts
   * const difficulty = await keywords.getKeywordDifficulty(
   *   ['dentist austin', 'dental implants austin'],
   *   2840
   * );
   * console.log(difficulty.get('dentist austin')); // 72
   * ```
   */
  async getKeywordDifficulty(
    keywords: string[],
    _locationCode: number = DEFAULT_LOCATION_CODE
  ): Promise<Map<string, number>> {
    // This uses the Labs API which has the bulk keyword difficulty endpoint
    // For now, return a placeholder - will be implemented in Labs module
    // TODO: Implement using Labs API bulkKeywordDifficulty endpoint
    const result = new Map<string, number>()

    // Placeholder implementation - real implementation will use Labs API
    for (const keyword of keywords) {
      result.set(keyword, 50) // Default medium difficulty
    }

    return result
  }

  /**
   * Analyze keyword opportunity for dental practices
   * Combines search volume, competition, and intent signals
   *
   * @param keyword - Keyword to analyze
   * @param locationCode - Location for analysis
   * @returns Opportunity analysis
   *
   * @example
   * ```ts
   * const opportunity = await keywords.analyzeOpportunity('emergency dentist', 2840);
   * console.log(opportunity);
   * // {
   * //   keyword: 'emergency dentist',
   * //   searchVolume: 12100,
   * //   competition: 0.45,
   * //   opportunityScore: 78,
   * //   intent: 'transactional',
   * //   recommendation: 'High priority - local intent keyword'
   * // }
   * ```
   */
  async analyzeOpportunity(
    keyword: string,
    locationCode: number = DEFAULT_LOCATION_CODE
  ): Promise<{
    keyword: string
    searchVolume: number
    competition: number
    cpc: number
    opportunityScore: number
    intent: 'informational' | 'transactional' | 'navigational' | 'commercial'
    recommendation: string
  }> {
    const volumeData = await this.getSearchVolume({
      keywords: [keyword],
      locationCode,
    })

    const kwData = volumeData[0]

    if (!kwData) {
      return {
        keyword,
        searchVolume: 0,
        competition: 0,
        cpc: 0,
        opportunityScore: 0,
        intent: 'informational',
        recommendation: 'No data available for this keyword',
      }
    }

    // Infer intent from keyword patterns
    const intent = this.inferIntent(keyword)

    // Calculate opportunity score
    const searchVolume = kwData.search_volume ?? 0
    const competition = kwData.competition ?? 0
    const cpc = kwData.cpc ?? 0

    // Score calculation:
    // - Higher volume = better (log scale)
    // - Lower competition = better
    // - Higher CPC = more valuable traffic
    // - Transactional intent = bonus for dental practices
    let opportunityScore = 0

    // Volume contribution (0-40 points)
    const volumeScore = Math.min((Math.log10(Math.max(searchVolume, 1)) / 5) * 40, 40)
    opportunityScore += volumeScore

    // Competition contribution (0-30 points, inverted)
    const competitionScore = (1 - competition) * 30
    opportunityScore += competitionScore

    // CPC contribution (0-20 points)
    const cpcScore = Math.min((cpc / 10) * 20, 20)
    opportunityScore += cpcScore

    // Intent bonus (0-10 points)
    if (intent === 'transactional') opportunityScore += 10
    else if (intent === 'commercial') opportunityScore += 7
    else if (intent === 'navigational') opportunityScore += 3

    opportunityScore = Math.round(opportunityScore)

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      keyword,
      searchVolume,
      competition,
      intent,
      opportunityScore
    )

    return {
      keyword,
      searchVolume,
      competition,
      cpc,
      opportunityScore,
      intent,
      recommendation,
    }
  }

  /**
   * Infer search intent from keyword
   */
  private inferIntent(
    keyword: string
  ): 'informational' | 'transactional' | 'navigational' | 'commercial' {
    const lowerKeyword = keyword.toLowerCase()

    // Transactional signals (ready to buy/book)
    const transactionalPatterns = [
      'near me',
      'appointment',
      'book',
      'cost',
      'price',
      'emergency',
      'open now',
      'same day',
      'walk in',
      'affordable',
      'cheap',
      'best',
    ]

    // Commercial signals (researching options)
    const commercialPatterns = ['review', 'compare', 'vs', 'alternative', 'top', 'recommended']

    // Navigational signals (looking for specific brand)
    const navigationalPatterns = ['login', 'website', 'phone number', 'address']

    // Informational signals (seeking knowledge)
    const informationalPatterns = [
      'how to',
      'what is',
      'why',
      'when',
      'can i',
      'should i',
      'tips',
      'guide',
    ]

    if (transactionalPatterns.some((p) => lowerKeyword.includes(p))) {
      return 'transactional'
    }
    if (commercialPatterns.some((p) => lowerKeyword.includes(p))) {
      return 'commercial'
    }
    if (navigationalPatterns.some((p) => lowerKeyword.includes(p))) {
      return 'navigational'
    }
    if (informationalPatterns.some((p) => lowerKeyword.includes(p))) {
      return 'informational'
    }

    // Default to commercial for dental-related queries
    return 'commercial'
  }

  /**
   * Generate keyword recommendation based on analysis
   */
  private generateRecommendation(
    _keyword: string,
    volume: number,
    competition: number,
    intent: string,
    score: number
  ): string {
    if (score >= 70) {
      if (intent === 'transactional') {
        return 'High priority - local intent keyword with strong conversion potential'
      }
      return 'High opportunity - good balance of volume and competition'
    }

    if (score >= 50) {
      if (competition > 0.7) {
        return 'Moderate opportunity - high competition, consider long-tail variants'
      }
      return 'Moderate opportunity - worth targeting with quality content'
    }

    if (score >= 30) {
      if (volume < 100) {
        return 'Low volume - consider as supporting content for topic clusters'
      }
      return 'Low-moderate opportunity - competitive landscape makes ranking difficult'
    }

    return 'Low priority - limited opportunity based on current metrics'
  }

  /**
   * Get dental-specific keyword suggestions
   * Pre-filtered list of keywords relevant to dental practices
   *
   * @param practice - Type of dental practice
   * @param locationCode - Location for data
   * @returns Array of keyword suggestions with metrics
   */
  async getDentalKeywordSuggestions(
    practice: 'general' | 'cosmetic' | 'pediatric' | 'orthodontic' | 'oral-surgery',
    locationCode: number = DEFAULT_LOCATION_CODE
  ): Promise<KeywordInfo[]> {
    // Seed keywords by practice type
    const seedKeywords: Record<string, string[]> = {
      general: [
        'dentist near me',
        'dental cleaning',
        'family dentist',
        'dental checkup',
        'tooth extraction',
        'root canal',
        'dental filling',
        'emergency dentist',
      ],
      cosmetic: [
        'teeth whitening',
        'dental veneers',
        'cosmetic dentist',
        'smile makeover',
        'dental bonding',
        'porcelain veneers',
        'teeth bleaching',
      ],
      pediatric: [
        'pediatric dentist',
        'kids dentist',
        'child dentist',
        'children dental care',
        "baby's first dentist",
        'dental sealants kids',
      ],
      orthodontic: [
        'orthodontist near me',
        'braces',
        'invisalign',
        'teeth straightening',
        'clear aligners',
        'adult braces',
      ],
      'oral-surgery': [
        'oral surgeon',
        'wisdom tooth extraction',
        'dental implants',
        'jaw surgery',
        'tooth removal surgery',
      ],
    }

    const keywords = seedKeywords[practice] ??
      seedKeywords.general ?? ['dentist near me', 'dental cleaning']

    return this.getSearchVolume({
      keywords,
      locationCode,
    })
  }
}
