/**
 * GBP Comparison Service
 *
 * Provides comparison logic between target and competitor GBP profiles.
 * Identifies gaps and generates actionable recommendations.
 */

import type { BusinessInfoResult } from '../dataforseo/schemas'
import type {
  GBPComparisonProfile,
  GBPGap,
  ComparisonField,
  ManualCheckItem,
  NameAnalysisResult,
} from './types'

// ============================================================================
// Constants
// ============================================================================

/**
 * Manual check items - API cannot fetch this data
 */
export const MANUAL_CHECK_ITEMS: ManualCheckItem[] = [
  {
    field: 'google_posts',
    label: 'Google Posts',
    description: 'Check if competitors post regularly (weekly is ideal for dental practices)',
  },
  {
    field: 'q_and_a',
    label: 'Q&A Section',
    description: 'Check if competitors have answered common patient questions',
  },
  {
    field: 'services',
    label: 'Services Listed',
    description: 'Check if competitors have added their services with descriptions',
  },
  {
    field: 'products',
    label: 'Products Listed',
    description: 'Check if competitors have added products (whitening kits, etc.)',
  },
  {
    field: 'menu',
    label: 'Menu/Services Menu',
    description: 'Check if competitors use the menu feature for pricing',
  },
  {
    field: 'booking_link',
    label: 'Booking Link',
    description: 'Check if competitors have online booking enabled',
  },
]

/**
 * Common dental-related keywords to check for in business names
 */
const DENTAL_KEYWORDS = [
  'dental',
  'dentist',
  'dentistry',
  'orthodontic',
  'orthodontist',
  'periodontal',
  'periodontist',
  'endodontic',
  'oral',
  'smile',
  'tooth',
  'teeth',
  'implant',
  'cosmetic',
  'family',
  'pediatric',
]

/**
 * Days of the week for hours completeness check
 */
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ============================================================================
// Profile Building
// ============================================================================

/**
 * Convert DataForSEO BusinessInfoResult to GBPComparisonProfile
 */
export function buildComparisonProfile(
  businessInfo: BusinessInfoResult,
  keywords: string[],
  city: string
): GBPComparisonProfile {
  const nameAnalysis = analyzeBusinessName(businessInfo.title ?? '', keywords, city)

  // Parse attributes
  const attributes = parseAttributes(businessInfo.attributes)
  const attributeCategories = Object.keys(attributes)
  const attributeCount = Object.values(attributes).reduce((sum, arr) => sum + arr.length, 0)

  // Parse work hours
  const workHours = parseWorkHours(businessInfo.work_hours)
  const hoursComplete = checkHoursComplete(workHours)

  // Calculate completeness score
  const completenessScore = calculateCompletenessScore({
    hasName: !!businessInfo.title,
    hasPhone: !!businessInfo.phone,
    hasAddress: !!businessInfo.address,
    hasWebsite: !!(businessInfo.url || businessInfo.domain),
    hasCategory: !!businessInfo.category,
    hasDescription: !!businessInfo.description,
    hasPhotos: (businessInfo.total_photos ?? 0) > 0,
    photoCount: businessInfo.total_photos ?? 0,
    hasHours: Object.keys(workHours).length > 0,
    hoursComplete,
    hasAttributes: attributeCount > 0,
    rating: businessInfo.rating?.value ?? null,
    reviewCount: businessInfo.rating?.votes_count ?? 0,
    isClaimed: businessInfo.is_claimed ?? false,
  })

  return {
    businessName: businessInfo.title ?? 'Unknown',
    gmbCid: businessInfo.cid ?? undefined,

    rating: businessInfo.rating?.value ?? null,
    reviewCount: businessInfo.rating?.votes_count ?? null,

    primaryCategory: businessInfo.category ?? null,
    additionalCategories: businessInfo.additional_categories ?? [],
    categoryCount: 1 + (businessInfo.additional_categories?.length ?? 0),

    nameHasKeyword: nameAnalysis.hasKeyword,
    nameHasCity: nameAnalysis.hasCity,

    hasDescription: !!businessInfo.description,
    descriptionLength: businessInfo.description?.length ?? 0,
    description: businessInfo.description ?? undefined,

    hasPhone: !!businessInfo.phone,
    phone: businessInfo.phone ?? undefined,
    hasWebsite: !!(businessInfo.url || businessInfo.domain),
    website: businessInfo.url ?? businessInfo.domain ?? undefined,
    hasAddress: !!businessInfo.address,
    address: businessInfo.address ?? undefined,

    attributes,
    attributeCategories,
    attributeCount,

    hasWorkHours: Object.keys(workHours).length > 0,
    hoursComplete,
    workHours,

    photoCount: businessInfo.total_photos ?? 0,

    isClaimed: businessInfo.is_claimed ?? false,
    hasServices: false, // API doesn't provide this directly
    hasProducts: false, // API doesn't provide this directly

    completenessScore,
  }
}

// ============================================================================
// Name Analysis
// ============================================================================

/**
 * Analyze business name for keyword and city presence
 */
export function analyzeBusinessName(
  name: string,
  keywords: string[],
  city: string
): NameAnalysisResult {
  const nameLower = name.toLowerCase()

  // Check for dental keywords
  let hasKeyword = false
  let matchedKeyword: string | undefined

  // First check campaign keywords
  for (const keyword of keywords) {
    const keywordWords = keyword.toLowerCase().split(/\s+/)
    for (const word of keywordWords) {
      if (nameLower.includes(word) && word.length > 2) {
        hasKeyword = true
        matchedKeyword = word
        break
      }
    }
    if (hasKeyword) break
  }

  // If no match, check common dental keywords
  if (!hasKeyword) {
    for (const keyword of DENTAL_KEYWORDS) {
      if (nameLower.includes(keyword)) {
        hasKeyword = true
        matchedKeyword = keyword
        break
      }
    }
  }

  // Check for city
  const hasCity = city ? nameLower.includes(city.toLowerCase()) : false

  return {
    hasKeyword,
    hasCity,
    matchedKeyword,
    matchedCity: hasCity ? city : undefined,
  }
}

// ============================================================================
// Gap Identification
// ============================================================================

/**
 * Identify gaps between target and competitors
 */
export function identifyGaps(
  target: GBPComparisonProfile,
  competitors: GBPComparisonProfile[]
): GBPGap[] {
  const gaps: GBPGap[] = []

  // Rating gap
  const avgCompetitorRating =
    competitors.reduce((sum, c) => sum + (c.rating ?? 0), 0) / competitors.length
  const bestRatingCompetitor = competitors.reduce((best, c) =>
    (c.rating ?? 0) > (best.rating ?? 0) ? c : best
  )

  if (target.rating !== null && avgCompetitorRating > (target.rating ?? 0) + 0.3) {
    gaps.push({
      field: 'rating',
      label: 'Google Rating',
      severity: 'critical',
      yourValue: target.rating ?? 0,
      competitorBest: {
        name: bestRatingCompetitor.businessName,
        value: bestRatingCompetitor.rating ?? 0,
      },
      competitorAvg: Math.round(avgCompetitorRating * 10) / 10,
      recommendation:
        'Implement a review generation strategy. Follow up with satisfied patients and make leaving a review easy.',
    })
  }

  // Review count gap
  const avgCompetitorReviews =
    competitors.reduce((sum, c) => sum + (c.reviewCount ?? 0), 0) / competitors.length
  const bestReviewCompetitor = competitors.reduce((best, c) =>
    (c.reviewCount ?? 0) > (best.reviewCount ?? 0) ? c : best
  )

  if ((target.reviewCount ?? 0) < avgCompetitorReviews * 0.5) {
    gaps.push({
      field: 'reviewCount',
      label: 'Review Count',
      severity: 'critical',
      yourValue: target.reviewCount ?? 0,
      competitorBest: {
        name: bestReviewCompetitor.businessName,
        value: bestReviewCompetitor.reviewCount ?? 0,
      },
      competitorAvg: Math.round(avgCompetitorReviews),
      recommendation:
        'Actively request reviews from patients. Consider email/SMS follow-ups after appointments.',
    })
  }

  // Description gap
  const bestDescCompetitor = competitors.find((c) => c.hasDescription)
  if (!target.hasDescription && bestDescCompetitor) {
    gaps.push({
      field: 'description',
      label: 'Business Description',
      severity: 'important',
      yourValue: false,
      competitorBest: {
        name: bestDescCompetitor.businessName,
        value: true,
      },
      competitorAvg: `${competitors.filter((c) => c.hasDescription).length}/${competitors.length} have one`,
      recommendation:
        'Add a compelling business description highlighting your unique services, experience, and patient care philosophy.',
    })
  } else if (target.hasDescription) {
    const avgDescLength =
      competitors.reduce((sum, c) => sum + c.descriptionLength, 0) / competitors.length
    if (target.descriptionLength < avgDescLength * 0.5) {
      gaps.push({
        field: 'descriptionLength',
        label: 'Description Length',
        severity: 'nice-to-have',
        yourValue: target.descriptionLength,
        competitorBest: {
          name: competitors.reduce((best, c) =>
            c.descriptionLength > best.descriptionLength ? c : best
          ).businessName,
          value: Math.max(...competitors.map((c) => c.descriptionLength)),
        },
        competitorAvg: Math.round(avgDescLength),
        recommendation:
          'Expand your description to include more details about services, technology, and patient experience.',
      })
    }
  }

  // Photo count gap
  const avgPhotos = competitors.reduce((sum, c) => sum + c.photoCount, 0) / competitors.length
  const bestPhotoCompetitor = competitors.reduce((best, c) =>
    c.photoCount > best.photoCount ? c : best
  )

  if (target.photoCount < 10 || target.photoCount < avgPhotos * 0.5) {
    gaps.push({
      field: 'photoCount',
      label: 'Photos',
      severity: target.photoCount < 5 ? 'important' : 'nice-to-have',
      yourValue: target.photoCount,
      competitorBest: {
        name: bestPhotoCompetitor.businessName,
        value: bestPhotoCompetitor.photoCount,
      },
      competitorAvg: Math.round(avgPhotos),
      recommendation:
        'Add high-quality photos of your office, team, equipment, and before/after cases (with permission). Aim for 20+ photos.',
    })
  }

  // Categories gap
  const avgCategories = competitors.reduce((sum, c) => sum + c.categoryCount, 0) / competitors.length
  if (target.categoryCount < avgCategories - 1) {
    const allCompetitorCategories = new Set<string>()
    competitors.forEach((c) => {
      if (c.primaryCategory) allCompetitorCategories.add(c.primaryCategory)
      c.additionalCategories.forEach((cat) => allCompetitorCategories.add(cat))
    })

    const targetCategories = new Set<string>()
    if (target.primaryCategory) targetCategories.add(target.primaryCategory)
    target.additionalCategories.forEach((cat) => targetCategories.add(cat))

    const missingCategories = Array.from(allCompetitorCategories).filter((c) => !targetCategories.has(c))

    gaps.push({
      field: 'categories',
      label: 'Categories',
      severity: 'important',
      yourValue: target.categoryCount,
      competitorBest: {
        name: competitors.reduce((best, c) => (c.categoryCount > best.categoryCount ? c : best))
          .businessName,
        value: Math.max(...competitors.map((c) => c.categoryCount)),
      },
      competitorAvg: Math.round(avgCategories),
      recommendation: `Consider adding these categories: ${missingCategories.slice(0, 3).join(', ')}`,
    })
  }

  // Hours completeness gap
  const bestHoursCompetitor = competitors.find((c) => c.hoursComplete)
  if (!target.hoursComplete && bestHoursCompetitor) {
    gaps.push({
      field: 'hoursComplete',
      label: 'Business Hours',
      severity: 'important',
      yourValue: false,
      competitorBest: {
        name: bestHoursCompetitor.businessName,
        value: true,
      },
      competitorAvg: `${competitors.filter((c) => c.hoursComplete).length}/${competitors.length} complete`,
      recommendation: 'Add business hours for all 7 days of the week, including closed days.',
    })
  }

  // Attributes gap
  const avgAttributes = competitors.reduce((sum, c) => sum + c.attributeCount, 0) / competitors.length
  if (target.attributeCount < avgAttributes * 0.5) {
    // Find attributes competitors have that target doesn't
    const allCompetitorAttributes = new Set<string>()
    competitors.forEach((c) => {
      Object.values(c.attributes).flat().forEach((attr) => allCompetitorAttributes.add(attr))
    })

    const targetAttributes = new Set<string>(Object.values(target.attributes).flat())
    const missingAttributes = Array.from(allCompetitorAttributes).filter((a) => !targetAttributes.has(a))

    gaps.push({
      field: 'attributes',
      label: 'Profile Attributes',
      severity: 'nice-to-have',
      yourValue: target.attributeCount,
      competitorBest: {
        name: competitors.reduce((best, c) => (c.attributeCount > best.attributeCount ? c : best))
          .businessName,
        value: Math.max(...competitors.map((c) => c.attributeCount)),
      },
      competitorAvg: Math.round(avgAttributes),
      recommendation: `Add attributes like: ${missingAttributes.slice(0, 5).join(', ')}`,
    })
  }

  // Name doesn't have keyword (competitors do)
  const competitorsWithKeyword = competitors.filter((c) => c.nameHasKeyword)
  if (!target.nameHasKeyword && competitorsWithKeyword.length > competitors.length / 2) {
    gaps.push({
      field: 'nameHasKeyword',
      label: 'Business Name Optimization',
      severity: 'nice-to-have',
      yourValue: false,
      competitorBest: {
        name: competitorsWithKeyword[0]?.businessName ?? '',
        value: true,
      },
      competitorAvg: `${competitorsWithKeyword.length}/${competitors.length} have keywords`,
      recommendation:
        'Consider if adding a service keyword to your business name is appropriate (e.g., "Smith Family Dentistry").',
    })
  }

  // Sort by severity
  const severityOrder = { critical: 0, important: 1, 'nice-to-have': 2 }
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return gaps
}

// ============================================================================
// Comparison Fields
// ============================================================================

/**
 * Build comparison fields for side-by-side display
 */
export function buildComparisonFields(
  target: GBPComparisonProfile,
  competitors: GBPComparisonProfile[]
): ComparisonField[] {
  const fields: ComparisonField[] = []

  // Identity
  fields.push({
    field: 'rating',
    label: 'Rating',
    category: 'engagement',
    targetValue: target.rating,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.rating })),
    higherIsBetter: true,
    targetWinning:
      target.rating !== null &&
      target.rating >= Math.max(...competitors.map((c) => c.rating ?? 0)),
  })

  fields.push({
    field: 'reviewCount',
    label: 'Review Count',
    category: 'engagement',
    targetValue: target.reviewCount,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.reviewCount })),
    higherIsBetter: true,
    targetWinning:
      (target.reviewCount ?? 0) >= Math.max(...competitors.map((c) => c.reviewCount ?? 0)),
  })

  fields.push({
    field: 'primaryCategory',
    label: 'Primary Category',
    category: 'identity',
    targetValue: target.primaryCategory,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.primaryCategory,
    })),
    targetWinning: !!target.primaryCategory,
  })

  fields.push({
    field: 'categoryCount',
    label: 'Total Categories',
    category: 'identity',
    targetValue: target.categoryCount,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.categoryCount })),
    higherIsBetter: true,
    targetWinning: target.categoryCount >= Math.max(...competitors.map((c) => c.categoryCount)),
  })

  fields.push({
    field: 'hasDescription',
    label: 'Has Description',
    category: 'content',
    targetValue: target.hasDescription,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.hasDescription,
    })),
    targetWinning: target.hasDescription || !competitors.some((c) => c.hasDescription),
  })

  fields.push({
    field: 'descriptionLength',
    label: 'Description Length',
    category: 'content',
    targetValue: target.descriptionLength,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.descriptionLength,
    })),
    higherIsBetter: true,
    targetWinning:
      target.descriptionLength >= Math.max(...competitors.map((c) => c.descriptionLength)),
  })

  fields.push({
    field: 'photoCount',
    label: 'Photos',
    category: 'media',
    targetValue: target.photoCount,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.photoCount })),
    higherIsBetter: true,
    targetWinning: target.photoCount >= Math.max(...competitors.map((c) => c.photoCount)),
  })

  fields.push({
    field: 'hasPhone',
    label: 'Has Phone',
    category: 'contact',
    targetValue: target.hasPhone,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.hasPhone })),
    targetWinning: target.hasPhone || !competitors.some((c) => c.hasPhone),
  })

  fields.push({
    field: 'hasWebsite',
    label: 'Has Website',
    category: 'contact',
    targetValue: target.hasWebsite,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.hasWebsite })),
    targetWinning: target.hasWebsite || !competitors.some((c) => c.hasWebsite),
  })

  fields.push({
    field: 'hoursComplete',
    label: 'Hours Complete (All 7 Days)',
    category: 'contact',
    targetValue: target.hoursComplete,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.hoursComplete,
    })),
    targetWinning: target.hoursComplete || !competitors.some((c) => c.hoursComplete),
  })

  fields.push({
    field: 'attributeCount',
    label: 'Attributes Count',
    category: 'content',
    targetValue: target.attributeCount,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.attributeCount,
    })),
    higherIsBetter: true,
    targetWinning: target.attributeCount >= Math.max(...competitors.map((c) => c.attributeCount)),
  })

  fields.push({
    field: 'isClaimed',
    label: 'Profile Claimed',
    category: 'identity',
    targetValue: target.isClaimed,
    competitorValues: competitors.map((c) => ({ name: c.businessName, value: c.isClaimed })),
    targetWinning: target.isClaimed,
  })

  fields.push({
    field: 'completenessScore',
    label: 'Completeness Score',
    category: 'identity',
    targetValue: target.completenessScore,
    competitorValues: competitors.map((c) => ({
      name: c.businessName,
      value: c.completenessScore,
    })),
    higherIsBetter: true,
    targetWinning:
      target.completenessScore >= Math.max(...competitors.map((c) => c.completenessScore)),
  })

  return fields
}

// ============================================================================
// Recommendations
// ============================================================================

/**
 * Generate recommendations based on gaps
 */
export function generateRecommendations(gaps: GBPGap[]): string[] {
  const recommendations: string[] = []

  // Prioritize critical gaps
  const criticalGaps = gaps.filter((g) => g.severity === 'critical')
  const importantGaps = gaps.filter((g) => g.severity === 'important')

  if (criticalGaps.length > 0) {
    recommendations.push(
      `🚨 Address ${criticalGaps.length} critical gap(s): ${criticalGaps.map((g) => g.label).join(', ')}`
    )
  }

  if (importantGaps.length > 0) {
    recommendations.push(
      `⚠️ Improve ${importantGaps.length} important area(s): ${importantGaps.map((g) => g.label).join(', ')}`
    )
  }

  // Add specific recommendations from gaps
  for (const gap of gaps.slice(0, 5)) {
    recommendations.push(gap.recommendation)
  }

  // General dental GBP recommendations
  if (!gaps.some((g) => g.field === 'google_posts')) {
    recommendations.push(
      '📝 Post weekly updates about promotions, dental tips, or team highlights'
    )
  }

  recommendations.push('💬 Respond to all reviews within 24-48 hours, especially negative ones')

  return recommendations.slice(0, 8) // Limit to 8 recommendations
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse attributes from API response
 */
function parseAttributes(
  apiAttributes?: BusinessInfoResult['attributes']
): Record<string, string[]> {
  if (!apiAttributes?.available_attributes) return {}

  const result: Record<string, string[]> = {}

  for (const [category, values] of Object.entries(apiAttributes.available_attributes)) {
    if (Array.isArray(values) && values.length > 0) {
      result[category] = values
    }
  }

  return result
}

/**
 * Parse work hours from API response
 */
function parseWorkHours(
  apiWorkHours?: BusinessInfoResult['work_hours']
): Record<string, string[]> {
  if (!apiWorkHours?.timetable) return {}

  const result: Record<string, string[]> = {}

  for (const [day, hours] of Object.entries(apiWorkHours.timetable)) {
    if (Array.isArray(hours)) {
      result[day.toLowerCase()] = hours.map((h) => {
        if (typeof h === 'object' && h !== null) {
          const hourObj = h as { open?: { hour?: number; minute?: number }; close?: { hour?: number; minute?: number } }
          const open = hourObj.open
          const close = hourObj.close
          if (open && close) {
            return `${String(open.hour ?? 0).padStart(2, '0')}:${String(open.minute ?? 0).padStart(2, '0')}-${String(close.hour ?? 0).padStart(2, '0')}:${String(close.minute ?? 0).padStart(2, '0')}`
          }
        }
        return String(h)
      })
    }
  }

  return result
}

/**
 * Check if hours are complete (all 7 days specified)
 */
function checkHoursComplete(workHours: Record<string, string[]>): boolean {
  const daysWithHours = Object.keys(workHours).map((d) => d.toLowerCase())
  return DAYS_OF_WEEK.every((day) => daysWithHours.includes(day))
}

/**
 * GBP Completeness scoring weights based on research doc
 * Formula: (Completed Items × Weight) / Total Weight × 100
 */
export const GBP_COMPLETENESS_WEIGHTS = {
  // High weight (essential for local SEO)
  businessName: 15,
  address: 15,
  phone: 12,
  website: 10,
  primaryCategory: 10,

  // Medium weight (content & context)
  secondaryCategories: 8,
  description: 8,
  hours: 6,
  hoursComplete: 4,

  // Lower weight (media & extras)
  photos: 5,
  photoCount: 4, // Bonus for 20+ photos
  logo: 2,
  coverPhoto: 2,
  attributes: 4,

  // Credibility signals (bonus)
  claimed: 3,
  reviews: 2, // Has any reviews
} as const

export type CompletenessCheckId = keyof typeof GBP_COMPLETENESS_WEIGHTS

export interface CompletenessBreakdown {
  score: number
  maxScore: number
  label: 'Poor' | 'Needs Work' | 'Good' | 'Excellent'
  checks: Array<{
    id: CompletenessCheckId
    label: string
    weight: number
    passed: boolean
  }>
}

/**
 * Get completeness score label
 */
export function getCompletenessLabel(score: number): 'Poor' | 'Needs Work' | 'Good' | 'Excellent' {
  if (score >= 86) return 'Excellent'
  if (score >= 71) return 'Good'
  if (score >= 51) return 'Needs Work'
  return 'Poor'
}

/**
 * Calculate GBP profile completeness score with breakdown
 * Uses weighted formula: (Completed Items × Weight) / Total Weight × 100
 */
export function calculateCompletenessWithBreakdown(profile: {
  hasName: boolean
  hasPhone: boolean
  hasAddress: boolean
  hasWebsite: boolean
  hasCategory: boolean
  hasSecondaryCategories: boolean
  hasDescription: boolean
  hasPhotos: boolean
  photoCount: number
  hasLogo: boolean
  hasCoverPhoto: boolean
  hasHours: boolean
  hoursComplete: boolean
  hasAttributes: boolean
  isClaimed: boolean
  hasReviews: boolean
}): CompletenessBreakdown {
  const weights = GBP_COMPLETENESS_WEIGHTS
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)

  const checks: CompletenessBreakdown['checks'] = [
    { id: 'businessName', label: 'Business Name', weight: weights.businessName, passed: profile.hasName },
    { id: 'address', label: 'Address', weight: weights.address, passed: profile.hasAddress },
    { id: 'phone', label: 'Phone', weight: weights.phone, passed: profile.hasPhone },
    { id: 'website', label: 'Website', weight: weights.website, passed: profile.hasWebsite },
    { id: 'primaryCategory', label: 'Primary Category', weight: weights.primaryCategory, passed: profile.hasCategory },
    { id: 'secondaryCategories', label: 'Secondary Categories', weight: weights.secondaryCategories, passed: profile.hasSecondaryCategories },
    { id: 'description', label: 'Description', weight: weights.description, passed: profile.hasDescription },
    { id: 'hours', label: 'Business Hours', weight: weights.hours, passed: profile.hasHours },
    { id: 'hoursComplete', label: 'All 7 Days Hours', weight: weights.hoursComplete, passed: profile.hoursComplete },
    { id: 'photos', label: 'Photos', weight: weights.photos, passed: profile.hasPhotos },
    { id: 'photoCount', label: '20+ Photos', weight: weights.photoCount, passed: profile.photoCount >= 20 },
    { id: 'logo', label: 'Logo', weight: weights.logo, passed: profile.hasLogo },
    { id: 'coverPhoto', label: 'Cover Photo', weight: weights.coverPhoto, passed: profile.hasCoverPhoto },
    { id: 'attributes', label: 'Attributes', weight: weights.attributes, passed: profile.hasAttributes },
    { id: 'claimed', label: 'Claimed Profile', weight: weights.claimed, passed: profile.isClaimed },
    { id: 'reviews', label: 'Has Reviews', weight: weights.reviews, passed: profile.hasReviews },
  ]

  const earnedWeight = checks
    .filter((c) => c.passed)
    .reduce((sum, c) => sum + c.weight, 0)

  const score = Math.round((earnedWeight / totalWeight) * 100)

  return {
    score,
    maxScore: 100,
    label: getCompletenessLabel(score),
    checks,
  }
}

/**
 * Calculate GBP profile completeness score (0-100)
 * Backward-compatible wrapper
 */
function calculateCompletenessScore(profile: {
  hasName: boolean
  hasPhone: boolean
  hasAddress: boolean
  hasWebsite: boolean
  hasCategory: boolean
  hasDescription: boolean
  hasPhotos: boolean
  photoCount: number
  hasHours: boolean
  hoursComplete: boolean
  hasAttributes: boolean
  rating: number | null
  reviewCount: number
  isClaimed: boolean
}): number {
  const breakdown = calculateCompletenessWithBreakdown({
    hasName: profile.hasName,
    hasPhone: profile.hasPhone,
    hasAddress: profile.hasAddress,
    hasWebsite: profile.hasWebsite,
    hasCategory: profile.hasCategory,
    hasSecondaryCategories: false, // Not available in old interface
    hasDescription: profile.hasDescription,
    hasPhotos: profile.hasPhotos,
    photoCount: profile.photoCount,
    hasLogo: false, // Not available in old interface
    hasCoverPhoto: false, // Not available in old interface
    hasHours: profile.hasHours,
    hoursComplete: profile.hoursComplete,
    hasAttributes: profile.hasAttributes,
    isClaimed: profile.isClaimed,
    hasReviews: profile.reviewCount > 0,
  })

  return breakdown.score
}
