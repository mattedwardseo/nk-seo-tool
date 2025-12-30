/**
 * Backlinks API Schemas
 *
 * Validation schemas for DataForSEO Backlinks API requests and responses.
 */

import { z } from 'zod'
import { domainSchema, urlSchema, paginationSchema } from './common'

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Target for backlinks analysis - can be domain, subdomain, or URL
 */
export const targetSchema = z.union([
  domainSchema,
  urlSchema,
  z.string().min(1).max(253), // Allow subdomains
])

/**
 * Backlinks summary input
 */
export const backlinksSummaryInputSchema = z.object({
  target: targetSchema,
  /** Include subdomains in analysis */
  includeSubdomains: z.boolean().default(true),
  /** Exclude internal backlinks */
  excludeInternalBacklinks: z.boolean().default(true),
})

/**
 * Get backlinks list input
 */
export const backlinksListInputSchema = z.object({
  target: targetSchema,
  /** Include subdomains */
  includeSubdomains: z.boolean().default(true),
  /** Backlink type filter */
  backlinkType: z.enum(['all', 'live', 'lost', 'new']).default('live'),
  /** Minimum domain rank filter */
  minRank: z.number().int().min(0).max(1000).optional(),
  /** Only dofollow links */
  onlyDofollow: z.boolean().default(false),
  /** Sort order */
  orderBy: z
    .enum(['rank_desc', 'rank_asc', 'date_first_seen_desc', 'date_first_seen_asc'])
    .default('rank_desc'),
  ...paginationSchema.shape,
})

/**
 * Get anchors input
 */
export const anchorsInputSchema = z.object({
  target: targetSchema,
  /** Include subdomains */
  includeSubdomains: z.boolean().default(true),
  ...paginationSchema.shape,
})

/**
 * Get referring domains input
 */
export const referringDomainsInputSchema = z.object({
  target: targetSchema,
  /** Include subdomains */
  includeSubdomains: z.boolean().default(true),
  /** Only dofollow links */
  onlyDofollow: z.boolean().default(false),
  /** Sort order */
  orderBy: z
    .enum(['rank_desc', 'rank_asc', 'backlinks_desc', 'backlinks_asc'])
    .default('rank_desc'),
  ...paginationSchema.shape,
})

/**
 * Get competitors input
 */
export const competitorsInputSchema = z.object({
  target: targetSchema,
  /** Exclude large domains (google, wikipedia, etc) */
  excludeLargeDomains: z.boolean().default(true),
  /** Main domain only (no subdomains) */
  mainDomainOnly: z.boolean().default(true),
  ...paginationSchema.shape,
})

/**
 * Bulk spam score input
 */
export const bulkSpamScoreInputSchema = z.object({
  targets: z.array(targetSchema).min(1).max(1000),
})

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Backlinks summary result
 */
export const backlinksSummaryResultSchema = z.object({
  target: z.string(),
  first_seen: z.string().nullable(),
  rank: z.number(),
  backlinks: z.number(),
  backlinks_spam_score: z.number().nullable(),
  crawled_pages: z.number().nullable(),
  info: z
    .object({
      server: z.string().nullable(),
      ip_address: z.string().nullable(),
      country: z.string().nullable(),
      target_spam_score: z.number().nullable(),
    })
    .nullable(),
  internal_links_count: z.number().nullable(),
  external_links_count: z.number().nullable(),
  broken_backlinks: z.number().nullable(),
  broken_pages: z.number().nullable(),
  referring_domains: z.number(),
  referring_domains_nofollow: z.number().nullable(),
  referring_main_domains: z.number().nullable(),
  referring_main_domains_nofollow: z.number().nullable(),
  referring_ips: z.number().nullable(),
  referring_subnets: z.number().nullable(),
  referring_pages: z.number().nullable(),
  referring_pages_nofollow: z.number().nullable(),
  referring_links_tld: z.record(z.string(), z.number()).nullable(),
  referring_links_types: z.record(z.string(), z.number()).nullable(),
  referring_links_attributes: z.record(z.string(), z.number()).nullable(),
  referring_links_platform_types: z.record(z.string(), z.number()).nullable(),
  referring_links_semantic_locations: z.record(z.string(), z.number()).nullable(),
  referring_links_countries: z.record(z.string(), z.number()).nullable(),
})

/**
 * Single backlink item
 */
export const backlinkItemSchema = z.object({
  type: z.string(),
  domain_from: z.string(),
  url_from: z.string(),
  url_from_https: z.boolean().nullable(),
  domain_to: z.string(),
  url_to: z.string(),
  url_to_https: z.boolean().nullable(),
  tld_from: z.string().nullable(),
  is_new: z.boolean().nullable(),
  is_lost: z.boolean().nullable(),
  backlink_spam_score: z.number().nullable(),
  rank: z.number().nullable(),
  page_from_rank: z.number().nullable(),
  domain_from_rank: z.number().nullable(),
  domain_from_platform_type: z.array(z.string()).nullable(),
  domain_from_is_ip: z.boolean().nullable(),
  domain_from_country: z.string().nullable(),
  page_from_external_links: z.number().nullable(),
  page_from_internal_links: z.number().nullable(),
  page_from_size: z.number().nullable(),
  page_from_encoding: z.string().nullable(),
  page_from_language: z.string().nullable(),
  page_from_title: z.string().nullable(),
  page_from_status_code: z.number().nullable(),
  first_seen: z.string().nullable(),
  prev_seen: z.string().nullable(),
  last_seen: z.string().nullable(),
  item_type: z.string().nullable(),
  attributes: z.array(z.string()).nullable(),
  dofollow: z.boolean(),
  original: z.boolean().nullable(),
  alt: z.string().nullable(),
  image_url: z.string().nullable(),
  anchor: z.string().nullable(),
  text_pre: z.string().nullable(),
  text_post: z.string().nullable(),
  semantic_location: z.string().nullable(),
})

/**
 * Anchor text result
 */
export const anchorResultSchema = z.object({
  anchor: z.string().nullable(),
  backlinks: z.number(),
  first_seen: z.string().nullable(),
  last_seen: z.string().nullable(),
  rank: z.number().nullable(),
  referring_domains: z.number().nullable(),
  referring_main_domains: z.number().nullable(),
  referring_pages: z.number().nullable(),
})

/**
 * Referring domain result
 */
export const referringDomainResultSchema = z.object({
  type: z.string(),
  domain: z.string(),
  rank: z.number(),
  backlinks: z.number(),
  first_seen: z.string().nullable(),
  last_seen: z.string().nullable(),
  backlinks_spam_score: z.number().nullable(),
  broken_backlinks: z.number().nullable(),
  broken_pages: z.number().nullable(),
  referring_domains: z.number().nullable(),
  referring_domains_nofollow: z.number().nullable(),
  referring_pages: z.number().nullable(),
  referring_pages_nofollow: z.number().nullable(),
})

/**
 * Competitor result
 */
export const competitorResultSchema = z.object({
  type: z.string(),
  target: z.string(),
  rank: z.number(),
  intersections: z.number(),
})

/**
 * Spam score result
 */
export const spamScoreResultSchema = z.object({
  target: z.string(),
  spam_score: z.number().nullable(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type Target = z.infer<typeof targetSchema>
// Use z.input for input types so that fields with defaults are optional for callers
export type BacklinksSummaryInput = z.input<typeof backlinksSummaryInputSchema>
export type BacklinksListInput = z.input<typeof backlinksListInputSchema>
export type AnchorsInput = z.input<typeof anchorsInputSchema>
export type ReferringDomainsInput = z.input<typeof referringDomainsInputSchema>
export type CompetitorsInput = z.input<typeof competitorsInputSchema>
export type BulkSpamScoreInput = z.input<typeof bulkSpamScoreInputSchema>
export type BacklinksSummaryResult = z.infer<typeof backlinksSummaryResultSchema>
export type BacklinkItem = z.infer<typeof backlinkItemSchema>
export type AnchorResult = z.infer<typeof anchorResultSchema>
export type ReferringDomainResult = z.infer<typeof referringDomainResultSchema>
export type CompetitorResult = z.infer<typeof competitorResultSchema>
export type SpamScoreResult = z.infer<typeof spamScoreResultSchema>
