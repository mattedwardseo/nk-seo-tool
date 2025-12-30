/**
 * Competitor Analysis Service
 *
 * Provides real-time competitor comparison data using DataForSEO APIs:
 * - SERP rankings comparison (serp_organic_live_advanced)
 * - Backlink gap analysis (backlinks_domain_intersection)
 * - Competitor discovery (dataforseo_labs_google_competitors_domain)
 * - Historical rank trends (google_historical_rank_overview)
 *
 * Phase 11: Competitor Comparison Dashboard
 */

import { getDataForSEOClient } from '@/lib/dataforseo/client'
import {
  SerpGoogleOrganicLiveAdvancedRequestInfo,
  DataforseoLabsGoogleCompetitorsDomainLiveRequestInfo,
  DataforseoLabsGoogleHistoricalRankOverviewLiveRequestInfo,
  BacklinksDomainIntersectionLiveRequestInfo,
} from 'dataforseo-client'

// ============================================================
// TYPES
// ============================================================

export interface LocalPackResult {
  position: number | null // Position in pack (1-3), null if not in pack
  rating: number | null // Business rating (1.0-5.0)
  reviewsCount: number | null // Number of reviews
  cid: string | null // Google CID for the listing
}

export interface SerpRankingResult {
  keyword: string
  searchVolume: number
  cpc: number
  clientPosition: number | null
  competitorPositions: Record<string, number | null>
  topDomain: string | null
  serpFeatures: string[]
  localPack: LocalPackResult | null // Local pack data for client domain
}

export interface CompetitorDiscoveryResult {
  domain: string
  rank: number
  organicTraffic: number
  intersections: number
  avgPosition: number
  etv: number // Estimated Traffic Value
}

export interface BacklinkGapResult {
  domain: string
  backlinks: number
  referringDomains: number
  rank: number
  spamScore: number
  linksToCompetitors: string[]
}

export interface HistoricalRankData {
  date: string
  organicTraffic: number
  paidTraffic: number
  etv: number
  keywordsRanking: number
}

// ============================================================
// SERP COMPARISON
// ============================================================

/**
 * Get live SERP rankings for a keyword, extracting positions for specific domains
 */
export async function getLiveSerpRankings(
  keyword: string,
  clientDomain: string,
  competitorDomains: string[],
  locationName: string = 'United States'
): Promise<SerpRankingResult> {
  const client = getDataForSEOClient()

  const request = new SerpGoogleOrganicLiveAdvancedRequestInfo()
  request.keyword = keyword
  request.location_name = locationName
  request.language_code = 'en'
  request.depth = 100 // Check top 100 results

  const response = await client.execute(
    () => client.serp.googleOrganicLiveAdvanced([request]),
    'general'
  )

  const task = response?.tasks?.[0]
  const result = task?.result?.[0]

  if (!result?.items) {
    return {
      keyword,
      searchVolume: 0,
      cpc: 0,
      clientPosition: null,
      competitorPositions: Object.fromEntries(competitorDomains.map((d) => [d, null])),
      topDomain: null,
      serpFeatures: [],
      localPack: null,
    }
  }

  // Extract search volume from result
  const searchVolume = result.se_results_count ?? 0

  // Type for SERP items (organic results)
  type SerpItem = {
    type?: string
    domain?: string
    rank_absolute?: number
    rank_group?: number
  }

  // Type for Local Pack item with nested businesses
  type LocalPackBusiness = {
    title?: string
    domain?: string
    url?: string
    rating?: { value?: number; votes_count?: number } | null
    cid?: string
  }

  type LocalPackItem = {
    type?: string
    rank_absolute?: number
    items?: LocalPackBusiness[]
  }

  const items = result.items as unknown as (SerpItem | LocalPackItem)[]

  // Find client position in organic results
  const normalizedClient = normalizeDomain(clientDomain)
  const clientItem = items.find(
    (item) => item.type === 'organic' && 'domain' in item && normalizeDomain((item as SerpItem).domain ?? '') === normalizedClient
  )
  const clientPosition = (clientItem as SerpItem)?.rank_absolute ?? null

  // Find competitor positions
  const competitorPositions: Record<string, number | null> = {}
  for (const compDomain of competitorDomains) {
    const normalizedComp = normalizeDomain(compDomain)
    const compItem = items.find(
      (item) => item.type === 'organic' && 'domain' in item && normalizeDomain((item as SerpItem).domain ?? '') === normalizedComp
    )
    competitorPositions[compDomain] = (compItem as SerpItem)?.rank_absolute ?? null
  }

  // Get top domain
  const topOrganic = items.find((item) => item.type === 'organic')
  const topDomain = (topOrganic as SerpItem)?.domain ?? null

  // Extract SERP features
  const serpFeatures: string[] = []
  const featureTypes = new Set(items.map((item) => item.type).filter(Boolean))
  if (featureTypes.has('local_pack')) serpFeatures.push('local_pack')
  if (featureTypes.has('featured_snippet')) serpFeatures.push('featured_snippet')
  if (featureTypes.has('people_also_ask')) serpFeatures.push('people_also_ask')
  if (featureTypes.has('knowledge_graph')) serpFeatures.push('knowledge_graph')

  // Extract local pack data for client domain
  let localPack: LocalPackResult | null = null
  const localPackItem = items.find((item) => item.type === 'local_pack') as LocalPackItem | undefined
  if (localPackItem?.items && Array.isArray(localPackItem.items)) {
    // Search for client domain in local pack businesses
    const packBusinesses = localPackItem.items as LocalPackBusiness[]
    for (let i = 0; i < packBusinesses.length; i++) {
      const business = packBusinesses[i]
      if (!business) continue
      // Match by domain (if available) or by URL containing domain
      let businessDomain: string | null = null
      if (business.domain) {
        businessDomain = business.domain
      } else if (business.url) {
        try {
          businessDomain = new URL(business.url).hostname
        } catch {
          // Invalid URL, skip
        }
      }
      if (businessDomain && normalizeDomain(businessDomain) === normalizedClient) {
        localPack = {
          position: i + 1, // 1-indexed position
          rating: business.rating?.value ?? null,
          reviewsCount: business.rating?.votes_count ?? null,
          cid: business.cid ?? null,
        }
        break
      }
    }
  }

  return {
    keyword,
    searchVolume,
    cpc: 0, // CPC comes from keyword data, not SERP
    clientPosition,
    competitorPositions,
    topDomain,
    serpFeatures,
    localPack,
  }
}

/**
 * Get SERP rankings for multiple keywords
 */
export async function getBatchSerpRankings(
  keywords: Array<{ keyword: string; searchVolume?: number; cpc?: number }>,
  clientDomain: string,
  competitorDomains: string[],
  locationName: string = 'United States'
): Promise<SerpRankingResult[]> {
  // Process in batches to avoid rate limits
  const results: SerpRankingResult[] = []
  const batchSize = 5 // Process 5 keywords at a time

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (kw) => {
        try {
          const result = await getLiveSerpRankings(
            kw.keyword,
            clientDomain,
            competitorDomains,
            locationName
          )
          // Override with provided search volume/cpc if available
          return {
            ...result,
            searchVolume: kw.searchVolume ?? result.searchVolume,
            cpc: kw.cpc ?? result.cpc,
          }
        } catch (error) {
          console.error(`[SERP] Error fetching rankings for "${kw.keyword}":`, error)
          return {
            keyword: kw.keyword,
            searchVolume: kw.searchVolume ?? 0,
            cpc: kw.cpc ?? 0,
            clientPosition: null,
            competitorPositions: Object.fromEntries(competitorDomains.map((d) => [d, null])),
            topDomain: null,
            serpFeatures: [],
            localPack: null,
          }
        }
      })
    )

    results.push(...batchResults)

    // Small delay between batches to respect rate limits
    if (i + batchSize < keywords.length) {
      await delay(200)
    }
  }

  return results
}

// ============================================================
// COMPETITOR DISCOVERY
// ============================================================

/**
 * Discover organic search competitors for a domain
 */
export async function discoverCompetitors(
  targetDomain: string,
  locationName: string = 'United States',
  limit: number = 10
): Promise<CompetitorDiscoveryResult[]> {
  const client = getDataForSEOClient()

  const request = new DataforseoLabsGoogleCompetitorsDomainLiveRequestInfo()
  request.target = targetDomain
  request.location_name = locationName
  request.language_code = 'en'
  request.limit = limit
  request.exclude_top_domains = true // Exclude giants like Amazon, Wikipedia

  const response = await client.execute(() => client.labs.googleCompetitorsDomainLive([request]))

  const task = response?.tasks?.[0]
  const items = task?.result?.[0]?.items ?? []

  // Type for competitor items
  type CompetitorItem = {
    domain?: string
    avg_position?: number
    sum_position?: number
    intersections?: number
    full_domain_metrics?: Array<{
      organic?: {
        etv?: number
        count?: number
        estimated_paid_traffic_cost?: number
      }
    }>
    metrics?: {
      organic?: {
        etv?: number
        count?: number
      }
    }
  }

  return (items as unknown as CompetitorItem[]).map((item) => {
    const metrics = item.metrics?.organic ?? item.full_domain_metrics?.[0]?.organic
    return {
      domain: item.domain ?? '',
      rank: 0, // Would need separate backlinks call
      organicTraffic: metrics?.count ?? 0,
      intersections: item.intersections ?? 0,
      avgPosition: item.avg_position ?? 0,
      etv: metrics?.etv ?? 0,
    }
  })
}

// ============================================================
// BACKLINK GAP ANALYSIS
// ============================================================

/**
 * Find domains that link to competitors but not to the client
 */
export async function getBacklinkGap(
  clientDomain: string,
  competitorDomains: string[],
  limit: number = 20
): Promise<BacklinkGapResult[]> {
  const client = getDataForSEOClient()

  // Include client as first target, competitors after
  const targetsList = [clientDomain, ...competitorDomains.slice(0, 19)] // Max 20 targets

  // Convert array to numbered object format required by API
  const targets: { [key: string]: string } = {}
  targetsList.forEach((domain, idx) => {
    targets[String(idx + 1)] = domain
  })

  const request = new BacklinksDomainIntersectionLiveRequestInfo()
  request.targets = targets
  request.limit = limit
  // Filter to show domains that link to competitors but not client
  // Target 1 = client, so we want items where target 1 has no backlinks
  request.filters = [['1.backlinks', '=', 0]]
  request.order_by = ['2.rank,desc'] // Order by first competitor's domain rank

  try {
    const response = await client.execute(() =>
      client.backlinks.domainIntersectionLive([request])
    )

    const task = response?.tasks?.[0]
    const items = task?.result?.[0]?.items ?? []

    // Type for intersection items
    type IntersectionItem = {
      domain_intersection?: Record<
        string,
        {
          target?: string
          backlinks?: number
          referring_domains?: number
          rank?: number
          backlinks_spam_score?: number
        }
      >
    }

    return (items as unknown as IntersectionItem[]).map((item) => {
      const intersection = item.domain_intersection ?? {}
      const firstComp = intersection['2'] // First competitor's data

      // Determine which competitors have links from this domain
      const linksToCompetitors: string[] = []
      for (let i = 2; i <= targetsList.length; i++) {
        const compData = intersection[String(i)]
        if (compData && (compData.backlinks ?? 0) > 0) {
          linksToCompetitors.push(compData.target ?? competitorDomains[i - 2] ?? '')
        }
      }

      return {
        domain: firstComp?.target ?? '',
        backlinks: firstComp?.backlinks ?? 0,
        referringDomains: firstComp?.referring_domains ?? 0,
        rank: firstComp?.rank ?? 0,
        spamScore: firstComp?.backlinks_spam_score ?? 0,
        linksToCompetitors,
      }
    })
  } catch (error) {
    console.error('[Backlink Gap] Error:', error)
    return []
  }
}

// ============================================================
// HISTORICAL TRENDS
// ============================================================

/**
 * Get historical rank overview for a domain
 */
export async function getHistoricalRankOverview(
  targetDomain: string,
  locationName: string = 'United States'
): Promise<HistoricalRankData[]> {
  const client = getDataForSEOClient()

  const request = new DataforseoLabsGoogleHistoricalRankOverviewLiveRequestInfo()
  request.target = targetDomain
  request.location_name = locationName
  request.language_code = 'en'

  const response = await client.execute(() =>
    client.labs.googleHistoricalRankOverviewLive([request])
  )

  const task = response?.tasks?.[0]
  const items = task?.result?.[0]?.items ?? []

  // Type for historical items
  type HistoricalItem = {
    date?: string
    metrics?: {
      organic?: {
        etv?: number
        count?: number
        estimated_paid_traffic_cost?: number
      }
      paid?: {
        etv?: number
        count?: number
      }
    }
  }

  return (items as unknown as HistoricalItem[]).map((item) => ({
    date: item.date ?? '',
    organicTraffic: item.metrics?.organic?.count ?? 0,
    paidTraffic: item.metrics?.paid?.count ?? 0,
    etv: item.metrics?.organic?.etv ?? 0,
    keywordsRanking: item.metrics?.organic?.count ?? 0,
  }))
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Normalize domain for comparison (remove www. prefix)
 */
function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '')
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
