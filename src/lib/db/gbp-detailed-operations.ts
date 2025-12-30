/**
 * GBP Detailed Profile Database Operations
 *
 * Prisma operations for storing and retrieving detailed GBP data
 * including Posts, Q&A, Reviews, Services, and Products.
 */

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  BusinessPostsResult,
  BusinessQAResult,
  BusinessReviewsResult,
  ReviewItem,
  BusinessPostItem,
  BusinessQuestionItem,
} from '@/lib/dataforseo/schemas/business'

// ============================================================================
// Types
// ============================================================================

export interface GBPDetailedProfileInput {
  campaignId?: string  // Optional - can link to campaign OR domain
  domainId?: string    // Optional - direct domain link (Phase 17)
  gmbCid: string
  businessName: string

  // Basic info (optional - may already exist from comparison)
  rating?: number
  reviewCount?: number
  primaryCategory?: string
  additionalCategories?: string[]
  phone?: string
  website?: string
  address?: string
  description?: string
  workHours?: Prisma.JsonValue
  attributes?: Prisma.JsonValue
  isClaimed?: boolean
  photoCount?: number
}

export interface PostsDataInput {
  postsResult: BusinessPostsResult
}

export interface QADataInput {
  qaResult: BusinessQAResult
}

export interface ReviewsDataInput {
  reviewsResult: BusinessReviewsResult
}

export interface GBPDetailedProfile {
  id: string
  campaignId: string | null
  domainId: string | null
  gmbCid: string
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
  workHours: Prisma.JsonValue | null
  attributes: Prisma.JsonValue | null
  isClaimed: boolean
  photoCount: number | null

  // Reviews Summary
  reviewsFetchedAt: Date | null
  reviewsCountByRating: Record<string, number> | null
  recentReviews: ReviewItem[] | null
  avgResponseTime: string | null
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

// ============================================================================
// Create / Upsert Operations
// ============================================================================

/**
 * Create or update a GBP detailed profile
 * Supports both campaign-based and domain-based profiles
 */
export async function upsertGBPDetailedProfile(
  input: GBPDetailedProfileInput
): Promise<string> {
  // Determine if this is campaign-based or domain-based
  if (input.campaignId) {
    // Campaign-based profile
    const result = await prisma.gbp_detailed_profiles.upsert({
      where: {
        campaign_id_gmb_cid: {
          campaign_id: input.campaignId,
          gmb_cid: input.gmbCid,
        },
      },
      update: {
        business_name: input.businessName,
        rating: input.rating ?? undefined,
        review_count: input.reviewCount ?? undefined,
        primary_category: input.primaryCategory ?? undefined,
        additional_categories: input.additionalCategories ?? undefined,
        phone: input.phone ?? undefined,
        website: input.website ?? undefined,
        address: input.address ?? undefined,
        description: input.description ?? undefined,
        work_hours: input.workHours ?? undefined,
        attributes: input.attributes ?? undefined,
        is_claimed: input.isClaimed ?? undefined,
        photo_count: input.photoCount ?? undefined,
        fetched_at: new Date(),
      },
      create: {
        id: createId(),
        campaign_id: input.campaignId,
        gmb_cid: input.gmbCid,
        business_name: input.businessName,
        rating: input.rating ?? null,
        review_count: input.reviewCount ?? null,
        primary_category: input.primaryCategory ?? null,
        additional_categories: input.additionalCategories ?? [],
        phone: input.phone ?? null,
        website: input.website ?? null,
        address: input.address ?? null,
        description: input.description ?? null,
        work_hours: input.workHours ?? Prisma.JsonNull,
        attributes: input.attributes ?? Prisma.JsonNull,
        is_claimed: input.isClaimed ?? false,
        photo_count: input.photoCount ?? null,
      },
      select: { id: true },
    })
    return result.id
  } else if (input.domainId) {
    // Domain-based profile (Phase 17 - standalone GBP)
    const result = await prisma.gbp_detailed_profiles.upsert({
      where: {
        domain_id_gmb_cid: {
          domain_id: input.domainId,
          gmb_cid: input.gmbCid,
        },
      },
      update: {
        business_name: input.businessName,
        rating: input.rating ?? undefined,
        review_count: input.reviewCount ?? undefined,
        primary_category: input.primaryCategory ?? undefined,
        additional_categories: input.additionalCategories ?? undefined,
        phone: input.phone ?? undefined,
        website: input.website ?? undefined,
        address: input.address ?? undefined,
        description: input.description ?? undefined,
        work_hours: input.workHours ?? undefined,
        attributes: input.attributes ?? undefined,
        is_claimed: input.isClaimed ?? undefined,
        photo_count: input.photoCount ?? undefined,
        fetched_at: new Date(),
      },
      create: {
        id: createId(),
        domain_id: input.domainId,
        gmb_cid: input.gmbCid,
        business_name: input.businessName,
        rating: input.rating ?? null,
        review_count: input.reviewCount ?? null,
        primary_category: input.primaryCategory ?? null,
        additional_categories: input.additionalCategories ?? [],
        phone: input.phone ?? null,
        website: input.website ?? null,
        address: input.address ?? null,
        description: input.description ?? null,
        work_hours: input.workHours ?? Prisma.JsonNull,
        attributes: input.attributes ?? Prisma.JsonNull,
        is_claimed: input.isClaimed ?? false,
        photo_count: input.photoCount ?? null,
      },
      select: { id: true },
    })
    return result.id
  } else {
    throw new Error('Either campaignId or domainId must be provided')
  }
}

/**
 * Update Posts data for a GBP profile
 */
export async function updateGBPPostsData(
  campaignId: string,
  gmbCid: string,
  postsResult: BusinessPostsResult
): Promise<void> {
  const posts = postsResult.items ?? []
  const postsCount = postsResult.items_count ?? posts.length

  // Calculate posts per month (last 6 months average)
  let postsPerMonthAvg: number | null = null
  let lastPostDate: Date | null = null

  if (posts.length > 0) {
    // Find most recent post date
    const postDates = posts
      .map((p) => (p.timestamp ? new Date(p.timestamp) : null))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())

    const firstPostDate = postDates[0]
    if (firstPostDate) {
      lastPostDate = firstPostDate

      // Calculate average posts per month over last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const recentPosts = postDates.filter((d) => d >= sixMonthsAgo)
      postsPerMonthAvg = recentPosts.length / 6
    }
  }

  await prisma.gbp_detailed_profiles.update({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      posts_fetched_at: new Date(),
      posts_count: postsCount,
      recent_posts: posts.slice(0, 10) as unknown as Prisma.InputJsonValue,
      last_post_date: lastPostDate,
      posts_per_month_avg: postsPerMonthAvg,
      raw_posts_data: postsResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Update Q&A data for a GBP profile
 */
export async function updateGBPQAData(
  campaignId: string,
  gmbCid: string,
  qaResult: BusinessQAResult
): Promise<void> {
  const questions = qaResult.items ?? []
  const questionsWithoutAnswers = qaResult.items_without_answers ?? []

  const questionsCount = qaResult.items_count ?? questions.length
  const answeredCount = questions.filter(
    (q) => q.items && q.items.length > 0
  ).length
  const unansweredCount = questionsWithoutAnswers.length

  await prisma.gbp_detailed_profiles.update({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      qa_fetched_at: new Date(),
      questions_count: questionsCount,
      answered_count: answeredCount,
      unanswered_count: unansweredCount,
      recent_qa: [...questions.slice(0, 5), ...questionsWithoutAnswers.slice(0, 5)] as unknown as Prisma.InputJsonValue,
      raw_qa_data: qaResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Update Reviews data for a GBP profile
 */
export async function updateGBPReviewsData(
  campaignId: string,
  gmbCid: string,
  reviewsResult: BusinessReviewsResult
): Promise<void> {
  const reviews = reviewsResult.items ?? []

  // Calculate rating distribution
  const reviewsCountByRating: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  }

  let ownerResponseCount = 0

  for (const review of reviews) {
    const rating = review.rating?.value
    if (rating && rating >= 1 && rating <= 5) {
      const key = Math.round(rating).toString()
      reviewsCountByRating[key] = (reviewsCountByRating[key] ?? 0) + 1
    }
    if (review.owner_answer) {
      ownerResponseCount++
    }
  }

  const ownerResponseRate = reviews.length > 0
    ? (ownerResponseCount / reviews.length) * 100
    : null

  await prisma.gbp_detailed_profiles.update({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      reviews_fetched_at: new Date(),
      review_count: reviewsResult.reviews_count ?? reviews.length,
      reviews_count_by_rating: reviewsCountByRating as unknown as Prisma.InputJsonValue,
      recent_reviews: reviews.slice(0, 10) as unknown as Prisma.InputJsonValue,
      owner_response_rate: ownerResponseRate,
      owner_response_count: ownerResponseCount,
      raw_reviews_data: reviewsResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Update Services & Products data for a GBP profile
 */
export async function updateGBPServicesData(
  campaignId: string,
  gmbCid: string,
  data: {
    services?: Prisma.JsonValue
    servicesCount?: number
    products?: Prisma.JsonValue
    productsCount?: number
    menuUrl?: string
    bookingUrl?: string
  }
): Promise<void> {
  await prisma.gbp_detailed_profiles.update({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      services: data.services ?? undefined,
      services_count: data.servicesCount ?? undefined,
      products: data.products ?? undefined,
      products_count: data.productsCount ?? undefined,
      menu_url: data.menuUrl ?? undefined,
      booking_url: data.bookingUrl ?? undefined,
      fetched_at: new Date(),
    },
  })
}

// ============================================================================
// Domain-Based Update Operations (Phase 17 - Standalone GBP)
// ============================================================================

/**
 * Update Posts data for a domain-based GBP profile
 */
export async function updateGBPPostsDataByDomain(
  domainId: string,
  gmbCid: string,
  postsResult: BusinessPostsResult
): Promise<void> {
  const posts = postsResult.items ?? []
  const postsCount = postsResult.items_count ?? posts.length

  // Calculate posts per month (last 6 months average)
  let postsPerMonthAvg: number | null = null
  let lastPostDate: Date | null = null

  if (posts.length > 0) {
    const postDates = posts
      .map((p) => (p.timestamp ? new Date(p.timestamp) : null))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())

    const firstPostDate = postDates[0]
    if (firstPostDate) {
      lastPostDate = firstPostDate
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const recentPosts = postDates.filter((d) => d >= sixMonthsAgo)
      postsPerMonthAvg = recentPosts.length / 6
    }
  }

  await prisma.gbp_detailed_profiles.update({
    where: {
      domain_id_gmb_cid: {
        domain_id: domainId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      posts_fetched_at: new Date(),
      posts_count: postsCount,
      recent_posts: posts.slice(0, 10) as unknown as Prisma.InputJsonValue,
      last_post_date: lastPostDate,
      posts_per_month_avg: postsPerMonthAvg,
      raw_posts_data: postsResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Update Q&A data for a domain-based GBP profile
 */
export async function updateGBPQADataByDomain(
  domainId: string,
  gmbCid: string,
  qaResult: BusinessQAResult
): Promise<void> {
  const questions = qaResult.items ?? []
  const questionsWithoutAnswers = qaResult.items_without_answers ?? []

  const questionsCount = qaResult.items_count ?? questions.length
  const answeredCount = questions.filter(
    (q) => q.items && q.items.length > 0
  ).length
  const unansweredCount = questionsWithoutAnswers.length

  await prisma.gbp_detailed_profiles.update({
    where: {
      domain_id_gmb_cid: {
        domain_id: domainId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      qa_fetched_at: new Date(),
      questions_count: questionsCount,
      answered_count: answeredCount,
      unanswered_count: unansweredCount,
      recent_qa: [...questions.slice(0, 5), ...questionsWithoutAnswers.slice(0, 5)] as unknown as Prisma.InputJsonValue,
      raw_qa_data: qaResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Update Reviews data for a domain-based GBP profile
 */
export async function updateGBPReviewsDataByDomain(
  domainId: string,
  gmbCid: string,
  reviewsResult: BusinessReviewsResult
): Promise<void> {
  const reviews = reviewsResult.items ?? []

  const reviewsCountByRating: Record<string, number> = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
  }

  let ownerResponseCount = 0

  for (const review of reviews) {
    const rating = review.rating?.value
    if (rating && rating >= 1 && rating <= 5) {
      const key = Math.round(rating).toString()
      reviewsCountByRating[key] = (reviewsCountByRating[key] ?? 0) + 1
    }
    if (review.owner_answer) {
      ownerResponseCount++
    }
  }

  const ownerResponseRate = reviews.length > 0
    ? (ownerResponseCount / reviews.length) * 100
    : null

  await prisma.gbp_detailed_profiles.update({
    where: {
      domain_id_gmb_cid: {
        domain_id: domainId,
        gmb_cid: gmbCid,
      },
    },
    data: {
      reviews_fetched_at: new Date(),
      review_count: reviewsResult.reviews_count ?? reviews.length,
      reviews_count_by_rating: reviewsCountByRating as unknown as Prisma.InputJsonValue,
      recent_reviews: reviews.slice(0, 10) as unknown as Prisma.InputJsonValue,
      owner_response_rate: ownerResponseRate,
      owner_response_count: ownerResponseCount,
      raw_reviews_data: reviewsResult as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Get a GBP detailed profile by domain and CID
 */
export async function getGBPDetailedProfileByDomain(
  domainId: string,
  gmbCid: string
): Promise<GBPDetailedProfile | null> {
  const profile = await prisma.gbp_detailed_profiles.findUnique({
    where: {
      domain_id_gmb_cid: {
        domain_id: domainId,
        gmb_cid: gmbCid,
      },
    },
  })

  if (!profile) return null

  return transformProfile(profile)
}

/**
 * Check if detailed data exists for a domain-based profile
 */
export async function hasDetailedDataByDomain(
  domainId: string,
  gmbCid: string
): Promise<{
  hasPosts: boolean
  hasQA: boolean
  hasReviews: boolean
  lastPostsFetch: Date | null
  lastQAFetch: Date | null
  lastReviewsFetch: Date | null
}> {
  const profile = await prisma.gbp_detailed_profiles.findUnique({
    where: {
      domain_id_gmb_cid: {
        domain_id: domainId,
        gmb_cid: gmbCid,
      },
    },
    select: {
      posts_fetched_at: true,
      qa_fetched_at: true,
      reviews_fetched_at: true,
    },
  })

  if (!profile) {
    return {
      hasPosts: false,
      hasQA: false,
      hasReviews: false,
      lastPostsFetch: null,
      lastQAFetch: null,
      lastReviewsFetch: null,
    }
  }

  return {
    hasPosts: profile.posts_fetched_at !== null,
    hasQA: profile.qa_fetched_at !== null,
    hasReviews: profile.reviews_fetched_at !== null,
    lastPostsFetch: profile.posts_fetched_at,
    lastQAFetch: profile.qa_fetched_at,
    lastReviewsFetch: profile.reviews_fetched_at,
  }
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a GBP detailed profile by campaign and CID
 */
export async function getGBPDetailedProfile(
  campaignId: string,
  gmbCid: string
): Promise<GBPDetailedProfile | null> {
  const profile = await prisma.gbp_detailed_profiles.findUnique({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
  })

  if (!profile) return null

  return transformProfile(profile)
}

/**
 * Get all GBP detailed profiles for a campaign
 */
export async function getGBPDetailedProfilesForCampaign(
  campaignId: string
): Promise<GBPDetailedProfile[]> {
  const profiles = await prisma.gbp_detailed_profiles.findMany({
    where: { campaign_id: campaignId },
    orderBy: { fetched_at: 'desc' },
  })

  return profiles.map(transformProfile)
}

/**
 * Get profiles that need data refresh (older than specified hours)
 */
export async function getProfilesNeedingRefresh(
  campaignId: string,
  dataType: 'posts' | 'qa' | 'reviews',
  maxAgeHours: number = 4
): Promise<GBPDetailedProfile[]> {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - maxAgeHours)

  const fetchedAtField = {
    posts: 'posts_fetched_at',
    qa: 'qa_fetched_at',
    reviews: 'reviews_fetched_at',
  }[dataType]

  const profiles = await prisma.gbp_detailed_profiles.findMany({
    where: {
      campaign_id: campaignId,
      OR: [
        { [fetchedAtField]: null },
        { [fetchedAtField]: { lt: cutoff } },
      ],
    },
  })

  return profiles.map(transformProfile)
}

/**
 * Check if detailed data exists for a profile
 */
export async function hasDetailedData(
  campaignId: string,
  gmbCid: string
): Promise<{
  hasPosts: boolean
  hasQA: boolean
  hasReviews: boolean
  lastPostsFetch: Date | null
  lastQAFetch: Date | null
  lastReviewsFetch: Date | null
}> {
  const profile = await prisma.gbp_detailed_profiles.findUnique({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
    select: {
      posts_fetched_at: true,
      qa_fetched_at: true,
      reviews_fetched_at: true,
    },
  })

  if (!profile) {
    return {
      hasPosts: false,
      hasQA: false,
      hasReviews: false,
      lastPostsFetch: null,
      lastQAFetch: null,
      lastReviewsFetch: null,
    }
  }

  return {
    hasPosts: profile.posts_fetched_at !== null,
    hasQA: profile.qa_fetched_at !== null,
    hasReviews: profile.reviews_fetched_at !== null,
    lastPostsFetch: profile.posts_fetched_at,
    lastQAFetch: profile.qa_fetched_at,
    lastReviewsFetch: profile.reviews_fetched_at,
  }
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a GBP detailed profile
 */
export async function deleteGBPDetailedProfile(
  campaignId: string,
  gmbCid: string
): Promise<void> {
  await prisma.gbp_detailed_profiles.delete({
    where: {
      campaign_id_gmb_cid: {
        campaign_id: campaignId,
        gmb_cid: gmbCid,
      },
    },
  })
}

/**
 * Delete all GBP detailed profiles for a campaign
 */
export async function deleteGBPDetailedProfilesForCampaign(
  campaignId: string
): Promise<number> {
  const result = await prisma.gbp_detailed_profiles.deleteMany({
    where: { campaign_id: campaignId },
  })

  return result.count
}

// ============================================================================
// Transform Helper
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformProfile(profile: any): GBPDetailedProfile {
  return {
    id: profile.id,
    campaignId: profile.campaign_id ?? null,
    domainId: profile.domain_id ?? null,
    gmbCid: profile.gmb_cid,
    businessName: profile.business_name,

    // Basic Info
    rating: profile.rating ? Number(profile.rating) : null,
    reviewCount: profile.review_count,
    primaryCategory: profile.primary_category,
    additionalCategories: profile.additional_categories ?? [],
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    description: profile.description,
    workHours: profile.work_hours,
    attributes: profile.attributes,
    isClaimed: profile.is_claimed ?? false,
    photoCount: profile.photo_count,

    // Reviews Summary
    reviewsFetchedAt: profile.reviews_fetched_at,
    reviewsCountByRating: profile.reviews_count_by_rating as Record<string, number> | null,
    recentReviews: profile.recent_reviews as ReviewItem[] | null,
    avgResponseTime: profile.avg_response_time,
    ownerResponseRate: profile.owner_response_rate ? Number(profile.owner_response_rate) : null,
    ownerResponseCount: profile.owner_response_count,

    // Posts
    postsFetchedAt: profile.posts_fetched_at,
    postsCount: profile.posts_count,
    recentPosts: profile.recent_posts as BusinessPostItem[] | null,
    lastPostDate: profile.last_post_date,
    postsPerMonthAvg: profile.posts_per_month_avg ? Number(profile.posts_per_month_avg) : null,

    // Q&A
    qaFetchedAt: profile.qa_fetched_at,
    questionsCount: profile.questions_count,
    answeredCount: profile.answered_count,
    unansweredCount: profile.unanswered_count,
    recentQA: profile.recent_qa as BusinessQuestionItem[] | null,

    // Services & Products
    services: profile.services,
    servicesCount: profile.services_count,
    products: profile.products,
    productsCount: profile.products_count,
    menuUrl: profile.menu_url,
    bookingUrl: profile.booking_url,

    // Metadata
    fetchedAt: profile.fetched_at,
    createdAt: profile.created_at,
  }
}
