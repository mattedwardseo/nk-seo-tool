/**
 * DataForSEO AI Optimization API Module
 * 
 * Provides access to:
 * - LLM Responses API: Query AI models (ChatGPT, Claude, Gemini, Perplexity)
 * - LLM Mentions API: Track brand mentions across AI platforms
 * - AI Keyword Data API: Get AI-specific keyword insights
 * 
 * API Documentation: https://docs.dataforseo.com/v3/ai_optimization/overview/
 */

import { getDataForSEOClient } from '../client'

const dataForSEOClient = getDataForSEOClient()

// ============================================================================
// Types
// ============================================================================

export type LLMPlatform = 'google' | 'chat_gpt' | 'claude' | 'gemini' | 'perplexity'

// LLM Mentions API Types
export interface LLMMentionsSearchRequest {
  target: LLMMentionsTargetEntity[]
  location_name?: string
  location_code?: number
  language_name?: string
  language_code?: string
  ai_platform?: 'google' | 'chat_gpt'
  limit?: number
  offset?: number
  tag?: string
}

export interface LLMMentionsTargetEntity {
  domain?: string
  keyword?: string
  search_filter?: 'include' | 'exclude'
  search_scope?: ('any' | 'question' | 'answer' | 'brand_entities' | 'fan_out_queries' | 'source' | 'search_result')[]
  match_type?: 'word_match' | 'partial_match'
  include_subdomain?: boolean
}

export interface LLMMentionsSearchResult {
  keyword: string
  type: string
  location_code: number
  language_code: string
  items_count: number
  items: LLMMentionItem[]
}

export interface LLMMentionItem {
  type: string
  position: number
  title: string
  category: string
  fan_out_queries?: string[]
  ai_search_volume?: number
  impressions?: number
  mentions_count?: number
  quoted_links?: {
    url: string
    domain: string
  }[]
}

// LLM Responses API Types
export interface LLMResponsesRequest {
  keyword: string
  location_code?: number
  language_code?: string
  depth?: number
  tag?: string
}

export interface LLMResponsesResult {
  keyword: string
  type: string
  se_domain: string
  location_code: number
  language_code: string
  check_url: string
  datetime: string
  items_count: number
  items: LLMResponseItem[]
}

export interface LLMResponseItem {
  type: string
  answer: string
  citations?: LLMCitation[]
  related_questions?: string[]
  brand_mentions?: LLMBrandMention[]
}

export interface LLMCitation {
  url: string
  title: string
  snippet?: string
  domain: string
}

export interface LLMBrandMention {
  name: string
  url?: string
  type: string
  category?: string
}

// AI Keyword Data Types
export interface AIKeywordDataRequest {
  keywords: string[]
  location_code?: number
  language_code?: string
  tag?: string
}

export interface AIKeywordDataResult {
  keyword: string
  ai_search_volume: number
  impressions: number
  clicks?: number
  ctr?: number
}

// ============================================================================
// LLM Mentions API
// https://docs.dataforseo.com/v3/ai_optimization/llm_mentions/overview/
// ============================================================================

/**
 * Search for domain/keyword mentions across AI platforms
 * Endpoint: /v3/ai_optimization/llm_mentions/search/live
 */
export async function searchLLMMentionsLive(
  request: LLMMentionsSearchRequest
): Promise<LLMMentionsSearchResult | null> {
  try {
    const response = await dataForSEOClient.post('/v3/ai_optimization/llm_mentions/search/live', [request])
    
    if (!response.tasks || response.tasks.length === 0) {
      console.error('LLM Mentions API: No tasks in response')
      return null
    }

    const task = response.tasks[0]
    
    // Check for API errors
    if (task.status_code !== 20000) {
      console.error('LLM Mentions API error:', {
        status_code: task.status_code,
        status_message: task.status_message,
        request: request,
      })
      return null
    }

    // Check if result exists and has data
    if (!task.result || task.result.length === 0) {
      // No results found - this is not necessarily an error, just no mentions
      return null
    }

    const result = task.result[0] as LLMMentionsSearchResult
    
    // Ensure items array exists even if empty
    if (!result.items) {
      result.items = []
    }
    
    return result
  } catch (error) {
    console.error('LLM Mentions API request failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return null
  }
}

/**
 * Get aggregated mention metrics for a domain/keyword
 * Endpoint: /v3/ai_optimization/llm_mentions/aggregated_metrics/live
 */
export async function getLLMAggregatedMetrics(
  target: LLMMentionsTargetEntity[],
  options: {
    locationCode?: number
    languageCode?: string
    aiPlatform?: 'google' | 'chat_gpt'
  } = {}
): Promise<{
  ai_search_volume: number
  impressions: number
  mentions_count: number
  platforms: { platform: string; mentions_count: number }[]
} | null> {
  const {
    locationCode = 2840,
    languageCode = 'en',
    aiPlatform,
  } = options

  const response = await dataForSEOClient.post('/v3/ai_optimization/llm_mentions/aggregated_metrics/live', [{
    target,
    location_code: locationCode,
    language_code: languageCode,
    ai_platform: aiPlatform,
  }])

  if (!response.tasks || response.tasks.length === 0 || !response.tasks[0].result) {
    return null
  }

  return response.tasks[0].result[0]
}

// ============================================================================
// LLM Responses API
// https://docs.dataforseo.com/v3/ai_optimization/llm_responses/overview/
// ============================================================================

/**
 * Query ChatGPT for responses (Live API)
 * Endpoint: /v3/ai_optimization/llm_responses/chatgpt/live
 */
export async function queryChatGPT(
  keyword: string,
  options: {
    locationCode?: number
    languageCode?: string
    depth?: number
  } = {}
): Promise<LLMResponsesResult | null> {
  try {
    const {
      locationCode = 2840,
      languageCode = 'en',
      depth = 0,
    } = options

    const response = await dataForSEOClient.post('/v3/ai_optimization/llm_responses/chatgpt/live', [{
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      depth,
    }])

    if (!response.tasks || response.tasks.length === 0) {
      console.error('ChatGPT API: No tasks in response')
      return null
    }

    const task = response.tasks[0]
    
    if (task.status_code !== 20000) {
      console.error('ChatGPT API error:', {
        status_code: task.status_code,
        status_message: task.status_message,
        keyword,
      })
      return null
    }

    if (!task.result || task.result.length === 0) {
      return null
    }

    return task.result[0] as LLMResponsesResult
  } catch (error) {
    console.error('ChatGPT API request failed:', error)
    return null
  }
}

/**
 * Query Gemini for responses (Live API)
 * Endpoint: /v3/ai_optimization/llm_responses/gemini/live
 */
export async function queryGemini(
  keyword: string,
  options: {
    locationCode?: number
    languageCode?: string
    depth?: number
  } = {}
): Promise<LLMResponsesResult | null> {
  const {
    locationCode = 2840,
    languageCode = 'en',
    depth = 0,
  } = options

  const response = await dataForSEOClient.post('/v3/ai_optimization/llm_responses/gemini/live', [{
    keyword,
    location_code: locationCode,
    language_code: languageCode,
    depth,
  }])

  if (!response.tasks || response.tasks.length === 0 || !response.tasks[0].result) {
    return null
  }

  return response.tasks[0].result[0] as LLMResponsesResult
}

/**
 * Query Perplexity for responses (Live API)
 * Endpoint: /v3/ai_optimization/llm_responses/perplexity/live
 */
export async function queryPerplexity(
  keyword: string,
  options: {
    locationCode?: number
    languageCode?: string
  } = {}
): Promise<LLMResponsesResult | null> {
  const {
    locationCode = 2840,
    languageCode = 'en',
  } = options

  const response = await dataForSEOClient.post('/v3/ai_optimization/llm_responses/perplexity/live', [{
    keyword,
    location_code: locationCode,
    language_code: languageCode,
  }])

  if (!response.tasks || response.tasks.length === 0 || !response.tasks[0].result) {
    return null
  }

  return response.tasks[0].result[0] as LLMResponsesResult
}

/**
 * Get Google AI Overview for a query
 * Endpoint: /v3/ai_optimization/llm_responses/google/live
 */
export async function queryGoogleAIOverview(
  keyword: string,
  options: {
    locationCode?: number
    languageCode?: string
    depth?: number
  } = {}
): Promise<LLMResponsesResult | null> {
  try {
    const {
      locationCode = 2840,
      languageCode = 'en',
      depth = 0,
    } = options

    const response = await dataForSEOClient.post('/v3/ai_optimization/llm_responses/google/live/advanced', [{
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      depth,
    }])

    if (!response.tasks || response.tasks.length === 0) {
      console.error('Google AI Overview API: No tasks in response')
      return null
    }

    const task = response.tasks[0]
    
    if (task.status_code !== 20000) {
      console.error('Google AI Overview API error:', {
        status_code: task.status_code,
        status_message: task.status_message,
        keyword,
      })
      return null
    }

    if (!task.result || task.result.length === 0) {
      return null
    }

    return task.result[0] as LLMResponsesResult
  } catch (error) {
    console.error('Google AI Overview API request failed:', error)
    return null
  }
}

// ============================================================================
// AI Keyword Data API
// https://docs.dataforseo.com/v3/ai_optimization/ai_keyword_data/overview/
// ============================================================================

/**
 * Get AI search volume for keywords
 * Endpoint: /v3/ai_optimization/ai_keyword_data/search_volume/live
 */
export async function getAIKeywordSearchVolume(
  keywords: string[],
  options: {
    locationCode?: number
    languageCode?: string
  } = {}
): Promise<AIKeywordDataResult[]> {
  const {
    locationCode = 2840,
    languageCode = 'en',
  } = options

  const response = await dataForSEOClient.post('/v3/ai_optimization/ai_keyword_data/search_volume/live', [{
    keywords,
    location_code: locationCode,
    language_code: languageCode,
  }])

  if (!response.tasks || response.tasks.length === 0 || !response.tasks[0].result) {
    return []
  }

  return response.tasks[0].result as AIKeywordDataResult[]
}

// ============================================================================
// AI Visibility Analysis (Composite Function)
// ============================================================================

export interface AIVisibilityAnalysis {
  domain: string
  businessName: string
  overallScore: number // 0-100
  platformScores: {
    platform: string
    mentionRate: number
    citationRate: number
    impressions: number
    mentionsCount: number
  }[]
  keywordMentions: {
    keyword: string
    mentioned: boolean
    platform: string
    position?: number
    context?: string
  }[]
  competitors: {
    name: string
    mentionsCount: number
    visibilityScore: number
  }[]
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    suggestion: string
  }[]
}

/**
 * Analyze AI visibility for a business across platforms
 * Uses LLM Mentions API to check if business is mentioned in AI responses
 */
export async function analyzeAIVisibility(
  businessName: string,
  domain: string,
  keywords: string[],
  options: {
    locationCode?: number
    languageCode?: string
    platforms?: ('google' | 'chat_gpt')[]
  } = {}
): Promise<AIVisibilityAnalysis> {
  const {
    locationCode = 2840,
    languageCode = 'en',
    platforms = ['google', 'chat_gpt'],
  } = options

  const analysis: AIVisibilityAnalysis = {
    domain,
    businessName,
    overallScore: 0,
    platformScores: [],
    keywordMentions: [],
    competitors: [],
    recommendations: [],
  }

  // Track mentions across platforms
  let totalMentions = 0
  let totalQueries = 0
  let totalCitations = 0

  for (const platform of platforms) {
    let platformMentions = 0
    let platformCitations = 0
    let platformImpressions = 0

    // Search for domain mentions for each keyword
    for (const keyword of keywords.slice(0, 10)) { // Limit to control costs
      try {
        const result = await searchLLMMentionsLive({
          target: [
            { domain, search_filter: 'include' },
            { keyword, search_filter: 'include', match_type: 'word_match' },
          ],
          location_code: locationCode,
          language_code: languageCode,
          ai_platform: platform,
          limit: 10,
        })

        totalQueries++

        if (result && result.items_count > 0) {
          platformMentions += result.items_count
          totalMentions++
          
          // Track citation rate from quoted_links
          for (const item of result.items) {
            if (item.quoted_links && item.quoted_links.length > 0) {
              platformCitations++
              totalCitations++
            }
            if (item.impressions) {
              platformImpressions += item.impressions
            }

            analysis.keywordMentions.push({
              keyword,
              mentioned: true,
              platform,
              position: item.position,
              context: item.title,
            })
          }
        } else {
          analysis.keywordMentions.push({
            keyword,
            mentioned: false,
            platform,
          })
        }
      } catch (error) {
        console.error(`Error analyzing ${platform} for "${keyword}":`, error)
      }
    }

    analysis.platformScores.push({
      platform: platform === 'google' ? 'Google AI Overview' : 'ChatGPT',
      mentionRate: totalQueries > 0 ? platformMentions / keywords.length : 0,
      citationRate: platformMentions > 0 ? platformCitations / platformMentions : 0,
      impressions: platformImpressions,
      mentionsCount: platformMentions,
    })
  }

  // Calculate overall visibility score
  const mentionRate = totalQueries > 0 ? totalMentions / totalQueries : 0
  const citationRate = totalMentions > 0 ? totalCitations / totalMentions : 0
  analysis.overallScore = Math.round((mentionRate * 0.6 + citationRate * 0.4) * 100)

  // Generate recommendations based on analysis
  if (analysis.overallScore < 30) {
    analysis.recommendations.push({
      priority: 'high',
      category: 'Content Strategy',
      suggestion: `Your ${businessName} has low visibility in AI responses. Create comprehensive FAQ content, detailed service pages, and authoritative guides that answer common local queries.`,
    })
  }

  if (totalCitations === 0) {
    analysis.recommendations.push({
      priority: 'high',
      category: 'Citation Building',
      suggestion: 'AI models are not citing your website. Ensure your pages have clear, structured content with Schema.org markup. Build authority through quality backlinks from industry sites.',
    })
  }

  const googleScore = analysis.platformScores.find(p => p.platform === 'Google AI Overview')
  const chatGPTScore = analysis.platformScores.find(p => p.platform === 'ChatGPT')

  if (googleScore && chatGPTScore && googleScore.mentionRate > chatGPTScore.mentionRate * 2) {
    analysis.recommendations.push({
      priority: 'medium',
      category: 'Platform Optimization',
      suggestion: 'Your visibility is stronger in Google AI Overview than ChatGPT. To improve ChatGPT visibility, focus on getting mentioned in training data sources like Wikipedia, major news sites, and industry publications.',
    })
  }

  if (analysis.overallScore >= 30 && analysis.overallScore < 60) {
    analysis.recommendations.push({
      priority: 'medium',
      category: 'Local Authority',
      suggestion: 'Build more local authority by getting reviews, maintaining an active Google Business Profile, and creating location-specific content that AI models can reference.',
    })
  }

  if (analysis.overallScore >= 60) {
    analysis.recommendations.push({
      priority: 'low',
      category: 'Maintenance',
      suggestion: 'Your AI visibility is good. Continue monitoring and maintain your content freshness, reviews, and local citations to preserve your visibility.',
    })
  }

  return analysis
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract business mentions from an AI response
 */
export function extractMentionsFromResponse(
  response: string,
  targetName: string
): { mentioned: boolean; context: string | null; sentiment: 'positive' | 'neutral' | 'negative' } {
  const lowerResponse = response.toLowerCase()
  const lowerTarget = targetName.toLowerCase()
  
  const mentioned = lowerResponse.includes(lowerTarget)
  
  if (!mentioned) {
    return { mentioned: false, context: null, sentiment: 'neutral' }
  }

  // Extract context around the mention
  const index = lowerResponse.indexOf(lowerTarget)
  const start = Math.max(0, index - 100)
  const end = Math.min(response.length, index + targetName.length + 100)
  const context = response.substring(start, end)

  // Simple sentiment analysis (in production, use a proper NLP library)
  const positiveWords = ['best', 'excellent', 'great', 'top', 'recommended', 'trusted', 'quality']
  const negativeWords = ['avoid', 'bad', 'poor', 'worst', 'not recommended', 'issues']
  
  const contextLower = context.toLowerCase()
  const hasPositive = positiveWords.some(word => contextLower.includes(word))
  const hasNegative = negativeWords.some(word => contextLower.includes(word))
  
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (hasPositive && !hasNegative) sentiment = 'positive'
  if (hasNegative && !hasPositive) sentiment = 'negative'

  return { mentioned, context, sentiment }
}

/**
 * Calculate visibility score from mentions data
 */
export function calculateVisibilityScore(
  mentionRate: number,
  averagePosition: number,
  sentimentScore: number,
  citationRate: number
): number {
  // Weighted formula for visibility score
  const mentionWeight = 0.35
  const positionWeight = 0.25
  const sentimentWeight = 0.20
  const citationWeight = 0.20

  // Normalize position (lower is better, max 10)
  const positionScore = averagePosition > 0 ? Math.max(0, 1 - (averagePosition - 1) / 9) : 0

  // Normalize sentiment (-1 to 1 → 0 to 1)
  const normalizedSentiment = (sentimentScore + 1) / 2

  const score = 
    (mentionRate * mentionWeight) +
    (positionScore * positionWeight) +
    (normalizedSentiment * sentimentWeight) +
    (citationRate * citationWeight)

  return Math.round(score * 100)
}

