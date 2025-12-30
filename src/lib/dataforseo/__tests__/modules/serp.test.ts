/**
 * SERP Module Tests
 *
 * Tests for the SERP API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  SerpApi: vi.fn(),
  SerpGoogleOrganicLiveAdvancedRequestInfo: vi.fn().mockImplementation(() => ({})),
  SerpGoogleMapsLiveAdvancedRequestInfo: vi.fn().mockImplementation(() => ({})),
  SerpGoogleLocalFinderLiveAdvancedRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { SerpModule } from '../../modules/serp'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockOrganicResult,
  mockOrganicResults,
  mockLocalPackResult,
  mockMapsResult,
  mockLocations,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('SerpModule', () => {
  let module: SerpModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new SerpModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // googleOrganicSearch Tests
  // ===========================================================================
  describe('googleOrganicSearch', () => {
    it('returns organic results for valid keyword', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleOrganicSearch({ keyword: 'dentist austin tx' })

      expect(results).toHaveLength(mockOrganicResults.length)
      expect(results[0].domain).toBe('example-dental.com')
      expect(mockClient.serp.googleOrganicLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleOrganicSearch({ keyword: 'obscure keyword' })

      expect(results).toEqual([])
    })

    it('filters to only organic type results', async () => {
      const mixedResults = [
        ...mockOrganicResults,
        { type: 'local_pack', title: 'Local Pack Result' },
        { type: 'ads', title: 'Ad Result' },
      ]
      const response = createSuccessResponse([{ items: mixedResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleOrganicSearch({ keyword: 'dentist' })

      expect(results.every((r) => r.type === 'organic')).toBe(true)
      expect(results).toHaveLength(mockOrganicResults.length)
    })

    it('uses default location code when not specified', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      await module.googleOrganicSearch({ keyword: 'dentist' })

      expect(mockClient.serp.googleOrganicLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('handles custom location code', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      await module.googleOrganicSearch({
        keyword: 'dentist',
        locationCode: 21176, // Austin, TX
      })

      expect(mockClient.serp.googleOrganicLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('handles mobile device option', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      await module.googleOrganicSearch({
        keyword: 'dentist',
        device: 'mobile',
      })

      expect(mockClient.serp.googleOrganicLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('validates keyword input', async () => {
      await expect(module.googleOrganicSearch({ keyword: '' })).rejects.toThrow()
    })
  })

  // ===========================================================================
  // googleMapsSearch Tests
  // ===========================================================================
  describe('googleMapsSearch', () => {
    it('returns maps results for valid keyword', async () => {
      const response = createSuccessResponse([{ items: [mockMapsResult] }])
      mockClient.serp.googleMapsLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleMapsSearch({ keyword: 'dental clinic austin' })

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('maps_search')
      expect(mockClient.serp.googleMapsLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.serp.googleMapsLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleMapsSearch({ keyword: 'obscure business' })

      expect(results).toEqual([])
    })

    it('handles coordinates parameter', async () => {
      const response = createSuccessResponse([{ items: [mockMapsResult] }])
      mockClient.serp.googleMapsLiveAdvanced.mockResolvedValue(response)

      await module.googleMapsSearch({
        keyword: 'dentist',
        coordinates: '30.2672,-97.7431',
      })

      expect(mockClient.serp.googleMapsLiveAdvanced).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // googleLocalFinder Tests
  // ===========================================================================
  describe('googleLocalFinder', () => {
    it('returns local finder results', async () => {
      const response = createSuccessResponse([{ items: [mockLocalPackResult] }])
      mockClient.serp.googleLocalFinderLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleLocalFinder({ keyword: 'pediatric dentist' })

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe('local_pack')
      expect(mockClient.serp.googleLocalFinderLiveAdvanced).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.serp.googleLocalFinderLiveAdvanced.mockResolvedValue(response)

      const results = await module.googleLocalFinder({ keyword: 'rare specialty' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // getLocations Tests
  // ===========================================================================
  describe('getLocations', () => {
    it('returns all locations when no filter', async () => {
      const response = createSuccessResponse(mockLocations)
      mockClient.serp.serpGoogleLocations.mockResolvedValue(response)

      const results = await module.getLocations()

      expect(results).toHaveLength(mockLocations.length)
      expect(mockClient.serp.serpGoogleLocations).toHaveBeenCalledTimes(1)
    })

    it('filters by country code', async () => {
      const response = createSuccessResponse(mockLocations)
      mockClient.serp.serpGoogleLocations.mockResolvedValue(response)

      const results = await module.getLocations({ country: 'US' })

      expect(results.every((r) => r.country_iso_code === 'US')).toBe(true)
    })

    it('returns empty array when no locations match', async () => {
      const response = createSuccessResponse(mockLocations)
      mockClient.serp.serpGoogleLocations.mockResolvedValue(response)

      const results = await module.getLocations({ country: 'XX' })

      expect(results).toEqual([])
    })
  })

  // ===========================================================================
  // findDomainRanking Tests
  // ===========================================================================
  describe('findDomainRanking', () => {
    it('finds domain in organic results', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const result = await module.findDomainRanking('dentist', 'example-dental.com')

      expect(result).toBeDefined()
      expect(result?.domain).toBe('example-dental.com')
    })

    it('returns null when domain not found', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const result = await module.findDomainRanking('dentist', 'notfound.com')

      expect(result).toBeNull()
    })

    it('normalizes domain comparison (removes www)', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const result = await module.findDomainRanking('dentist', 'www.example-dental.com')

      expect(result).toBeDefined()
      expect(result?.domain).toBe('example-dental.com')
    })
  })

  // ===========================================================================
  // findLocalPackPresence Tests
  // ===========================================================================
  describe('findLocalPackPresence', () => {
    it('finds business in local pack results', async () => {
      const response = createSuccessResponse([{ items: [mockLocalPackResult] }])
      mockClient.serp.googleLocalFinderLiveAdvanced.mockResolvedValue(response)

      const result = await module.findLocalPackPresence('dentist', 'Example Dental')

      expect(result).toBeDefined()
      expect(result?.title).toContain('Example Dental')
    })

    it('returns null when business not found', async () => {
      const response = createSuccessResponse([{ items: [mockLocalPackResult] }])
      mockClient.serp.googleLocalFinderLiveAdvanced.mockResolvedValue(response)

      const result = await module.findLocalPackPresence('dentist', 'Nonexistent Business')

      expect(result).toBeNull()
    })

    it('uses partial match for business name', async () => {
      const response = createSuccessResponse([{ items: [mockLocalPackResult] }])
      mockClient.serp.googleLocalFinderLiveAdvanced.mockResolvedValue(response)

      const result = await module.findLocalPackPresence('dentist', 'Example')

      expect(result).toBeDefined()
    })
  })

  // ===========================================================================
  // analyzeSerpFeatures Tests
  // ===========================================================================
  describe('analyzeSerpFeatures', () => {
    it('analyzes SERP features correctly', async () => {
      const itemsWithFeatures = [...mockOrganicResults, { type: 'local_pack', title: 'Local Pack' }]
      const response = createSuccessResponse([{ items: itemsWithFeatures }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const features = await module.analyzeSerpFeatures('dentist near me')

      expect(features.organicCount).toBe(mockOrganicResults.length)
      expect(features.hasLocalPack).toBe(true)
      expect(features.topOrganicDomain).toBe('example-dental.com')
    })

    it('returns correct counts when no features', async () => {
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const features = await module.analyzeSerpFeatures('simple query')

      expect(features.organicCount).toBe(mockOrganicResults.length)
      expect(features.hasLocalPack).toBe(false)
      expect(features.hasFeaturedSnippet).toBe(false)
    })

    it('handles empty results', async () => {
      const response = createSuccessResponse([{ items: [] }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const features = await module.analyzeSerpFeatures('no results')

      expect(features.organicCount).toBe(0)
      expect(features.hasLocalPack).toBe(false)
      expect(features.topOrganicDomain).toBeNull()
    })
  })

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new SerpModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([{ items: mockOrganicResults }])
      mockClient.serp.googleOrganicLiveAdvanced.mockResolvedValue(response)

      const results = await moduleNoCache.googleOrganicSearch({ keyword: 'dentist' })

      expect(results).toHaveLength(mockOrganicResults.length)
    })
  })
})
