/**
 * Business Data API Schemas
 *
 * Validation schemas for DataForSEO Business Data API requests and responses.
 */

import { z } from 'zod'
import {
  keywordSchema,
  locationCodeSchema,
  locationNameSchema,
  languageCodeSchema,
  paginationSchema,
} from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Get business info input (Google My Business)
 */
export const businessInfoInputSchema = z.object({
  keyword: keywordSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Device type */
  device: z.enum(['desktop', 'mobile']).default('desktop'),
  /** Operating system */
  os: z.enum(['windows', 'macos', 'android', 'ios']).optional(),
  /** Depth of results */
  depth: z.number().int().min(1).max(700).default(100),
})

/**
 * Get Google reviews input
 */
export const googleReviewsInputSchema = z.object({
  keyword: keywordSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Sort by */
  sortBy: z
    .enum(['most_relevant', 'newest', 'highest_rating', 'lowest_rating'])
    .default('most_relevant'),
  /** Depth of reviews */
  depth: z.number().int().min(1).max(4500).default(100),
})

/**
 * Search business listings input
 */
export const searchListingsInputSchema = z.object({
  /** Business categories to search */
  categories: z.array(z.string()).min(1).max(10).optional(),
  /** Business description keywords */
  description: z.string().max(200).optional(),
  /** Business title/name */
  title: z.string().max(200).optional(),
  /** Location coordinates (latitude,longitude,radius_km) */
  locationCoordinate: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,\d+$/)
    .optional(),
  /** Filter by claimed status */
  isClaimed: z.boolean().optional(),
  /** Minimum rating */
  minRating: z.number().min(1).max(5).optional(),
  /** Maximum rating */
  maxRating: z.number().min(1).max(5).optional(),
  /** Has website */
  hasWebsite: z.boolean().optional(),
  ...paginationSchema.shape,
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Address info
 */
export const addressInfoSchema = z.object({
  city: z.string().nullable(),
  region: z.string().nullable(),
  zip: z.string().nullable(),
  address: z.string().nullable(),
  country_code: z.string().nullable(),
})

/**
 * Rating info
 */
export const ratingInfoSchema = z.object({
  rating_type: z.string().nullable(),
  value: z.number().nullable(),
  votes_count: z.number().nullable(),
  rating_max: z.number().nullable(),
})

/**
 * Work hours
 */
export const workHoursSchema = z.object({
  timetable: z
    .record(
      z.string(),
      z.array(
        z.object({
          open: z
            .object({
              hour: z.number(),
              minute: z.number(),
            })
            .nullable(),
          close: z
            .object({
              hour: z.number(),
              minute: z.number(),
            })
            .nullable(),
        })
      )
    )
    .nullable(),
  current_status: z.string().nullable(),
})

/**
 * Business info result (GMB data)
 */
export const businessInfoResultSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  category_ids: z.array(z.string()).nullable(),
  additional_categories: z.array(z.string()).nullable(),
  url: z.string().nullable(),
  domain: z.string().nullable(),
  address: z.string().nullable(),
  address_info: addressInfoSchema.nullable(),
  place_id: z.string().nullable(),
  phone: z.string().nullable(),
  main_image: z.string().nullable(),
  total_photos: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  is_claimed: z.boolean().nullable(),
  attributes: z
    .object({
      available_attributes: z.record(z.string(), z.array(z.string())).nullable(),
      unavailable_attributes: z.record(z.string(), z.array(z.string())).nullable(),
    })
    .nullable(),
  rating: ratingInfoSchema.nullable(),
  work_hours: workHoursSchema.nullable(),
  popular_times: z
    .object({
      popular_times: z
        .record(
          z.string(),
          z.array(
            z.object({
              hour: z.number(),
              popularity: z.number().nullable(),
            })
          )
        )
        .nullable(),
    })
    .nullable(),
  people_also_search: z
    .array(
      z.object({
        title: z.string().nullable(),
        cid: z.string().nullable(),
      })
    )
    .nullable(),
  cid: z.string().nullable(),
  feature_id: z.string().nullable(),
})

/**
 * Review item
 */
export const reviewItemSchema = z.object({
  type: z.string(),
  review_id: z.string().nullable(),
  rating: ratingInfoSchema.nullable(),
  timestamp: z.string().nullable(),
  review_text: z.string().nullable(),
  original_review_text: z.string().nullable(),
  review_url: z.string().nullable(),
  review_images: z
    .array(
      z.object({
        type: z.string().nullable(),
        url: z.string().nullable(),
      })
    )
    .nullable(),
  owner_answer: z.string().nullable(),
  owner_timestamp: z.string().nullable(),
  profile_name: z.string().nullable(),
  profile_url: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  reviews_count: z.number().nullable(),
  location: z.string().nullable(),
})

/**
 * Business listing item
 */
export const businessListingItemSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  address: z.string().nullable(),
  address_info: addressInfoSchema.nullable(),
  place_id: z.string().nullable(),
  phone: z.string().nullable(),
  url: z.string().nullable(),
  domain: z.string().nullable(),
  main_image: z.string().nullable(),
  total_photos: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  is_claimed: z.boolean().nullable(),
  rating: ratingInfoSchema.nullable(),
  cid: z.string().nullable(),
})

// ============================================================================
// Type Exports
// ============================================================================

// ============================================================================
// Task-Based API Input Schemas (Posts, Q&A, Reviews)
// ============================================================================

/**
 * Base task input with keyword/cid and location
 */
const taskBaseInputSchema = z.object({
  /** Business search keyword OR cid:XXXX OR place_id:XXXX */
  keyword: keywordSchema,
  locationCode: locationCodeSchema.optional(),
  locationName: locationNameSchema.optional(),
  locationCoordinate: z.string().optional(),
  languageCode: languageCodeSchema.default('en'),
  /** Priority: 1 = normal, 2 = high (extra cost) */
  priority: z.enum(['1', '2']).optional(),
  /** Custom tag for identification */
  tag: z.string().max(255).optional(),
})

/**
 * Google My Business Updates (Posts) task input
 */
export const businessPostsTaskInputSchema = taskBaseInputSchema.extend({
  /** Number of posts to retrieve (multiples of 10, max 4490) */
  depth: z.number().int().min(10).max(4490).default(10),
})

/**
 * Google Questions & Answers task input
 */
export const businessQATaskInputSchema = taskBaseInputSchema.extend({
  /** Number of questions to retrieve (multiples of 20, max 700) */
  depth: z.number().int().min(20).max(700).default(20),
})

/**
 * Google Reviews task input
 */
export const businessReviewsTaskInputSchema = taskBaseInputSchema.extend({
  /** Number of reviews to retrieve (multiples of 10, max 4490) */
  depth: z.number().int().min(10).max(4490).default(20),
  /** Sort order */
  sortBy: z
    .enum(['relevant', 'newest', 'highest_rating', 'lowest_rating'])
    .default('newest'),
})

// ============================================================================
// Task-Based API Output Schemas
// ============================================================================

/**
 * Task ready result
 */
export const businessTaskReadySchema = z.object({
  id: z.string(),
  tag: z.string().nullable(),
})

/**
 * Google Business Post item
 */
export const businessPostItemSchema = z.object({
  type: z.string().default('google_business_post'),
  rank_group: z.number().nullable(),
  rank_absolute: z.number().nullable(),
  position: z.string().nullable(),
  author: z.string().nullable(),
  snippet: z.string().nullable(),
  post_text: z.string().nullable(),
  url: z.string().nullable(),
  images_url: z.string().nullable(),
  post_date: z.string().nullable(),
  timestamp: z.string().nullable(),
  links: z
    .array(
      z.object({
        type: z.string().nullable(),
        title: z.string().nullable(),
        url: z.string().nullable(),
      })
    )
    .nullable(),
})

/**
 * Google Q&A Answer element
 */
export const businessAnswerElementSchema = z.object({
  type: z.string().default('google_business_answer_element'),
  answer_id: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  profile_url: z.string().nullable(),
  profile_name: z.string().nullable(),
  answer_text: z.string().nullable(),
  original_answer_text: z.string().nullable(),
  time_ago: z.string().nullable(),
  timestamp: z.string().nullable(),
})

/**
 * Google Q&A Question item
 */
export const businessQuestionItemSchema = z.object({
  type: z.string().default('google_business_question_item'),
  rank_group: z.number().nullable(),
  rank_absolute: z.number().nullable(),
  question_id: z.string().nullable(),
  url: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  profile_url: z.string().nullable(),
  profile_name: z.string().nullable(),
  question_text: z.string().nullable(),
  original_question_text: z.string().nullable(),
  time_ago: z.string().nullable(),
  timestamp: z.string().nullable(),
  items: z.array(businessAnswerElementSchema).nullable(),
})

/**
 * Posts result wrapper
 */
export const businessPostsResultSchema = z.object({
  keyword: z.string().nullable(),
  cid: z.string().nullable(),
  feature_id: z.string().nullable(),
  se_domain: z.string().nullable(),
  location_code: z.number().nullable(),
  language_code: z.string().nullable(),
  check_url: z.string().nullable(),
  datetime: z.string().nullable(),
  items_count: z.number().nullable(),
  items: z.array(businessPostItemSchema).nullable(),
})

/**
 * Q&A result wrapper
 */
export const businessQAResultSchema = z.object({
  keyword: z.string().nullable(),
  cid: z.string().nullable(),
  feature_id: z.string().nullable(),
  se_domain: z.string().nullable(),
  location_code: z.number().nullable(),
  language_code: z.string().nullable(),
  check_url: z.string().nullable(),
  datetime: z.string().nullable(),
  items_count: z.number().nullable(),
  items: z.array(businessQuestionItemSchema).nullable(),
  items_without_answers: z.array(businessQuestionItemSchema).nullable(),
})

/**
 * Reviews result wrapper
 */
export const businessReviewsResultSchema = z.object({
  keyword: z.string().nullable(),
  se_domain: z.string().nullable(),
  location_code: z.number().nullable(),
  language_code: z.string().nullable(),
  check_url: z.string().nullable(),
  datetime: z.string().nullable(),
  title: z.string().nullable(),
  sub_title: z.string().nullable(),
  rating: ratingInfoSchema.nullable(),
  feature_id: z.string().nullable(),
  place_id: z.string().nullable(),
  cid: z.string().nullable(),
  reviews_count: z.number().nullable(),
  items_count: z.number().nullable(),
  items: z.array(reviewItemSchema).nullable(),
})

// ============================================================================
// Type Exports
// ============================================================================

// Use z.input for input types so that fields with defaults are optional for callers
export type BusinessInfoInput = z.input<typeof businessInfoInputSchema>
export type GoogleReviewsInput = z.input<typeof googleReviewsInputSchema>
export type SearchListingsInput = z.input<typeof searchListingsInputSchema>
export type AddressInfo = z.infer<typeof addressInfoSchema>
export type RatingInfo = z.infer<typeof ratingInfoSchema>
export type WorkHours = z.infer<typeof workHoursSchema>
export type BusinessInfoResult = z.infer<typeof businessInfoResultSchema>
export type ReviewItem = z.infer<typeof reviewItemSchema>
export type BusinessListingItem = z.infer<typeof businessListingItemSchema>

// Task-based API types
export type BusinessPostsTaskInput = z.input<typeof businessPostsTaskInputSchema>
export type BusinessQATaskInput = z.input<typeof businessQATaskInputSchema>
export type BusinessReviewsTaskInput = z.input<typeof businessReviewsTaskInputSchema>
export type BusinessTaskReady = z.infer<typeof businessTaskReadySchema>
export type BusinessPostItem = z.infer<typeof businessPostItemSchema>
export type BusinessAnswerElement = z.infer<typeof businessAnswerElementSchema>
export type BusinessQuestionItem = z.infer<typeof businessQuestionItemSchema>
export type BusinessPostsResult = z.infer<typeof businessPostsResultSchema>
export type BusinessQAResult = z.infer<typeof businessQAResultSchema>
export type BusinessReviewsResult = z.infer<typeof businessReviewsResultSchema>
