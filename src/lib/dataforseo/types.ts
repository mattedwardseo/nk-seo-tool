/**
 * DataForSEO Custom Types
 *
 * Extended types and interfaces for DataForSEO API responses.
 * The official dataforseo-client provides base types, these extend them
 * for our specific use cases.
 */

// Base API response structure
export interface DataForSEOResponse<T> {
  id: string
  status_code: number
  status_message: string
  time: string
  cost: number
  tasks_count: number
  tasks_error: number
  tasks?: DataForSEOTask<T>[]
}

export interface DataForSEOTask<T> {
  id: string
  status_code: number
  status_message: string
  time: string
  cost: number
  result_count: number
  path: string[]
  data: Record<string, unknown>
  result: T[] | null
}

// Status codes
export const STATUS_CODES = {
  SUCCESS: 20000,
  SUCCESS_PARTIAL: 20100,
  PAYMENT_REQUIRED: 40200,
  RATE_LIMIT_EXCEEDED: 40202,
  NOT_FOUND: 40400,
  INVALID_REQUEST: 40001,
  AUTH_ERROR: 40100,
  INTERNAL_ERROR: 50000,
} as const

export type StatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES]

// Error response
export interface DataForSEOError {
  code: number
  message: string
  http_code?: number
}

/**
 * Error categories for retry logic and failure handling
 */
export enum ErrorCategory {
  /** Transient errors that may succeed on retry (rate limit, timeout, 5xx) */
  RETRYABLE = 'retryable',
  /** Permanent errors that will not succeed on retry (auth, invalid input) */
  PERMANENT = 'permanent',
  /** Account/quota issues requiring user action */
  QUOTA = 'quota',
  /** Request succeeded but with partial data (some tasks failed) */
  PARTIAL = 'partial',
}

/**
 * Extended error info for step execution tracking
 */
export interface StepError {
  message: string
  category: ErrorCategory
  code?: number
  httpCode?: number
  retryable: boolean
  timestamp: Date
}

/**
 * Classify an error to determine retry behavior
 *
 * @param error - The error to classify (can be DataForSEOError, Error, or unknown)
 * @param statusCode - Optional API status code for more accurate classification
 * @returns ErrorCategory indicating how to handle the error
 */
export function classifyError(
  error: DataForSEOError | Error | unknown,
  statusCode?: number
): ErrorCategory {
  // Check status code first if provided
  if (statusCode !== undefined) {
    // Success codes (shouldn't be here, but handle gracefully)
    if (statusCode >= 20000 && statusCode < 30000) {
      if (statusCode === STATUS_CODES.SUCCESS_PARTIAL) {
        return ErrorCategory.PARTIAL
      }
      return ErrorCategory.RETRYABLE // Treat unexpected success codes as retry
    }

    // Payment/quota errors (4020x range)
    if (
      statusCode === STATUS_CODES.PAYMENT_REQUIRED ||
      statusCode === STATUS_CODES.RATE_LIMIT_EXCEEDED
    ) {
      return statusCode === STATUS_CODES.RATE_LIMIT_EXCEEDED
        ? ErrorCategory.RETRYABLE
        : ErrorCategory.QUOTA
    }

    // Auth errors
    if (statusCode === STATUS_CODES.AUTH_ERROR) {
      return ErrorCategory.PERMANENT
    }

    // Invalid request errors (400xx range)
    if (statusCode >= 40000 && statusCode < 40200) {
      return ErrorCategory.PERMANENT
    }

    // Server errors (5xxxx range) - retryable
    if (statusCode >= 50000) {
      return ErrorCategory.RETRYABLE
    }
  }

  // Check error message for patterns
  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as DataForSEOError).message).toLowerCase()
        : String(error).toLowerCase()

  // Rate limit patterns
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    return ErrorCategory.RETRYABLE
  }

  // Payment/quota patterns
  if (
    errorMessage.includes('payment') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('insufficient') ||
    errorMessage.includes('402')
  ) {
    return ErrorCategory.QUOTA
  }

  // Auth patterns
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('invalid credentials') ||
    errorMessage.includes('401')
  ) {
    return ErrorCategory.PERMANENT
  }

  // Invalid input patterns
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('malformed') ||
    errorMessage.includes('bad request') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist')
  ) {
    return ErrorCategory.PERMANENT
  }

  // Timeout/network patterns - retryable
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('network') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('socket')
  ) {
    return ErrorCategory.RETRYABLE
  }

  // Server error patterns
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('internal server') ||
    errorMessage.includes('service unavailable')
  ) {
    return ErrorCategory.RETRYABLE
  }

  // Default to retryable for unknown errors (safer to retry than fail immediately)
  return ErrorCategory.RETRYABLE
}

/**
 * Check if an error category should be retried
 */
export function isRetryableCategory(category: ErrorCategory): boolean {
  return category === ErrorCategory.RETRYABLE
}

/**
 * Create a StepError from various error types
 */
export function createStepError(
  error: DataForSEOError | Error | unknown,
  statusCode?: number
): StepError {
  const category = classifyError(error, statusCode)

  let message: string
  let code: number | undefined
  let httpCode: number | undefined

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    const dfError = error as DataForSEOError
    message = dfError.message
    code = dfError.code
    httpCode = dfError.http_code
  } else {
    message = String(error)
  }

  return {
    message,
    category,
    code: code ?? statusCode,
    httpCode,
    retryable: isRetryableCategory(category),
    timestamp: new Date(),
  }
}

// Common pagination params
export interface PaginationParams {
  limit?: number
  offset?: number
}

// Backlinks summary result type
export interface BacklinksSummaryResult {
  target: string
  first_seen: string
  rank: number
  backlinks: number
  backlinks_spam_score: number
  crawled_pages: number
  info: {
    server: string
    ip_address: string
    country: string
    target_spam_score: number
  }
  internal_links_count: number
  external_links_count: number
  broken_backlinks: number
  broken_pages: number
  referring_domains: number
  referring_domains_nofollow: number
  referring_main_domains: number
  referring_main_domains_nofollow: number
  referring_ips: number
  referring_subnets: number
  referring_pages: number
  referring_pages_nofollow: number
  referring_links_tld: Record<string, number>
  referring_links_types: Record<string, number>
  referring_links_attributes: Record<string, number>
  referring_links_platform_types: Record<string, number>
  referring_links_semantic_locations: Record<string, number>
  referring_links_countries: Record<string, number>
}

// OnPage instant pages result type
export interface OnPageInstantResult {
  resource_type: string
  status_code: number
  url: string
  meta: {
    title: string
    charset: number
    follow: boolean
    htags: Record<string, string[]>
    external_links_count: number
    title_length: number
    cumulative_layout_shift: number
    content: {
      plain_text_size: number
      plain_text_rate: number
      plain_text_word_count: number
      automated_readability_index: number
      coleman_liau_readability_index: number
      dale_chall_readability_index: number
      flesch_kincaid_readability_index: number
      smog_readability_index: number
      title_to_content_consistency: number
    }
  }
  page_timing: {
    time_to_interactive: number
    dom_complete: number
    largest_contentful_paint: number
    first_input_delay: number
    connection_time: number
    time_to_secure_connection: number
    duration_time: number
    fetch_end: number
  }
  onpage_score: number
  total_dom_size: number
  size: number
  encoded_size: number
  total_transfer_size: number
  fetch_time: string
  cache_control: {
    cachable: boolean
    ttl: number
  }
  checks: Record<string, boolean>
  media_type: string
  url_length: number
  relative_url_length: number
  last_modified?: {
    header: string
  }
}

// Client configuration
export interface DataForSEOConfig {
  username: string
  password: string
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
}

// Request options
export interface RequestOptions {
  limiterType?: 'general' | 'tasksReady' | 'googleAds'
  timeout?: number
  retryOnRateLimit?: boolean
}
