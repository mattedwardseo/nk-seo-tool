/**
 * DataForSEO Rate Limiter
 *
 * Uses Bottleneck to manage API rate limits:
 * - 2,000 requests/minute general limit
 * - 33.33ms minimum time between requests
 * - 30 concurrent connections maximum
 */

import Bottleneck from 'bottleneck'

// General rate limiter for most endpoints
export const generalLimiter = new Bottleneck({
  maxConcurrent: 30,
  minTime: 34, // ~33.33ms = 2000 req/min
  reservoir: 2000,
  reservoirRefreshAmount: 2000,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
})

// Stricter limiter for tasksReady endpoint (20/min)
export const tasksReadyLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 3000, // 3 seconds between requests
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000,
})

// Stricter limiter for live Google Ads (12/min)
export const googleAdsLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 5000, // 5 seconds between requests
  reservoir: 12,
  reservoirRefreshAmount: 12,
  reservoirRefreshInterval: 60 * 1000,
})

// Event handlers for monitoring
generalLimiter.on('failed', async (error, jobInfo) => {
  console.error('[DataForSEO] Request failed:', error.message)
  if (jobInfo.retryCount < 3) {
    // Retry with exponential backoff
    const delay = Math.pow(2, jobInfo.retryCount) * 1000
    console.log(`[DataForSEO] Retrying in ${delay}ms...`)
    return delay
  }
  return undefined // Don't retry after 3 attempts
})

generalLimiter.on('retry', (_error, jobInfo) => {
  console.log(`[DataForSEO] Retry attempt ${jobInfo.retryCount + 1}`)
})

// Export types for limiter selection
export type LimiterType = 'general' | 'tasksReady' | 'googleAds'

export function getLimiter(type: LimiterType): Bottleneck {
  switch (type) {
    case 'tasksReady':
      return tasksReadyLimiter
    case 'googleAds':
      return googleAdsLimiter
    default:
      return generalLimiter
  }
}
