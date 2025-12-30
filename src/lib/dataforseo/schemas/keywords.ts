/**
 * Keywords Data API Schemas
 *
 * Validation schemas for DataForSEO Keywords Data API requests and responses.
 */

import { z } from 'zod'
import {
  keywordSchema,
  keywordsArraySchema,
  locationCodeSchema,
  locationNameSchema,
  languageCodeSchema,
  domainSchema,
  dateRangeSchema,
} from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Search volume input
 */
export const searchVolumeInputSchema = z.object({
  keywords: keywordsArraySchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Include search partner network data */
  searchPartners: z.boolean().default(false),
  /** Include low search volume keywords */
  includeLowSearchVolume: z.boolean().default(true),
})

/**
 * Keywords for site input
 */
export const keywordsForSiteInputSchema = z.object({
  target: domainSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Include subcategories */
  includeSubcategories: z.boolean().default(true),
  /** Sort by */
  sortBy: z.enum(['search_volume', 'relevance', 'cpc']).default('search_volume'),
  /** Limit results */
  limit: z.number().int().min(1).max(1000).default(100),
})

/**
 * Keywords trends input
 */
export const keywordsTrendsInputSchema = z.object({
  keywords: z.array(keywordSchema).min(1).max(5), // Trends limited to 5
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Time range */
  timeRange: z
    .enum([
      'past_hour',
      'past_4_hours',
      'past_day',
      'past_week',
      'past_month',
      'past_3_months',
      'past_12_months',
      'past_5_years',
    ])
    .default('past_12_months'),
  /** Data type */
  type: z.enum(['web', 'news', 'youtube', 'images', 'froogle']).default('web'),
  ...dateRangeSchema.shape,
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Monthly search volume data
 */
export const monthlySearchSchema = z.object({
  year: z.number(),
  month: z.number(),
  search_volume: z.number().nullable(),
})

/**
 * Keyword info (search volume result)
 */
export const keywordInfoSchema = z.object({
  keyword: z.string(),
  location_code: z.number().nullable(),
  language_code: z.string().nullable(),
  search_volume: z.number().nullable(),
  competition: z.number().nullable(),
  competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
  cpc: z.number().nullable(),
  low_top_of_page_bid: z.number().nullable(),
  high_top_of_page_bid: z.number().nullable(),
  monthly_searches: z.array(monthlySearchSchema).nullable(),
})

/**
 * Keyword for site result
 */
export const keywordForSiteResultSchema = z.object({
  keyword: z.string(),
  location_code: z.number().nullable(),
  language_code: z.string().nullable(),
  search_volume: z.number().nullable(),
  competition: z.number().nullable(),
  competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
  cpc: z.number().nullable(),
  low_top_of_page_bid: z.number().nullable(),
  high_top_of_page_bid: z.number().nullable(),
  categories: z.array(z.number()).nullable(),
  monthly_searches: z.array(monthlySearchSchema).nullable(),
})

/**
 * Trend data point
 */
export const trendDataPointSchema = z.object({
  date: z.string(),
  values: z.array(z.number().nullable()),
})

/**
 * Keywords trends result
 */
export const keywordsTrendsResultSchema = z.object({
  keywords: z.array(z.string()),
  date_from: z.string().nullable(),
  date_to: z.string().nullable(),
  data: z.array(trendDataPointSchema),
})

/**
 * Subregion interest
 */
export const subregionInterestSchema = z.object({
  location_code: z.number(),
  location_name: z.string(),
  values: z.array(z.number().nullable()),
})

/**
 * Demographics data
 */
export const demographicsDataSchema = z.object({
  age: z.record(z.string(), z.number()).nullable(),
  gender: z.record(z.string(), z.number()).nullable(),
})

// ============================================================================
// Type Exports
// ============================================================================

// Use z.input for input types so that fields with defaults are optional for callers
export type SearchVolumeInput = z.input<typeof searchVolumeInputSchema>
export type KeywordsForSiteInput = z.input<typeof keywordsForSiteInputSchema>
export type KeywordsTrendsInput = z.input<typeof keywordsTrendsInputSchema>
export type MonthlySearch = z.infer<typeof monthlySearchSchema>
export type KeywordInfo = z.infer<typeof keywordInfoSchema>
export type KeywordForSiteResult = z.infer<typeof keywordForSiteResultSchema>
export type TrendDataPoint = z.infer<typeof trendDataPointSchema>
export type KeywordsTrendsResult = z.infer<typeof keywordsTrendsResultSchema>
export type SubregionInterest = z.infer<typeof subregionInterestSchema>
export type DemographicsData = z.infer<typeof demographicsDataSchema>
