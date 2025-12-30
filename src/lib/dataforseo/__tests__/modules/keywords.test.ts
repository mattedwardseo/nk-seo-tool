/**
 * Keywords Module Tests
 *
 * Tests for the Keywords Data API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  KeywordsDataApi: vi.fn(),
  DataforseoLabsApi: vi.fn(),
  KeywordsDataGoogleAdsSearchVolumeLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  KeywordsDataGoogleAdsKeywordsForSiteLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  KeywordsDataGoogleTrendsExploreLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { KeywordsModule } from '../../modules/keywords'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockKeywordInfo,
  mockKeywordInfoLowVolume,
  mockKeywordsForSiteResults,
  mockKeywordsTrendsResult,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('KeywordsModule', () => {
  let module: KeywordsModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new KeywordsModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // getSearchVolume Tests
  // ===========================================================================
  describe('getSearchVolume', () => {
    it('returns search volume data for keywords', async () => {
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const results = await module.getSearchVolume({ keywords: ['dentist near me'] })

      expect(results).toHaveLength(1)
      expect(results[0].keyword).toBe('dentist near me')
      expect(results[0].search_volume).toBe(165000)
      expect(mockClient.keywords.googleAdsSearchVolumeLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const results = await module.getSearchVolume({ keywords: ['unknown keyword'] })

      expect(results).toEqual([])
    })

    it('handles multiple keywords', async () => {
      const response = createSuccessResponse([mockKeywordInfo, mockKeywordInfoLowVolume])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const results = await module.getSearchVolume({
        keywords: ['dentist near me', 'pediatric dentist austin tx emergency'],
      })

      expect(results).toHaveLength(2)
    })

    it('uses default location when not specified', async () => {
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      await module.getSearchVolume({ keywords: ['dentist'] })

      expect(mockClient.keywords.googleAdsSearchVolumeLive).toHaveBeenCalledTimes(1)
    })

    it('validates keywords array', async () => {
      await expect(module.getSearchVolume({ keywords: [] })).rejects.toThrow()
    })
  })

  // ===========================================================================
  // getKeywordsForSite Tests
  // ===========================================================================
  describe('getKeywordsForSite', () => {
    it('returns keywords for valid domain', async () => {
      const response = createSuccessResponse(mockKeywordsForSiteResults)
      mockClient.keywords.googleAdsKeywordsForSiteLive.mockResolvedValue(response)

      const results = await module.getKeywordsForSite({ target: 'example-dental.com' })

      expect(results).toBeDefined()
      expect(mockClient.keywords.googleAdsKeywordsForSiteLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no keywords', async () => {
      const response = createSuccessResponse([])
      mockClient.keywords.googleAdsKeywordsForSiteLive.mockResolvedValue(response)

      const results = await module.getKeywordsForSite({ target: 'new-site.com' })

      expect(results).toBeDefined()
    })

    it('validates target domain', async () => {
      await expect(module.getKeywordsForSite({ target: '' })).rejects.toThrow()
    })

    it('handles pagination options', async () => {
      const response = createSuccessResponse(mockKeywordsForSiteResults)
      mockClient.keywords.googleAdsKeywordsForSiteLive.mockResolvedValue(response)

      await module.getKeywordsForSite({
        target: 'example.com',
        limit: 50,
        offset: 100,
      })

      expect(mockClient.keywords.googleAdsKeywordsForSiteLive).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // getKeywordsTrends Tests
  // ===========================================================================
  describe('getKeywordsTrends', () => {
    it('returns trends data for keywords', async () => {
      const response = createSuccessResponse([mockKeywordsTrendsResult])
      mockClient.keywords.googleTrendsExploreLive.mockResolvedValue(response)

      const result = await module.getKeywordsTrends({ keywords: ['dentist near me'] })

      expect(result).toBeDefined()
      expect(mockClient.keywords.googleTrendsExploreLive).toHaveBeenCalledTimes(1)
    })

    it('handles custom location', async () => {
      const response = createSuccessResponse([mockKeywordsTrendsResult])
      mockClient.keywords.googleTrendsExploreLive.mockResolvedValue(response)

      await module.getKeywordsTrends({
        keywords: ['dentist'],
        locationName: 'Texas,United States',
      })

      expect(mockClient.keywords.googleTrendsExploreLive).toHaveBeenCalledTimes(1)
    })

    it('handles date range', async () => {
      const response = createSuccessResponse([mockKeywordsTrendsResult])
      mockClient.keywords.googleTrendsExploreLive.mockResolvedValue(response)

      await module.getKeywordsTrends({
        keywords: ['dentist'],
        dateFrom: '2024-01-01',
        dateTo: '2024-11-01',
      })

      expect(mockClient.keywords.googleTrendsExploreLive).toHaveBeenCalledTimes(1)
    })
  })

  // Note: getKeywordDifficulty delegates to Labs module

  // ===========================================================================
  // analyzeOpportunity Tests
  // ===========================================================================
  describe('analyzeOpportunity', () => {
    it('analyzes keyword opportunity', async () => {
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const opportunity = await module.analyzeOpportunity('dentist near me')

      expect(opportunity).toBeDefined()
      expect(opportunity.keyword).toBe('dentist near me')
      expect(opportunity.searchVolume).toBe(165000)
      expect(opportunity.opportunityScore).toBeGreaterThan(0)
    })

    it('handles keyword with no data', async () => {
      const response = createSuccessResponse([])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const opportunity = await module.analyzeOpportunity('unknown keyword')

      expect(opportunity.searchVolume).toBe(0)
      expect(opportunity.opportunityScore).toBe(0)
      expect(opportunity.recommendation).toContain('No data')
    })

    it('returns intent classification', async () => {
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const opportunity = await module.analyzeOpportunity('dentist near me')

      expect(['informational', 'transactional', 'navigational', 'commercial']).toContain(
        opportunity.intent
      )
    })

    it('provides recommendation', async () => {
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const opportunity = await module.analyzeOpportunity('dentist near me')

      expect(opportunity.recommendation).toBeDefined()
      expect(typeof opportunity.recommendation).toBe('string')
    })
  })

  // Note: getDentalKeywordSuggestions is a convenience method for dental-specific searches

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new KeywordsModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([mockKeywordInfo])
      mockClient.keywords.googleAdsSearchVolumeLive.mockResolvedValue(response)

      const results = await moduleNoCache.getSearchVolume({ keywords: ['dentist'] })

      expect(results).toHaveLength(1)
    })
  })
})
