/**
 * GBP Comparison API
 *
 * GET /api/local-seo/campaigns/[id]/gbp-comparison - Get GBP comparison data
 *
 * Compares the target business's GBP profile against top competitors
 * discovered from geo-grid scanning.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getLocalCampaign,
  getLatestGBPSnapshot,
  getTopCompetitorsBySoV,
  getCompetitorGBPProfiles,
  saveCompetitorGBPProfile,
  checkCompetitorProfilesNeedRefresh,
} from '@/lib/db/local-campaign-operations'
import { getGBPDetailedProfilesForCampaign } from '@/lib/db/gbp-detailed-operations'
import { BusinessModule } from '@/lib/dataforseo/modules/business'
import { getDataForSEOClient } from '@/lib/dataforseo'
import {
  buildComparisonProfile,
  identifyGaps,
  buildComparisonFields,
  generateRecommendations,
  MANUAL_CHECK_ITEMS,
} from '@/lib/local-seo/gbp-comparison'
import type { GBPComparisonProfile } from '@/lib/local-seo/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Cache TTL: 4 hours in seconds
const CACHE_TTL_SECONDS = 4 * 60 * 60

/**
 * GET /api/local-seo/campaigns/[id]/gbp-comparison
 *
 * Query params:
 * - competitorCount: Number of competitors to compare (default: 3, max: 5)
 * - refresh: Force fresh data fetch (default: false)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Validate ownership
    const ownership = await getCampaignForUser(id, session.user.id)
    if (!ownership) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Get campaign data
    const campaign = await getLocalCampaign(id)
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const competitorCount = Math.min(
      parseInt(searchParams.get('competitorCount') ?? '3', 10),
      5
    )
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Get city from address (for name analysis)
    // Try to extract city from the campaign's center location or GBP data
    const gbpSnapshot = await getLatestGBPSnapshot(id)
    const city = extractCityFromAddress(gbpSnapshot?.address ?? campaign.business_name)

    // 1. Get target's GBP profile
    let targetProfile: GBPComparisonProfile | null = null

    if (gbpSnapshot?.raw_data) {
      // Use cached snapshot
      targetProfile = buildComparisonProfile(
        gbpSnapshot.raw_data as Parameters<typeof buildComparisonProfile>[0],
        campaign.keywords,
        city
      )
    } else {
      // Fetch fresh if no snapshot
      try {
        const businessModule = new BusinessModule(getDataForSEOClient())
        const results = await businessModule.getBusinessInfo({
          keyword: `${campaign.business_name} ${city}`,
        })

        const firstResult = results[0]
        if (firstResult) {
          targetProfile = buildComparisonProfile(firstResult, campaign.keywords, city)
        }
      } catch (err) {
        console.error('Error fetching target GBP:', err)
      }
    }

    if (!targetProfile) {
      // Create minimal profile if we can't fetch
      targetProfile = {
        businessName: campaign.business_name,
        gmbCid: campaign.gmb_cid ?? undefined,
        rating: gbpSnapshot?.rating ? Number(gbpSnapshot.rating) : null,
        reviewCount: gbpSnapshot?.review_count ?? null,
        primaryCategory: null,
        additionalCategories: [],
        categoryCount: 0,
        nameHasKeyword: false,
        nameHasCity: false,
        hasDescription: false,
        descriptionLength: 0,
        hasPhone: !!gbpSnapshot?.phone,
        phone: gbpSnapshot?.phone ?? undefined,
        hasWebsite: !!gbpSnapshot?.website,
        website: gbpSnapshot?.website ?? undefined,
        hasAddress: !!gbpSnapshot?.address,
        address: gbpSnapshot?.address ?? undefined,
        attributes: {},
        attributeCategories: [],
        attributeCount: 0,
        hasWorkHours: false,
        hoursComplete: false,
        photoCount: 0,
        isClaimed: false,
        hasServices: false,
        hasProducts: false,
        completenessScore: 0,
      }
    }

    // 2. Get top competitors from geo-grid scans
    const topCompetitors = await getTopCompetitorsBySoV(id, competitorCount)

    if (topCompetitors.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          target: targetProfile,
          competitors: [],
          comparison: [],
          gaps: [],
          manualChecks: MANUAL_CHECK_ITEMS,
          recommendations: [
            'Run a geo-grid scan first to discover local competitors',
            'Once scan completes, return here for competitor comparison',
          ],
          cacheAge: 0,
          hasCompetitorData: false,
        },
      })
    }

    // 3. Check which competitor profiles need refresh
    const competitorCids = topCompetitors
      .map((c) => c.gmbCid)
      .filter((cid): cid is string => !!cid)

    const cidsNeedingRefresh = forceRefresh
      ? competitorCids
      : await checkCompetitorProfilesNeedRefresh(id, competitorCids, CACHE_TTL_SECONDS)

    // 4. Fetch fresh GBP data for competitors that need it
    if (cidsNeedingRefresh.length > 0) {
      const businessModule = new BusinessModule(getDataForSEOClient())

      for (const competitor of topCompetitors) {
        if (!competitor.gmbCid || !cidsNeedingRefresh.includes(competitor.gmbCid)) {
          continue
        }

        try {
          const results = await businessModule.getBusinessInfo({
            keyword: `${competitor.businessName} ${city}`,
          })

          const competitorResult = results[0]
          if (competitorResult) {
            const profile = buildComparisonProfile(competitorResult, campaign.keywords, city)

            // Save to database
            await saveCompetitorGBPProfile(id, {
              gmbCid: competitor.gmbCid,
              businessName: profile.businessName,
              rating: profile.rating ?? undefined,
              reviewCount: profile.reviewCount ?? undefined,
              description: profile.description,
              primaryCategory: profile.primaryCategory ?? undefined,
              additionalCategories: profile.additionalCategories,
              nameHasKeyword: profile.nameHasKeyword,
              nameHasCity: profile.nameHasCity,
              address: profile.address,
              phone: profile.phone,
              website: profile.website,
              hasDescription: profile.hasDescription,
              descriptionLength: profile.descriptionLength,
              hasPhotos: profile.photoCount > 0,
              photoCount: profile.photoCount,
              isClaimed: profile.isClaimed,
              attributes: profile.attributes,
              attributeCount: profile.attributeCount,
              workHours: profile.workHours,
              hoursComplete: profile.hoursComplete,
              completenessScore: profile.completenessScore,
              rawData: competitorResult as unknown as Record<string, unknown>,
            })
          }
        } catch (err) {
          console.error(`Error fetching competitor GBP for ${competitor.businessName}:`, err)
        }
      }
    }

    // 5. Get competitor profiles from database
    const cachedProfiles = await getCompetitorGBPProfiles(id, {
      limit: competitorCount,
      maxAge: forceRefresh ? undefined : CACHE_TTL_SECONDS,
    })

    // Convert to GBPComparisonProfile
    const competitorProfiles: GBPComparisonProfile[] = cachedProfiles.map((p) => ({
      businessName: p.businessName,
      gmbCid: p.gmbCid,
      rating: p.rating,
      reviewCount: p.reviewCount,
      primaryCategory: p.primaryCategory,
      additionalCategories: p.additionalCategories,
      categoryCount: 1 + p.additionalCategories.length,
      nameHasKeyword: p.nameHasKeyword,
      nameHasCity: p.nameHasCity,
      hasDescription: p.hasDescription,
      descriptionLength: p.descriptionLength,
      description: p.description ?? undefined,
      hasPhone: !!p.phone,
      phone: p.phone ?? undefined,
      hasWebsite: !!p.website,
      website: p.website ?? undefined,
      hasAddress: !!p.address,
      address: p.address ?? undefined,
      attributes: p.attributes ?? {},
      attributeCategories: Object.keys(p.attributes ?? {}),
      attributeCount: p.attributeCount,
      hasWorkHours: !!p.workHours && Object.keys(p.workHours).length > 0,
      hoursComplete: p.hoursComplete,
      workHours: p.workHours ?? undefined,
      photoCount: p.photoCount,
      isClaimed: p.isClaimed,
      hasServices: p.hasServices,
      hasProducts: p.hasProducts,
      completenessScore: p.completenessScore ?? 0,
    }))

    // Fill in missing competitors from basic data
    for (const competitor of topCompetitors) {
      if (!competitorProfiles.some((p) => p.gmbCid === competitor.gmbCid)) {
        competitorProfiles.push({
          businessName: competitor.businessName,
          gmbCid: competitor.gmbCid ?? undefined,
          rating: competitor.rating,
          reviewCount: competitor.reviewCount,
          primaryCategory: null,
          additionalCategories: [],
          categoryCount: 0,
          nameHasKeyword: false,
          nameHasCity: false,
          hasDescription: false,
          descriptionLength: 0,
          hasPhone: false,
          hasWebsite: false,
          hasAddress: false,
          attributes: {},
          attributeCategories: [],
          attributeCount: 0,
          hasWorkHours: false,
          hoursComplete: false,
          photoCount: 0,
          isClaimed: false,
          hasServices: false,
          hasProducts: false,
          completenessScore: 0,
        })
      }
    }

    // 6. Build comparison data
    const gaps = identifyGaps(targetProfile, competitorProfiles)
    const comparison = buildComparisonFields(targetProfile, competitorProfiles)
    const recommendations = generateRecommendations(gaps)

    // Calculate cache age
    const oldestProfile = cachedProfiles.reduce(
      (oldest, p) => (p.fetchedAt < oldest ? p.fetchedAt : oldest),
      new Date()
    )
    const cacheAge = Math.round((Date.now() - oldestProfile.getTime()) / 1000)

    // 7. Get detailed profiles (posts, Q&A, reviews) if available
    const detailedProfiles = await getGBPDetailedProfilesForCampaign(id)

    // Build detailed data maps
    const targetGmbCid = targetProfile.gmbCid ?? campaign.gmb_cid
    const targetDetailedProfile = targetGmbCid
      ? detailedProfiles.find((p) => p.gmbCid === targetGmbCid)
      : null

    const competitorDetailedData = competitorProfiles.slice(0, competitorCount).map((c) => {
      const detailed = detailedProfiles.find((p) => p.gmbCid === c.gmbCid)
      return {
        businessName: c.businessName,
        gmbCid: c.gmbCid ?? '',
        postsCount: detailed?.postsCount ?? null,
        lastPostDate: detailed?.lastPostDate?.toISOString() ?? null,
        postsPerMonthAvg: detailed?.postsPerMonthAvg ?? null,
        recentPosts: detailed?.recentPosts ?? null,
        postsFetchedAt: detailed?.postsFetchedAt?.toISOString() ?? null,
        questionsCount: detailed?.questionsCount ?? null,
        answeredCount: detailed?.answeredCount ?? null,
        unansweredCount: detailed?.unansweredCount ?? null,
        recentQA: detailed?.recentQA ?? null,
        qaFetchedAt: detailed?.qaFetchedAt?.toISOString() ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        target: targetProfile,
        competitors: competitorProfiles.slice(0, competitorCount),
        comparison,
        gaps,
        manualChecks: MANUAL_CHECK_ITEMS,
        recommendations,
        cacheAge,
        hasCompetitorData: true,
        // Include detailed data for Posts/Q&A tabs
        detailedData: {
          target: {
            businessName: targetProfile.businessName,
            gmbCid: targetGmbCid ?? '',
            postsCount: targetDetailedProfile?.postsCount ?? null,
            lastPostDate: targetDetailedProfile?.lastPostDate?.toISOString() ?? null,
            postsPerMonthAvg: targetDetailedProfile?.postsPerMonthAvg ?? null,
            recentPosts: targetDetailedProfile?.recentPosts ?? null,
            postsFetchedAt: targetDetailedProfile?.postsFetchedAt?.toISOString() ?? null,
            questionsCount: targetDetailedProfile?.questionsCount ?? null,
            answeredCount: targetDetailedProfile?.answeredCount ?? null,
            unansweredCount: targetDetailedProfile?.unansweredCount ?? null,
            recentQA: targetDetailedProfile?.recentQA ?? null,
            qaFetchedAt: targetDetailedProfile?.qaFetchedAt?.toISOString() ?? null,
          },
          competitors: competitorDetailedData,
        },
      },
    })
  } catch (error) {
    console.error('Error getting GBP comparison:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get GBP comparison' },
      { status: 500 }
    )
  }
}

/**
 * Extract city from address string
 */
function extractCityFromAddress(address: string): string {
  if (!address) return ''

  // Common pattern: "123 Main St, City, ST 12345"
  const parts = address.split(',')
  if (parts.length >= 2) {
    // City is usually the second-to-last part before state/zip
    const cityPart = parts[parts.length - 2]?.trim() ?? ''
    // Remove any numbers (in case it's a zip code)
    return cityPart.replace(/\d+/g, '').trim()
  }

  return ''
}
