/**
 * Google Places API Client
 * Used for reliable GBP (Google Business Profile) lookup
 *
 * API Endpoints:
 * - Find Place From Text: Search for a place by name/address
 * - Place Details: Get full details including rating, reviews, hours
 *
 * Pricing (as of 2024):
 * - Find Place: $17 per 1000 requests
 * - Place Details (Basic): $17 per 1000 requests
 * - Place Details (Contact): +$3 per 1000
 * - Place Details (Atmosphere): +$5 per 1000
 *
 * Free tier: $200/month credit (~5000 lookups/month)
 */

import {
  type PlaceSearchResult,
  type PlaceDetailsResponse,
  type PlaceDetails,
  type NormalizedGBPData,
  type PlaceSearchOptions,
  type PlaceDetailsOptions,
} from './types'

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'

/**
 * Default fields for Find Place (minimal for cost)
 */
const DEFAULT_SEARCH_FIELDS = ['place_id', 'name', 'formatted_address', 'business_status']

/**
 * Default fields for Place Details
 * Balanced between data needs and cost
 */
const DEFAULT_DETAIL_FIELDS = [
  // Basic (included in base price)
  'place_id',
  'name',
  'formatted_address',
  'geometry',
  'business_status',
  'types',
  'url',

  // Contact (+$3/1000)
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'opening_hours',

  // Atmosphere (+$5/1000)
  'rating',
  'user_ratings_total',
  'reviews',
  'photos',
]

/**
 * Google Places API Client
 */
export class GooglePlacesClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || ''

    if (!this.apiKey) {
      console.warn('GooglePlacesClient: No API key provided. GBP lookups will fail.')
    }
  }

  /**
   * Check if the client is configured with an API key
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  /**
   * Search for a place by text query
   * Uses the Find Place From Text API
   *
   * @param options Search options (query, locationBias, fields)
   * @returns Place candidates matching the query
   */
  async findPlace(options: PlaceSearchOptions): Promise<PlaceSearchResult> {
    const { query, locationBias, fields = DEFAULT_SEARCH_FIELDS } = options

    const params = new URLSearchParams({
      input: locationBias ? `${query} ${locationBias}` : query,
      inputtype: 'textquery',
      fields: fields.join(','),
      key: this.apiKey,
    })

    const response = await fetch(`${PLACES_API_BASE}/findplacefromtext/json?${params}`)

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as PlaceSearchResult

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
    }

    return data
  }

  /**
   * Get detailed information about a place
   * Uses the Place Details API
   *
   * @param options Details options (placeId, fields)
   * @returns Full place details
   */
  async getPlaceDetails(options: PlaceDetailsOptions): Promise<PlaceDetails | null> {
    const { placeId, fields = DEFAULT_DETAIL_FIELDS } = options

    const params = new URLSearchParams({
      place_id: placeId,
      fields: fields.join(','),
      key: this.apiKey,
    })

    const response = await fetch(`${PLACES_API_BASE}/details/json?${params}`)

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as PlaceDetailsResponse

    if (data.status === 'ZERO_RESULTS' || data.status === 'INVALID_REQUEST') {
      return null
    }

    if (data.status !== 'OK') {
      throw new Error(
        `Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`
      )
    }

    return data.result
  }

  /**
   * Search for a business and get its details in one call
   * Convenience method that combines findPlace + getPlaceDetails
   *
   * @param businessName Name of the business
   * @param location Optional location (city, state)
   * @returns Normalized GBP data or null if not found
   */
  async lookupBusiness(
    businessName: string,
    location?: string
  ): Promise<NormalizedGBPData | null> {
    // Search for the place
    const searchResult = await this.findPlace({
      query: businessName,
      locationBias: location,
    })

    if (!searchResult.candidates || searchResult.candidates.length === 0) {
      return null
    }

    // Get details for the first (best) match
    const firstCandidate = searchResult.candidates[0]
    if (!firstCandidate) {
      return null
    }

    const placeId = firstCandidate.place_id
    const details = await this.getPlaceDetails({ placeId })

    if (!details) {
      return null
    }

    return this.normalizeToGBPData(details)
  }

  /**
   * Get business details by Place ID directly
   * Use this when the Place ID is already known
   *
   * @param placeId Google Place ID
   * @returns Normalized GBP data or null if not found
   */
  async getBusinessByPlaceId(placeId: string): Promise<NormalizedGBPData | null> {
    const details = await this.getPlaceDetails({ placeId })

    if (!details) {
      return null
    }

    return this.normalizeToGBPData(details)
  }

  /**
   * Normalize Google Places data to our GBP format
   */
  private normalizeToGBPData(details: PlaceDetails): NormalizedGBPData {
    // Parse work hours from opening_hours
    const workHours = this.parseWorkHours(details.opening_hours)

    // Extract categories from types
    const categories = (details.types || []).filter(
      (type) => !['point_of_interest', 'establishment'].includes(type)
    )

    // Recent reviews (up to 5)
    const recentReviews = details.reviews?.slice(0, 5).map((review) => ({
      rating: review.rating,
      text: review.text,
      time: review.time,
    }))

    return {
      hasGmbListing: true,
      businessName: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number || details.international_phone_number,
      website: details.website,
      placeId: details.place_id,

      gmbRating: details.rating || null,
      reviewCount: details.user_ratings_total || 0,
      napConsistent: true, // Will be verified against domain later
      categoriesSet: categories.length > 0,
      photosCount: details.photos?.length || 0,
      postsRecent: false, // Can't determine from Places API

      primaryCategory: categories[0],
      additionalCategories: categories.slice(1),

      workHours,
      recentReviews,

      latitude: details.geometry?.location?.lat,
      longitude: details.geometry?.location?.lng,
    }
  }

  /**
   * Parse opening hours into our format
   */
  private parseWorkHours(
    openingHours?: PlaceDetails['opening_hours']
  ): Record<string, Array<{ open: string; close: string }>> | undefined {
    if (!openingHours?.periods) {
      return undefined
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const result: Record<string, Array<{ open: string; close: string }>> = {}

    for (const period of openingHours.periods) {
      const dayIndex = period.open.day
      if (dayIndex < 0 || dayIndex > 6) continue

      const dayName = dayNames[dayIndex] as string

      if (!result[dayName]) {
        result[dayName] = []
      }

      result[dayName].push({
        open: this.formatTime(period.open.time),
        close: period.close ? this.formatTime(period.close.time) : '23:59',
      })
    }

    return result
  }

  /**
   * Format time from HHMM to HH:MM
   */
  private formatTime(time: string): string {
    if (time.length === 4) {
      return `${time.slice(0, 2)}:${time.slice(2)}`
    }
    return time
  }
}

/**
 * Singleton instance for default usage
 */
let defaultClient: GooglePlacesClient | null = null

/**
 * Get the default Google Places client
 * Uses GOOGLE_PLACES_API_KEY from environment
 */
export function getGooglePlacesClient(): GooglePlacesClient {
  if (!defaultClient) {
    defaultClient = new GooglePlacesClient()
  }
  return defaultClient
}
