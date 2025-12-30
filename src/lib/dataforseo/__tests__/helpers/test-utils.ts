/**
 * Test Utilities for DataForSEO Integration Tests
 *
 * Provides mock factories, response builders, and common test helpers.
 */

import { vi } from 'vitest'
import { STATUS_CODES } from '../../types'
import type { DataForSEOResponse, DataForSEOTask } from '../../types'

/**
 * Create a successful DataForSEO API response
 */
export function createSuccessResponse<T>(
  result: T[],
  options?: {
    cost?: number
    taskId?: string
    time?: string
  }
): DataForSEOResponse<T> {
  const { cost = 0.0001, taskId = 'test-task-id', time = '0.5 sec.' } = options ?? {}

  return {
    id: 'test-response-id',
    status_code: STATUS_CODES.SUCCESS,
    status_message: 'Ok.',
    time,
    cost,
    tasks_count: 1,
    tasks_error: 0,
    tasks: [
      {
        id: taskId,
        status_code: STATUS_CODES.SUCCESS,
        status_message: 'Ok.',
        time: '0.3 sec.',
        cost,
        result_count: result.length,
        path: ['v3', 'test'],
        data: {},
        result,
      },
    ],
  }
}

/**
 * Create an error DataForSEO API response
 */
export function createErrorResponse(
  code: number,
  message: string,
  options?: {
    taskId?: string
    time?: string
  }
): DataForSEOResponse<never> {
  const { taskId = 'test-task-id', time = '0.1 sec.' } = options ?? {}

  return {
    id: 'test-response-id',
    status_code: code,
    status_message: message,
    time,
    cost: 0,
    tasks_count: 1,
    tasks_error: 1,
    tasks: [
      {
        id: taskId,
        status_code: code,
        status_message: message,
        time: '0.1 sec.',
        cost: 0,
        result_count: 0,
        path: ['v3', 'test'],
        data: {},
        result: null,
      },
    ],
  }
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(): DataForSEOResponse<never> {
  return createErrorResponse(STATUS_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded')
}

/**
 * Create a payment required error response
 */
export function createPaymentRequiredResponse(): DataForSEOResponse<never> {
  return createErrorResponse(STATUS_CODES.PAYMENT_REQUIRED, 'Payment required')
}

/**
 * Create a partial success response (some tasks succeeded, some failed)
 */
export function createPartialSuccessResponse<T>(
  successResult: T[],
  errorCode: number,
  errorMessage: string
): DataForSEOResponse<T> {
  return {
    id: 'test-response-id',
    status_code: STATUS_CODES.SUCCESS_PARTIAL,
    status_message: 'Task executed with partial success.',
    time: '1.0 sec.',
    cost: 0.0002,
    tasks_count: 2,
    tasks_error: 1,
    tasks: [
      {
        id: 'success-task-id',
        status_code: STATUS_CODES.SUCCESS,
        status_message: 'Ok.',
        time: '0.4 sec.',
        cost: 0.0001,
        result_count: successResult.length,
        path: ['v3', 'test'],
        data: {},
        result: successResult,
      },
      {
        id: 'error-task-id',
        status_code: errorCode,
        status_message: errorMessage,
        time: '0.1 sec.',
        cost: 0,
        result_count: 0,
        path: ['v3', 'test'],
        data: {},
        result: null,
      },
    ],
  }
}

/**
 * Create a mock DataForSEO client
 */
export function createMockClient() {
  const mockExecute = vi.fn().mockImplementation((apiCall) => apiCall())

  return {
    execute: mockExecute,
    checkStatus: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
    backlinks: {
      summaryLive: vi.fn(),
      backlinksLive: vi.fn(),
      anchorsLive: vi.fn(),
      referringDomainsLive: vi.fn(),
      competitorsLive: vi.fn(),
      bulkSpamScoreLive: vi.fn(),
    },
    keywords: {
      googleAdsSearchVolumeLive: vi.fn(),
      googleAdsKeywordsForSiteLive: vi.fn(),
      googleTrendsExploreLive: vi.fn(),
    },
    onPage: {
      instantPages: vi.fn(),
      lighthouseLiveJson: vi.fn(),
    },
    serp: {
      googleOrganicLiveAdvanced: vi.fn(),
      googleMapsLiveAdvanced: vi.fn(),
      googleLocalFinderLiveAdvanced: vi.fn(),
      serpGoogleLocations: vi.fn(),
    },
    labs: {
      googleDomainRankOverviewLive: vi.fn(),
      googleRankedKeywordsLive: vi.fn(),
      googleCompetitorsDomainLive: vi.fn(),
      googleBulkKeywordDifficultyLive: vi.fn(),
      googleSearchIntentLive: vi.fn(),
      googleBulkTrafficEstimationLive: vi.fn(),
      googleKeywordSuggestionsLive: vi.fn(),
    },
    business: {
      googleMyBusinessInfoLive: vi.fn(),
      businessListingsSearchLive: vi.fn(),
    },
    domain: {},
    content: {},
  }
}

/**
 * Create a mock cache instance
 */
export function createMockCache() {
  const mockStore = new Map<string, unknown>()

  return {
    isEnabled: vi.fn().mockReturnValue(true),
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockStore.get(key) ?? null)
    }),
    set: vi.fn().mockImplementation((key: string, value: unknown) => {
      mockStore.set(key, value)
      return Promise.resolve()
    }),
    delete: vi.fn().mockImplementation((key: string) => {
      mockStore.delete(key)
      return Promise.resolve()
    }),
    getOrFetch: vi.fn().mockImplementation(async (key: string, fetchFn: () => Promise<unknown>) => {
      const cached = mockStore.get(key)
      if (cached !== undefined) {
        return cached
      }
      const result = await fetchFn()
      mockStore.set(key, result)
      return result
    }),
    getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, errors: 0 }),
    ping: vi.fn().mockResolvedValue(true),
    _store: mockStore, // Expose for test assertions
    _clear: () => mockStore.clear(), // Helper to reset between tests
  }
}

/**
 * Create mock environment variables helper
 */
export function mockEnvVars(vars: Record<string, string | undefined>) {
  const originalEnv = { ...process.env }

  return {
    setup: () => {
      Object.entries(vars).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = value
        }
      })
    },
    restore: () => {
      Object.keys(vars).forEach((key) => {
        if (originalEnv[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = originalEnv[key]
        }
      })
    },
  }
}

/**
 * Wait for a specified time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a mock API method that returns a specific response
 */
export function createMockApiMethod<T>(response: DataForSEOResponse<T>) {
  return vi.fn().mockResolvedValue(response)
}

/**
 * Create a mock API method that throws an error
 */
export function createMockApiMethodError(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}
