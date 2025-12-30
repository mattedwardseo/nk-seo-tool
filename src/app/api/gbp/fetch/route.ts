import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { BusinessModule } from '@/lib/dataforseo/modules/business'
import { getDataForSEOClient } from '@/lib/dataforseo'
import {
  calculateCompletenessWithBreakdown,
  getCompletenessLabel,
} from '@/lib/local-seo/gbp-comparison'
import {
  upsertGBPDetailedProfile,
  updateGBPPostsDataByDomain,
  updateGBPQADataByDomain,
  updateGBPReviewsDataByDomain,
} from '@/lib/db/gbp-detailed-operations'

/**
 * POST /api/gbp/fetch
 * Fetch GBP data directly from DataForSEO without requiring a campaign
 *
 * Query params:
 * - domainId: Required - the domain to fetch GBP for
 * - fetchDetailed: Optional - fetch Posts, Q&A, Reviews (default: false)
 *
 * This enables GBP to work independently from Local SEO campaigns
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')
    const fetchDetailed = searchParams.get('fetchDetailed') === 'true'

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    // Get domain info
    const domain = await prisma.domains.findUnique({
      where: { id: domainId },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Build search keyword from domain's business info
    const businessName = domain.business_name || domain.name
    const city = domain.city || ''
    const state = domain.state || ''

    if (!businessName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domain must have a business name set. Go to domain settings to add it.',
        },
        { status: 400 }
      )
    }

    // Build search query: "Business Name City State"
    const searchQuery = [businessName, city, state].filter(Boolean).join(' ')

    // Initialize DataForSEO client and fetch business info
    const businessModule = new BusinessModule(getDataForSEOClient())
    const businessResults = await businessModule.getBusinessInfo({
      keyword: searchQuery,
      locationCode: 2840, // US
      depth: 1, // Just need the top result
    })

    const businessInfo = businessResults?.[0]

    if (!businessInfo) {
      return NextResponse.json(
        {
          success: false,
          error: `No GBP listing found for "${searchQuery}". Try updating the business name in domain settings.`,
        },
        { status: 404 }
      )
    }

    // Parse work hours from timetable
    // Path: work_time.work_hours.timetable (per DataForSEO docs)
    const workHours: Record<string, string[]> = {}
    const timetable = (businessInfo as any).work_time?.work_hours?.timetable
    if (timetable && typeof timetable === 'object') {
      for (const [day, slots] of Object.entries(timetable)) {
        if (slots && Array.isArray(slots)) {
          workHours[day.toLowerCase()] = slots.map((slot: any) => {
            if (slot?.open && slot?.close) {
              return `${slot.open.hour}:${String(slot.open.minute).padStart(2, '0')}-${slot.close.hour}:${String(slot.close.minute).padStart(2, '0')}`
            }
            return 'Closed'
          })
        }
      }
    }

    // Parse attributes - available_attributes is an OBJECT with category keys
    // e.g., { "From the business": ["Identifies as women-owned"], "Amenities": ["Wi-Fi"] }
    const attributes: Record<string, string[]> = {}
    const availableAttrs = businessInfo.attributes?.available_attributes
    if (availableAttrs && typeof availableAttrs === 'object' && !Array.isArray(availableAttrs)) {
      for (const [category, values] of Object.entries(availableAttrs)) {
        if (Array.isArray(values) && values.length > 0) {
          attributes[category] = values.map(v => String(v))
        }
      }
    }

    // Extract rating distribution if available
    const ratingDistribution = (businessInfo as any).rating_distribution as Record<string, number> | null

    // Calculate completeness score
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const hoursComplete = daysOfWeek.every((day) => Object.keys(workHours).map(d => d.toLowerCase()).includes(day))

    const completenessResult = calculateCompletenessWithBreakdown({
      hasName: !!businessInfo.title,
      hasPhone: !!businessInfo.phone,
      hasAddress: !!businessInfo.address,
      hasWebsite: !!(businessInfo.url || businessInfo.domain),
      hasCategory: !!businessInfo.category,
      hasSecondaryCategories: (businessInfo.additional_categories?.length ?? 0) > 0,
      hasDescription: !!businessInfo.description,
      hasPhotos: (businessInfo.total_photos ?? 0) > 0,
      photoCount: businessInfo.total_photos ?? 0,
      hasLogo: !!businessInfo.main_image,
      hasCoverPhoto: !!businessInfo.main_image, // Same as logo for now
      hasHours: Object.keys(workHours).length > 0,
      hoursComplete,
      hasAttributes: Object.keys(attributes).length > 0,
      isClaimed: businessInfo.is_claimed ?? false,
      hasReviews: (businessInfo.rating?.votes_count ?? 0) > 0,
    })

    // Create or update GBP snapshot linked directly to domain
    const snapshotId = createId()

    await prisma.gbp_snapshots.upsert({
      where: {
        id: snapshotId, // Will create new if not exists
      },
      create: {
        id: snapshotId,
        domain_id: domainId,
        campaign_id: null, // Not linked to a campaign
        business_name: businessInfo.title ?? businessName,
        gmb_place_id: businessInfo.place_id ?? null,
        gmb_cid: businessInfo.cid ?? null,
        rating: businessInfo.rating?.value ?? null,
        review_count: businessInfo.rating?.votes_count ?? null,
        rating_distribution: ratingDistribution ?? Prisma.JsonNull,
        completeness_score: completenessResult.score,
        address: businessInfo.address ?? null,
        phone: businessInfo.phone ?? null,
        website: businessInfo.url || businessInfo.domain || null,
        categories: [
          businessInfo.category,
          ...(businessInfo.additional_categories ?? []),
        ].filter((c): c is string => !!c),
        attributes: attributes,
        work_hours: workHours,
        description: businessInfo.description ?? null,
        photos: {
          total: businessInfo.total_photos ?? 0,
          mainImage: businessInfo.main_image ?? null,
          logo: (businessInfo as any).logo ?? null,
        },
        raw_data: JSON.parse(JSON.stringify(businessInfo)),
      },
      update: {
        business_name: businessInfo.title ?? businessName,
        gmb_place_id: businessInfo.place_id ?? null,
        gmb_cid: businessInfo.cid ?? null,
        rating: businessInfo.rating?.value ?? null,
        review_count: businessInfo.rating?.votes_count ?? null,
        rating_distribution: ratingDistribution ?? Prisma.JsonNull,
        completeness_score: completenessResult.score,
        address: businessInfo.address ?? null,
        phone: businessInfo.phone ?? null,
        website: businessInfo.url || businessInfo.domain || null,
        categories: [
          businessInfo.category,
          ...(businessInfo.additional_categories ?? []),
        ].filter((c): c is string => !!c),
        attributes: attributes,
        work_hours: workHours,
        description: businessInfo.description ?? null,
        photos: {
          total: businessInfo.total_photos ?? 0,
          mainImage: businessInfo.main_image ?? null,
          logo: (businessInfo as any).logo ?? null,
        },
        raw_data: JSON.parse(JSON.stringify(businessInfo)),
        updated_at: new Date(),
      },
    })

    // ============================================================
    // Fetch detailed data (Posts, Q&A, Reviews) if requested
    // ============================================================
    let detailedResults: {
      posts: { success: boolean; count?: number; error?: string }
      qa: { success: boolean; questionsCount?: number; error?: string }
      reviews: { success: boolean; count?: number; error?: string }
    } | null = null

    if (fetchDetailed && businessInfo.cid) {
      const gmbCid = businessInfo.cid
      console.log(`[GBP Fetch] Starting detailed fetch for domain ${domainId}, CID: ${gmbCid}`)

      // First, create the detailed profile record
      await upsertGBPDetailedProfile({
        domainId,
        gmbCid,
        businessName: businessInfo.title ?? businessName,
        rating: businessInfo.rating?.value ?? undefined,
        reviewCount: businessInfo.rating?.votes_count ?? undefined,
        primaryCategory: businessInfo.category ?? undefined,
        additionalCategories: businessInfo.additional_categories ?? [],
        phone: businessInfo.phone ?? undefined,
        website: businessInfo.url || businessInfo.domain || undefined,
        address: businessInfo.address ?? undefined,
        description: businessInfo.description ?? undefined,
        workHours: workHours,
        attributes: attributes,
        isClaimed: businessInfo.is_claimed ?? false,
        photoCount: businessInfo.total_photos ?? undefined,
      })

      detailedResults = {
        posts: { success: false },
        qa: { success: false },
        reviews: { success: false },
      }

      // Fetch Posts (reduced timeout for serverless)
      try {
        console.log(`[GBP Fetch] Fetching posts for ${businessInfo.title} (cid:${gmbCid})...`)
        const postsResult = await businessModule.fetchBusinessPosts({
          keyword: `cid:${gmbCid}`,
          depth: 10,
        }, 60000) // 60 second timeout

        if (postsResult) {
          await updateGBPPostsDataByDomain(domainId, gmbCid, postsResult)
          detailedResults.posts = {
            success: true,
            count: postsResult.items_count ?? postsResult.items?.length ?? 0,
          }
        } else {
          detailedResults.posts = { success: false, error: 'No posts data returned' }
        }
      } catch (err) {
        console.error(`Error fetching posts:`, err)
        detailedResults.posts = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Fetch Q&A (reduced timeout for serverless)
      try {
        console.log(`[GBP Fetch] Fetching Q&A for ${businessInfo.title} (cid:${gmbCid})...`)
        const qaResult = await businessModule.fetchBusinessQA({
          keyword: `cid:${gmbCid}`,
          depth: 20,
        }, 60000) // 60 second timeout

        if (qaResult) {
          await updateGBPQADataByDomain(domainId, gmbCid, qaResult)
          detailedResults.qa = {
            success: true,
            questionsCount: qaResult.items_count ?? qaResult.items?.length ?? 0,
          }
        } else {
          detailedResults.qa = { success: false, error: 'No Q&A data returned' }
        }
      } catch (err) {
        console.error(`Error fetching Q&A:`, err)
        detailedResults.qa = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Fetch Reviews (reduced timeout for serverless)
      try {
        console.log(`[GBP Fetch] Fetching reviews for ${businessInfo.title} (cid:${gmbCid})...`)
        const reviewsResult = await businessModule.fetchBusinessReviews({
          keyword: `cid:${gmbCid}`,
          depth: 20,
          sortBy: 'newest',
        }, 60000) // 60 second timeout

        if (reviewsResult) {
          await updateGBPReviewsDataByDomain(domainId, gmbCid, reviewsResult)
          detailedResults.reviews = {
            success: true,
            count: reviewsResult.reviews_count ?? reviewsResult.items?.length ?? 0,
          }
        } else {
          detailedResults.reviews = { success: false, error: 'No reviews data returned' }
        }
      } catch (err) {
        console.error(`Error fetching reviews:`, err)
        detailedResults.reviews = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      console.log(`[GBP Fetch] Detailed fetch complete:`, JSON.stringify(detailedResults))
    }

    return NextResponse.json({
      success: true,
      data: {
        businessName: businessInfo.title,
        gmbCid: businessInfo.cid,
        rating: businessInfo.rating?.value ?? null,
        reviewCount: businessInfo.rating?.votes_count ?? 0,
        ratingDistribution: ratingDistribution,
        completenessScore: completenessResult.score,
        completenessLabel: getCompletenessLabel(completenessResult.score),
        address: businessInfo.address,
        phone: businessInfo.phone,
        website: businessInfo.url || businessInfo.domain,
        category: businessInfo.category,
        additionalCategories: businessInfo.additional_categories ?? [],
        workHours: workHours,
        attributes: attributes,
        photoCount: businessInfo.total_photos ?? 0,
        isClaimed: businessInfo.is_claimed ?? false,
        detailed: detailedResults,
        message: fetchDetailed
          ? 'GBP profile and detailed data fetched successfully'
          : 'GBP profile fetched and saved successfully',
      },
    })
  } catch (error) {
    console.error('Error fetching GBP data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch GBP data',
      },
      { status: 500 }
    )
  }
}
