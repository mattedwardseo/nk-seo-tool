/**
 * Common Zod Schemas
 *
 * Shared validation schemas used across all DataForSEO API modules.
 */

import { z } from 'zod'

// ============================================================================
// Base Input Schemas
// ============================================================================

/**
 * Domain validation - no protocol, no www
 * Examples: "example.com", "subdomain.example.com"
 */
export const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .max(253, 'Domain too long')
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/,
    'Invalid domain format'
  )
  .transform((d) => d.toLowerCase())

/**
 * URL validation - full URL with protocol
 */
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .url('Invalid URL format')
  .max(2048, 'URL too long')

/**
 * Keyword validation
 */
export const keywordSchema = z
  .string()
  .min(1, 'Keyword is required')
  .max(100, 'Keyword too long (max 100 characters)')
  .transform((k) => k.trim())

/**
 * Array of keywords (1-1000)
 */
export const keywordsArraySchema = z
  .array(keywordSchema)
  .min(1, 'At least one keyword required')
  .max(1000, 'Maximum 1000 keywords allowed')

/**
 * Location code (DataForSEO location ID)
 */
export const locationCodeSchema = z.number().int().positive('Location code must be positive')

/**
 * Location name (e.g., "United States", "New York,New York,United States")
 */
export const locationNameSchema = z
  .string()
  .min(1, 'Location name is required')
  .max(100, 'Location name too long')

/**
 * Language code (e.g., "en", "es", "de")
 */
export const languageCodeSchema = z
  .string()
  .min(2, 'Invalid language code')
  .max(10, 'Invalid language code')
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code format')

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
})

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
})

// ============================================================================
// Common Response Schemas
// ============================================================================

/**
 * Base DataForSEO API response wrapper
 */
export const baseResponseSchema = z.object({
  version: z.string().optional(),
  status_code: z.number(),
  status_message: z.string(),
  time: z.string(),
  cost: z.number(),
  tasks_count: z.number(),
  tasks_error: z.number(),
})

/**
 * Base task result schema
 */
export const baseTaskSchema = z.object({
  id: z.string(),
  status_code: z.number(),
  status_message: z.string(),
  time: z.string(),
  cost: z.number(),
  result_count: z.number(),
  path: z.array(z.string()),
  data: z.record(z.string(), z.unknown()).optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type Domain = z.infer<typeof domainSchema>
export type Url = z.infer<typeof urlSchema>
export type Keyword = z.infer<typeof keywordSchema>
export type KeywordsArray = z.infer<typeof keywordsArraySchema>
export type LocationCode = z.infer<typeof locationCodeSchema>
export type LocationName = z.infer<typeof locationNameSchema>
export type LanguageCode = z.infer<typeof languageCodeSchema>
export type Pagination = z.infer<typeof paginationSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
