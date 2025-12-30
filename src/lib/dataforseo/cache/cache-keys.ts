/**
 * DataForSEO Cache Keys
 *
 * Utility functions for generating consistent cache keys.
 * Uses crypto hash for long strings to keep keys manageable.
 */

import { createHash } from 'crypto'

/**
 * Generate a short hash of a string for cache key usage
 */
function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12)
}

/**
 * TTL values in seconds for different data types
 */
export const CacheTTL = {
  /** SERP/Rankings - 4 hours (changes frequently) */
  SERP: 4 * 60 * 60,
  /** GMB/Reviews - 4 hours */
  GMB: 4 * 60 * 60,
  /** OnPage/Technical - 24 hours (page content stable) */
  ONPAGE: 24 * 60 * 60,
  /** Backlinks - 24 hours */
  BACKLINKS: 24 * 60 * 60,
  /** Search Volume - 24 hours (monthly data) */
  KEYWORDS: 24 * 60 * 60,
  /** Keyword Difficulty - 3 days (rarely changes) */
  KEYWORD_DIFFICULTY: 3 * 24 * 60 * 60,
  /** Reference data - 7 days */
  REFERENCE: 7 * 24 * 60 * 60,
} as const

/**
 * Cache key generators for each API module
 */
export const CacheKeys = {
  // OnPage API
  onpage: {
    instantPage: (url: string): string => `dfs:onpage:instant:${hash(url)}`,
    lighthouse: (url: string): string => `dfs:onpage:lighthouse:${hash(url)}`,
    crawlSummary: (taskId: string): string => `dfs:onpage:crawl:${taskId}`,
    microdata: (taskId: string): string => `dfs:onpage:microdata:${taskId}`,
  },

  // SERP API
  serp: {
    organic: (keyword: string, locationCode: number): string =>
      `dfs:serp:organic:${hash(keyword)}:${locationCode}`,
    maps: (keyword: string, locationCode: number): string =>
      `dfs:serp:maps:${hash(keyword)}:${locationCode}`,
    /** Coordinate-based maps cache key for geo-grid searches */
    mapsCoords: (keyword: string, coordinates: string): string =>
      `dfs:serp:maps:${hash(keyword)}:${hash(coordinates)}`,
    localFinder: (keyword: string, locationCode: number): string =>
      `dfs:serp:local:${hash(keyword)}:${locationCode}`,
    locations: (country: string): string => `dfs:serp:locations:${hash(country)}`,
  },

  // Backlinks API
  backlinks: {
    summary: (target: string): string => `dfs:backlinks:summary:${hash(target)}`,
    list: (target: string, limit: number): string => `dfs:backlinks:list:${hash(target)}:${limit}`,
    anchors: (target: string): string => `dfs:backlinks:anchors:${hash(target)}`,
    referringDomains: (target: string): string => `dfs:backlinks:refdomains:${hash(target)}`,
    competitors: (target: string): string => `dfs:backlinks:competitors:${hash(target)}`,
    spamScore: (targets: string[]): string =>
      `dfs:backlinks:spam:${hash(targets.sort().join(','))}`,
  },

  // Keywords API
  keywords: {
    searchVolume: (keywords: string[], locationCode: number): string =>
      `dfs:keywords:volume:${hash(keywords.sort().join(','))}:${locationCode}`,
    forSite: (domain: string, locationCode: number): string =>
      `dfs:keywords:site:${hash(domain)}:${locationCode}`,
    trends: (keywords: string[]): string =>
      `dfs:keywords:trends:${hash(keywords.sort().join(','))}`,
  },

  // Labs API
  labs: {
    domainRank: (domain: string, locationCode: number): string =>
      `dfs:labs:rank:${hash(domain)}:${locationCode}`,
    rankedKeywords: (domain: string, locationCode: number): string =>
      `dfs:labs:ranked:${hash(domain)}:${locationCode}`,
    competitors: (domain: string, locationCode: number): string =>
      `dfs:labs:competitors:${hash(domain)}:${locationCode}`,
    keywordDifficulty: (keywords: string[], locationCode: number): string =>
      `dfs:labs:kd:${hash(keywords.sort().join(','))}:${locationCode}`,
    searchIntent: (keywords: string[], languageCode: string): string =>
      `dfs:labs:intent:${hash(keywords.sort().join(','))}:${languageCode}`,
    trafficEstimation: (targets: string[], locationCode: number): string =>
      `dfs:labs:traffic:${hash(targets.sort().join(','))}:${locationCode}`,
    historicalKeywords: (keywords: string[], locationCode: number): string =>
      `dfs:labs:historical:${hash(keywords.sort().join(','))}:${locationCode}`,
    historicalRankOverview: (domain: string, locationCode: number): string =>
      `dfs:labs:histrank:${hash(domain)}:${locationCode}`,
  },

  // Business API
  business: {
    info: (keyword: string, locationCode: number): string =>
      `dfs:business:info:${hash(keyword)}:${locationCode}`,
    reviews: (keyword: string, locationCode: number): string =>
      `dfs:business:reviews:${hash(keyword)}:${locationCode}`,
    listings: (query: string): string => `dfs:business:listings:${hash(query)}`,
    /** Google Business Posts/Updates by CID or keyword */
    posts: (keyword: string, locationCode: number): string =>
      `dfs:business:posts:${hash(keyword)}:${locationCode}`,
    /** Google Business Q&A by CID or keyword */
    qa: (keyword: string, locationCode: number): string =>
      `dfs:business:qa:${hash(keyword)}:${locationCode}`,
    /** Reviews task result by task ID */
    reviewsTask: (taskId: string): string => `dfs:business:reviewstask:${taskId}`,
    /** Posts task result by task ID */
    postsTask: (taskId: string): string => `dfs:business:poststask:${taskId}`,
    /** Q&A task result by task ID */
    qaTask: (taskId: string): string => `dfs:business:qatask:${taskId}`,
  },
}

export type CacheKeyModule = keyof typeof CacheKeys
