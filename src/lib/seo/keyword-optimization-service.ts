/**
 * Keyword Optimization Audit Service
 *
 * Gathers data from multiple DataForSEO APIs to analyze
 * how well a page is optimized for a target keyword.
 *
 * Includes fallback logic for "dentist + city" keywords that
 * Google Ads blocks - uses Historical Keyword Data API.
 */

import { getDataForSEOClient } from '@/lib/dataforseo/client'
import { LabsModule } from '@/lib/dataforseo/modules/labs'
import { SerpModule } from '@/lib/dataforseo/modules/serp'
import { BacklinksModule } from '@/lib/dataforseo/modules/backlinks'

// Types for the audit data
export interface KeywordOptimizationData {
  // Domain metrics
  domainRank: number | null
  organicKeywordsCount: number
  estimatedTrafficValue: number
  referringDomains: number
  backlinks: number
  spamScore: number | null

  // Target keyword metrics
  targetKeyword: string
  searchVolume: number | null
  cpc: number | null
  keywordDifficulty: number | null
  currentPosition: number | null
  searchIntent: string | null

  // Historical data fallback info
  volumeSource: 'current' | 'historical'
  historicalDate: string | null

  // SERP analysis
  serpFeatures: {
    hasLocalPack: boolean
    hasFeaturedSnippet: boolean
    hasPeopleAlsoAsk: boolean
    organicResultsCount: number
  }
  topCompetitors: Array<{
    domain: string
    position: number
    title: string
  }>

  // Current rankings for related keywords
  rankedKeywords: Array<{
    keyword: string
    position: number
    searchVolume: number | null
    cpc: number | null
    url: string
  }>

  // Keyword opportunities (suggestions)
  keywordOpportunities: Array<{
    keyword: string
    searchVolume: number | null
    cpc: number | null
    difficulty: number | null
    intent: string | null
  }>

  // API costs
  apiCost: number
}

/**
 * Check if a keyword is a "dentist + city" pattern that may need historical fallback
 */
function isDentistCityKeyword(keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase().trim()

  // Common dental + location patterns
  const dentalTerms = [
    'dentist',
    'dental',
    'dentistry',
    'orthodontist',
    'periodontist',
    'endodontist',
    'oral surgeon',
    'cosmetic dentist',
    'pediatric dentist',
    'family dentist',
    'emergency dentist',
  ]

  // Check if keyword contains a dental term
  const hasDentalTerm = dentalTerms.some((term) => normalizedKeyword.includes(term))

  if (!hasDentalTerm) return false

  // Check for location patterns (city names, state abbreviations, "near me")
  // Keywords like "dentist chicago", "dentist in chicago", "dentist chicago il"
  const locationPatterns = [
    /\b(in|near|around)\s+\w+/i, // "in chicago", "near me"
    /\b[a-z]+\s+(il|tx|ca|ny|fl|pa|oh|ga|nc|mi|nj|va|wa|az|ma|tn|in|mo|md|wi|co|mn|sc|al|la|ky|or|ok|ct|ut|ia|nv|ar|ms|ks|nm|ne|wv|id|hi|nh|me|mt|ri|de|sd|nd|ak|vt|wy|dc)\b/i, // city + state abbr
    /\b\w+,?\s*(illinois|texas|california|new york|florida|pennsylvania|ohio|georgia|north carolina|michigan)/i, // city + full state
    /\bnear\s+me\b/i,
  ]

  const hasLocationPattern = locationPatterns.some((pattern) => pattern.test(normalizedKeyword))

  // If it has a dental term and either has a location pattern OR is just "dentist <word>"
  // (which is likely "dentist cityname")
  if (hasLocationPattern) return true

  // Check for simple "dentist cityname" pattern (2-3 words with dental term)
  const words = normalizedKeyword.split(/\s+/)
  if (words.length >= 2 && words.length <= 4 && hasDentalTerm) {
    return true
  }

  return false
}

/**
 * Get the most recent search volume from historical data
 */
function getMostRecentVolume(
  historicalData: Array<{
    year: number
    month: number
    search_volume: number | null
  }>
): { volume: number | null; date: string | null } {
  if (!historicalData || historicalData.length === 0) {
    return { volume: null, date: null }
  }

  // Sort by year and month descending
  const sorted = [...historicalData].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  // Find first non-null volume
  for (const item of sorted) {
    if (item.search_volume !== null && item.search_volume > 0) {
      return {
        volume: item.search_volume,
        date: `${item.year}-${String(item.month).padStart(2, '0')}`,
      }
    }
  }

  return { volume: null, date: null }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // If URL parsing fails, try to extract domain from string
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url
  }
}

/**
 * Gather all data needed for keyword optimization audit
 */
export async function gatherKeywordOptimizationData(
  url: string,
  targetKeyword: string,
  locationName?: string
): Promise<KeywordOptimizationData> {
  const client = getDataForSEOClient()
  const labs = new LabsModule(client)
  const serp = new SerpModule(client)
  const backlinks = new BacklinksModule(client)

  const domain = extractDomain(url)
  let apiCost = 0

  // Estimate costs (rough estimates based on DataForSEO pricing)
  const COST_ESTIMATES = {
    rankedKeywords: 0.02,
    domainRank: 0.01,
    serpOrganic: 0.003,
    backlinksSummary: 0.002,
    keywordSuggestions: 0.02,
    historicalKeyword: 0.01,
    searchIntent: 0.01,
  }

  // 1. Get domain rank overview
  let domainRank: number | null = null
  let organicKeywordsCount = 0
  let estimatedTrafficValue = 0

  try {
    const domainOverview = await labs.getDomainRankOverview({
      target: domain,
      locationName: locationName || 'United States',
      languageCode: 'en',
    })
    apiCost += COST_ESTIMATES.domainRank

    if (domainOverview) {
      domainRank = domainOverview.metrics?.organic?.count ?
        Math.round((domainOverview.metrics.organic.pos_1 ?? 0) * 10 +
          (domainOverview.metrics.organic.pos_2_3 ?? 0) * 5 +
          (domainOverview.metrics.organic.pos_4_10 ?? 0) * 2) : null
      organicKeywordsCount = domainOverview.metrics?.organic?.count ?? 0
      estimatedTrafficValue = domainOverview.metrics?.organic?.etv ?? 0
    }
  } catch (error) {
    console.error('Error fetching domain rank:', error)
  }

  // 2. Get ranked keywords for the domain
  let rankedKeywords: KeywordOptimizationData['rankedKeywords'] = []
  try {
    const rankedData = await labs.getRankedKeywords({
      target: domain,
      locationName: locationName || 'United States',
      languageCode: 'en',
      itemTypes: ['organic'],
      limit: 50,
    })
    apiCost += COST_ESTIMATES.rankedKeywords

    rankedKeywords = rankedData.map((item) => ({
      keyword: item.keyword_data.keyword,
      position: item.ranked_serp_element.serp_item.rank_group ?? 0,
      searchVolume: item.keyword_data.keyword_info?.search_volume ?? null,
      cpc: item.keyword_data.keyword_info?.cpc ?? null,
      url: item.ranked_serp_element.serp_item.url ?? '',
    }))
  } catch (error) {
    console.error('Error fetching ranked keywords:', error)
  }

  // 3. Get live SERP for target keyword
  let currentPosition: number | null = null
  let serpFeatures = {
    hasLocalPack: false,
    hasFeaturedSnippet: false,
    hasPeopleAlsoAsk: false,
    organicResultsCount: 0,
  }
  let topCompetitors: KeywordOptimizationData['topCompetitors'] = []

  try {
    // Use location name for SERP if provided
    const serpResults = await serp.googleOrganicSearch({
      keyword: targetKeyword,
      locationName: locationName || 'United States',
      languageCode: 'en',
      depth: 20,
    })
    apiCost += COST_ESTIMATES.serpOrganic

    // Find domain's position
    const domainResult = serpResults.find((r) => {
      const resultDomain = r.domain?.replace(/^www\./, '') || ''
      return resultDomain === domain || resultDomain.includes(domain)
    })
    currentPosition = domainResult?.rank_absolute ?? null

    // Get top competitors
    topCompetitors = serpResults.slice(0, 10).map((r) => ({
      domain: r.domain || '',
      position: r.rank_absolute ?? 0,
      title: r.title || '',
    }))

    serpFeatures.organicResultsCount = serpResults.length
  } catch (error) {
    console.error('Error fetching SERP:', error)
  }

  // 4. Get backlinks summary
  let referringDomains = 0
  let totalBacklinks = 0
  let spamScore: number | null = null

  try {
    const backlinksSummary = await backlinks.getSummary({
      target: domain,
      includeSubdomains: true,
    })
    apiCost += COST_ESTIMATES.backlinksSummary

    if (backlinksSummary) {
      referringDomains = backlinksSummary.referring_domains ?? 0
      totalBacklinks = backlinksSummary.backlinks ?? 0
      spamScore = backlinksSummary.backlinks_spam_score ?? null
    }
  } catch (error) {
    console.error('Error fetching backlinks:', error)
  }

  // 5. Get keyword metrics for target keyword
  let searchVolume: number | null = null
  let cpc: number | null = null
  let keywordDifficulty: number | null = null
  let searchIntent: string | null = null
  let volumeSource: 'current' | 'historical' = 'current'
  let historicalDate: string | null = null

  try {
    // First try to get keyword difficulty which includes some metrics
    const difficultyData = await labs.getBulkKeywordDifficulty({
      keywords: [targetKeyword],
      locationName: locationName || 'United States',
      languageCode: 'en',
    })
    apiCost += COST_ESTIMATES.historicalKeyword

    if (difficultyData.length > 0 && difficultyData[0]) {
      keywordDifficulty = difficultyData[0].keyword_difficulty ?? null
    }

    // Try to get search intent
    const intentData = await labs.getSearchIntent({
      keywords: [targetKeyword],
      languageCode: 'en',
    })
    apiCost += COST_ESTIMATES.searchIntent

    if (intentData.length > 0 && intentData[0]) {
      searchIntent = intentData[0].keyword_intent?.label ?? null
    }
  } catch (error) {
    console.error('Error fetching keyword metrics:', error)
  }

  // 6. Check if we need historical fallback for search volume
  // Look for the keyword in ranked keywords first
  const rankedMatch = rankedKeywords.find(
    (k) => k.keyword.toLowerCase() === targetKeyword.toLowerCase()
  )
  if (rankedMatch?.searchVolume) {
    searchVolume = rankedMatch.searchVolume
    cpc = rankedMatch.cpc
  }

  // If no volume found and it's a dentist+city keyword, try historical
  if (searchVolume === null && isDentistCityKeyword(targetKeyword)) {
    try {
      const historicalData = await labs.getHistoricalKeywordData({
        keywords: [targetKeyword],
        locationName: locationName || 'United States',
        languageCode: 'en',
      })
      apiCost += COST_ESTIMATES.historicalKeyword

      const firstItem = historicalData[0]
      if (historicalData.length > 0 && firstItem?.history && firstItem.history.length > 0) {
        // Convert history array to format for processing
        const historyArray = firstItem.history.map((h) => ({
          year: h.year,
          month: h.month,
          search_volume: h.keyword_info?.search_volume ?? null,
        }))

        const { volume, date } = getMostRecentVolume(historyArray)
        if (volume !== null) {
          searchVolume = volume
          volumeSource = 'historical'
          historicalDate = date
          // Get CPC from the first history entry that has it
          const historyWithCpc = firstItem.history.find((h) => h.keyword_info?.cpc != null)
          cpc = historyWithCpc?.keyword_info?.cpc ?? null
        }
      }
    } catch (error) {
      console.error('Error fetching historical keyword data:', error)
    }
  }

  // 7. Get keyword suggestions/opportunities
  let keywordOpportunities: KeywordOptimizationData['keywordOpportunities'] = []

  try {
    const suggestions = await labs.getKeywordSuggestions({
      keyword: targetKeyword,
      locationName: locationName || 'United States',
      languageCode: 'en',
      limit: 20,
    })
    apiCost += COST_ESTIMATES.keywordSuggestions

    keywordOpportunities = suggestions.map((s) => ({
      keyword: s.keyword,
      searchVolume: s.keyword_info?.search_volume ?? null,
      cpc: s.keyword_info?.cpc ?? null,
      difficulty: s.keyword_properties?.keyword_difficulty ?? null,
      intent: null, // Intent not available in keyword suggestions response
    }))

    // For suggestions with null volume that are dentist+city, try historical
    const needsHistorical = keywordOpportunities.filter(
      (k) => k.searchVolume === null && isDentistCityKeyword(k.keyword)
    )

    if (needsHistorical.length > 0) {
      try {
        const historicalData = await labs.getHistoricalKeywordData({
          keywords: needsHistorical.map((k) => k.keyword).slice(0, 10), // Limit to 10
          locationName: locationName || 'United States',
          languageCode: 'en',
        })
        apiCost += COST_ESTIMATES.historicalKeyword

        // Update opportunities with historical data
        for (const hist of historicalData) {
          const opp = keywordOpportunities.find(
            (k) => k.keyword.toLowerCase() === hist.keyword?.toLowerCase()
          )
          if (opp && hist.history && hist.history.length > 0) {
            const historyArray = hist.history.map((h) => ({
              year: h.year,
              month: h.month,
              search_volume: h.keyword_info?.search_volume ?? null,
            }))
            const { volume } = getMostRecentVolume(historyArray)
            if (volume !== null) {
              opp.searchVolume = volume
            }
            // Get CPC from the first history entry that has it
            const historyWithCpc = hist.history.find((h) => h.keyword_info?.cpc != null)
            if (historyWithCpc?.keyword_info?.cpc) {
              opp.cpc = historyWithCpc.keyword_info.cpc
            }
          }
        }
      } catch (error) {
        console.error('Error fetching historical data for suggestions:', error)
      }
    }
  } catch (error) {
    console.error('Error fetching keyword suggestions:', error)
  }

  return {
    domainRank,
    organicKeywordsCount,
    estimatedTrafficValue,
    referringDomains,
    backlinks: totalBacklinks,
    spamScore,

    targetKeyword,
    searchVolume,
    cpc,
    keywordDifficulty,
    currentPosition,
    searchIntent,

    volumeSource,
    historicalDate,

    serpFeatures,
    topCompetitors,
    rankedKeywords,
    keywordOpportunities,

    apiCost: Math.round(apiCost * 1000) / 1000, // Round to 3 decimal places
  }
}
