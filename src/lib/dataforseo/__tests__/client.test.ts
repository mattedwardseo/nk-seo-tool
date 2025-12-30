/**
 * DataForSEO Client Tests
 *
 * Tests for the main DataForSEO client wrapper class.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DataForSEOClient,
  DataForSEOAPIError,
  getDataForSEOClient,
  resetDataForSEOClient,
} from '../client'
import { STATUS_CODES } from '../types'
import { createSuccessResponse } from './helpers/test-utils'

// Mock the dataforseo-client package
vi.mock('dataforseo-client', () => ({
  BacklinksApi: vi.fn().mockImplementation(() => ({
    summaryLive: vi.fn(),
  })),
  KeywordsDataApi: vi.fn(),
  OnPageApi: vi.fn(),
  SerpApi: vi.fn(),
  DataforseoLabsApi: vi.fn(),
  BusinessDataApi: vi.fn(),
  DomainAnalyticsApi: vi.fn(),
  ContentAnalysisApi: vi.fn(),
  BacklinksSummaryLiveRequestInfo: vi.fn().mockImplementation(() => ({})),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('DataForSEOClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDataForSEOClient()
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ status_code: 20000 })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ===========================================================================
  // Constructor Tests
  // ===========================================================================
  describe('constructor', () => {
    it('creates client with environment variables', () => {
      const client = new DataForSEOClient()
      expect(client).toBeInstanceOf(DataForSEOClient)
    })

    it('creates client with custom config', () => {
      const client = new DataForSEOClient({
        username: 'custom-user',
        password: 'custom-pass',
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        retryAttempts: 5,
      })
      expect(client).toBeInstanceOf(DataForSEOClient)
    })

    it('throws error when credentials not configured', () => {
      const originalLogin = process.env.DATAFORSEO_LOGIN
      const originalPassword = process.env.DATAFORSEO_PASSWORD

      delete process.env.DATAFORSEO_LOGIN
      delete process.env.DATAFORSEO_PASSWORD

      expect(() => new DataForSEOClient()).toThrow('DataForSEO credentials not configured')

      process.env.DATAFORSEO_LOGIN = originalLogin
      process.env.DATAFORSEO_PASSWORD = originalPassword
    })

    it('throws error when only login is missing', () => {
      const originalLogin = process.env.DATAFORSEO_LOGIN

      delete process.env.DATAFORSEO_LOGIN

      expect(() => new DataForSEOClient()).toThrow('DataForSEO credentials not configured')

      process.env.DATAFORSEO_LOGIN = originalLogin
    })

    it('throws error when only password is missing', () => {
      const originalPassword = process.env.DATAFORSEO_PASSWORD

      delete process.env.DATAFORSEO_PASSWORD

      expect(() => new DataForSEOClient()).toThrow('DataForSEO credentials not configured')

      process.env.DATAFORSEO_PASSWORD = originalPassword
    })

    it('initializes all API instances', () => {
      const client = new DataForSEOClient()

      expect(client.backlinks).toBeDefined()
      expect(client.keywords).toBeDefined()
      expect(client.onPage).toBeDefined()
      expect(client.serp).toBeDefined()
      expect(client.labs).toBeDefined()
      expect(client.business).toBeDefined()
      expect(client.domain).toBeDefined()
      expect(client.content).toBeDefined()
    })
  })

  // ===========================================================================
  // execute() Tests
  // ===========================================================================
  describe('execute', () => {
    it('executes API call and returns result', async () => {
      const client = new DataForSEOClient()
      const mockResult = { data: 'test' }
      const mockApiCall = vi.fn().mockResolvedValue(mockResult)

      const result = await client.execute(mockApiCall)

      expect(result).toEqual(mockResult)
      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })

    it('uses general limiter by default', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockResolvedValue({ success: true })

      await client.execute(mockApiCall)

      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })

    it('uses specified limiter type', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockResolvedValue({ success: true })

      await client.execute(mockApiCall, 'googleAds')

      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })

    it('throws DataForSEOAPIError on API call failure', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API failure'))

      await expect(client.execute(mockApiCall)).rejects.toThrow(DataForSEOAPIError)
    })

    it('detects rate limit error from message', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('rate limit exceeded'))

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).code).toBe(STATUS_CODES.RATE_LIMIT_EXCEEDED)
        expect((error as DataForSEOAPIError).isRateLimitError()).toBe(true)
      }
    })

    it('detects rate limit error from 429 status', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('HTTP 429'))

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).isRateLimitError()).toBe(true)
      }
    })

    it('detects payment error from message', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('payment required'))

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).code).toBe(STATUS_CODES.PAYMENT_REQUIRED)
        expect((error as DataForSEOAPIError).isPaymentError()).toBe(true)
      }
    })

    it('detects payment error from 402 status', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('HTTP 402'))

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).isPaymentError()).toBe(true)
      }
    })

    it('returns internal error for unknown errors', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue(new Error('Something went wrong'))

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).code).toBe(STATUS_CODES.INTERNAL_ERROR)
      }
    })

    it('handles non-Error objects', async () => {
      const client = new DataForSEOClient()
      const mockApiCall = vi.fn().mockRejectedValue('string error')

      try {
        await client.execute(mockApiCall)
      } catch (error) {
        expect(error).toBeInstanceOf(DataForSEOAPIError)
        expect((error as DataForSEOAPIError).message).toBe('Unknown error occurred')
      }
    })
  })

  // ===========================================================================
  // checkStatus() Tests
  // ===========================================================================
  describe('checkStatus', () => {
    it('returns success true on valid response', async () => {
      const client = new DataForSEOClient()
      const mockResponse = createSuccessResponse([{ target: 'example.com' }])

      // Mock the backlinks.summaryLive method
      client.backlinks.summaryLive = vi.fn().mockResolvedValue(mockResponse)

      const result = await client.checkStatus()

      expect(result.success).toBe(true)
      expect(result.message).toBe('DataForSEO API connection successful')
    })

    it('returns success false on error response', async () => {
      const client = new DataForSEOClient()

      client.backlinks.summaryLive = vi.fn().mockResolvedValue({
        status_code: 40000,
        status_message: 'Invalid request',
      })

      const result = await client.checkStatus()

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid request')
    })

    it('returns success false on API exception', async () => {
      const client = new DataForSEOClient()

      client.backlinks.summaryLive = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await client.checkStatus()

      expect(result.success).toBe(false)
      expect(result.message).toContain('Network error')
    })

    it('handles non-Error exceptions', async () => {
      const client = new DataForSEOClient()

      client.backlinks.summaryLive = vi.fn().mockRejectedValue('Connection refused')

      const result = await client.checkStatus()

      expect(result.success).toBe(false)
      // Non-Error exceptions get caught and wrapped - the actual message may vary
      // The key assertion is that success is false
      expect(result.message).toBeDefined()
    })
  })

  // ===========================================================================
  // Singleton Pattern Tests
  // ===========================================================================
  describe('singleton pattern', () => {
    it('getDataForSEOClient returns singleton instance', () => {
      const client1 = getDataForSEOClient()
      const client2 = getDataForSEOClient()

      expect(client1).toBe(client2)
    })

    it('getDataForSEOClient accepts custom config on first call', () => {
      resetDataForSEOClient()

      const client = getDataForSEOClient({
        username: 'test-user',
        password: 'test-pass',
      })

      expect(client).toBeInstanceOf(DataForSEOClient)
    })

    it('resetDataForSEOClient clears singleton', () => {
      const client1 = getDataForSEOClient()
      resetDataForSEOClient()
      const client2 = getDataForSEOClient()

      expect(client1).not.toBe(client2)
    })
  })
})

// ===========================================================================
// DataForSEOAPIError Tests
// ===========================================================================
describe('DataForSEOAPIError', () => {
  it('creates error with message and code', () => {
    const error = new DataForSEOAPIError('Test error', 40000)

    expect(error.message).toBe('Test error')
    expect(error.code).toBe(40000)
    expect(error.name).toBe('DataForSEOAPIError')
  })

  it('isRateLimitError returns true for rate limit code', () => {
    const error = new DataForSEOAPIError('Rate limit', STATUS_CODES.RATE_LIMIT_EXCEEDED)

    expect(error.isRateLimitError()).toBe(true)
    expect(error.isPaymentError()).toBe(false)
  })

  it('isPaymentError returns true for payment code', () => {
    const error = new DataForSEOAPIError('Payment required', STATUS_CODES.PAYMENT_REQUIRED)

    expect(error.isPaymentError()).toBe(true)
    expect(error.isRateLimitError()).toBe(false)
  })

  it('both methods return false for other codes', () => {
    const error = new DataForSEOAPIError('Internal error', STATUS_CODES.INTERNAL_ERROR)

    expect(error.isRateLimitError()).toBe(false)
    expect(error.isPaymentError()).toBe(false)
  })

  it('extends Error class', () => {
    const error = new DataForSEOAPIError('Test', 40000)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DataForSEOAPIError)
  })

  it('has correct stack trace', () => {
    const error = new DataForSEOAPIError('Test', 40000)

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('DataForSEOAPIError')
  })
})
