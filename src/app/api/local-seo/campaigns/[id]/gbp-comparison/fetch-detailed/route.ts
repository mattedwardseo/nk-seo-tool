/**
 * Fetch Detailed GBP Data API
 *
 * POST /api/local-seo/campaigns/[id]/gbp-comparison/fetch-detailed
 *
 * Triggers fetching of detailed GBP data (Posts, Q&A, Reviews) for target
 * and competitor businesses. This is a manual trigger to save API costs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getLocalCampaign,
  getLatestGBPSnapshot,
  getTopCompetitorsBySoV,
} from '@/lib/db/local-campaign-operations'
import {
  upsertGBPDetailedProfile,
  updateGBPPostsData,
  updateGBPQAData,
  updateGBPReviewsData,
  hasDetailedData,
} from '@/lib/db/gbp-detailed-operations'
import { BusinessModule } from '@/lib/dataforseo/modules/business'
import { getDataForSEOClient } from '@/lib/dataforseo'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface FetchResult {
  businessName: string
  gmbCid: string
  posts: { success: boolean; error?: string; count?: number }
  qa: { success: boolean; error?: string; questionsCount?: number }
  reviews: { success: boolean; error?: string; count?: number }
}

/**
 * POST /api/local-seo/campaigns/[id]/gbp-comparison/fetch-detailed
 *
 * Body params:
 * - dataTypes: Array of data types to fetch ('posts' | 'qa' | 'reviews') - default: all
 * - includeTarget: Include target business (default: true)
 * - includeCompetitors: Include competitors (default: true)
 * - competitorCount: Number of competitors (default: 3, max: 5)
 * - forceRefresh: Force fetch even if recent data exists (default: false)
 */
export async function POST(
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

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const dataTypes: ('posts' | 'qa' | 'reviews')[] = body.dataTypes ?? ['posts', 'qa', 'reviews']
    const includeTarget = body.includeTarget !== false
    const includeCompetitors = body.includeCompetitors !== false
    const competitorCount = Math.min(body.competitorCount ?? 3, 5)
    const forceRefresh = body.forceRefresh === true

    // Validate dataTypes
    const validDataTypes = ['posts', 'qa', 'reviews']
    for (const dt of dataTypes) {
      if (!validDataTypes.includes(dt)) {
        return NextResponse.json(
          { success: false, error: `Invalid data type: ${dt}` },
          { status: 400 }
        )
      }
    }

    // Build list of businesses to fetch
    const businessesToFetch: Array<{
      businessName: string
      gmbCid: string
      keyword: string
    }> = []

    // 1. Add target business
    if (includeTarget) {
      const gbpSnapshot = await getLatestGBPSnapshot(id)
      const targetCid = campaign.gmb_cid ?? gbpSnapshot?.gmb_cid

      if (targetCid) {
        businessesToFetch.push({
          businessName: campaign.business_name,
          gmbCid: targetCid,
          keyword: `cid:${targetCid}`,
        })
      } else {
        // No CID - try searching by name
        businessesToFetch.push({
          businessName: campaign.business_name,
          gmbCid: campaign.business_name, // Will be used as placeholder
          keyword: campaign.business_name,
        })
      }
    }

    // 2. Add competitors
    if (includeCompetitors) {
      const topCompetitors = await getTopCompetitorsBySoV(id, competitorCount)

      for (const competitor of topCompetitors) {
        if (competitor.gmbCid) {
          businessesToFetch.push({
            businessName: competitor.businessName,
            gmbCid: competitor.gmbCid,
            keyword: `cid:${competitor.gmbCid}`,
          })
        }
      }
    }

    if (businessesToFetch.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No businesses found to fetch data for' },
        { status: 400 }
      )
    }

    // Initialize BusinessModule
    const businessModule = new BusinessModule(getDataForSEOClient())
    const results: FetchResult[] = []

    // 3. Fetch detailed data for each business
    for (const business of businessesToFetch) {
      const result: FetchResult = {
        businessName: business.businessName,
        gmbCid: business.gmbCid,
        posts: { success: false },
        qa: { success: false },
        reviews: { success: false },
      }

      // Check if we already have recent data (unless forceRefresh)
      if (!forceRefresh) {
        const existingData = await hasDetailedData(id, business.gmbCid)

        // Skip data types that were recently fetched (within 4 hours)
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

        if (existingData.lastPostsFetch && existingData.lastPostsFetch > fourHoursAgo) {
          result.posts = { success: true, count: -1 } // -1 indicates cached
        }
        if (existingData.lastQAFetch && existingData.lastQAFetch > fourHoursAgo) {
          result.qa = { success: true, questionsCount: -1 }
        }
        if (existingData.lastReviewsFetch && existingData.lastReviewsFetch > fourHoursAgo) {
          result.reviews = { success: true, count: -1 }
        }
      }

      // Ensure profile exists
      await upsertGBPDetailedProfile({
        campaignId: id,
        gmbCid: business.gmbCid,
        businessName: business.businessName,
      })

      // Fetch Posts
      if (dataTypes.includes('posts') && !result.posts.success) {
        try {
          console.log(`Fetching posts for ${business.businessName}...`)
          const postsResult = await businessModule.fetchBusinessPosts({
            keyword: business.keyword,
            depth: 10,
          })

          if (postsResult) {
            await updateGBPPostsData(id, business.gmbCid, postsResult)
            result.posts = {
              success: true,
              count: postsResult.items_count ?? postsResult.items?.length ?? 0,
            }
          } else {
            result.posts = { success: false, error: 'No posts data returned' }
          }
        } catch (err) {
          console.error(`Error fetching posts for ${business.businessName}:`, err)
          result.posts = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      }

      // Fetch Q&A
      if (dataTypes.includes('qa') && !result.qa.success) {
        try {
          console.log(`Fetching Q&A for ${business.businessName}...`)
          const qaResult = await businessModule.fetchBusinessQA({
            keyword: business.keyword,
            depth: 20,
          })

          if (qaResult) {
            await updateGBPQAData(id, business.gmbCid, qaResult)
            result.qa = {
              success: true,
              questionsCount: qaResult.items_count ?? qaResult.items?.length ?? 0,
            }
          } else {
            result.qa = { success: false, error: 'No Q&A data returned' }
          }
        } catch (err) {
          console.error(`Error fetching Q&A for ${business.businessName}:`, err)
          result.qa = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      }

      // Fetch Reviews
      if (dataTypes.includes('reviews') && !result.reviews.success) {
        try {
          console.log(`Fetching reviews for ${business.businessName}...`)
          const reviewsResult = await businessModule.fetchBusinessReviews({
            keyword: business.keyword,
            depth: 20,
            sortBy: 'newest',
          })

          if (reviewsResult) {
            await updateGBPReviewsData(id, business.gmbCid, reviewsResult)
            result.reviews = {
              success: true,
              count: reviewsResult.reviews_count ?? reviewsResult.items?.length ?? 0,
            }
          } else {
            result.reviews = { success: false, error: 'No reviews data returned' }
          }
        } catch (err) {
          console.error(`Error fetching reviews for ${business.businessName}:`, err)
          result.reviews = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      }

      results.push(result)
    }

    // Calculate summary stats
    const summary = {
      totalBusinesses: results.length,
      postsSuccess: results.filter((r) => r.posts.success).length,
      qaSuccess: results.filter((r) => r.qa.success).length,
      reviewsSuccess: results.filter((r) => r.reviews.success).length,
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary,
        message: `Fetched detailed data for ${results.length} businesses`,
      },
    })
  } catch (error) {
    console.error('Error fetching detailed GBP data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch detailed GBP data' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/local-seo/campaigns/[id]/gbp-comparison/fetch-detailed
 *
 * Returns the current status of detailed data for the campaign
 */
export async function GET(
  _request: NextRequest,
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

    // Get target CID
    const gbpSnapshot = await getLatestGBPSnapshot(id)
    const targetCid = campaign.gmb_cid ?? gbpSnapshot?.gmb_cid

    // Get status for target
    const targetStatus = targetCid
      ? await hasDetailedData(id, targetCid)
      : { hasPosts: false, hasQA: false, hasReviews: false, lastPostsFetch: null, lastQAFetch: null, lastReviewsFetch: null }

    // Get competitors
    const topCompetitors = await getTopCompetitorsBySoV(id, 5)
    const competitorStatuses = await Promise.all(
      topCompetitors
        .filter((c) => c.gmbCid)
        .map(async (c) => ({
          businessName: c.businessName,
          gmbCid: c.gmbCid!,
          ...(await hasDetailedData(id, c.gmbCid!)),
        }))
    )

    return NextResponse.json({
      success: true,
      data: {
        target: {
          businessName: campaign.business_name,
          gmbCid: targetCid,
          ...targetStatus,
        },
        competitors: competitorStatuses,
      },
    })
  } catch (error) {
    console.error('Error getting detailed GBP status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get detailed GBP status' },
      { status: 500 }
    )
  }
}
