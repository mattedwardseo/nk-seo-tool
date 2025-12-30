/**
 * DataForSEO Labs API Schemas
 *
 * Validation schemas for DataForSEO Labs API requests and responses.
 */

import { z } from 'zod'
import {
  domainSchema,
  keywordSchema,
  keywordsArraySchema,
  locationCodeSchema,
  locationNameSchema,
  languageCodeSchema,
  paginationSchema,
} from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Domain rank overview input
 */
export const domainRankOverviewInputSchema = z.object({
  target: domainSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
})

/**
 * Ranked keywords input
 */
export const rankedKeywordsInputSchema = z.object({
  target: domainSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Include subdomains */
  includeSubdomains: z.boolean().default(true),
  /** Item types to include */
  itemTypes: z
    .array(z.enum(['organic', 'paid', 'featured_snippet', 'local_pack']))
    .default(['organic']),
  /** Historical data */
  historicalSerpMode: z.enum(['live', 'live_historical']).default('live'),
  ...paginationSchema.shape,
})

/**
 * Competitors domain input
 */
export const competitorsDomainInputSchema = z.object({
  target: domainSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Exclude top domains (google, wikipedia, etc) */
  excludeTopDomains: z.boolean().default(true),
  /** Include only intersecting results */
  intersectingResults: z.boolean().default(true),
  ...paginationSchema.shape,
})

/**
 * Bulk keyword difficulty input
 */
export const bulkKeywordDifficultyInputSchema = z.object({
  keywords: keywordsArraySchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
})

/**
 * Search intent input
 */
export const searchIntentInputSchema = z.object({
  keywords: keywordsArraySchema,
  languageCode: languageCodeSchema.default('en'),
})

/**
 * Bulk traffic estimation input
 */
export const bulkTrafficEstimationInputSchema = z.object({
  targets: z.array(domainSchema).min(1).max(1000),
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
})

/**
 * Keyword suggestions input
 */
export const keywordSuggestionsInputSchema = z.object({
  keyword: keywordSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Include seed keyword in results */
  includeSeedKeyword: z.boolean().default(true),
  ...paginationSchema.shape,
})

/**
 * Historical keyword data input
 * For enriching keywords with search volume, CPC, and bid data
 */
export const historicalKeywordDataInputSchema = z.object({
  keywords: keywordsArraySchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
})

/**
 * Historical rank overview input
 * For getting domain ranking distribution trends over time (6 months)
 */
export const historicalRankOverviewInputSchema = z.object({
  target: domainSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Ranking distribution metrics
 */
export const rankingDistributionSchema = z.object({
  pos_1: z.number().nullable(),
  pos_2_3: z.number().nullable(),
  pos_4_10: z.number().nullable(),
  pos_11_20: z.number().nullable(),
  pos_21_30: z.number().nullable(),
  pos_31_40: z.number().nullable(),
  pos_41_50: z.number().nullable(),
  pos_51_60: z.number().nullable(),
  pos_61_70: z.number().nullable(),
  pos_71_80: z.number().nullable(),
  pos_81_90: z.number().nullable(),
  pos_91_100: z.number().nullable(),
  etv: z.number().nullable(),
  impressions_etv: z.number().nullable(),
  count: z.number().nullable(),
  estimated_paid_traffic_cost: z.number().nullable(),
  is_new: z.number().nullable(),
  is_up: z.number().nullable(),
  is_down: z.number().nullable(),
  is_lost: z.number().nullable(),
})

/**
 * Domain rank overview result
 */
export const domainRankOverviewResultSchema = z.object({
  target: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  total_count: z.number().nullable(),
  metrics: z.object({
    organic: rankingDistributionSchema.nullable(),
    paid: rankingDistributionSchema.nullable(),
    featured_snippet: rankingDistributionSchema.nullable(),
    local_pack: rankingDistributionSchema.nullable(),
  }),
})

/**
 * Ranked keyword item
 */
export const rankedKeywordItemSchema = z.object({
  keyword_data: z.object({
    keyword: z.string(),
    keyword_info: z
      .object({
        search_volume: z.number().nullable(),
        competition: z.number().nullable(),
        competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
        cpc: z.number().nullable(),
        monthly_searches: z
          .array(
            z.object({
              year: z.number(),
              month: z.number(),
              search_volume: z.number().nullable(),
            })
          )
          .nullable(),
      })
      .nullable(),
  }),
  ranked_serp_element: z.object({
    serp_item: z.object({
      type: z.string(),
      rank_group: z.number().nullable(),
      rank_absolute: z.number().nullable(),
      position: z.string().nullable(),
      etv: z.number().nullable(),
      impressions_etv: z.number().nullable(),
      url: z.string().optional(),
    }),
  }),
})

/**
 * Competitor domain item
 */
export const competitorDomainItemSchema = z.object({
  domain: z.string(),
  avg_position: z.number().nullable(),
  sum_position: z.number().nullable(),
  intersections: z.number(),
  full_domain_metrics: z
    .object({
      organic: rankingDistributionSchema.nullable(),
    })
    .nullable(),
  metrics: z
    .object({
      organic: rankingDistributionSchema.nullable(),
    })
    .nullable(),
})

/**
 * Keyword difficulty result
 */
export const keywordDifficultyResultSchema = z.object({
  keyword: z.string(),
  keyword_difficulty: z.number().nullable(),
})

/**
 * Search intent item
 * Note: API returns 'label' and 'probability' in keyword_intent, not 'main_intent'
 */
export const searchIntentItemSchema = z.object({
  keyword: z.string(),
  keyword_intent: z
    .object({
      label: z
        .enum(['informational', 'navigational', 'commercial', 'transactional'])
        .nullable(),
      probability: z.number().nullable(),
    })
    .nullable(),
  secondary_keyword_intents: z
    .array(
      z.object({
        label: z.string(),
        probability: z.number(),
      })
    )
    .optional()
    .nullable(),
})

/**
 * Traffic estimation result
 */
export const trafficEstimationResultSchema = z.object({
  target: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  metrics: z.object({
    organic: z
      .object({
        etv: z.number().nullable(),
        impressions_etv: z.number().nullable(),
        count: z.number().nullable(),
        estimated_paid_traffic_cost: z.number().nullable(),
      })
      .nullable(),
    paid: z
      .object({
        etv: z.number().nullable(),
        impressions_etv: z.number().nullable(),
        count: z.number().nullable(),
      })
      .nullable(),
  }),
})

/**
 * Keyword suggestion item
 */
export const keywordSuggestionItemSchema = z.object({
  keyword: z.string(),
  keyword_info: z
    .object({
      search_volume: z.number().nullable(),
      competition: z.number().nullable(),
      competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
      cpc: z.number().nullable(),
    })
    .nullable(),
  keyword_properties: z
    .object({
      keyword_difficulty: z.number().nullable(),
    })
    .nullable(),
  impressions_info: z
    .object({
      daily_impressions_average: z.number().nullable(),
      daily_clicks_average: z.number().nullable(),
      daily_cost_average: z.number().nullable(),
    })
    .nullable(),
})

/**
 * Historical keyword info for a specific month
 */
export const historicalKeywordInfoSchema = z.object({
  se_type: z.string().optional(),
  last_updated_time: z.string().nullable().optional(),
  competition: z.number().nullable().optional(),
  competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable().optional(),
  cpc: z.number().nullable().optional(),
  search_volume: z.number().nullable().optional(),
  low_top_of_page_bid: z.number().nullable().optional(),
  high_top_of_page_bid: z.number().nullable().optional(),
  categories: z.array(z.number()).nullable().optional(),
  monthly_searches: z.record(z.string(), z.number()).nullable().optional(),
  search_volume_trend: z
    .object({
      monthly: z.number().optional(),
      quarterly: z.number().optional(),
      yearly: z.number().optional(),
    })
    .nullable()
    .optional(),
})

/**
 * Historical data entry for a single month
 */
export const historicalKeywordMonthSchema = z.object({
  year: z.number(),
  month: z.number(),
  keyword_info: historicalKeywordInfoSchema.nullable().optional(),
})

/**
 * Historical keyword data item (one per keyword)
 */
export const historicalKeywordDataItemSchema = z.object({
  se_type: z.string().optional(),
  keyword: z.string(),
  location_code: z.number().nullable().optional(),
  language_code: z.string().optional(),
  history: z.array(historicalKeywordMonthSchema).nullable().optional(),
})

/**
 * Historical rank overview item (one per month)
 * Contains ranking distribution metrics for organic keywords
 */
export const historicalRankItemSchema = z.object({
  se_type: z.string().optional(),
  year: z.number(),
  month: z.number(),
  metrics: z.object({
    organic: rankingDistributionSchema.nullable(),
    paid: rankingDistributionSchema.nullable().optional(),
    featured_snippet: rankingDistributionSchema.nullable().optional(),
    local_pack: rankingDistributionSchema.nullable().optional(),
  }),
})

/**
 * Historical rank overview result
 * Returns 6 months of ranking distribution data for a domain
 */
export const historicalRankOverviewResultSchema = z.object({
  target: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  items: z.array(historicalRankItemSchema),
})

// ============================================================================
// Type Exports
// ============================================================================

// Use z.input for input types so that fields with defaults are optional for callers
export type DomainRankOverviewInput = z.input<typeof domainRankOverviewInputSchema>
export type RankedKeywordsInput = z.input<typeof rankedKeywordsInputSchema>
export type CompetitorsDomainInput = z.input<typeof competitorsDomainInputSchema>
export type BulkKeywordDifficultyInput = z.input<typeof bulkKeywordDifficultyInputSchema>
export type SearchIntentInput = z.input<typeof searchIntentInputSchema>
export type BulkTrafficEstimationInput = z.input<typeof bulkTrafficEstimationInputSchema>
export type KeywordSuggestionsInput = z.input<typeof keywordSuggestionsInputSchema>
export type HistoricalKeywordDataInput = z.input<typeof historicalKeywordDataInputSchema>
export type RankingDistribution = z.infer<typeof rankingDistributionSchema>
export type DomainRankOverviewResult = z.infer<typeof domainRankOverviewResultSchema>
export type RankedKeywordItem = z.infer<typeof rankedKeywordItemSchema>
export type CompetitorDomainItem = z.infer<typeof competitorDomainItemSchema>
export type KeywordDifficultyResult = z.infer<typeof keywordDifficultyResultSchema>
export type SearchIntentItem = z.infer<typeof searchIntentItemSchema>
export type TrafficEstimationResult = z.infer<typeof trafficEstimationResultSchema>
export type KeywordSuggestionItem = z.infer<typeof keywordSuggestionItemSchema>
export type HistoricalKeywordInfo = z.infer<typeof historicalKeywordInfoSchema>
export type HistoricalKeywordMonth = z.infer<typeof historicalKeywordMonthSchema>
export type HistoricalKeywordDataItem = z.infer<typeof historicalKeywordDataItemSchema>
export type HistoricalRankOverviewInput = z.input<typeof historicalRankOverviewInputSchema>
export type HistoricalRankItem = z.infer<typeof historicalRankItemSchema>
export type HistoricalRankOverviewResult = z.infer<typeof historicalRankOverviewResultSchema>
