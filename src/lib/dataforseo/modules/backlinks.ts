/**
 * Backlinks API Module
 *
 * Backlink profile analysis - domain authority, referring domains, spam scores.
 * Important for dental practice competitive analysis.
 */

import {
  BacklinksSummaryLiveRequestInfo,
  BacklinksBacklinksLiveRequestInfo,
  BacklinksAnchorsLiveRequestInfo,
  BacklinksReferringDomainsLiveRequestInfo,
  BacklinksCompetitorsLiveRequestInfo,
  BacklinksBulkSpamScoreLiveRequestInfo,
} from 'dataforseo-client'

import { BaseModule, type ExecuteOptions } from './base-module'
import { CacheKeys, CacheTTL } from '../cache'
import {
  backlinksSummaryInputSchema,
  backlinksListInputSchema,
  anchorsInputSchema,
  referringDomainsInputSchema,
  competitorsInputSchema,
  bulkSpamScoreInputSchema,
  type BacklinksSummaryInput,
  type BacklinksListInput,
  type AnchorsInput,
  type ReferringDomainsInput,
  type CompetitorsInput,
  type BulkSpamScoreInput,
  type BacklinksSummaryResult,
  type BacklinkItem,
  type AnchorResult,
  type ReferringDomainResult,
  type CompetitorResult,
  type SpamScoreResult,
} from '../schemas'

/**
 * Backlinks API module for link profile analysis
 */
export class BacklinksModule extends BaseModule {
  /**
   * Get backlinks summary for a domain/URL
   * Returns comprehensive overview of the backlink profile
   *
   * @param input - Target domain/URL and options
   * @param options - Execution options (caching, rate limiting)
   * @returns Backlinks summary or null
   *
   * @example
   * ```ts
   * const summary = await backlinks.getSummary({
   *   target: 'dentist-example.com',
   *   includeSubdomains: true,
   * });
   * console.log(`Referring domains: ${summary?.referring_domains}`);
   * console.log(`Backlinks: ${summary?.backlinks}`);
   * ```
   */
  async getSummary(
    input: BacklinksSummaryInput,
    options?: ExecuteOptions
  ): Promise<BacklinksSummaryResult | null> {
    const validated = this.validateInput(backlinksSummaryInputSchema, input)

    const cacheKey = CacheKeys.backlinks.summary(validated.target)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksSummaryLiveRequestInfo()
        request.target = validated.target
        request.include_subdomains = validated.includeSubdomains
        request.exclude_internal_backlinks = validated.excludeInternalBacklinks

        return this.client.backlinks.summaryLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]) return null
    return task.result[0] as unknown as BacklinksSummaryResult
  }

  /**
   * Get list of backlinks pointing to a target
   * Returns detailed backlink data with filtering options
   *
   * @param input - Target and filter options
   * @param options - Execution options
   * @returns Array of backlink items
   *
   * @example
   * ```ts
   * const backlinks = await backlinks.getBacklinks({
   *   target: 'dentist-example.com',
   *   backlinkType: 'live',
   *   onlyDofollow: true,
   *   limit: 100,
   * });
   * for (const link of backlinks) {
   *   console.log(`${link.domain_from} -> ${link.anchor}`);
   * }
   * ```
   */
  async getBacklinks(input: BacklinksListInput, options?: ExecuteOptions): Promise<BacklinkItem[]> {
    const validated = this.validateInput(backlinksListInputSchema, input)

    const cacheKey = CacheKeys.backlinks.list(validated.target, validated.limit ?? 100)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksBacklinksLiveRequestInfo()
        request.target = validated.target
        request.include_subdomains = validated.includeSubdomains
        request.limit = validated.limit
        request.offset = validated.offset

        // Apply filters
        const filters: string[][] = []

        if (validated.onlyDofollow) {
          filters.push(['dofollow', '=', 'true'])
        }

        if (validated.minRank !== undefined) {
          filters.push(['rank', '>=', String(validated.minRank)])
        }

        if (validated.backlinkType === 'new') {
          filters.push(['is_new', '=', 'true'])
        } else if (validated.backlinkType === 'lost') {
          filters.push(['is_lost', '=', 'true'])
        }

        if (filters.length > 0) {
          request.filters = filters as unknown as string[]
        }

        // Set order
        if (validated.orderBy) {
          const [field, direction] = validated.orderBy.split('_')
          request.order_by = [`${field},${direction}`]
        }

        return this.client.backlinks.backlinksLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as BacklinkItem[]
  }

  /**
   * Get anchor text distribution for a target
   * Shows most common anchor texts used in backlinks
   *
   * @param input - Target and pagination options
   * @param options - Execution options
   * @returns Array of anchor text results
   *
   * @example
   * ```ts
   * const anchors = await backlinks.getAnchors({
   *   target: 'dentist-example.com',
   *   limit: 50,
   * });
   * for (const anchor of anchors) {
   *   console.log(`"${anchor.anchor}": ${anchor.backlinks} links`);
   * }
   * ```
   */
  async getAnchors(input: AnchorsInput, options?: ExecuteOptions): Promise<AnchorResult[]> {
    const validated = this.validateInput(anchorsInputSchema, input)

    const cacheKey = CacheKeys.backlinks.anchors(validated.target)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksAnchorsLiveRequestInfo()
        request.target = validated.target
        request.include_subdomains = validated.includeSubdomains
        request.limit = validated.limit
        request.offset = validated.offset

        return this.client.backlinks.anchorsLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as AnchorResult[]
  }

  /**
   * Get referring domains for a target
   * Lists all domains linking to the target
   *
   * @param input - Target and filter options
   * @param options - Execution options
   * @returns Array of referring domain results
   *
   * @example
   * ```ts
   * const domains = await backlinks.getReferringDomains({
   *   target: 'dentist-example.com',
   *   orderBy: 'rank_desc',
   *   limit: 100,
   * });
   * console.log(`Top referring domain: ${domains[0]?.domain}`);
   * ```
   */
  async getReferringDomains(
    input: ReferringDomainsInput,
    options?: ExecuteOptions
  ): Promise<ReferringDomainResult[]> {
    const validated = this.validateInput(referringDomainsInputSchema, input)

    const cacheKey = CacheKeys.backlinks.referringDomains(validated.target)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksReferringDomainsLiveRequestInfo()
        request.target = validated.target
        request.include_subdomains = validated.includeSubdomains
        request.limit = validated.limit
        request.offset = validated.offset

        // Set order
        if (validated.orderBy) {
          const [field, direction] = validated.orderBy.split('_')
          request.order_by = [`${field},${direction}`]
        }

        return this.client.backlinks.referringDomainsLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as ReferringDomainResult[]
  }

  /**
   * Get backlink competitors for a domain
   * Finds domains with similar backlink profiles
   *
   * @param input - Target and filter options
   * @param options - Execution options
   * @returns Array of competitor results
   *
   * @example
   * ```ts
   * const competitors = await backlinks.getCompetitors({
   *   target: 'dentist-example.com',
   *   excludeLargeDomains: true,
   *   limit: 20,
   * });
   * for (const comp of competitors) {
   *   console.log(`${comp.target}: ${comp.intersections} shared referring domains`);
   * }
   * ```
   */
  async getCompetitors(
    input: CompetitorsInput,
    options?: ExecuteOptions
  ): Promise<CompetitorResult[]> {
    const validated = this.validateInput(competitorsInputSchema, input)

    const cacheKey = CacheKeys.backlinks.competitors(validated.target)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksCompetitorsLiveRequestInfo()
        request.target = validated.target
        request.exclude_large_domains = validated.excludeLargeDomains
        request.main_domain = validated.mainDomainOnly
        request.limit = validated.limit
        request.offset = validated.offset

        return this.client.backlinks.competitorsLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result?.[0]?.items) return []
    return task.result[0].items as unknown as CompetitorResult[]
  }

  /**
   * Get bulk spam scores for multiple targets
   * Efficient way to check spam scores for many domains at once
   *
   * @param input - Array of targets (up to 1000)
   * @param options - Execution options
   * @returns Array of spam score results
   *
   * @example
   * ```ts
   * const scores = await backlinks.getBulkSpamScore({
   *   targets: ['dentist1.com', 'dentist2.com', 'dentist3.com'],
   * });
   * for (const score of scores) {
   *   console.log(`${score.target}: spam score ${score.spam_score}`);
   * }
   * ```
   */
  async getBulkSpamScore(
    input: BulkSpamScoreInput,
    options?: ExecuteOptions
  ): Promise<SpamScoreResult[]> {
    const validated = this.validateInput(bulkSpamScoreInputSchema, input)

    const cacheKey = CacheKeys.backlinks.spamScore(validated.targets)

    const response = await this.executeWithCache(
      cacheKey,
      async () => {
        const request = new BacklinksBulkSpamScoreLiveRequestInfo()
        request.targets = validated.targets

        return this.client.backlinks.bulkSpamScoreLive([request])
      },
      {
        ...options,
        cache: { ttl: CacheTTL.BACKLINKS, ...options?.cache },
      }
    )

    const task = response?.tasks?.[0]
    if (!task?.result) return []
    return task.result as unknown as SpamScoreResult[]
  }

  /**
   * Calculate domain authority score from backlinks summary
   * Custom weighted score based on key metrics
   *
   * @param summary - Backlinks summary result
   * @returns Score from 0-100
   */
  calculateAuthorityScore(summary: BacklinksSummaryResult): number {
    if (!summary) return 0

    let score = 0

    // Domain rank is the primary metric (0-1000 scale from DataForSEO)
    // Normalize to 0-40 range (40% weight)
    const rankScore = Math.min(summary.rank / 1000, 1) * 40
    score += rankScore

    // Referring domains count (30% weight)
    // Log scale: 100 domains = 15, 1000 = 22.5, 10000 = 30
    const rdScore = Math.min((Math.log10(Math.max(summary.referring_domains, 1)) / 4) * 30, 30)
    score += rdScore

    // Backlinks count (15% weight)
    // Log scale
    const blScore = Math.min((Math.log10(Math.max(summary.backlinks, 1)) / 6) * 15, 15)
    score += blScore

    // Referring IPs diversity (10% weight)
    const ipCount = summary.referring_ips ?? 0
    const ipScore = Math.min((Math.log10(Math.max(ipCount, 1)) / 4) * 10, 10)
    score += ipScore

    // Spam score penalty (5% weight, inverted)
    const spamScore = summary.backlinks_spam_score ?? 0
    const spamPenalty = ((100 - spamScore) / 100) * 5
    score += spamPenalty

    return Math.round(score)
  }

  /**
   * Get link quality assessment
   * Analyzes backlink profile for quality indicators
   *
   * @param target - Domain to analyze
   * @returns Quality assessment object
   *
   * @example
   * ```ts
   * const quality = await backlinks.assessLinkQuality('dentist-example.com');
   * console.log(quality);
   * // {
   * //   overallScore: 72,
   * //   referringDomains: 150,
   * //   dofollowRatio: 0.65,
   * //   spamRisk: 'low',
   * //   topIssues: ['Low referring domain count']
   * // }
   * ```
   */
  async assessLinkQuality(
    target: string,
    options?: ExecuteOptions
  ): Promise<{
    overallScore: number
    referringDomains: number
    dofollowRatio: number
    spamRisk: 'low' | 'medium' | 'high'
    topIssues: string[]
  }> {
    const summary = await this.getSummary({ target }, options)

    if (!summary) {
      return {
        overallScore: 0,
        referringDomains: 0,
        dofollowRatio: 0,
        spamRisk: 'high',
        topIssues: ['Unable to retrieve backlink data'],
      }
    }

    const issues: string[] = []

    // Calculate dofollow ratio
    const nofollowDomains = summary.referring_domains_nofollow ?? 0
    const totalDomains = summary.referring_domains
    const dofollowDomains = totalDomains - nofollowDomains
    const dofollowRatio = totalDomains > 0 ? dofollowDomains / totalDomains : 0

    // Assess spam risk
    const spamScore = summary.backlinks_spam_score ?? 0
    let spamRisk: 'low' | 'medium' | 'high' = 'low'
    if (spamScore >= 60) {
      spamRisk = 'high'
      issues.push('High spam score indicates potential toxic backlinks')
    } else if (spamScore >= 30) {
      spamRisk = 'medium'
      issues.push('Moderate spam score - review backlink sources')
    }

    // Check for common issues
    if (totalDomains < 50) {
      issues.push('Low referring domain count')
    }

    if (dofollowRatio < 0.5) {
      issues.push('High proportion of nofollow links')
    }

    const brokenBacklinks = summary.broken_backlinks ?? 0
    if (brokenBacklinks > summary.backlinks * 0.1) {
      issues.push('Significant number of broken backlinks')
    }

    const overallScore = this.calculateAuthorityScore(summary)

    return {
      overallScore,
      referringDomains: totalDomains,
      dofollowRatio: Math.round(dofollowRatio * 100) / 100,
      spamRisk,
      topIssues: issues.slice(0, 5),
    }
  }
}
