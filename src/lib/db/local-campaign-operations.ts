/**
 * Local Campaign Database Operations
 *
 * Prisma operations for local SEO campaign CRUD, grid scans, and GBP snapshots.
 */

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { LocalCampaignStatus, GridScanStatus, Prisma } from '@prisma/client'
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignSummary,
  CompetitorRanking,
  AggregatedCompetitorStats,
} from '@/lib/local-seo/types'

// ============================================================================
// Campaign Operations
// ============================================================================

/**
 * Create a new local campaign
 */
export async function createLocalCampaign(
  userId: string,
  input: CreateCampaignInput
): Promise<string> {
  const campaign = await prisma.local_campaigns.create({
    data: {
      id: createId(),
      user_id: userId,
      business_name: input.businessName,
      gmb_place_id: input.gmbPlaceId || null,
      gmb_cid: input.gmbCid || null,
      center_lat: input.centerLat,
      center_lng: input.centerLng,
      grid_size: input.gridSize ?? 7,
      grid_radius_miles: input.gridRadiusMiles ?? 5,
      keywords: input.keywords,
      status: LocalCampaignStatus.ACTIVE,
      scan_frequency: input.scanFrequency ?? 'weekly',
      // Set next scan to now (will be scheduled after creation)
      next_scan_at: new Date(),
      updated_at: new Date(),
    },
    select: { id: true },
  })
  return campaign.id
}

/**
 * Get campaign by ID with relations
 */
export async function getLocalCampaign(campaignId: string) {
  return prisma.local_campaigns.findUnique({
    where: { id: campaignId },
    include: {
      users: { select: { id: true, email: true, name: true } },
      grid_scans: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          avg_rank: true,
          share_of_voice: true,
          top_competitor: true,
          created_at: true,
          completed_at: true,
        },
      },
      gbp_snapshots: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Get campaign for user validation
 */
export async function getCampaignForUser(campaignId: string, userId: string) {
  return prisma.local_campaigns.findFirst({
    where: { id: campaignId, user_id: userId },
  })
}

/**
 * List campaigns for a user
 */
export async function listUserCampaigns(
  userId: string,
  options?: {
    status?: LocalCampaignStatus
    limit?: number
    offset?: number
  }
): Promise<CampaignSummary[]> {
  const campaigns = await prisma.local_campaigns.findMany({
    where: {
      user_id: userId,
      ...(options?.status && { status: options.status }),
    },
    orderBy: { updated_at: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    include: {
      grid_scans: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: {
          avg_rank: true,
          share_of_voice: true,
          top_competitor: true,
        },
      },
    },
  })

  return campaigns.map((c) => ({
    id: c.id,
    businessName: c.business_name,
    status: c.status,
    keywords: c.keywords,
    gridSize: c.grid_size,
    gridRadiusMiles: Number(c.grid_radius_miles),
    scanFrequency: c.scan_frequency,
    lastScanAt: c.last_scan_at,
    nextScanAt: c.next_scan_at,
    latestScan: c.grid_scans[0]
      ? {
          avgRank: c.grid_scans[0].avg_rank ? Number(c.grid_scans[0].avg_rank) : null,
          shareOfVoice: c.grid_scans[0].share_of_voice
            ? Number(c.grid_scans[0].share_of_voice)
            : null,
        }
      : null,
  }))
}

/**
 * Update campaign
 */
export async function updateLocalCampaign(
  campaignId: string,
  input: UpdateCampaignInput
): Promise<void> {
  await prisma.local_campaigns.update({
    where: { id: campaignId },
    data: {
      ...(input.businessName && { business_name: input.businessName }),
      ...(input.keywords && { keywords: input.keywords }),
      ...(input.status && { status: input.status as LocalCampaignStatus }),
      ...(input.scanFrequency && { scan_frequency: input.scanFrequency }),
      ...(input.gridRadiusMiles && { grid_radius_miles: input.gridRadiusMiles }),
    },
  })
}

/**
 * Delete campaign and all related data
 */
export async function deleteLocalCampaign(campaignId: string): Promise<void> {
  await prisma.local_campaigns.delete({
    where: { id: campaignId },
  })
}

/**
 * Update campaign scan schedule
 */
export async function updateCampaignSchedule(
  campaignId: string,
  lastScanAt: Date,
  scanFrequency: string
): Promise<void> {
  // Calculate next scan based on frequency
  const nextScanAt = new Date(lastScanAt)
  switch (scanFrequency) {
    case 'daily':
      nextScanAt.setDate(nextScanAt.getDate() + 1)
      break
    case 'weekly':
      nextScanAt.setDate(nextScanAt.getDate() + 7)
      break
    case 'monthly':
      nextScanAt.setMonth(nextScanAt.getMonth() + 1)
      break
  }

  await prisma.local_campaigns.update({
    where: { id: campaignId },
    data: {
      last_scan_at: lastScanAt,
      next_scan_at: nextScanAt,
    },
  })
}

/**
 * Get campaigns due for scanning
 */
export async function getCampaignsDueForScan(limit: number = 10) {
  return prisma.local_campaigns.findMany({
    where: {
      status: LocalCampaignStatus.ACTIVE,
      next_scan_at: { lte: new Date() },
    },
    orderBy: { next_scan_at: 'asc' },
    take: limit,
    select: {
      id: true,
      user_id: true,
      business_name: true,
      keywords: true,
    },
  })
}

// ============================================================================
// Grid Scan Operations
// ============================================================================

/**
 * Create a new grid scan record
 */
export async function createGridScan(campaignId: string): Promise<string> {
  const scan = await prisma.grid_scans.create({
    data: {
      id: createId(),
      campaign_id: campaignId,
      status: GridScanStatus.PENDING,
      progress: 0,
    },
    select: { id: true },
  })
  return scan.id
}

/**
 * Start a grid scan
 */
export async function startGridScan(scanId: string): Promise<void> {
  await prisma.grid_scans.update({
    where: { id: scanId },
    data: {
      status: GridScanStatus.SCANNING,
      started_at: new Date(),
    },
  })
}

/**
 * Update scan progress
 */
export async function updateScanProgress(
  scanId: string,
  progress: number,
  apiCallsUsed?: number
): Promise<void> {
  await prisma.grid_scans.update({
    where: { id: scanId },
    data: {
      progress: Math.min(100, Math.max(0, progress)),
      ...(apiCallsUsed !== undefined && { api_calls_used: apiCallsUsed }),
    },
  })
}

/**
 * Complete a grid scan with aggregate metrics
 */
export async function completeGridScan(
  scanId: string,
  metrics: {
    avgRank: number | null
    shareOfVoice: number
    topCompetitor: string | null
    apiCallsUsed: number
    estimatedCost: number
    failedPoints: number
  }
): Promise<void> {
  await prisma.grid_scans.update({
    where: { id: scanId },
    data: {
      status: GridScanStatus.COMPLETED,
      completed_at: new Date(),
      progress: 100,
      avg_rank: metrics.avgRank,
      share_of_voice: metrics.shareOfVoice,
      top_competitor: metrics.topCompetitor,
      api_calls_used: metrics.apiCallsUsed,
      estimated_cost: metrics.estimatedCost,
      failed_points: metrics.failedPoints,
    },
  })
}

/**
 * Fail a grid scan
 */
export async function failGridScan(scanId: string, errorMessage: string): Promise<void> {
  await prisma.grid_scans.update({
    where: { id: scanId },
    data: {
      status: GridScanStatus.FAILED,
      completed_at: new Date(),
      error_message: errorMessage,
    },
  })
}

/**
 * Get scan by ID
 */
export async function getGridScan(scanId: string) {
  return prisma.grid_scans.findUnique({
    where: { id: scanId },
    include: {
      local_campaigns: {
        select: {
          id: true,
          business_name: true,
          keywords: true,
          grid_size: true,
          grid_radius_miles: true,
          center_lat: true,
          center_lng: true,
        },
      },
    },
  })
}

/**
 * Get scan status
 */
export async function getScanStatus(scanId: string) {
  return prisma.grid_scans.findUnique({
    where: { id: scanId },
    select: {
      id: true,
      status: true,
      progress: true,
      started_at: true,
      completed_at: true,
      error_message: true,
    },
  })
}

/**
 * List scans for a campaign
 */
export async function listCampaignScans(
  campaignId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.grid_scans.findMany({
    where: { campaign_id: campaignId },
    orderBy: { created_at: 'desc' },
    take: options?.limit ?? 20,
    skip: options?.offset ?? 0,
    select: {
      id: true,
      status: true,
      avg_rank: true,
      share_of_voice: true,
      top_competitor: true,
      api_calls_used: true,
      started_at: true,
      completed_at: true,
      created_at: true,
    },
  })
}

// ============================================================================
// Grid Point Result Operations
// ============================================================================

/**
 * Save grid point results in batch
 */
export async function saveGridPointResults(
  scanId: string,
  results: Array<{
    gridRow: number
    gridCol: number
    lat: number
    lng: number
    keyword: string
    rank: number | null
    topRankings: CompetitorRanking[]
    totalResults: number
  }>
): Promise<void> {
  await prisma.grid_point_results.createMany({
    data: results.map((r) => ({
      id: createId(),
      scan_id: scanId,
      grid_row: r.gridRow,
      grid_col: r.gridCol,
      lat: r.lat,
      lng: r.lng,
      keyword: r.keyword,
      rank: r.rank,
      top_rankings: r.topRankings as unknown as Prisma.InputJsonValue,
      total_results: r.totalResults,
    })),
  })
}

/**
 * Get grid points for a scan and keyword
 */
export async function getGridPointsForKeyword(scanId: string, keyword: string) {
  return prisma.grid_point_results.findMany({
    where: { scan_id: scanId, keyword },
    orderBy: [{ grid_row: 'asc' }, { grid_col: 'asc' }],
  })
}

/**
 * Get all grid points for a scan
 */
export async function getAllGridPoints(scanId: string) {
  return prisma.grid_point_results.findMany({
    where: { scan_id: scanId },
    orderBy: [{ keyword: 'asc' }, { grid_row: 'asc' }, { grid_col: 'asc' }],
  })
}

// ============================================================================
// Competitor Stat Operations
// ============================================================================

/**
 * Save competitor stats in batch
 */
export async function saveCompetitorStats(
  scanId: string,
  stats: AggregatedCompetitorStats[]
): Promise<void> {
  await prisma.competitor_stats.createMany({
    data: stats.map((s) => ({
      id: createId(),
      scan_id: scanId,
      business_name: s.businessName,
      gmb_cid: s.gmbCid,
      rating: s.rating,
      review_count: s.reviewCount,
      avg_rank: s.avgRank,
      times_in_top_3: s.timesInTop3,
      times_in_top_10: s.timesInTop10,
      times_in_top_20: s.timesInTop20,
      share_of_voice: s.shareOfVoice,
      prev_avg_rank: s.prevAvgRank,
      rank_change: s.rankChange,
    })),
  })
}

/**
 * Get competitor stats for a scan
 */
export async function getCompetitorStats(
  scanId: string,
  options?: { limit?: number; sortBy?: 'avg_rank' | 'share_of_voice' | 'times_in_top_3' }
) {
  const sortField = options?.sortBy ?? 'avg_rank'
  const sortOrder = sortField === 'avg_rank' ? 'asc' : 'desc'

  return prisma.competitor_stats.findMany({
    where: { scan_id: scanId },
    orderBy: { [sortField]: sortOrder },
    take: options?.limit ?? 50,
  })
}

/**
 * Get previous scan's competitor stats for comparison
 */
export async function getPreviousCompetitorStats(campaignId: string, excludeScanId: string) {
  // Get the previous completed scan
  const previousScan = await prisma.grid_scans.findFirst({
    where: {
      campaign_id: campaignId,
      status: GridScanStatus.COMPLETED,
      id: { not: excludeScanId },
    },
    orderBy: { completed_at: 'desc' },
    select: { id: true },
  })

  if (!previousScan) return null

  const stats = await prisma.competitor_stats.findMany({
    where: { scan_id: previousScan.id },
  })

  // Return as map for easy lookup
  return new Map(stats.map((s) => [s.business_name, s]))
}

// ============================================================================
// GBP Snapshot Operations
// ============================================================================

/**
 * Save GBP snapshot
 */
export async function saveGBPSnapshot(
  campaignId: string,
  data: {
    businessName: string
    gmbPlaceId?: string
    gmbCid?: string
    rating?: number
    reviewCount?: number
    ratingDistribution?: Record<string, number>
    completenessScore?: number
    address?: string
    phone?: string
    website?: string
    categories?: string[]
    attributes?: Record<string, unknown>
    workHours?: Record<string, unknown>
    photos?: Record<string, unknown>
    rawData?: Record<string, unknown>
  }
): Promise<string> {
  const snapshot = await prisma.gbp_snapshots.create({
    data: {
      id: createId(),
      campaign_id: campaignId,
      business_name: data.businessName,
      gmb_place_id: data.gmbPlaceId,
      gmb_cid: data.gmbCid,
      rating: data.rating,
      review_count: data.reviewCount,
      rating_distribution: data.ratingDistribution as Prisma.InputJsonValue,
      completeness_score: data.completenessScore,
      address: data.address,
      phone: data.phone,
      website: data.website,
      categories: data.categories ?? [],
      attributes: data.attributes as Prisma.InputJsonValue,
      work_hours: data.workHours as Prisma.InputJsonValue,
      photos: data.photos as Prisma.InputJsonValue,
      raw_data: data.rawData as Prisma.InputJsonValue,
    },
    select: { id: true },
  })
  return snapshot.id
}

/**
 * Get latest GBP snapshot for a campaign
 */
export async function getLatestGBPSnapshot(campaignId: string) {
  return prisma.gbp_snapshots.findFirst({
    where: { campaign_id: campaignId },
    orderBy: { created_at: 'desc' },
  })
}

/**
 * Get GBP snapshot history for a campaign
 */
export async function getGBPSnapshotHistory(
  campaignId: string,
  options?: { limit?: number }
) {
  return prisma.gbp_snapshots.findMany({
    where: { campaign_id: campaignId },
    orderBy: { created_at: 'desc' },
    take: options?.limit ?? 10,
    select: {
      id: true,
      rating: true,
      review_count: true,
      completeness_score: true,
      created_at: true,
    },
  })
}

// ============================================================================
// Statistics Helpers
// ============================================================================

/**
 * Count campaigns for a user
 */
export async function countUserCampaigns(userId: string): Promise<number> {
  return prisma.local_campaigns.count({
    where: { user_id: userId },
  })
}

/**
 * Get campaign scan count
 */
export async function getCampaignScanCount(campaignId: string): Promise<number> {
  return prisma.grid_scans.count({
    where: { campaign_id: campaignId },
  })
}

// ============================================================================
// GBP Competitor Profile Operations (Phase 12)
// ============================================================================

/**
 * Input for saving a competitor GBP profile
 */
export interface CompetitorGBPProfileInput {
  gmbCid: string
  businessName: string
  rating?: number
  reviewCount?: number
  description?: string
  primaryCategory?: string
  additionalCategories?: string[]
  nameHasKeyword?: boolean
  nameHasCity?: boolean
  address?: string
  phone?: string
  website?: string
  hasDescription?: boolean
  descriptionLength?: number
  hasPhotos?: boolean
  photoCount?: number
  hasServices?: boolean
  hasProducts?: boolean
  isClaimed?: boolean
  attributes?: Record<string, string[]>
  attributeCount?: number
  workHours?: Record<string, string[]>
  hoursComplete?: boolean
  completenessScore?: number
  rawData?: Record<string, unknown>
}

/**
 * Save or update a competitor GBP profile
 */
export async function saveCompetitorGBPProfile(
  campaignId: string,
  profile: CompetitorGBPProfileInput
): Promise<string> {
  const data = {
    campaign_id: campaignId,
    gmb_cid: profile.gmbCid,
    business_name: profile.businessName,
    rating: profile.rating,
    review_count: profile.reviewCount,
    description: profile.description,
    primary_category: profile.primaryCategory,
    additional_categories: profile.additionalCategories ?? [],
    name_has_keyword: profile.nameHasKeyword ?? false,
    name_has_city: profile.nameHasCity ?? false,
    address: profile.address,
    phone: profile.phone,
    website: profile.website,
    has_description: profile.hasDescription ?? false,
    description_length: profile.descriptionLength ?? 0,
    has_photos: profile.hasPhotos ?? false,
    photo_count: profile.photoCount ?? 0,
    has_services: profile.hasServices ?? false,
    has_products: profile.hasProducts ?? false,
    is_claimed: profile.isClaimed ?? false,
    attributes: profile.attributes as Prisma.InputJsonValue,
    attribute_count: profile.attributeCount ?? 0,
    work_hours: profile.workHours as Prisma.InputJsonValue,
    hours_complete: profile.hoursComplete ?? false,
    completeness_score: profile.completenessScore,
    raw_data: profile.rawData as Prisma.InputJsonValue,
    fetched_at: new Date(),
  }

  const result = await prisma.gbp_competitor_profiles.upsert({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: profile.gmbCid,
      },
    },
    create: {
      id: createId(),
      ...data,
    },
    update: data,
    select: { id: true },
  })

  return result.id
}

/**
 * Get competitor GBP profiles for a campaign
 */
export async function getCompetitorGBPProfiles(
  campaignId: string,
  options?: { limit?: number; maxAge?: number }
) {
  const profiles = await prisma.gbp_competitor_profiles.findMany({
    where: {
      campaign_id: campaignId,
      ...(options?.maxAge && {
        fetched_at: {
          gte: new Date(Date.now() - options.maxAge * 1000),
        },
      }),
    },
    orderBy: { fetched_at: 'desc' },
    take: options?.limit ?? 10,
  })

  return profiles.map((p) => ({
    id: p.id,
    gmbCid: p.gmb_cid,
    businessName: p.business_name,
    rating: p.rating ? Number(p.rating) : null,
    reviewCount: p.review_count,
    description: p.description,
    primaryCategory: p.primary_category,
    additionalCategories: p.additional_categories,
    nameHasKeyword: p.name_has_keyword,
    nameHasCity: p.name_has_city,
    address: p.address,
    phone: p.phone,
    website: p.website,
    hasDescription: p.has_description,
    descriptionLength: p.description_length,
    hasPhotos: p.has_photos,
    photoCount: p.photo_count,
    hasServices: p.has_services,
    hasProducts: p.has_products,
    isClaimed: p.is_claimed,
    attributes: p.attributes as Record<string, string[]> | null,
    attributeCount: p.attribute_count,
    workHours: p.work_hours as Record<string, string[]> | null,
    hoursComplete: p.hours_complete,
    completenessScore: p.completeness_score,
    fetchedAt: p.fetched_at,
    createdAt: p.created_at,
  }))
}

/**
 * Get a specific competitor GBP profile
 */
export async function getCompetitorGBPProfile(campaignId: string, gmbCid: string) {
  const profile = await prisma.gbp_competitor_profiles.findUnique({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
  })

  if (!profile) return null

  return {
    id: profile.id,
    gmbCid: profile.gmb_cid,
    businessName: profile.business_name,
    rating: profile.rating ? Number(profile.rating) : null,
    reviewCount: profile.review_count,
    description: profile.description,
    primaryCategory: profile.primary_category,
    additionalCategories: profile.additional_categories,
    nameHasKeyword: profile.name_has_keyword,
    nameHasCity: profile.name_has_city,
    address: profile.address,
    phone: profile.phone,
    website: profile.website,
    hasDescription: profile.has_description,
    descriptionLength: profile.description_length,
    hasPhotos: profile.has_photos,
    photoCount: profile.photo_count,
    hasServices: profile.has_services,
    hasProducts: profile.has_products,
    isClaimed: profile.is_claimed,
    attributes: profile.attributes as Record<string, string[]> | null,
    attributeCount: profile.attribute_count,
    workHours: profile.work_hours as Record<string, string[]> | null,
    hoursComplete: profile.hours_complete,
    completenessScore: profile.completeness_score,
    rawData: profile.raw_data,
    fetchedAt: profile.fetched_at,
    createdAt: profile.created_at,
  }
}

/**
 * Get top competitors by share of voice from the latest scan
 */
export async function getTopCompetitorsBySoV(
  campaignId: string,
  limit: number = 3
): Promise<
  Array<{
    businessName: string
    gmbCid: string | null
    rating: number | null
    reviewCount: number | null
    avgRank: number
    shareOfVoice: number
    timesInTop3: number
  }>
> {
  // Get the latest completed scan
  const latestScan = await prisma.grid_scans.findFirst({
    where: {
      campaign_id: campaignId,
      status: GridScanStatus.COMPLETED,
    },
    orderBy: { completed_at: 'desc' },
    select: { id: true },
  })

  if (!latestScan) return []

  const competitors = await prisma.competitor_stats.findMany({
    where: { scan_id: latestScan.id },
    orderBy: { share_of_voice: 'desc' },
    take: limit,
  })

  return competitors.map((c) => ({
    businessName: c.business_name,
    gmbCid: c.gmb_cid,
    rating: c.rating ? Number(c.rating) : null,
    reviewCount: c.review_count,
    avgRank: Number(c.avg_rank),
    shareOfVoice: Number(c.share_of_voice),
    timesInTop3: c.times_in_top_3,
  }))
}

/**
 * Check if competitor profiles need refresh (older than maxAge seconds)
 */
export async function checkCompetitorProfilesNeedRefresh(
  campaignId: string,
  gmbCids: string[],
  maxAgeSeconds: number = 14400 // 4 hours default
): Promise<string[]> {
  const cutoff = new Date(Date.now() - maxAgeSeconds * 1000)

  const existingProfiles = await prisma.gbp_competitor_profiles.findMany({
    where: {
      campaign_id: campaignId,
      gmb_cid: { in: gmbCids },
      fetched_at: { gte: cutoff },
    },
    select: { gmb_cid: true },
  })

  const freshCids = new Set(existingProfiles.map((p) => p.gmb_cid))
  return gmbCids.filter((cid) => !freshCids.has(cid))
}

/**
 * Delete competitor GBP profiles for a campaign
 */
export async function deleteCompetitorGBPProfiles(campaignId: string): Promise<number> {
  const result = await prisma.gbp_competitor_profiles.deleteMany({
    where: { campaign_id: campaignId },
  })
  return result.count
}
