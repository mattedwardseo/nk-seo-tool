/**
 * Google Places API Types
 * Used for GBP (Google Business Profile) lookup
 */

/**
 * Place search result from Find Place From Text API
 */
export interface PlaceSearchResult {
  candidates: PlaceCandidate[]
  status: PlacesApiStatus
  error_message?: string
}

/**
 * Place candidate from search
 */
export interface PlaceCandidate {
  place_id: string
  name?: string
  formatted_address?: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
}

/**
 * Detailed place information from Place Details API
 */
export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  url?: string // Google Maps URL
  rating?: number
  user_ratings_total?: number
  price_level?: number
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'

  // Categories
  types?: string[]

  // Hours
  opening_hours?: OpeningHours

  // Reviews
  reviews?: PlaceReview[]

  // Photos
  photos?: PlacePhoto[]

  // Address components
  address_components?: AddressComponent[]

  // Geometry
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }

  // UTC offset for timezone
  utc_offset?: number
}

/**
 * Opening hours information
 */
export interface OpeningHours {
  open_now?: boolean
  periods?: OpeningPeriod[]
  weekday_text?: string[]
}

/**
 * Single opening period (day + times)
 */
export interface OpeningPeriod {
  open: {
    day: number // 0-6, Sunday = 0
    time: string // HHMM format
  }
  close?: {
    day: number
    time: string
  }
}

/**
 * Review from a customer
 */
export interface PlaceReview {
  author_name: string
  author_url?: string
  language: string
  profile_photo_url?: string
  rating: number // 1-5
  relative_time_description: string
  text: string
  time: number // Unix timestamp
}

/**
 * Photo reference for fetching
 */
export interface PlacePhoto {
  height: number
  width: number
  photo_reference: string
  html_attributions: string[]
}

/**
 * Address component (e.g., street, city, state)
 */
export interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

/**
 * Places API status codes
 */
export type PlacesApiStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'INVALID_REQUEST'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'UNKNOWN_ERROR'

/**
 * Place Details API response
 */
export interface PlaceDetailsResponse {
  result: PlaceDetails
  status: PlacesApiStatus
  error_message?: string
  html_attributions?: string[]
}

/**
 * Options for searching places
 */
export interface PlaceSearchOptions {
  /** Business name to search for */
  query: string
  /** Optional location bias (city, state) */
  locationBias?: string
  /** Fields to include in response (controls billing) */
  fields?: string[]
}

/**
 * Options for getting place details
 */
export interface PlaceDetailsOptions {
  /** Google Place ID */
  placeId: string
  /** Fields to include in response (controls billing) */
  fields?: string[]
}

/**
 * Normalized GBP data for our application
 * Maps Google Places data to our BusinessStepResult format
 */
export interface NormalizedGBPData {
  hasGmbListing: true
  businessName: string
  description?: string
  address?: string
  phone?: string
  website?: string
  placeId: string
  isClaimed?: boolean

  gmbRating: number | null
  reviewCount: number
  napConsistent: boolean
  categoriesSet: boolean
  photosCount: number
  postsRecent: boolean // Can't determine from Places API

  primaryCategory?: string
  additionalCategories?: string[]

  workHours?: Record<string, Array<{ open: string; close: string }>>

  // Reviews for sentiment analysis
  recentReviews?: Array<{
    rating: number
    text: string
    time: number
  }>

  // Location
  latitude?: number
  longitude?: number
}
