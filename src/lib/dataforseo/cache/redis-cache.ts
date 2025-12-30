/**
 * DataForSEO Redis Cache
 *
 * Upstash Redis caching layer for DataForSEO API responses.
 * Uses the getOrFetch pattern for transparent caching.
 */

import { Redis } from '@upstash/redis'
import { CacheTTL } from './cache-keys'

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Upstash Redis REST URL */
  url: string
  /** Upstash Redis REST Token */
  token: string
  /** Default TTL in seconds (default: 24 hours) */
  defaultTtl?: number
  /** Enable/disable caching (default: true) */
  enabled?: boolean
}

/**
 * Options for individual cache operations
 */
export interface CacheOptions {
  /** TTL in seconds (overrides default) */
  ttl?: number
  /** Skip cache read (force fresh fetch) */
  skipRead?: boolean
  /** Skip cache write (don't store result) */
  skipWrite?: boolean
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number
  misses: number
  errors: number
}

/**
 * DataForSEO Cache Manager
 *
 * Provides transparent caching for API responses using Upstash Redis.
 */
export class DataForSEOCache {
  private redis: Redis | null = null
  private enabled: boolean
  private defaultTtl: number
  private stats: CacheStats = { hits: 0, misses: 0, errors: 0 }

  constructor(config?: CacheConfig) {
    // Check environment variables if no config provided
    const url = config?.url || process.env.UPSTASH_REDIS_REST_URL
    const token = config?.token || process.env.UPSTASH_REDIS_REST_TOKEN
    const envEnabled = process.env.DATAFORSEO_CACHE_ENABLED !== 'false'

    this.enabled = config?.enabled ?? envEnabled
    this.defaultTtl = config?.defaultTtl ?? CacheTTL.ONPAGE

    // Only initialize Redis if we have credentials and caching is enabled
    if (this.enabled && url && token) {
      try {
        this.redis = new Redis({ url, token })
      } catch (error) {
        console.warn('[Cache] Failed to initialize Redis:', error)
        this.enabled = false
      }
    } else if (this.enabled) {
      console.warn('[Cache] Redis credentials not configured. Caching disabled.')
      this.enabled = false
    }
  }

  /**
   * Check if caching is enabled and operational
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null

    try {
      const value = await this.redis!.get<T>(key)
      if (value !== null) {
        this.stats.hits++
      } else {
        this.stats.misses++
      }
      return value
    } catch (error) {
      this.stats.errors++
      console.warn(`[Cache] Get error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isEnabled()) return

    try {
      const expirationTime = ttl ?? this.defaultTtl
      await this.redis!.setex(key, expirationTime, value)
    } catch (error) {
      this.stats.errors++
      console.warn(`[Cache] Set error for key ${key}:`, error)
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.isEnabled()) return

    try {
      await this.redis!.del(key)
    } catch (error) {
      this.stats.errors++
      console.warn(`[Cache] Delete error for key ${key}:`, error)
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Note: Use sparingly - scans can be slow on large datasets
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) return 0

    try {
      let deleted = 0
      let cursorPosition: number = 0

      // Scan and delete in batches
      const scanAndDelete = async (): Promise<void> => {
        const [nextCursor, keys] = await this.redis!.scan(cursorPosition, {
          match: pattern,
          count: 100,
        })

        if (keys.length > 0) {
          await this.redis!.del(...keys)
          deleted += keys.length
        }

        // Parse cursor - Upstash returns string or number depending on version
        cursorPosition = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor

        if (cursorPosition !== 0) {
          await scanAndDelete()
        }
      }

      await scanAndDelete()
      return deleted
    } catch (error) {
      this.stats.errors++
      console.warn(`[Cache] DeletePattern error for ${pattern}:`, error)
      return 0
    }
  }

  /**
   * Get or fetch pattern - the primary method for API caching
   *
   * Attempts to get cached value first, falls back to fetch function,
   * then caches the result for future use.
   */
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T> {
    // If caching is disabled or skipRead is true, just fetch
    if (!this.isEnabled() || options?.skipRead) {
      const result = await fetchFn()
      if (!options?.skipWrite) {
        await this.set(key, result, options?.ttl)
      }
      return result
    }

    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Cache miss - fetch fresh data
    const result = await fetchFn()

    // Store in cache (unless skipWrite)
    if (!options?.skipWrite) {
      await this.set(key, result, options?.ttl)
    }

    return result
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, errors: 0 }
  }

  /**
   * Check cache health by pinging Redis
   */
  async ping(): Promise<boolean> {
    if (!this.isEnabled()) return false

    try {
      const result = await this.redis!.ping()
      return result === 'PONG'
    } catch {
      return false
    }
  }
}

// Singleton instance
let cacheInstance: DataForSEOCache | null = null

/**
 * Get singleton cache instance
 */
export function getCache(config?: CacheConfig): DataForSEOCache {
  if (!cacheInstance) {
    cacheInstance = new DataForSEOCache(config)
  }
  return cacheInstance
}

/**
 * Reset cache instance (useful for testing)
 */
export function resetCache(): void {
  cacheInstance = null
}
