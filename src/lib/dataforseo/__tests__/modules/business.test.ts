/**
 * Business Module Tests
 *
 * Tests for the Business Data API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  BusinessDataApi: vi.fn(),
  BusinessDataGoogleMyBusinessInfoLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
  BusinessDataBusinessListingsSearchLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { BusinessModule } from '../../modules/business'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockBusinessInfoResult,
  mockBusinessInfoResultIncomplete,
  mockBusinessListings,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('BusinessModule', () => {
  let module: BusinessModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new BusinessModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // getBusinessInfo Tests
  // ===========================================================================
  describe('getBusinessInfo', () => {
    it('returns business info for valid keyword', async () => {
      const response = createSuccessResponse([mockBusinessInfoResult])
      mockClient.business.googleMyBusinessInfoLive.mockResolvedValue(response)

      const result = await module.getBusinessInfo({ keyword: 'example dental austin' })

      expect(result).toBeDefined()
      expect(mockClient.business.googleMyBusinessInfoLive).toHaveBeenCalledTimes(1)
    })

    it('handles empty results', async () => {
      const response = createSuccessResponse([])
      mockClient.business.googleMyBusinessInfoLive.mockResolvedValue(response)

      const result = await module.getBusinessInfo({ keyword: 'nonexistent business' })

      // Should return empty array or null
      expect(result === null || (Array.isArray(result) && result.length === 0)).toBe(true)
    })

    it('validates keyword input', async () => {
      await expect(module.getBusinessInfo({ keyword: '' })).rejects.toThrow()
    })

    it('handles location code', async () => {
      const response = createSuccessResponse([{ items: [mockBusinessInfoResult] }])
      mockClient.business.googleMyBusinessInfoLive.mockResolvedValue(response)

      await module.getBusinessInfo({
        keyword: 'example dental',
        locationCode: 21176,
      })

      expect(mockClient.business.googleMyBusinessInfoLive).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // searchListings Tests
  // ===========================================================================
  describe('searchListings', () => {
    it('returns listings for valid search', async () => {
      const response = createSuccessResponse([{ items: mockBusinessListings }])
      mockClient.business.businessListingsSearchLive.mockResolvedValue(response)

      const results = await module.searchListings({ categories: ['dentist'] })

      expect(results).toHaveLength(mockBusinessListings.length)
      expect(results[0].title).toBe('Example Dental Practice')
      expect(mockClient.business.businessListingsSearchLive).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no listings', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.business.businessListingsSearchLive.mockResolvedValue(response)

      const results = await module.searchListings({ categories: ['obscure category'] })

      expect(results).toEqual([])
    })

    it('handles location coordinates', async () => {
      const response = createSuccessResponse([{ items: mockBusinessListings }])
      mockClient.business.businessListingsSearchLive.mockResolvedValue(response)

      await module.searchListings({
        categories: ['dentist'],
        locationCoordinate: '30.2672,-97.7431,10',
      })

      expect(mockClient.business.businessListingsSearchLive).toHaveBeenCalledTimes(1)
    })

    it('handles pagination', async () => {
      const response = createSuccessResponse([{ items: mockBusinessListings }])
      mockClient.business.businessListingsSearchLive.mockResolvedValue(response)

      await module.searchListings({
        categories: ['dentist'],
        limit: 50,
        offset: 0,
      })

      expect(mockClient.business.businessListingsSearchLive).toHaveBeenCalledTimes(1)
    })

    it('handles claimed filter', async () => {
      const response = createSuccessResponse([{ items: mockBusinessListings }])
      mockClient.business.businessListingsSearchLive.mockResolvedValue(response)

      await module.searchListings({
        categories: ['dentist'],
        isClaimed: true,
      })

      expect(mockClient.business.businessListingsSearchLive).toHaveBeenCalledTimes(1)
    })
  })

  // Note: analyzeReviews and getLocalCompetitors methods tested separately if available

  // Note: calculateProfileCompleteness is a helper method for assessing business profiles

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new BusinessModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([{ items: [mockBusinessInfoResult] }])
      mockClient.business.googleMyBusinessInfoLive.mockResolvedValue(response)

      const result = await moduleNoCache.getBusinessInfo({ keyword: 'example dental' })

      expect(result).toBeDefined()
    })
  })
})
