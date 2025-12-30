import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

/**
 * Global test environment setup for DataForSEO integration tests
 */

// Set default environment variables for tests
process.env.DATAFORSEO_LOGIN = 'test-login'
process.env.DATAFORSEO_PASSWORD = 'test-password'
process.env.DATAFORSEO_BASE_URL = 'https://api.dataforseo.com'
process.env.DATAFORSEO_TIMEOUT = '30000'
process.env.DATAFORSEO_RETRY_ATTEMPTS = '3'

// Cache is disabled by default in tests
process.env.DATAFORSEO_CACHE_ENABLED = 'false'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Reset modules after each test
afterEach(() => {
  vi.resetModules()
})
