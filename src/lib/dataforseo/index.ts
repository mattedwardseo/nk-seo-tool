/**
 * DataForSEO Integration Module
 *
 * Provides a typed, rate-limited client for the DataForSEO API.
 */

// Main client
export {
  DataForSEOClient,
  DataForSEOAPIError,
  getDataForSEOClient,
  resetDataForSEOClient,
} from './client'

// Rate limiter
export {
  generalLimiter,
  tasksReadyLimiter,
  googleAdsLimiter,
  getLimiter,
  type LimiterType,
} from './rate-limiter'

// Types
export {
  STATUS_CODES,
  type DataForSEOResponse,
  type DataForSEOTask,
  type DataForSEOError,
  type DataForSEOConfig,
  type RequestOptions,
  type StatusCode,
  type BacklinksSummaryResult,
  type OnPageInstantResult,
  type PaginationParams,
  // Error classification
  ErrorCategory,
  type StepError,
  classifyError,
  isRetryableCategory,
  createStepError,
} from './types'

// Cache
export { DataForSEOCache, CacheKeys, CacheTTL, type CacheOptions } from './cache'

// API Modules
export { OnPageModule } from './modules/onpage'
export { SerpModule } from './modules/serp'
export { BacklinksModule } from './modules/backlinks'
export { KeywordsModule } from './modules/keywords'
export { LabsModule } from './modules/labs'
export { BusinessModule } from './modules/business'
export { BaseModule, type ExecuteOptions } from './modules/base-module'

// Re-export schemas for convenience
export * from './schemas'
