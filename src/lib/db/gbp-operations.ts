/**
 * GBP Operations (Domain-Scoped)
 *
 * Database operations for the standalone GBP tool.
 * Provides domain-level access to GBP profiles, competitors, and analysis.
 *
 * Note: Currently queries through domain -> campaigns -> gbp tables.
 * Future enhancement: Add domain_id directly to GBP tables.
 */

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  ReviewItem,
  BusinessPostItem,
  BusinessQuestionItem,
} from '@/lib/dataforseo/schemas/business'

// ============================================================================
// Types
// ============================================================================

export interface GBPProfile {
  id: string
  domainId: string
  campaignId?: string
  gmbCid: string | null
  gmbPlaceId: string | null
  businessName: string

  // Basic Info
  rating: number | null
  reviewCount: number | null
  primaryCategory: string | null
  additionalCategories: string[]
  phone: string | null
  website: string | null
  address: string | null
  description: string | null
  workHours: Record<string, string[]> | null
  attributes: Record<string, string[]> | null
  isClaimed: boolean
  photoCount: number | null

  // Completeness
  completenessScore: number | null

  // Reviews Summary
  reviewsFetchedAt: Date | null
  reviewsCountByRating: Record<string, number> | null
  recentReviews: ReviewItem[] | null
  ownerResponseRate: number | null
  ownerResponseCount: number | null

  // Posts
  postsFetchedAt: Date | null
  postsCount: number | null
  recentPosts: BusinessPostItem[] | null
  lastPostDate: Date | null
  postsPerMonthAvg: number | null

  // Q&A
  qaFetchedAt: Date | null
  questionsCount: number | null
  answeredCount: number | null
  unansweredCount: number | null
  recentQA: BusinessQuestionItem[] | null

  // Services & Products
  services: Prisma.JsonValue | null
  servicesCount: number | null
  products: Prisma.JsonValue | null
  productsCount: number | null
  menuUrl: string | null
  bookingUrl: string | null

  // Metadata
  fetchedAt: Date
  createdAt: Date
}

export interface GBPCompetitor {
  id: string
  domainId: string
  gmbCid: string
  businessName: string
  rating: number | null
  reviewCount: number | null
  primaryCategory: string | null
  additionalCategories: string[]
  phone: string | null
  website: string | null
  address: string | null
  description: string | null
  photoCount: number | null
  isClaimed: boolean
  completenessScore: number | null
  fetchedAt: Date
  createdAt: Date
  // Source info
  sourceType: 'geo_grid' | 'manual' | 'import'
  avgRank?: number | null
  shareOfVoice?: number | null
}

export interface GBPAnalysisResult {
  id: string
  domainId: string
  profile: GBPProfile
  score: number
  checks: GBPAnalysisCheck[]
  recommendations: string[]
  quickWins: string[]
  competitorAvgScore: number | null
  analyzedAt: Date
}

export interface GBPAnalysisCheck {
  id: string
  label: string
  description: string
  weight: 'high' | 'medium' | 'low'
  passed: boolean
  currentValue: string | number | boolean | null
  recommendedValue: string | number | boolean | null
  recommendation?: string
}

export interface GBPProfileInput {
  domainId: string
  gmbCid?: string
  gmbPlaceId?: string
  businessName: string
  rating?: number
  reviewCount?: number
  primaryCategory?: string
  additionalCategories?: string[]
  phone?: string
  website?: string
  address?: string
  description?: string
  workHours?: Record<string, string[]>
  attributes?: Record<string, string[]>
  isClaimed?: boolean
  photoCount?: number
  completenessScore?: number
}

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Get the primary GBP profile for a domain
 * Looks for the most recently updated GBP profile linked to this domain
 */
export async function getGBPProfileForDomain(
  domainId: string
): Promise<GBPProfile | null> {
  // First check for domain-linked GBP profile (Phase 17 - GBP decoupling)
  const domainSnapshot = await prisma.gbp_snapshots.findFirst({
    where: {
      domain_id: domainId,
      campaign_id: null, // Only domain-linked, not campaign-linked
    },
    orderBy: { updated_at: 'desc' },
  })

  if (domainSnapshot) {
    // Also check for detailed profile data (Posts, Q&A, Reviews)
    let detailedProfile = null
    if (domainSnapshot.gmb_cid) {
      detailedProfile = await prisma.gbp_detailed_profiles.findUnique({
        where: {
          domain_id_gmb_cid: {
            domain_id: domainId,
            gmb_cid: domainSnapshot.gmb_cid,
          },
        },
      })
    }

    // Return domain-linked profile merged with detailed data
    return {
      id: domainSnapshot.id,
      domainId,
      campaignId: undefined,
      businessName: domainSnapshot.business_name,
      gmbPlaceId: domainSnapshot.gmb_place_id,
      gmbCid: domainSnapshot.gmb_cid,
      rating: domainSnapshot.rating ? Number(domainSnapshot.rating) : null,
      reviewCount: domainSnapshot.review_count,
      primaryCategory: domainSnapshot.categories?.[0] ?? null,
      additionalCategories: domainSnapshot.categories?.slice(1) ?? [],
      phone: domainSnapshot.phone,
      website: domainSnapshot.website,
      address: domainSnapshot.address,
      description: domainSnapshot.description,
      workHours: domainSnapshot.work_hours as Record<string, string[]> | null,
      attributes: domainSnapshot.attributes as Record<string, string[]> | null,
      isClaimed: detailedProfile?.is_claimed ?? false,
      photoCount: (domainSnapshot.photos as { total?: number })?.total ?? null,
      completenessScore: domainSnapshot.completeness_score,
      // Detailed data from gbp_detailed_profiles
      reviewsFetchedAt: detailedProfile?.reviews_fetched_at ?? null,
      reviewsCountByRating: detailedProfile?.reviews_count_by_rating as Record<string, number> | null,
      recentReviews: detailedProfile?.recent_reviews as ReviewItem[] | null,
      ownerResponseRate: detailedProfile?.owner_response_rate ? Number(detailedProfile.owner_response_rate) : null,
      ownerResponseCount: detailedProfile?.owner_response_count ?? null,
      postsFetchedAt: detailedProfile?.posts_fetched_at ?? null,
      postsCount: detailedProfile?.posts_count ?? null,
      recentPosts: detailedProfile?.recent_posts as BusinessPostItem[] | null,
      lastPostDate: detailedProfile?.last_post_date ?? null,
      postsPerMonthAvg: detailedProfile?.posts_per_month_avg ? Number(detailedProfile.posts_per_month_avg) : null,
      qaFetchedAt: detailedProfile?.qa_fetched_at ?? null,
      questionsCount: detailedProfile?.questions_count ?? null,
      answeredCount: detailedProfile?.answered_count ?? null,
      unansweredCount: detailedProfile?.unanswered_count ?? null,
      recentQA: detailedProfile?.recent_qa as BusinessQuestionItem[] | null,
      services: detailedProfile?.services ?? null,
      servicesCount: detailedProfile?.services_count ?? null,
      products: detailedProfile?.products ?? null,
      productsCount: detailedProfile?.products_count ?? null,
      menuUrl: detailedProfile?.menu_url ?? null,
      bookingUrl: detailedProfile?.booking_url ?? null,
      fetchedAt: domainSnapshot.updated_at,
      createdAt: domainSnapshot.created_at,
    }
  }

  // Fall back to campaign-linked GBP data
  const campaign = await prisma.local_campaigns.findFirst({
    where: {
      domain_id: domainId,
      status: 'ACTIVE',
    },
    orderBy: { created_at: 'desc' },
    include: {
      gbp_snapshots: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      gbp_detailed_profiles: {
        orderBy: { fetched_at: 'desc' },
        take: 1,
      },
    },
  })

  if (!campaign) return null

  const snapshot = campaign.gbp_snapshots[0]
  const detailed = campaign.gbp_detailed_profiles[0]

  if (!snapshot && !detailed) return null

  // Merge snapshot and detailed data
  return mergeGBPData(domainId, campaign.id, snapshot, detailed)
}

/**
 * Get all GBP profiles for a domain (from all campaigns)
 */
export async function getAllGBPProfilesForDomain(
  domainId: string
): Promise<GBPProfile[]> {
  const campaigns = await prisma.local_campaigns.findMany({
    where: { domain_id: domainId },
    include: {
      gbp_snapshots: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      gbp_detailed_profiles: {
        orderBy: { fetched_at: 'desc' },
        take: 1,
      },
    },
  })

  const profiles: GBPProfile[] = []

  for (const campaign of campaigns) {
    const snapshot = campaign.gbp_snapshots[0]
    const detailed = campaign.gbp_detailed_profiles[0]

    if (snapshot || detailed) {
      const profile = mergeGBPData(domainId, campaign.id, snapshot, detailed)
      if (profile) profiles.push(profile)
    }
  }

  return profiles
}

/**
 * Save/update a GBP profile for a domain
 * Creates or updates the underlying snapshot/detailed tables
 */
export async function saveGBPProfile(
  input: GBPProfileInput
): Promise<string> {
  // Find or create a campaign for this domain to store the GBP data
  let campaign = await prisma.local_campaigns.findFirst({
    where: {
      domain_id: input.domainId,
      status: 'ACTIVE',
    },
    orderBy: { created_at: 'desc' },
  })

  if (!campaign) {
    // Get domain info to create a default campaign
    const domain = await prisma.domains.findUnique({
      where: { id: input.domainId },
      include: { users: true },
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    // Create a default campaign for GBP data
    campaign = await prisma.local_campaigns.create({
      data: {
        id: createId(),
        user_id: domain.user_id,
        business_name: input.businessName,
        keywords: [],
        grid_size: 7,
        grid_radius_miles: 3,
        center_lat: 0,
        center_lng: 0,
        status: 'ACTIVE',
        domain_id: input.domainId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  // Create/update the GBP snapshot
  // Find existing snapshot first
  const existingSnapshot = await prisma.gbp_snapshots.findFirst({
    where: {
      campaign_id: campaign.id,
      business_name: input.businessName,
    },
  })

  let snapshotId: string
  if (existingSnapshot) {
    // Update existing
    snapshotId = existingSnapshot.id
    await prisma.gbp_snapshots.update({
      where: { id: existingSnapshot.id },
      data: {
        gmb_cid: input.gmbCid,
        gmb_place_id: input.gmbPlaceId,
        rating: input.rating,
        review_count: input.reviewCount,
        phone: input.phone,
        website: input.website,
        address: input.address,
        completeness_score: input.completenessScore,
        categories: input.primaryCategory ? [input.primaryCategory, ...(input.additionalCategories ?? [])] : [],
      },
    })
  } else {
    // Create new
    snapshotId = createId()
    await prisma.gbp_snapshots.create({
      data: {
        id: snapshotId,
        campaign_id: campaign.id,
        business_name: input.businessName,
        gmb_cid: input.gmbCid,
        gmb_place_id: input.gmbPlaceId,
        rating: input.rating,
        review_count: input.reviewCount,
        phone: input.phone,
        website: input.website,
        address: input.address,
        completeness_score: input.completenessScore,
        categories: input.primaryCategory ? [input.primaryCategory, ...(input.additionalCategories ?? [])] : [],
      },
    })
  }

  // If we have a CID, also update/create detailed profile
  if (input.gmbCid) {
    await prisma.gbp_detailed_profiles.upsert({
      where: {
        campaign_id_gmb_cid: {
          campaign_id: campaign.id,
          gmb_cid: input.gmbCid,
        },
      },
      update: {
        business_name: input.businessName,
        rating: input.rating,
        review_count: input.reviewCount,
        primary_category: input.primaryCategory,
        additional_categories: input.additionalCategories ?? [],
        phone: input.phone,
        website: input.website,
        address: input.address,
        description: input.description,
        work_hours: input.workHours as Prisma.InputJsonValue ?? Prisma.JsonNull,
        attributes: input.attributes as Prisma.InputJsonValue ?? Prisma.JsonNull,
        is_claimed: input.isClaimed ?? false,
        photo_count: input.photoCount,
        fetched_at: new Date(),
      },
      create: {
        id: createId(),
        campaign_id: campaign.id,
        gmb_cid: input.gmbCid,
        business_name: input.businessName,
        rating: input.rating,
        review_count: input.reviewCount,
        primary_category: input.primaryCategory,
        additional_categories: input.additionalCategories ?? [],
        phone: input.phone,
        website: input.website,
        address: input.address,
        description: input.description,
        work_hours: input.workHours as Prisma.InputJsonValue ?? Prisma.JsonNull,
        attributes: input.attributes as Prisma.InputJsonValue ?? Prisma.JsonNull,
        is_claimed: input.isClaimed ?? false,
        photo_count: input.photoCount,
      },
    })
  }

  return snapshotId
}

// ============================================================================
// Competitor Operations
// ============================================================================

/**
 * Get GBP competitors for a domain
 * Sources from geo-grid rankings (SOV data)
 */
export async function getGBPCompetitorsForDomain(
  domainId: string,
  options: { limit?: number; sortBy?: 'rating' | 'reviews' | 'rank' } = {}
): Promise<GBPCompetitor[]> {
  const { limit = 10, sortBy = 'rank' } = options

  // Get campaigns with their latest grid scans
  const campaigns = await prisma.local_campaigns.findMany({
    where: { domain_id: domainId },
    include: {
      grid_scans: {
        where: { status: 'COMPLETED' },
        orderBy: { completed_at: 'desc' },
        take: 1,
        select: { id: true },
      },
    },
  })

  if (campaigns.length === 0) return []

  const campaignIds = campaigns.map((c) => c.id)
  const latestScanIds = campaigns
    .map((c) => c.grid_scans[0]?.id)
    .filter((id): id is string => id !== undefined)

  // Get competitors from GBP competitor profiles
  const competitors = await prisma.gbp_competitor_profiles.findMany({
    where: {
      campaign_id: { in: campaignIds },
    },
    take: limit * 2, // Fetch more to allow for sorting
  })

  // Get competitor stats from the latest scans to join avg_rank and share_of_voice
  const competitorStats = latestScanIds.length > 0
    ? await prisma.competitor_stats.findMany({
        where: {
          scan_id: { in: latestScanIds },
        },
        select: {
          gmb_cid: true,
          business_name: true,
          avg_rank: true,
          share_of_voice: true,
        },
      })
    : []

  // Build lookup maps by both gmb_cid and business_name
  const statsByGmbCid = new Map<string, { avgRank: number | null; shareOfVoice: number | null }>()
  const statsByName = new Map<string, { avgRank: number | null; shareOfVoice: number | null }>()

  for (const stat of competitorStats) {
    const data = {
      avgRank: stat.avg_rank ? Number(stat.avg_rank) : null,
      shareOfVoice: stat.share_of_voice ? Number(stat.share_of_voice) : null,
    }
    if (stat.gmb_cid) {
      statsByGmbCid.set(stat.gmb_cid, data)
    }
    statsByName.set(stat.business_name.toLowerCase(), data)
  }

  // Map competitors with stats
  let result = competitors.map((c) => {
    const statsByCid = c.gmb_cid ? statsByGmbCid.get(c.gmb_cid) : undefined
    const statsByNameMatch = statsByName.get(c.business_name.toLowerCase())
    const stats = statsByCid ?? statsByNameMatch

    return {
      id: c.id,
      domainId,
      gmbCid: c.gmb_cid,
      businessName: c.business_name,
      rating: c.rating ? Number(c.rating) : null,
      reviewCount: c.review_count,
      primaryCategory: c.primary_category,
      additionalCategories: (c.additional_categories as string[]) ?? [],
      phone: c.phone,
      website: c.website,
      address: c.address,
      description: c.description,
      photoCount: c.photo_count,
      isClaimed: c.is_claimed ?? false,
      completenessScore: c.completeness_score,
      fetchedAt: c.fetched_at,
      createdAt: c.created_at,
      sourceType: 'geo_grid' as const,
      avgRank: stats?.avgRank ?? null,
      shareOfVoice: stats?.shareOfVoice ?? null,
    }
  })

  // Sort based on sortBy parameter
  if (sortBy === 'rank') {
    result.sort((a, b) => {
      if (a.avgRank === null && b.avgRank === null) return 0
      if (a.avgRank === null) return 1
      if (b.avgRank === null) return -1
      return a.avgRank - b.avgRank // Lower rank is better
    })
  } else if (sortBy === 'rating') {
    result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  } else if (sortBy === 'reviews') {
    result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
  }

  return result.slice(0, limit)
}

/**
 * Add a GBP competitor manually
 */
export async function addGBPCompetitor(
  domainId: string,
  competitor: {
    gmbCid: string
    businessName: string
    rating?: number
    reviewCount?: number
    primaryCategory?: string
    phone?: string
    website?: string
    address?: string
  }
): Promise<string> {
  // Find campaign for this domain
  const campaign = await prisma.local_campaigns.findFirst({
    where: { domain_id: domainId },
    orderBy: { created_at: 'desc' },
  })

  if (!campaign) {
    throw new Error('No campaign found for this domain. Create a local SEO campaign first.')
  }

  const id = createId()
  await prisma.gbp_competitor_profiles.create({
    data: {
      id,
      campaign_id: campaign.id,
      gmb_cid: competitor.gmbCid,
      business_name: competitor.businessName,
      rating: competitor.rating,
      review_count: competitor.reviewCount,
      primary_category: competitor.primaryCategory,
      phone: competitor.phone,
      website: competitor.website,
      address: competitor.address,
      is_claimed: false,
      fetched_at: new Date(),
      created_at: new Date(),
    },
  })

  return id
}

/**
 * Remove a GBP competitor
 */
export async function removeGBPCompetitor(
  competitorId: string
): Promise<void> {
  await prisma.gbp_competitor_profiles.delete({
    where: { id: competitorId },
  })
}

/**
 * Import competitors from geo-grid SOV data
 * 
 * This function finds competitors from completed grid scans that have:
 * - An average rank at or below the threshold (default 20)
 * - Share of voice above 0
 * 
 * It excludes the target business (user's own business) by matching against
 * the campaign's business_name.
 */
export async function importCompetitorsFromGrid(
  domainId: string,
  options: { minAvgRank?: number; minShareOfVoice?: number; limit?: number } = {}
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const { minAvgRank = 20, minShareOfVoice = 0, limit = 15 } = options

  const result = { imported: 0, skipped: 0, errors: [] as string[] }

  // Find campaigns with grid scans for this domain
  const campaigns = await prisma.local_campaigns.findMany({
    where: { domain_id: domainId },
    include: {
      grid_scans: {
        where: { status: 'COMPLETED' },
        orderBy: { completed_at: 'desc' },
        take: 1,
      },
    },
  })

  if (campaigns.length === 0) {
    result.errors.push('No local SEO campaigns found for this domain')
    return result
  }

  for (const campaign of campaigns) {
    const latestScan = campaign.grid_scans[0]
    if (!latestScan) {
      result.errors.push(`Campaign "${campaign.business_name}" has no completed scans`)
      continue
    }

    // Get competitor stats from the scan, excluding the target business
    // Normalize business name comparison to handle case differences
    const targetNameLower = campaign.business_name.toLowerCase().trim()
    
    const competitorStats = await prisma.competitor_stats.findMany({
      where: {
        scan_id: latestScan.id,
        avg_rank: { lte: minAvgRank },
        share_of_voice: { gte: minShareOfVoice },
      },
      orderBy: [
        { share_of_voice: 'desc' },
        { avg_rank: 'asc' },
      ],
      take: limit + 5, // Get extra to account for filtering out target
    })

    if (competitorStats.length === 0) {
      result.errors.push(`No competitors found in scan for "${campaign.business_name}"`)
      continue
    }

    let importedForCampaign = 0

    for (const stat of competitorStats) {
      // Skip if this is the target business (user's own business)
      const statNameLower = stat.business_name.toLowerCase().trim()
      if (statNameLower === targetNameLower || 
          statNameLower.includes(targetNameLower) || 
          targetNameLower.includes(statNameLower)) {
        continue
      }

      // Stop if we've hit the limit for this campaign
      if (importedForCampaign >= limit) break

      // Check if already exists
      const existing = await prisma.gbp_competitor_profiles.findFirst({
        where: {
          campaign_id: campaign.id,
          business_name: stat.business_name,
        },
      })

      if (existing) {
        result.skipped++
        continue
      }

      try {
        await prisma.gbp_competitor_profiles.create({
          data: {
            id: createId(),
            campaign_id: campaign.id,
            gmb_cid: stat.gmb_cid ?? '',
            business_name: stat.business_name,
            rating: stat.rating,
            review_count: stat.review_count,
            is_claimed: false,
            fetched_at: new Date(),
            created_at: new Date(),
          },
        })
        result.imported++
        importedForCampaign++
      } catch (error) {
        result.errors.push(`Failed to import "${stat.business_name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return result
}

// ============================================================================
// Analysis Operations
// ============================================================================

/**
 * Dental-specific GBP analysis checks
 */
export const GBP_ANALYSIS_CHECKS: Omit<GBPAnalysisCheck, 'passed' | 'currentValue'>[] = [
  {
    id: 'city_in_name',
    label: 'City in GBP Name',
    description: 'Having the city in your business name significantly improves local rankings',
    weight: 'high',
    recommendedValue: true,
    recommendation: 'Consider adding your city to your GBP business name (e.g., "Bright Smiles Dental - Chicago")',
  },
  {
    id: 'primary_category',
    label: 'Optimal Primary Category',
    description: '"Dentist" typically performs better than "Dental Clinic" for most practices',
    weight: 'high',
    recommendedValue: 'Dentist',
    recommendation: 'Set your primary category to "Dentist" unless you specialize (e.g., "Orthodontist")',
  },
  {
    id: 'secondary_categories',
    label: 'Secondary Categories',
    description: 'Add all relevant service categories',
    weight: 'medium',
    recommendedValue: '3+ categories',
    recommendation: 'Add categories like "Cosmetic Dentist", "Emergency Dental Service", "Dental Implants Provider"',
  },
  {
    id: 'service_descriptions',
    label: 'Service Descriptions',
    description: 'Each service should have a detailed description',
    weight: 'medium',
    recommendedValue: true,
    recommendation: 'Add detailed descriptions for each service you offer (at least 100 characters each)',
  },
  {
    id: 'posting_frequency',
    label: 'Regular Google Posts',
    description: 'Posting at least once per week shows an active business',
    weight: 'medium',
    recommendedValue: '4+ posts/month',
    recommendation: 'Post weekly updates about promotions, dental tips, team highlights, or patient testimonials',
  },
  {
    id: 'qa_answered',
    label: 'Q&A Section Complete',
    description: 'All questions should have answers from the business owner',
    weight: 'medium',
    recommendedValue: '100% answered',
    recommendation: 'Answer all questions in your Q&A section. Consider adding common questions yourself.',
  },
  {
    id: 'photo_count',
    label: 'Photo Count',
    description: 'More photos lead to more engagement and clicks',
    weight: 'medium',
    recommendedValue: '50+ photos',
    recommendation: 'Add photos of your office, team, equipment, before/after cases, and happy patients',
  },
  {
    id: 'photo_types',
    label: 'Photo Variety',
    description: 'Include cover photo, logo, interior, exterior, and team photos',
    weight: 'low',
    recommendedValue: 'All types',
    recommendation: 'Ensure you have: cover photo, logo, interior shots, exterior shot, and team photos',
  },
  {
    id: 'hours_complete',
    label: 'Business Hours',
    description: 'Hours should be set for all 7 days (including closed days)',
    weight: 'low',
    recommendedValue: true,
    recommendation: 'Set hours for all 7 days, marking closed days explicitly',
  },
  {
    id: 'description_keywords',
    label: 'Keywords in Description',
    description: 'Business description should include target keywords naturally',
    weight: 'low',
    recommendedValue: true,
    recommendation: 'Include keywords like "dentist", "[city] dental", and your key services in your description',
  },
]

/**
 * Run GBP analysis for a domain
 */
export async function runGBPAnalysis(
  domainId: string,
  cityName: string
): Promise<GBPAnalysisResult | null> {
  const profile = await getGBPProfileForDomain(domainId)
  if (!profile) return null

  const checks: GBPAnalysisCheck[] = []
  let totalWeight = 0
  let earnedWeight = 0

  const weightValues = { high: 3, medium: 2, low: 1 }

  // Run each check
  for (const check of GBP_ANALYSIS_CHECKS) {
    let passed = false
    let currentValue: string | number | boolean | null = null

    switch (check.id) {
      case 'city_in_name':
        currentValue = profile.businessName.toLowerCase().includes(cityName.toLowerCase())
        passed = currentValue === true
        break

      case 'primary_category':
        currentValue = profile.primaryCategory
        passed = profile.primaryCategory?.toLowerCase() === 'dentist'
        break

      case 'secondary_categories':
        currentValue = profile.additionalCategories?.length ?? 0
        passed = (profile.additionalCategories?.length ?? 0) >= 3
        break

      case 'service_descriptions':
        currentValue = profile.servicesCount ?? 0
        passed = (profile.servicesCount ?? 0) >= 5
        break

      case 'posting_frequency':
        currentValue = profile.postsPerMonthAvg ?? 0
        passed = (profile.postsPerMonthAvg ?? 0) >= 4
        break

      case 'qa_answered':
        const totalQs = profile.questionsCount ?? 0
        const answered = profile.answeredCount ?? 0
        currentValue = totalQs > 0 ? `${answered}/${totalQs}` : 'No Q&A'
        passed = totalQs === 0 || answered === totalQs
        break

      case 'photo_count':
        currentValue = profile.photoCount ?? 0
        passed = (profile.photoCount ?? 0) >= 50
        break

      case 'photo_types':
        // Would need photo type breakdown - assume passed if > 20 photos
        currentValue = profile.photoCount ?? 0
        passed = (profile.photoCount ?? 0) >= 20
        break

      case 'hours_complete':
        const hours = profile.workHours ?? {}
        currentValue = Object.keys(hours).length
        passed = Object.keys(hours).length >= 7
        break

      case 'description_keywords':
        const desc = profile.description?.toLowerCase() ?? ''
        currentValue = !!profile.description
        passed = desc.includes('dentist') || desc.includes('dental')
        break
    }

    totalWeight += weightValues[check.weight]
    if (passed) earnedWeight += weightValues[check.weight]

    checks.push({
      ...check,
      passed,
      currentValue,
    })
  }

  // Calculate score (0-100)
  const score = Math.round((earnedWeight / totalWeight) * 100)

  // Generate recommendations from failed checks
  const recommendations = checks
    .filter((c) => !c.passed)
    .sort((a, b) => weightValues[b.weight] - weightValues[a.weight])
    .map((c) => c.recommendation ?? '')
    .filter(Boolean)

  // Quick wins = low effort, high impact
  const quickWins = checks
    .filter((c) => !c.passed && (c.id === 'hours_complete' || c.id === 'secondary_categories' || c.id === 'description_keywords'))
    .map((c) => c.recommendation ?? '')
    .filter(Boolean)

  // Get competitor average for comparison
  const competitors = await getGBPCompetitorsForDomain(domainId, { limit: 5 })
  const competitorAvgScore = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + (c.completenessScore ?? 0), 0) / competitors.length
    : null

  return {
    id: createId(),
    domainId,
    profile,
    score,
    checks,
    recommendations,
    quickWins,
    competitorAvgScore,
    analyzedAt: new Date(),
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeGBPData(
  domainId: string,
  campaignId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailed: any
): GBPProfile | null {
  if (!snapshot && !detailed) return null

  return {
    id: detailed?.id ?? snapshot?.id ?? createId(),
    domainId,
    campaignId,
    gmbCid: detailed?.gmb_cid ?? snapshot?.gmb_cid ?? null,
    gmbPlaceId: snapshot?.gmb_place_id ?? null,
    businessName: detailed?.business_name ?? snapshot?.business_name ?? 'Unknown',

    // Basic Info
    rating: detailed?.rating ? Number(detailed.rating) : snapshot?.rating ? Number(snapshot.rating) : null,
    reviewCount: detailed?.review_count ?? snapshot?.review_count ?? null,
    primaryCategory: detailed?.primary_category ?? snapshot?.primary_category ?? null,
    additionalCategories: (detailed?.additional_categories as string[]) ?? [],
    phone: detailed?.phone ?? snapshot?.phone ?? null,
    website: detailed?.website ?? snapshot?.website ?? null,
    address: detailed?.address ?? snapshot?.address ?? null,
    description: detailed?.description ?? null,
    workHours: detailed?.work_hours as Record<string, string[]> | null,
    attributes: detailed?.attributes as Record<string, string[]> | null,
    isClaimed: detailed?.is_claimed ?? snapshot?.is_claimed ?? false,
    photoCount: detailed?.photo_count ?? null,

    // Completeness
    completenessScore: snapshot?.completeness_score ?? null,

    // Reviews
    reviewsFetchedAt: detailed?.reviews_fetched_at ?? null,
    reviewsCountByRating: detailed?.reviews_count_by_rating as Record<string, number> | null,
    recentReviews: detailed?.recent_reviews as ReviewItem[] | null,
    ownerResponseRate: detailed?.owner_response_rate ? Number(detailed.owner_response_rate) : null,
    ownerResponseCount: detailed?.owner_response_count ?? null,

    // Posts
    postsFetchedAt: detailed?.posts_fetched_at ?? null,
    postsCount: detailed?.posts_count ?? null,
    recentPosts: detailed?.recent_posts as BusinessPostItem[] | null,
    lastPostDate: detailed?.last_post_date ?? null,
    postsPerMonthAvg: detailed?.posts_per_month_avg ? Number(detailed.posts_per_month_avg) : null,

    // Q&A
    qaFetchedAt: detailed?.qa_fetched_at ?? null,
    questionsCount: detailed?.questions_count ?? null,
    answeredCount: detailed?.answered_count ?? null,
    unansweredCount: detailed?.unanswered_count ?? null,
    recentQA: detailed?.recent_qa as BusinessQuestionItem[] | null,

    // Services & Products
    services: detailed?.services ?? null,
    servicesCount: detailed?.services_count ?? null,
    products: detailed?.products ?? null,
    productsCount: detailed?.products_count ?? null,
    menuUrl: detailed?.menu_url ?? null,
    bookingUrl: detailed?.booking_url ?? null,

    // Metadata
    fetchedAt: detailed?.fetched_at ?? snapshot?.created_at ?? new Date(),
    createdAt: detailed?.created_at ?? snapshot?.created_at ?? new Date(),
  }
}
