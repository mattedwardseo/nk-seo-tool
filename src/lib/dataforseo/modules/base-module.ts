/**
 * Base Module Class
 *
 * Abstract base class for all DataForSEO API module wrappers.
 * Provides common functionality for caching, rate limiting, and error handling.
 */

import type { z } from 'zod'
import type { DataForSEOClient } from '../client'
import type { DataForSEOCache, CacheOptions } from '../cache'
import type { LimiterType } from '../rate-limiter'
import type { DataForSEOResponse, DataForSEOTask } from '../types'
import { STATUS_CODES } from '../types'

/**
 * Options for module method execution
 */
export interface ExecuteOptions {
  /** Type of rate limiter to use */
  limiterType?: LimiterType
  /** Cache options */
  cache?: CacheOptions
  /** Skip caching entirely for this request */
  skipCache?: boolean
}

/**
 * Base class for DataForSEO API modules
 */
export abstract class BaseModule {
  protected readonly client: DataForSEOClient
  protected readonly cache: DataForSEOCache | null
  protected readonly defaultLimiter: LimiterType = 'general'

  constructor(client: DataForSEOClient, cache?: DataForSEOCache | null) {
    this.client = client
    this.cache = cache ?? null
  }

  /**
   * Execute an API call with rate limiting
   */
  protected async execute<T>(apiCall: () => Promise<T>, limiterType?: LimiterType): Promise<T> {
    return this.client.execute(apiCall, limiterType ?? this.defaultLimiter)
  }

  /**
   * Execute an API call with caching support
   */
  protected async executeWithCache<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    options?: ExecuteOptions
  ): Promise<T> {
    // If no cache or skipCache is true, just execute
    if (!this.cache || options?.skipCache) {
      return this.execute(apiCall, options?.limiterType)
    }

    // Use cache.getOrFetch pattern
    return this.cache.getOrFetch(
      cacheKey,
      () => this.execute(apiCall, options?.limiterType),
      options?.cache
    )
  }

  /**
   * Validate input using a Zod schema
   */
  protected validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
    return schema.parse(input)
  }

  /**
   * Extract results from a DataForSEO API response
   * Returns the first successful task's results
   */
  protected extractResults<T>(response: DataForSEOResponse<T> | null | undefined): T[] {
    if (!response?.tasks) {
      return []
    }

    return response.tasks
      .filter(
        (task): task is DataForSEOTask<T> & { result: T[] } =>
          task.status_code === STATUS_CODES.SUCCESS && task.result !== null
      )
      .flatMap((task) => task.result)
  }

  /**
   * Extract first result from a DataForSEO API response
   */
  protected extractFirstResult<T>(response: DataForSEOResponse<T> | null | undefined): T | null {
    const results = this.extractResults(response)
    return results[0] ?? null
  }

  /**
   * Check if response was successful
   */
  protected isSuccess(response: DataForSEOResponse<unknown> | null | undefined): boolean {
    if (!response) return false
    return (
      response.status_code === STATUS_CODES.SUCCESS ||
      response.status_code === STATUS_CODES.SUCCESS_PARTIAL
    )
  }

  /**
   * Get total cost from response
   */
  protected getCost(response: DataForSEOResponse<unknown> | null | undefined): number {
    return response?.cost ?? 0
  }

  /**
   * Check if there were any task errors
   */
  protected hasErrors(response: DataForSEOResponse<unknown> | null | undefined): boolean {
    if (!response) return true
    return response.tasks_error > 0
  }

  /**
   * Get error messages from failed tasks
   */
  protected getErrors(response: DataForSEOResponse<unknown> | null | undefined): string[] {
    if (!response?.tasks) return []

    return response.tasks
      .filter((task) => task.status_code !== STATUS_CODES.SUCCESS)
      .map((task) => `[${task.status_code}] ${task.status_message}`)
  }
}
