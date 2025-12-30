/**
 * SERP API Schemas
 *
 * Validation schemas for DataForSEO SERP API requests and responses.
 */

import { z } from 'zod'
import { keywordSchema, locationCodeSchema, locationNameSchema, languageCodeSchema } from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Base SERP request input
 */
const baseSerpInputSchema = z.object({
  keyword: keywordSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Device type */
  device: z.enum(['desktop', 'mobile']).default('desktop'),
  /** Operating system */
  os: z.enum(['windows', 'macos', 'android', 'ios']).optional(),
  /** Depth of results */
  depth: z.number().int().min(10).max(700).default(100),
})

/**
 * Google organic SERP input
 */
export const googleOrganicInputSchema = baseSerpInputSchema.extend({
  /** Search type */
  searchType: z.enum(['regular', 'images', 'news', 'local_pack']).default('regular'),
  /** Calculate rank group */
  calculateRankGroup: z.boolean().default(true),
})

/**
 * Google Maps SERP input
 */
export const googleMapsInputSchema = baseSerpInputSchema.extend({
  /** GPS coordinates in "latitude,longitude" or "latitude,longitude,zoom" format */
  coordinates: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*(,\d+)?$/)
    .optional(),
  /** Zoom level (3-21) - only used if not included in coordinates string */
  zoom: z.number().int().min(3).max(21).optional(),
})

/**
 * Google Local Finder input
 */
export const googleLocalFinderInputSchema = baseSerpInputSchema.extend({
  /** GPS coordinates */
  coordinates: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .optional(),
  /** Depth of results (local finder supports fewer) */
  depth: z.number().int().min(1).max(100).default(20),
})

/**
 * Get locations input
 */
export const getLocationsInputSchema = z.object({
  /** Country code (e.g., "US", "GB") */
  country: z.string().length(2).optional(),
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * SERP organic result item
 */
export const organicResultSchema = z.object({
  type: z.literal('organic'),
  rank_group: z.number(),
  rank_absolute: z.number(),
  position: z.string().nullable(),
  xpath: z.string().nullable(),
  domain: z.string(),
  title: z.string().nullable(),
  url: z.string(),
  description: z.string().nullable(),
  breadcrumb: z.string().nullable(),
  is_image: z.boolean().nullable(),
  is_video: z.boolean().nullable(),
  is_featured_snippet: z.boolean().nullable(),
  is_malicious: z.boolean().nullable(),
  highlighted: z.array(z.string()).nullable(),
  links: z
    .array(
      z.object({
        type: z.string(),
        title: z.string().nullable(),
        url: z.string().nullable(),
        description: z.string().nullable(),
      })
    )
    .nullable(),
})

/**
 * Local pack result item
 */
export const localPackResultSchema = z.object({
  type: z.literal('local_pack'),
  rank_group: z.number(),
  rank_absolute: z.number(),
  position: z.string().nullable(),
  xpath: z.string().nullable(),
  title: z.string().nullable(),
  domain: z.string().nullable(),
  url: z.string().nullable(),
  description: z.string().nullable(),
  rating: z
    .object({
      rating_type: z.string().nullable(),
      value: z.number().nullable(),
      votes_count: z.number().nullable(),
    })
    .nullable(),
  cid: z.string().nullable(),
})

/**
 * Maps result item
 */
export const mapsResultSchema = z.object({
  type: z.literal('maps_search'),
  rank_group: z.number(),
  rank_absolute: z.number(),
  domain: z.string().nullable(),
  title: z.string(),
  url: z.string().nullable(),
  address: z.string().nullable(),
  address_info: z
    .object({
      city: z.string().nullable(),
      region: z.string().nullable(),
      zip: z.string().nullable(),
      address: z.string().nullable(),
      country_code: z.string().nullable(),
    })
    .nullable(),
  rating: z
    .object({
      rating_type: z.string().nullable(),
      value: z.number().nullable(),
      votes_count: z.number().nullable(),
    })
    .nullable(),
  phone: z.string().nullable(),
  main_image: z.string().nullable(),
  category: z.string().nullable(),
  work_hours: z
    .object({
      work_hours: z.record(z.string(), z.array(z.string())).nullable(),
    })
    .nullable(),
  feature_id: z.string().nullable(),
  cid: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

/**
 * Location item
 */
export const locationSchema = z.object({
  location_code: z.number(),
  location_name: z.string(),
  location_code_parent: z.number().nullable(),
  country_iso_code: z.string().nullable(),
  location_type: z.string(),
})

/**
 * SERP item union type
 */
export const serpItemSchema = z.union([
  organicResultSchema,
  localPackResultSchema,
  z.object({ type: z.string() }).passthrough(), // Allow other types
])

// ============================================================================
// Type Exports
// ============================================================================

// Use z.input for input types so that fields with defaults are optional for callers
export type GoogleOrganicInput = z.input<typeof googleOrganicInputSchema>
export type GoogleMapsInput = z.input<typeof googleMapsInputSchema>
export type GoogleLocalFinderInput = z.input<typeof googleLocalFinderInputSchema>
export type GetLocationsInput = z.input<typeof getLocationsInputSchema>
export type OrganicResult = z.infer<typeof organicResultSchema>
export type LocalPackResult = z.infer<typeof localPackResultSchema>
export type MapsResult = z.infer<typeof mapsResultSchema>
export type Location = z.infer<typeof locationSchema>
export type SerpItem = z.infer<typeof serpItemSchema>
