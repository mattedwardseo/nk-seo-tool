/**
 * OnPage Module Tests
 *
 * Tests for the OnPage API module wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dataforseo-client before importing modules that use it
vi.mock('dataforseo-client', () => ({
  OnPageApi: vi.fn(),
  OnPageInstantPagesRequestInfo: vi.fn().mockImplementation(() => ({})),
  OnPageLighthouseTaskPostRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

import { OnPageModule } from '../../modules/onpage'
import { createMockClient, createMockCache, createSuccessResponse } from '../helpers/test-utils'
import {
  mockOnPageInstantResult,
  mockOnPageInstantResultPoor,
  mockLighthouseResult,
} from '../__mocks__/fixtures'
import type { DataForSEOClient } from '../../client'
import type { DataForSEOCache } from '../../cache'

describe('OnPageModule', () => {
  let module: OnPageModule
  let mockClient: ReturnType<typeof createMockClient>
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockCache = createMockCache()
    module = new OnPageModule(
      mockClient as unknown as DataForSEOClient,
      mockCache as unknown as DataForSEOCache
    )
  })

  // ===========================================================================
  // instantPageAudit Tests
  // ===========================================================================
  describe('instantPageAudit', () => {
    it('returns page audit result for valid URL', async () => {
      const response = createSuccessResponse([mockOnPageInstantResult])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const result = await module.instantPageAudit({ url: 'https://example-dental.com' })

      expect(result).toBeDefined()
      expect(result?.url).toBe('https://example-dental.com')
      expect(result?.onpage_score).toBe(78.5)
      expect(mockClient.onPage.instantPages).toHaveBeenCalledTimes(1)
    })

    it('returns null when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const result = await module.instantPageAudit({ url: 'https://example.com' })

      expect(result).toBeNull()
    })

    it('uses cache when available', async () => {
      const response = createSuccessResponse([mockOnPageInstantResult])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      // First call - cache miss
      await module.instantPageAudit({ url: 'https://example.com' })

      // Second call - should hit cache
      await module.instantPageAudit({ url: 'https://example.com' })

      // getOrFetch should have been called twice
      expect(mockCache.getOrFetch).toHaveBeenCalledTimes(2)
    })

    it('skips cache when skipCache option is true', async () => {
      const response = createSuccessResponse([mockOnPageInstantResult])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const moduleNoCache = new OnPageModule(mockClient as unknown as DataForSEOClient, null)
      await moduleNoCache.instantPageAudit({ url: 'https://example.com' }, { skipCache: true })

      expect(mockClient.onPage.instantPages).toHaveBeenCalledTimes(1)
    })

    it('validates URL input', async () => {
      await expect(module.instantPageAudit({ url: 'invalid-url' })).rejects.toThrow()
    })

    it('passes optional parameters', async () => {
      const response = createSuccessResponse([mockOnPageInstantResult])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      await module.instantPageAudit({
        url: 'https://example.com',
        enableJavascript: true,
        loadResources: true,
        customUserAgent: 'TestBot/1.0',
        acceptLanguage: 'en-US',
      })

      expect(mockClient.onPage.instantPages).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // lighthouseAudit Tests
  // ===========================================================================
  describe('lighthouseAudit', () => {
    it('returns lighthouse result for valid URL', async () => {
      const response = createSuccessResponse([mockLighthouseResult])
      mockClient.onPage.lighthouseLiveJson.mockResolvedValue(response)

      const result = await module.lighthouseAudit({ url: 'https://example-dental.com' })

      expect(result).toBeDefined()
      expect(result?.categories?.performance?.score).toBe(0.85)
      expect(mockClient.onPage.lighthouseLiveJson).toHaveBeenCalledTimes(1)
    })

    it('returns null when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.onPage.lighthouseLiveJson.mockResolvedValue(response)

      const result = await module.lighthouseAudit({ url: 'https://example.com' })

      expect(result).toBeNull()
    })

    it('handles mobile device option', async () => {
      const response = createSuccessResponse([mockLighthouseResult])
      mockClient.onPage.lighthouseLiveJson.mockResolvedValue(response)

      await module.lighthouseAudit({
        url: 'https://example.com',
        device: 'mobile',
      })

      expect(mockClient.onPage.lighthouseLiveJson).toHaveBeenCalledTimes(1)
    })

    it('handles desktop device option', async () => {
      const response = createSuccessResponse([mockLighthouseResult])
      mockClient.onPage.lighthouseLiveJson.mockResolvedValue(response)

      await module.lighthouseAudit({
        url: 'https://example.com',
        device: 'desktop',
      })

      expect(mockClient.onPage.lighthouseLiveJson).toHaveBeenCalledTimes(1)
    })

    it('handles custom categories', async () => {
      const response = createSuccessResponse([mockLighthouseResult])
      mockClient.onPage.lighthouseLiveJson.mockResolvedValue(response)

      await module.lighthouseAudit({
        url: 'https://example.com',
        categories: ['performance', 'seo'],
      })

      expect(mockClient.onPage.lighthouseLiveJson).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // batchInstantAudit Tests
  // ===========================================================================
  describe('batchInstantAudit', () => {
    it('returns results for multiple URLs', async () => {
      const response = createSuccessResponse([mockOnPageInstantResult, mockOnPageInstantResultPoor])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const results = await module.batchInstantAudit([
        'https://example.com/page1',
        'https://example.com/page2',
      ])

      expect(results).toHaveLength(2)
      expect(mockClient.onPage.instantPages).toHaveBeenCalledTimes(1)
    })

    it('returns empty array when no results', async () => {
      const response = createSuccessResponse([])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const results = await module.batchInstantAudit(['https://example.com/page1'])

      expect(results).toEqual([])
    })

    it('validates all URLs', async () => {
      await expect(module.batchInstantAudit(['https://valid.com', 'invalid-url'])).rejects.toThrow()
    })
  })

  // ===========================================================================
  // calculateTechnicalScore Tests
  // ===========================================================================
  describe('calculateTechnicalScore', () => {
    it('returns score for good page metrics', () => {
      const score = module.calculateTechnicalScore(mockOnPageInstantResult)

      expect(score).toBeGreaterThan(0)
    })

    it('returns lower score for poor page metrics', () => {
      const goodScore = module.calculateTechnicalScore(mockOnPageInstantResult)
      const poorScore = module.calculateTechnicalScore(mockOnPageInstantResultPoor)

      // Poor metrics should result in lower score
      expect(poorScore).toBeLessThan(goodScore)
    })

    it('returns 0 for null result', () => {
      const score = module.calculateTechnicalScore(
        null as unknown as typeof mockOnPageInstantResult
      )

      expect(score).toBe(0)
    })

    it('handles result with missing timing data', () => {
      const resultNoTiming = {
        ...mockOnPageInstantResult,
        page_timing: null,
      }

      const score = module.calculateTechnicalScore(
        resultNoTiming as unknown as typeof mockOnPageInstantResult
      )

      expect(score).toBeGreaterThan(0) // Should still have score from onpage_score and checks
    })

    it('handles result with missing checks', () => {
      const resultNoChecks = {
        ...mockOnPageInstantResult,
        checks: null,
      }

      const score = module.calculateTechnicalScore(
        resultNoChecks as unknown as typeof mockOnPageInstantResult
      )

      expect(score).toBeGreaterThan(0) // Should still have score from onpage_score and timing
    })

    it('rewards good LCP (under 2.5s)', () => {
      const goodLcp = {
        ...mockOnPageInstantResult,
        page_timing: {
          ...mockOnPageInstantResult.page_timing,
          largest_contentful_paint: 2000,
        },
      }

      const poorLcp = {
        ...mockOnPageInstantResult,
        page_timing: {
          ...mockOnPageInstantResult.page_timing,
          largest_contentful_paint: 5000,
        },
      }

      const goodScore = module.calculateTechnicalScore(
        goodLcp as unknown as typeof mockOnPageInstantResult
      )
      const poorScore = module.calculateTechnicalScore(
        poorLcp as unknown as typeof mockOnPageInstantResult
      )

      expect(goodScore).toBeGreaterThan(poorScore)
    })
  })

  // ===========================================================================
  // Module without cache
  // ===========================================================================
  describe('without cache', () => {
    it('works correctly without cache instance', async () => {
      const moduleNoCache = new OnPageModule(mockClient as unknown as DataForSEOClient, null)
      const response = createSuccessResponse([mockOnPageInstantResult])
      mockClient.onPage.instantPages.mockResolvedValue(response)

      const result = await moduleNoCache.instantPageAudit({ url: 'https://example.com' })

      expect(result).toBeDefined()
      expect(mockClient.onPage.instantPages).toHaveBeenCalledTimes(1)
    })
  })
})
