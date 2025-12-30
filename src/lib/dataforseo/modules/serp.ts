/**
 * SERP API Module
 *
 * Search engine results page analysis - organic rankings, local pack, and Maps.
 * Critical for dental practice visibility tracking.
 */

import {
  SerpGoogleOrganicLiveAdvancedRequestInfo,
  SerpGoogleMapsLiveAdvancedRequestInfo,
  SerpGoogleLocalFinderLiveAdvancedRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  googleOrganicInputSchema,
  googleMapsInputSchema,
  googleLocalFinderInputSchema,
  getLocationsInputSchema,
  type GoogleOrganicInput,
  type GoogleMapsInput,
  type GoogleLocalFinderInput,
  type GetLocationsInput,
  type OrganicResult,
  type LocalPackResult,
  type MapsResult,
  type Location,
} from '../schemas'

/** Default US location code */
const DEFAULT_LOCATION_CODE = 2840

/**
 * SERP API module for search engine rankings analysis
 */
export class SerpModule extends BaseModule {
  /**
   * Get Google organic search results for a keyword
   * Returns organic listings with rank positions and metadata
   *
   * @param input - Keyword, location, and search parameters
   * @param options - Execution options (caching, rate limiting)
   * @returns Array of organic search results
   *
   * @example
   * ```ts
   * const results = await serp.googleOrganicSearch({
   *   keyword: 'dentist near me',
   *   locationCode: 2840, // United States
   *   device: 'mobile',
   *   depth: 100,
   * });
   * const topResult = results[0];
   * console.log(`#1: ${topResult.domain} - ${topResult.title}`);
   * ```
   */
  async googleOrganicSearch(
    input: GoogleOrganicInput,
    options?: ExecuteOptions
  ): Promise<OrganicResult[]> {
    const validated = this.validateInput(googleOrganicInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.serp.organic(validated.keyword, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new SerpGoogleOrganicLiveAdvancedRequestInfo()
        request.keyword = validated.keyword
        request.language_code = validated.languageCode
        request.device = validated.device
        request.depth = validated.depth
        request.calculate_rectangles = validated.calculateRankGroup

        // Set location (prefer code over name)
        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        // Set OS if specified
        if (validated.os) {
          request.os = validated.os
        }

        return this.client.serp.googleOrganicLiveAdvanced([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.SERP, ...options?.cache },
      }
    )

    // Extract organic results from the response
    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []

    // Filter to only organic type results
    const items = task.result[0].items as unknown as Array<{ type?: string }>
    return items.filter((item): item is OrganicResult => item.type === 'organic')
  }

  /**
   * Get Google Maps search results for a keyword
   * Returns local business listings with ratings and contact info
   *
   * @param input - Keyword, location, and search parameters
   * @param options - Execution options
   * @returns Array of Maps search results
   *
   * @example
   * ```ts
   * const results = await serp.googleMapsSearch({
   *   keyword: 'dental clinic Austin TX',
   *   coordinates: '30.2672,-97.7431', // Austin coordinates
   *   depth: 20,
   * });
   * for (const business of results) {
   *   console.log(`${business.title}: ${business.rating?.value} stars`);
   * }
   * ```
   */
  async googleMapsSearch(input: GoogleMapsInput, options?: ExecuteOptions): Promise<MapsResult[]> {
    const validated = this.validateInput(googleMapsInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    // Use coordinate-specific cache key when coordinates provided, otherwise use location code
    const cacheKey = validated.coordinates
      ? CacheKeys.serp.mapsCoords(validated.keyword, validated.coordinates)
      : CacheKeys.serp.maps(validated.keyword, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new SerpGoogleMapsLiveAdvancedRequestInfo()
        request.keyword = validated.keyword
        request.language_code = validated.languageCode
        request.device = validated.device
        request.depth = validated.depth

        // IMPORTANT: location_coordinate, location_code, and location_name are MUTUALLY EXCLUSIVE
        // Per DataForSEO docs: "if you use this field, you don't need to specify location_name or location_coordinate"
        // When using geo-grid coordinates, we should ONLY set location_coordinate
        if (validated.coordinates) {
          // Use GPS coordinates for geo-grid searches - do NOT set location_code
          request.location_coordinate = validated.coordinates
          // Per DataForSEO docs: "search_places mode might interfere with some local-intent queries"
          // "to prevent this interference and obtain correct results for keywords with local intent
          // you may set this parameter to false"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(request as any).search_places = false
        } else if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        // Set OS if specified
        if (validated.os) {
          request.os = validated.os
        }

        return this.client.serp.googleMapsLiveAdvanced([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.SERP, ...options?.cache },
      }
    )

    // Extract maps results from the response
    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []

    const items = task.result[0].items as unknown as Array<{ type?: string }>
    return items.filter((item): item is MapsResult => item.type === 'maps_search')
  }

  /**
   * Get Google Local Finder results for a keyword
   * Returns the expanded local pack results with detailed business info
   *
   * @param input - Keyword and location parameters
   * @param options - Execution options
   * @returns Array of local finder results
   *
   * @example
   * ```ts
   * const results = await serp.googleLocalFinder({
   *   keyword: 'pediatric dentist',
   *   locationName: 'Chicago, Illinois, United States',
   *   depth: 20,
   * });
   * ```
   */
  async googleLocalFinder(
    input: GoogleLocalFinderInput,
    options?: ExecuteOptions
  ): Promise<LocalPackResult[]> {
    const validated = this.validateInput(googleLocalFinderInputSchema, input)
    const locationCode = validated.locationCode ?? DEFAULT_LOCATION_CODE

    const cacheKey = CacheKeys.serp.localFinder(validated.keyword, locationCode)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new SerpGoogleLocalFinderLiveAdvancedRequestInfo()
        request.keyword = validated.keyword
        request.language_code = validated.languageCode
        request.device = validated.device
        request.depth = validated.depth

        // Set location
        if (validated.locationCode) {
          request.location_code = validated.locationCode
        } else if (validated.locationName) {
          request.location_name = validated.locationName
        } else {
          request.location_code = DEFAULT_LOCATION_CODE
        }

        // Set GPS coordinates if provided
        if (validated.coordinates) {
          request.location_coordinate = validated.coordinates
        }

        // Set OS if specified
        if (validated.os) {
          request.os = validated.os
        }

        return this.client.serp.googleLocalFinderLiveAdvanced([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.SERP, ...options?.cache },
      }
    )

    // Extract local finder results from the response
    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []

    const items = task.result[0].items as unknown as Array<{ type?: string }>
    return items.filter((item): item is LocalPackResult => item.type === 'local_pack')
  }

  /**
   * Get available SERP locations
   * Returns location codes for targeting specific geographic areas
   *
   * @param input - Optional country filter
   * @param options - Execution options
   * @returns Array of available locations
   *
   * @example
   * ```ts
   * // Get all US locations
   * const usLocations = await serp.getLocations({ country: 'US' });
   * const newYork = usLocations.find(l => l.location_name.includes('New York'));
   * console.log(newYork?.location_code); // Use this code for searches
   * ```
   */
  async getLocations(input?: GetLocationsInput, options?: ExecuteOptions): Promise<Location[]> {
    const validated = input ? this.validateInput(getLocationsInputSchema, input) : {}

    const cacheKey = CacheKeys.serp.locations(validated.country ?? 'all')

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        return this.client.serp.serpGoogleLocations()
      },
      {
        ...options,
        cache: { ttl: CacheTTL.REFERENCE, ...options?.cache },
      }
    )

    // Extract locations from response
    const task = response?.tasks?.[0]
    if (!task?.result) return []

    const locations = task.result as unknown as Location[]

    // Filter by country if specified
    if (validated.country) {
      return locations.filter((loc) => loc.country_iso_code === validated.country)
    }

    return locations
  }

  /**
   * Find a practice's ranking for a specific keyword
   * Searches organic results to find where a domain ranks
   *
   * @param keyword - Search keyword
   * @param domain - Domain to find in results
   * @param locationCode - Location for search
   * @returns Ranking position or null if not found in top results
   *
   * @example
   * ```ts
   * const ranking = await serp.findDomainRanking(
   *   'dentist austin tx',
   *   'austindental.com',
   *   { locationCode: 2840 }
   * );
   * // Or with location name:
   * const ranking2 = await serp.findDomainRanking(
   *   'dentist boston',
   *   'bostondental.com',
   *   { locationName: 'Boston,Massachusetts,United States' }
   * );
   * if (ranking) {
   *   console.log(`Ranking #${ranking.rank_absolute} for "dentist austin tx"`);
   * }
   * ```
   */
  async findDomainRanking(
    keyword: string,
    domain: string,
    locationOptions?: { locationCode?: number; locationName?: string }
  ): Promise<OrganicResult | null> {
    const results = await this.googleOrganicSearch({
      keyword,
      locationCode: locationOptions?.locationCode ?? (locationOptions?.locationName ? undefined : DEFAULT_LOCATION_CODE),
      locationName: locationOptions?.locationName,
      depth: 100, // Check top 100 results
    })

    // Normalize domain for comparison
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')

    return (
      results.find((result) => {
        const resultDomain = result.domain.toLowerCase().replace(/^www\./, '')
        return resultDomain === normalizedDomain
      }) ?? null
    )
  }

  /**
   * Get local pack presence for a business
   * Checks if a business appears in local results for a keyword
   *
   * @param keyword - Search keyword
   * @param businessName - Business name to find (partial match)
   * @param locationCode - Location for search
   * @returns Local pack result or null if not found
   *
   * @example
   * ```ts
   * const presence = await serp.findLocalPackPresence(
   *   'family dentist',
   *   'Smile Family Dental',
   *   1023191 // Austin, TX location code
   * );
   * if (presence) {
   *   console.log(`Found in local pack at position ${presence.rank_absolute}`);
   *   console.log(`Rating: ${presence.rating?.value} stars`);
   * }
   * ```
   */
  async findLocalPackPresence(
    keyword: string,
    businessName: string,
    locationCode: number = DEFAULT_LOCATION_CODE
  ): Promise<LocalPackResult | null> {
    const results = await this.googleLocalFinder({
      keyword,
      locationCode,
      depth: 20,
    })

    const normalizedName = businessName.toLowerCase()

    return (
      results.find((result) => {
        const resultName = (result.title ?? '').toLowerCase()
        return resultName.includes(normalizedName)
      }) ?? null
    )
  }

  /**
   * Analyze SERP features for a keyword
   * Identifies what types of results appear for a search
   *
   * @param keyword - Search keyword
   * @param locationCode - Location for search
   * @returns Object with SERP feature analysis
   *
   * @example
   * ```ts
   * const features = await serp.analyzeSerpFeatures('dentist near me', { locationCode: 2840 });
   * // Or with location name:
   * const features2 = await serp.analyzeSerpFeatures('dentist boston', {
   *   locationName: 'Boston,Massachusetts,United States'
   * });
   * console.log(features);
   * // { hasLocalPack: true, organicCount: 10, featuredSnippet: false }
   * ```
   */
  async analyzeSerpFeatures(
    keyword: string,
    locationOptions?: { locationCode?: number; locationName?: string }
  ): Promise<{
    organicCount: number
    hasLocalPack: boolean
    hasFeaturedSnippet: boolean
    hasImages: boolean
    hasVideos: boolean
    topOrganicDomain: string | null
  }> {
    const locName: string | undefined = locationOptions?.locationName
    const effectiveLocationCode = locationOptions?.locationCode ??
      (locName ? undefined : DEFAULT_LOCATION_CODE)
    // For cache key, use location code or a simplified location name
    let locationKey: string | number = effectiveLocationCode ?? 'us'
    if (locName) {
      // Use first part of location name (city) as cache key
      locationKey = locName.split(',')[0]!.toLowerCase().replace(/\s+/g, '')
    }
    const cacheKey = `${CacheKeys.serp.organic(keyword, 0)}_${locationKey}`

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new SerpGoogleOrganicLiveAdvancedRequestInfo()
        request.keyword = keyword
        if (locName) {
          request.location_name = locName
        } else {
          request.location_code = effectiveLocationCode ?? DEFAULT_LOCATION_CODE
        }
        request.language_code = 'en'
        request.depth = 10

        return this.client.serp.googleOrganicLiveAdvanced([request])
      },
      { cache: { ttl: CacheTTL.SERP } }
    )

    const task = response?.tasks?.[0]
    const rawItems = task?.result?.[0]?.items ?? []

    // Type cast for processing
    type SerpItem = {
      type?: string
      is_featured_snippet?: boolean | null
      is_image?: boolean | null
      is_video?: boolean | null
      domain?: string
    }
    const items = rawItems as unknown as SerpItem[]

    const organicResults = items.filter((item) => item.type === 'organic')
    const hasLocalPack = items.some((item) => item.type === 'local_pack')
    const hasFeaturedSnippet = organicResults.some((item) => item.is_featured_snippet === true)
    const hasImages = organicResults.some((item) => item.is_image === true)
    const hasVideos = organicResults.some((item) => item.is_video === true)

    const topOrganic = organicResults[0]

    return {
      organicCount: organicResults.length,
      hasLocalPack,
      hasFeaturedSnippet,
      hasImages,
      hasVideos,
      topOrganicDomain: topOrganic?.domain ?? null,
    }
  }
}
