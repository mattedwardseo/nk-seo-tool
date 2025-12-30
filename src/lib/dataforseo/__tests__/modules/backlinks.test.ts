/**
 * Backlinks Module Tests
 *
 * Tests for the Backlinks API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  BacklinksApi: vi.fn(),
  BacklinksSummaryLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BacklinksBacklinksLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BacklinksAnchorsLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BacklinksReferringDomainsLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BacklinksCompetitorsLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BacklinksBulkSpamScoreLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { BacklinksModule } from '../../modules/backlinks'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockBacklinksSummary,
  mockBacklinkItem,
  mockAnchorResult,
  mockReferringDomainResult,
  mockCompetitorResult,
  mockSpamScoreResult,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('BacklinksModule', () => {
  let module: BacklinksModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new BacklinksModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // getSummary Tests
  // ===========================================================================
  describe('getSummary', () => {
    it('returns backlinks summary for valid domain', async () => {
      const response = createSuccessResponse([mockBacklinksSummary])
      mockClient.backlinks.summaryLive.mockResolvedValue(response)

      const result = await module.getSummary({ target: 'example.com' })

      expect(result).toBeDefined()
      expect(result?.target).toBe('example.com')
      expect(result?.backlinks).toBe(15420)
      expect(mockClient.backlinks.summaryLive).toHaveBeenCalledTimes(1)
    })

    it('returns null when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.backlinks.summaryLive.mockResolvedValue(response)

      const result = await module.getSummary({ target: 'unknown.com' })

      expect(result).toBeNull()
    })

    it('handles invalid domain gracefully', async () => {
      // The schema is lenient - this tests actual API behavior
      const response = createSuccessResponse([])
      mockClient.backlinks.summaryLive.mockResolvedValue(response)

      const result = await module.getSummary({ target: 'invalid-domain' })
      expect(result).toBeNull()
    })

    it('handles internal backlinks filter', async () => {
      const response = createSuccessResponse([mockBacklinksSummary])
      mockClient.backlinks.summaryLive.mockResolvedValue(response)

      await module.getSummary({
        target: 'example.com',
        includeSubdomains: true,
        excludeInternalBacklinks: false,
      })

      expect(mockClient.backlinks.summaryLive).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // getBacklinks Tests
  // ===========================================================================
  describe('getBacklinks', () => {
    it('returns backlinks for valid domain', async () => {
      const response = createSuccessResponse([{ items: [mockBacklinkItem] }])
      mockClient.backlinks.backlinksLive.mockResolvedValue(response)

      const results = await module.getBacklinks({ target: 'example.com' })

      expect(results).toHaveLength(1)
      expect(results[0].domain_from).toBe('referrer.com')
      expect(mockClient.backlinks.backlinksLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no backlinks', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.backlinks.backlinksLive.mockResolvedValue(response)

      const results = await module.getBacklinks({ target: 'new-site.com' })

      expect(results).toEqual([])
    })

    it('handles pagination options', async () => {
      const response = createSuccessResponse([{ items: [mockBacklinkItem] }])
      mockClient.backlinks.backlinksLive.mockResolvedValue(response)

      await module.getBacklinks({
        target: 'example.com',
        limit: 50,
        offset: 100,
      })

      expect(mockClient.backlinks.backlinksLive).toHaveBeenCalledTimes(1)
    })

    it('handles mode filter', async () => {
      const response = createSuccessResponse([{ items: [mockBacklinkItem] }])
      mockClient.backlinks.backlinksLive.mockResolvedValue(response)

      await module.getBacklinks({
        target: 'example.com',
        mode: 'one_per_domain',
      })

      expect(mockClient.backlinks.backlinksLive).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // getAnchors Tests
  // ===========================================================================
  describe('getAnchors', () => {
    it('returns anchor data for valid domain', async () => {
      const response = createSuccessResponse([{ items: [mockAnchorResult] }])
      mockClient.backlinks.anchorsLive.mockResolvedValue(response)

      const results = await module.getAnchors({ target: 'example.com' })

      expect(results).toHaveLength(1)
      expect(results[0].anchor).toBe('SEO tips')
      expect(mockClient.backlinks.anchorsLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no anchors', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.backlinks.anchorsLive.mockResolvedValue(response)

      const results = await module.getAnchors({ target: 'new-site.com' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getReferringDomains Tests
  // ===========================================================================
  describe('getReferringDomains', () => {
    it('returns referring domains for valid domain', async () => {
      const response = createSuccessResponse([{ items: [mockReferringDomainResult] }])
      mockClient.backlinks.referringDomainsLive.mockResolvedValue(response)

      const results = await module.getReferringDomains({ target: 'example.com' })

      expect(results).toHaveLength(1)
      expect(results[0].domain).toBe('referrer-site.com')
      expect(mockClient.backlinks.referringDomainsLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no referring domains', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.backlinks.referringDomainsLive.mockResolvedValue(response)

      const results = await module.getReferringDomains({ target: 'isolated-site.com' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getCompetitors Tests
  // ===========================================================================
  describe('getCompetitors', () => {
    it('returns competitors for valid domain', async () => {
      const response = createSuccessResponse([{ items: [mockCompetitorResult] }])
      mockClient.backlinks.competitorsLive.mockResolvedValue(response)

      const results = await module.getCompetitors({ target: 'example.com' })

      expect(results).toHaveLength(1)
      expect(results[0].domain).toBe('competitor.com')
      expect(mockClient.backlinks.competitorsLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no competitors', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.backlinks.competitorsLive.mockResolvedValue(response)

      const results = await module.getCompetitors({ target: 'unique-site.com' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getBulkSpamScore Tests
  // ===========================================================================
  describe('getBulkSpamScore', () => {
    it('returns spam scores for multiple domains', async () => {
      const response = createSuccessResponse([mockSpamScoreResult])
      mockClient.backlinks.bulkSpamScoreLive.mockResolvedValue(response)

      const results = await module.getBulkSpamScore({ targets: ['example.com'] })

      expect(results).toHaveLength(1)
      expect(results[0].spam_score).toBe(12)
      expect(mockClient.backlinks.bulkSpamScoreLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.backlinks.bulkSpamScoreLive.mockResolvedValue(response)

      const results = await module.getBulkSpamScore({ targets: ['unknown.com'] })

      expect(results).toEqual([])
    })

    it('handles multiple targets', async () => {
      const response = createSuccessResponse([
        mockSpamScoreResult,
        { ...mockSpamScoreResult, target: 'site2.com' },
      ])
      mockClient.backlinks.bulkSpamScoreLive.mockResolvedValue(response)

      const results = await module.getBulkSpamScore({
        targets: ['example.com', 'site2.com'],
      })

      expect(results).toHaveLength(2)
    })
  })

  // ===========================================================================
  // calculateAuthorityScore Tests
  // ===========================================================================
  describe('calculateAuthorityScore', () => {
    it('returns high score for strong backlink profile', () => {
      const score = module.calculateAuthorityScore(mockBacklinksSummary)

      expect(score).toBeGreaterThan(60)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('returns 0 for null input', () => {
      const score = module.calculateAuthorityScore(null as unknown as typeof mockBacklinksSummary)

      expect(score).toBe(0)
    })

    it('factors in referring domains', () => {
      const weakProfile = {
        ...mockBacklinksSummary,
        referring_domains: 5,
        referring_main_domains: 3,
      }

      const weakScore = module.calculateAuthorityScore(weakProfile)
      const strongScore = module.calculateAuthorityScore(mockBacklinksSummary)

      expect(strongScore).toBeGreaterThan(weakScore)
    })

    it('factors in rank', () => {
      const lowRankProfile = {
        ...mockBacklinksSummary,
        rank: 10,
      }

      const highRankProfile = {
        ...mockBacklinksSummary,
        rank: 900,
      }

      const lowScore = module.calculateAuthorityScore(lowRankProfile)
      const highScore = module.calculateAuthorityScore(highRankProfile)

      expect(highScore).toBeGreaterThan(lowScore)
    })
  })

  // Note: assessLinkQuality method tested separately if available

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new BacklinksModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([mockBacklinksSummary])
      mockClient.backlinks.summaryLive.mockResolvedValue(response)

      const result = await moduleNoCache.getSummary({ target: 'example.com' })

      expect(result).toBeDefined()
    })
  })
})
