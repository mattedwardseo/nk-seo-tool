/**
 * Audit Data Transformation Helpers
 * Transform raw audit step results into component-ready formats
 */

import type {
  BusinessStepResult,
  KeywordData as AuditKeywordData,
  CompetitorData,
  ReferringDomainData,
  AnchorData,
  BusinessAttributes,
} from '@/types/audit'

import type { KeywordData } from '@/components/audit/KeywordTable'
import type { GBPField, GBPFieldStatus } from '@/components/audit/GBPCompleteness'
import type { SentimentStats, SentimentType } from '@/components/audit/ReviewSentiment'
import type { CompetitorMetrics } from '@/components/audit/CompetitorComparison'
import type { RadarMetrics } from '@/components/audit/CompetitorRadar'

// NOTE: Removed generateIssuesFromAudit and generateHighlights functions
// as part of scoring removal cleanup

// ============================================================
// KEYWORD TRANSFORMATION
// ============================================================

/**
 * Transform audit keywords to KeywordTable format
 */
export function transformKeywords(keywords: AuditKeywordData[] | undefined): KeywordData[] {
  if (!keywords) return []

  return keywords.map((kw) => ({
    keyword: kw.keyword,
    position: kw.position,
    previousPosition: kw.previousPosition ?? undefined,
    searchVolume: kw.searchVolume ?? 0,
    cpc: kw.cpc ?? undefined,
    rankingUrl: kw.url ?? undefined,
    competition: kw.competition ?? undefined,
    competitionLevel: kw.competitionLevel,
    etv: kw.etv,
    trafficCost: kw.trafficCost,
    isNew: kw.isNew,
    isUp: kw.isUp,
    historicalDataDate: kw.historicalDataDate,
    lowTopOfPageBid: kw.lowTopOfPageBid,
    highTopOfPageBid: kw.highTopOfPageBid,
  }))
}

// ============================================================
// GBP COMPLETENESS
// ============================================================

/**
 * Generate GBP fields from business step result
 */
export function generateGBPFields(business: BusinessStepResult | null): GBPField[] {
  if (!business) return []

  const getStatus = (value: unknown): GBPFieldStatus => {
    if (value === null || value === undefined || value === '') return 'missing'
    if (typeof value === 'boolean') return value ? 'complete' : 'missing'
    if (typeof value === 'number') return value > 0 ? 'complete' : 'missing'
    if (typeof value === 'string') return value.trim() ? 'complete' : 'missing'
    if (Array.isArray(value)) return value.length > 0 ? 'complete' : 'missing'
    return 'complete'
  }

  const fields: GBPField[] = [
    {
      id: 'name',
      name: 'Business Name',
      status: getStatus(business.businessName),
      value: business.businessName,
      importance: 'critical',
    },
    {
      id: 'phone',
      name: 'Phone Number',
      status: getStatus(business.phone),
      value: business.phone,
      importance: 'critical',
    },
    {
      id: 'address',
      name: 'Address',
      status: getStatus(business.address),
      value: business.address,
      importance: 'critical',
    },
    {
      id: 'website',
      name: 'Website',
      status: getStatus(business.website),
      value: business.website,
      importance: 'important',
    },
    {
      id: 'description',
      name: 'Business Description',
      status: getStatus(business.description),
      value: business.description ? `${business.description.slice(0, 100)}...` : undefined,
      importance: 'important',
      recommendation: !business.description
        ? 'Add a detailed description with relevant keywords'
        : undefined,
    },
    {
      id: 'category',
      name: 'Primary Category',
      status: getStatus(business.primaryCategory),
      value: business.primaryCategory,
      importance: 'critical',
    },
    {
      id: 'additional-categories',
      name: 'Additional Categories',
      status:
        business.additionalCategories && business.additionalCategories.length > 0
          ? 'complete'
          : 'incomplete',
      value: business.additionalCategories?.join(', '),
      importance: 'important',
    },
    {
      id: 'photos',
      name: 'Photos',
      status:
        business.photosCount >= 10 ? 'complete' : business.photosCount > 0 ? 'partial' : 'missing',
      value: `${business.photosCount} photos`,
      importance: 'important',
      recommendation: business.photosCount < 10 ? 'Add at least 10 high-quality photos' : undefined,
    },
    {
      id: 'hours',
      name: 'Business Hours',
      status:
        business.workHours && Object.keys(business.workHours).length > 0 ? 'complete' : 'missing',
      importance: 'important',
    },
    {
      id: 'reviews',
      name: 'Reviews',
      status:
        business.reviewCount >= 10 ? 'complete' : business.reviewCount > 0 ? 'partial' : 'missing',
      value: `${business.reviewCount} reviews`,
      importance: 'optional',
    },
    {
      id: 'posts',
      name: 'Recent Posts',
      status: business.postsRecent ? 'complete' : 'incomplete',
      importance: 'optional',
      recommendation: !business.postsRecent
        ? 'Post updates weekly for better visibility'
        : undefined,
    },
  ]

  return fields
}

/**
 * Calculate GBP completeness percentage
 */
export function calculateGBPCompleteness(business: BusinessStepResult | null): number {
  if (!business || !business.hasGmbListing) return 0

  const fields = generateGBPFields(business)
  const weights: Record<string, number> = {
    critical: 3,
    important: 2,
    optional: 1,
  }

  let totalWeight = 0
  let completedWeight = 0

  for (const field of fields) {
    const weight = weights[field.importance] ?? 1
    totalWeight += weight
    if (field.status === 'complete') {
      completedWeight += weight
    } else if (field.status === 'partial') {
      completedWeight += weight * 0.5
    }
  }

  return Math.round((completedWeight / totalWeight) * 100)
}

// ============================================================
// REVIEW SENTIMENT
// ============================================================

/**
 * Generate sentiment stats from business data
 */
export function generateSentimentStats(business: BusinessStepResult | null): SentimentStats | null {
  if (!business || !business.hasGmbListing) return null

  // Calculate sentiment from rating distribution
  const distribution = business.ratingDistribution || {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  }

  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  // Consider 4-5 stars positive, 3 neutral, 1-2 negative
  const positive = distribution['4'] + distribution['5']
  const neutral = distribution['3']
  const negative = distribution['1'] + distribution['2']

  // Generate topics from placeTopics
  const topics = business.placeTopics
    ? Object.entries(business.placeTopics)
        .map(([topic, count]) => ({
          topic,
          count,
          sentiment: 'positive' as SentimentType, // Simplified - would need NLP for accuracy
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : []

  return {
    total,
    averageRating: business.gmbRating ?? 0,
    sentiment: { positive, neutral, negative },
    ratings: distribution,
    topTopics: topics,
  }
}

// ============================================================
// COMPETITORS
// ============================================================

/**
 * Transform competitor data for CompetitorComparison
 */
export function transformCompetitors(
  competitors: CompetitorData[] | undefined,
  _targetMetrics?: Partial<CompetitorMetrics>
): CompetitorMetrics[] {
  if (!competitors) return []

  return competitors.map((comp) => ({
    domain: comp.domain ?? comp.name,
    rank: 0, // Not available from GMB competitor data
    organicTraffic: 0,
    backlinks: 0,
    referringDomains: 0,
    rankingKeywords: 0,
    top10Keywords: 0,
    trafficValue: 0,
    // Note: GMB competitor data is limited - full SEO metrics would need Labs API
  }))
}

/**
 * Transform competitor data for radar chart
 */
export function transformCompetitorRadar(
  targetName: string,
  targetMetrics: RadarMetrics,
  competitors: CompetitorData[] | undefined
): Array<{ name: string; metrics: RadarMetrics }> {
  const result = [{ name: targetName, metrics: targetMetrics }]

  if (competitors) {
    // Add top 3 competitors
    competitors.slice(0, 3).forEach((comp) => {
      result.push({
        name: comp.name,
        metrics: {
          technical: 50, // Would need real data
          content: 50,
          local: (comp.rating ?? 0) * 20, // Convert 0-5 to 0-100
          backlinks: 50,
          authority: 50,
        },
      })
    })
  }

  return result
}

// ============================================================
// BACKLINKS
// ============================================================

/**
 * Format referring domains for display
 */
export function formatReferringDomains(
  domains: ReferringDomainData[] | undefined
): Array<{ domain: string; backlinks: number; domainRank: number }> {
  if (!domains) return []
  return domains.map((d) => ({
    domain: d.domain,
    backlinks: d.backlinks,
    domainRank: d.domainRank,
  }))
}

/**
 * Format anchor distribution for display
 */
export function formatAnchorDistribution(
  anchors: AnchorData[] | undefined
): Array<{ anchor: string; count: number; percentage: number }> {
  if (!anchors) return []
  return anchors.map((a) => ({
    anchor: a.anchor,
    count: a.count,
    percentage: a.percentage,
  }))
}

// ============================================================
// BUSINESS ATTRIBUTES
// ============================================================

/**
 * Format business attributes for display
 */
export function formatBusinessAttributes(
  attributes: BusinessAttributes | undefined
): Array<{ category: string; items: string[] }> {
  if (!attributes) return []

  const result: Array<{ category: string; items: string[] }> = []

  if (attributes.accessibility?.length) {
    result.push({ category: 'Accessibility', items: attributes.accessibility })
  }
  if (attributes.amenities?.length) {
    result.push({ category: 'Amenities', items: attributes.amenities })
  }
  if (attributes.offerings?.length) {
    result.push({ category: 'Service Offerings', items: attributes.offerings })
  }
  if (attributes.payments?.length) {
    result.push({ category: 'Payment Methods', items: attributes.payments })
  }

  return result
}

/**
 * Format work hours for display
 */
export function formatWorkHours(
  hours: Record<string, Array<{ open: string; close: string }>> | undefined
): Array<{ day: string; hours: string }> {
  if (!hours) return []

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return days.map((day) => {
    const dayHours = hours[day]
    if (!dayHours || dayHours.length === 0) {
      return { day: capitalize(day), hours: 'Closed' }
    }
    const formatted = dayHours.map((h) => `${h.open} - ${h.close}`).join(', ')
    return { day: capitalize(day), hours: formatted }
  })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
