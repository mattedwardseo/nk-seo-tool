/**
 * Google Places API Module
 *
 * Provides reliable GBP (Google Business Profile) lookup
 * using Google Places API as a fallback/alternative to DataForSEO.
 */

export { GooglePlacesClient, getGooglePlacesClient } from './client'
export type {
  PlaceSearchResult,
  PlaceCandidate,
  PlaceDetails,
  PlaceDetailsResponse,
  PlaceReview,
  PlacePhoto,
  OpeningHours,
  OpeningPeriod,
  AddressComponent,
  PlacesApiStatus,
  PlaceSearchOptions,
  PlaceDetailsOptions,
  NormalizedGBPData,
} from './types'
