/**
 * DataForSEO Client Wrapper
 *
 * Wraps the official dataforseo-client with:
 * - Rate limiting via Bottleneck
 * - Error handling and retry logic
 * - Logging
 * - Configuration management
 */

import {
  BacklinksApi,
  KeywordsDataApi,
  OnPageApi,
  SerpApi,
  DataforseoLabsApi,
  BusinessDataApi,
  DomainAnalyticsApi,
  ContentAnalysisApi,
  BacklinksSummaryLiveRequestInfo,
} from 'dataforseo-client'

import { generalLimiter, getLimiter, type LimiterType } from './rate-limiter'
import { STATUS_CODES, type DataForSEOConfig, type DataForSEOError } from './types'

// Environment configuration
const getConfig = (): DataForSEOConfig => {
  const username = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!username || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    )
  }

  return {
    username,
    password,
    baseUrl: process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com',
    timeout: parseInt(process.env.DATAFORSEO_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.DATAFORSEO_RETRY_ATTEMPTS || '3', 10),
  }
}

// Create HTTP client for the DataForSEO client library
const createHttpClient = (config: DataForSEOConfig) => {
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')

  return {
    fetch: async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers)
      headers.set('Authorization', `Basic ${credentials}`)
      headers.set('Content-Type', 'application/json')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

      try {
        const response = await fetch(url, {
          ...init,
          headers,
          signal: controller.signal,
        })
        return response
      } finally {
        clearTimeout(timeoutId)
      }
    },
  }
}

// Singleton client instance
let clientInstance: DataForSEOClient | null = null

/**
 * DataForSEO Client Class
 *
 * Main client for interacting with the DataForSEO API.
 * Provides rate-limited access to all DataForSEO API endpoints.
 *
 * @example
 * ```typescript
 * const client = getDataForSEOClient();
 *
 * // Execute a rate-limited API call
 * const result = await client.execute(
 *   () => client.backlinks.summaryLive([{ target: 'example.com' }])
 * );
 * ```
 */
export class DataForSEOClient {
  private config: DataForSEOConfig
  private httpClient: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> }

  // API instances
  public backlinks: BacklinksApi
  public keywords: KeywordsDataApi
  public onPage: OnPageApi
  public serp: SerpApi
  public labs: DataforseoLabsApi
  public business: BusinessDataApi
  public domain: DomainAnalyticsApi
  public content: ContentAnalysisApi

  constructor(config?: DataForSEOConfig) {
    this.config = config || getConfig()
    this.httpClient = createHttpClient(this.config)

    const baseUrl = this.config.baseUrl || 'https://api.dataforseo.com'

    // Initialize API instances with baseUrl and http client
    this.backlinks = new BacklinksApi(baseUrl, this.httpClient)
    this.keywords = new KeywordsDataApi(baseUrl, this.httpClient)
    this.onPage = new OnPageApi(baseUrl, this.httpClient)
    this.serp = new SerpApi(baseUrl, this.httpClient)
    this.labs = new DataforseoLabsApi(baseUrl, this.httpClient)
    this.business = new BusinessDataApi(baseUrl, this.httpClient)
    this.domain = new DomainAnalyticsApi(baseUrl, this.httpClient)
    this.content = new ContentAnalysisApi(baseUrl, this.httpClient)
  }

  /**
   * Execute a rate-limited API call with automatic retry on failure.
   *
   * @template T - The return type of the API call
   * @param apiCall - Function that returns a promise with the API call
   * @param limiterType - Type of rate limiter to use (default: 'general')
   * @returns Promise resolving to the API response
   * @throws {DataForSEOAPIError} When the API call fails after retries
   *
   * @example
   * ```typescript
   * const result = await client.execute(
   *   () => client.serp.googleOrganicLiveAdvanced([{ keyword: 'dentist' }]),
   *   'serp'
   * );
   * ```
   */
  async execute<T>(apiCall: () => Promise<T>, limiterType: LimiterType = 'general'): Promise<T> {
    const limiter = getLimiter(limiterType)

    return limiter.schedule(async () => {
      try {
        const result = await apiCall()
        return result
      } catch (error) {
        const dfsError = this.parseError(error)
        throw new DataForSEOAPIError(dfsError.message, dfsError.code)
      }
    })
  }

  /**
   * Parse error response
   */
  private parseError(error: unknown): DataForSEOError {
    if (error instanceof Error) {
      // Check for rate limit error
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return {
          code: STATUS_CODES.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded. Request will be retried.',
        }
      }

      // Check for payment error
      if (error.message.includes('payment') || error.message.includes('402')) {
        return {
          code: STATUS_CODES.PAYMENT_REQUIRED,
          message: 'Payment required. Check your DataForSEO account balance.',
        }
      }

      return {
        code: STATUS_CODES.INTERNAL_ERROR,
        message: error.message,
      }
    }

    return {
      code: STATUS_CODES.INTERNAL_ERROR,
      message: 'Unknown error occurred',
    }
  }

  /**
   * Check API status and verify credentials.
   *
   * Makes a minimal API call to verify the connection is working.
   *
   * @returns Object with success status and message
   *
   * @example
   * ```typescript
   * const status = await client.checkStatus();
   * if (status.success) {
   *   console.log('API connected:', status.message);
   * }
   * ```
   */
  async checkStatus(): Promise<{ success: boolean; message: string }> {
    try {
      // Make a minimal API call to verify credentials
      const request = new BacklinksSummaryLiveRequestInfo()
      request.target = 'example.com'

      const result = await this.execute(() => this.backlinks.summaryLive([request]))

      if (result && result.status_code === STATUS_CODES.SUCCESS) {
        return {
          success: true,
          message: 'DataForSEO API connection successful',
        }
      }

      return {
        success: false,
        message: result?.status_message || 'Unknown error',
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to API',
      }
    }
  }
}

/**
 * Custom error class for DataForSEO API errors
 */
export class DataForSEOAPIError extends Error {
  public code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = 'DataForSEOAPIError'
    this.code = code
  }

  isRateLimitError(): boolean {
    return this.code === STATUS_CODES.RATE_LIMIT_EXCEEDED
  }

  isPaymentError(): boolean {
    return this.code === STATUS_CODES.PAYMENT_REQUIRED
  }
}

/**
 * Get singleton client instance
 */
export function getDataForSEOClient(config?: DataForSEOConfig): DataForSEOClient {
  if (!clientInstance) {
    clientInstance = new DataForSEOClient(config)
  }
  return clientInstance
}

/**
 * Reset client instance (useful for testing)
 */
export function resetDataForSEOClient(): void {
  clientInstance = null
}

// Export the rate limiter for direct use if needed
export { generalLimiter, getLimiter }
