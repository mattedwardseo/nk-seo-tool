/**
 * Labs Module Tests
 *
 * Tests for the DataForSEO Labs API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  DataforseoLabsApi: vi.fn(),
  DataforseoLabsGoogleDomainRankOverviewLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleRankedKeywordsLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleCompetitorsDomainLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleBulkKeywordDifficultyLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleSearchIntentLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleBulkTrafficEstimationLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  DataforseoLabsGoogleKeywordSuggestionsLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { LabsModule } from '../../modules/labs'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockDomainRankOverview,
  mockRankedKeywords,
  mockCompetitors,
  mockKeywordDifficultyResults,
  mockSearchIntentResults,
  mockTrafficEstimationResult,
  mockKeywordSuggestions,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('LabsModule', () => {
  let module: LabsModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new LabsModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // getDomainRankOverview Tests
  // ===========================================================================
  describe('getDomainRankOverview', () => {
    it('returns rank overview for valid domain', async () => {
      const response = createSuccessResponse([mockDomainRankOverview])
      mockClient.labs.googleDomainRankOverviewLive.mockResolvedValue(response)

      const result = await module.getDomainRankOverview({ target: 'example-dental.com' })

      expect(result).toBeDefined()
      expect(result?.target).toBe('example-dental.com')
      expect(result?.metrics?.organic?.count).toBe(450)
      expect(mockClient.labs.googleDomainRankOverviewLive).toHaveBeenCalledTimes(1)
    })

    it('returns null when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.labs.googleDomainRankOverviewLive.mockResolvedValue(response)

      const result = await module.getDomainRankOverview({ target: 'unknown.com' })

      expect(result).toBeNull()
    })

    it('validates domain input', async () => {
      await expect(module.getDomainRankOverview({ target: '' })).rejects.toThrow()
    })
  })

  // ===========================================================================
  // getRankedKeywords Tests
  // ===========================================================================
  describe('getRankedKeywords', () => {
    it('returns ranked keywords for valid domain', async () => {
      const response = createSuccessResponse([{ items: mockRankedKeywords }])
      mockClient.labs.googleRankedKeywordsLive.mockResolvedValue(response)

      const results = await module.getRankedKeywords({ target: 'example-dental.com' })

      expect(results).toHaveLength(mockRankedKeywords.length)
      expect(results[0].keyword_data.keyword).toBe('dentist austin tx')
      expect(mockClient.labs.googleRankedKeywordsLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no keywords', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.labs.googleRankedKeywordsLive.mockResolvedValue(response)

      const results = await module.getRankedKeywords({ target: 'new-site.com' })

      expect(results).toEqual([])
    })

    it('handles pagination', async () => {
      const response = createSuccessResponse([{ items: mockRankedKeywords }])
      mockClient.labs.googleRankedKeywordsLive.mockResolvedValue(response)

      await module.getRankedKeywords({
        target: 'example.com',
        limit: 100,
        offset: 0,
      })

      expect(mockClient.labs.googleRankedKeywordsLive).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // getCompetitors Tests
  // ===========================================================================
  describe('getCompetitors', () => {
    it('returns competitors for valid domain', async () => {
      const response = createSuccessResponse([{ items: mockCompetitors }])
      mockClient.labs.googleCompetitorsDomainLive.mockResolvedValue(response)

      const results = await module.getCompetitors({ target: 'example-dental.com' })

      expect(results).toHaveLength(mockCompetitors.length)
      expect(results[0].domain).toBe('competitor-dental.com')
      expect(mockClient.labs.googleCompetitorsDomainLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no competitors', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.labs.googleCompetitorsDomainLive.mockResolvedValue(response)

      const results = await module.getCompetitors({ target: 'unique-site.com' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getBulkKeywordDifficulty Tests
  // ===========================================================================
  describe('getBulkKeywordDifficulty', () => {
    it('returns difficulty scores for keywords', async () => {
      const response = createSuccessResponse(mockKeywordDifficultyResults)
      mockClient.labs.googleBulkKeywordDifficultyLive.mockResolvedValue(response)

      const results = await module.getBulkKeywordDifficulty({
        keywords: ['dentist austin', 'emergency dentist austin'],
      })

      expect(results).toHaveLength(mockKeywordDifficultyResults.length)
      expect(results[0].keyword_difficulty).toBe(68)
      expect(mockClient.labs.googleBulkKeywordDifficultyLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.labs.googleBulkKeywordDifficultyLive.mockResolvedValue(response)

      const results = await module.getBulkKeywordDifficulty({ keywords: ['unknown'] })

      expect(results).toEqual([])
    })

    it('validates keywords array', async () => {
      await expect(module.getBulkKeywordDifficulty({ keywords: [] })).rejects.toThrow()
    })
  })

  // ===========================================================================
  // getSearchIntent Tests
  // ===========================================================================
  describe('getSearchIntent', () => {
    it('returns search intent for keywords', async () => {
      const response = createSuccessResponse(mockSearchIntentResults)
      mockClient.labs.googleSearchIntentLive.mockResolvedValue(response)

      const results = await module.getSearchIntent({
        keywords: ['dentist near me', 'how to find a good dentist'],
      })

      expect(results).toHaveLength(mockSearchIntentResults.length)
      expect(results[0].intent).toBe('transactional')
      expect(mockClient.labs.googleSearchIntentLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.labs.googleSearchIntentLive.mockResolvedValue(response)

      const results = await module.getSearchIntent({ keywords: ['xyz'] })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getBulkTrafficEstimation Tests
  // ===========================================================================
  describe('getBulkTrafficEstimation', () => {
    it('returns traffic estimation for targets', async () => {
      const response = createSuccessResponse([mockTrafficEstimationResult])
      mockClient.labs.googleBulkTrafficEstimationLive.mockResolvedValue(response)

      const results = await module.getBulkTrafficEstimation({
        targets: ['example-dental.com'],
      })

      expect(results).toHaveLength(1)
      expect(results[0].organic.etv).toBe(12500)
      expect(mockClient.labs.googleBulkTrafficEstimationLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.labs.googleBulkTrafficEstimationLive.mockResolvedValue(response)

      const results = await module.getBulkTrafficEstimation({ targets: ['unknown.com'] })

      expect(results).toEqual([])
    })

    it('handles multiple targets', async () => {
      const response = createSuccessResponse([
        mockTrafficEstimationResult,
        { ...mockTrafficEstimationResult, target: 'site2.com' },
      ])
      mockClient.labs.googleBulkTrafficEstimationLive.mockResolvedValue(response)

      const results = await module.getBulkTrafficEstimation({
        targets: ['example-dental.com', 'site2.com'],
      })

      expect(results).toHaveLength(2)
    })
  })

  // ===========================================================================
  // getKeywordSuggestions Tests
  // ===========================================================================
  describe('getKeywordSuggestions', () => {
    it('returns keyword suggestions', async () => {
      const response = createSuccessResponse([{ items: mockKeywordSuggestions }])
      mockClient.labs.googleKeywordSuggestionsLive.mockResolvedValue(response)

      const results = await module.getKeywordSuggestions({ keyword: 'dentist austin' })

      expect(results).toHaveLength(mockKeywordSuggestions.length)
      expect(results[0].keyword).toBe('best dentist austin')
      expect(mockClient.labs.googleKeywordSuggestionsLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no suggestions', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.labs.googleKeywordSuggestionsLive.mockResolvedValue(response)

      const results = await module.getKeywordSuggestions({ keyword: 'xyz123' })

      expect(results).toEqual([])
    })

    it('handles custom filters', async () => {
      const response = createSuccessResponse([{ items: mockKeywordSuggestions }])
      mockClient.labs.googleKeywordSuggestionsLive.mockResolvedValue(response)

      await module.getKeywordSuggestions({
        keyword: 'dentist',
        limit: 50,
      })

      expect(mockClient.labs.googleKeywordSuggestionsLive).toHaveBeenCalledTimes(1)
    })
  })

  // Note: getCompetitiveAnalysis is a convenience method combining multiple API calls

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new LabsModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([mockDomainRankOverview])
      mockClient.labs.googleDomainRankOverviewLive.mockResolvedValue(response)

      const result = await moduleNoCache.getDomainRankOverview({ target: 'example.com' })

      expect(result).toBeDefined()
    })
  })
})
