/**
 * GBP Comparison by Keyword API
 *
 * GET /api/local-seo/campaigns/[id]/gbp-comparison/by-keyword
 *
 * Fetches top 3 competitors from the map pack for a specific keyword.
 * Uses the campaign's tracked keywords.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCampaignForUser, getLocalCampaign } from '@/lib/db/local-campaign-operations'
import { SerpModule } from '@/lib/dataforseo/modules/serp'
import { getDataForSEOClient } from '@/lib/dataforseo'
import type { MapPackCompetitor } from '@/lib/local-seo/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/gbp-comparison/by-keyword
 *
 * Query params:
 * - keyword: Required - keyword to search (must be one of campaign's tracked keywords)
 * - location: Optional - location name (defaults to location based on campaign center)
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
    const keyword = searchParams.get('keyword')

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Keyword is required',
          availableKeywords: campaign.keywords,
        },
        { status: 400 }
      )
    }

    // Validate keyword is in campaign's tracked keywords
    if (!campaign.keywords.includes(keyword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Keyword not in campaign tracked keywords',
          availableKeywords: campaign.keywords,
        },
        { status: 400 }
      )
    }

    // Build coordinates from campaign center (lat,lng,zoom format)
    const coordinates = `${campaign.center_lat},${campaign.center_lng},14`

    // Fetch map pack results using SERP module
    const serpModule = new SerpModule(getDataForSEOClient())

    try {
      const results = await serpModule.googleMapsSearch({
        keyword,
        coordinates,
        depth: 20,
      })

      // Find target business rank
      const normalizedTargetName = campaign.business_name.toLowerCase()
      let targetRank: number | null = null

      const mapPackResults: MapPackCompetitor[] = results.slice(0, 20).map((result, index) => {
        const rank = index + 1

        // Check if this is the target business
        if (result.title?.toLowerCase().includes(normalizedTargetName)) {
          targetRank = rank
        }

        return {
          name: result.title ?? 'Unknown',
          rank,
          cid: result.cid ?? undefined,
          rating: result.rating?.value ?? undefined,
          reviewCount: result.rating?.votes_count ?? undefined,
          address: result.address ?? undefined,
        }
      })

      // Get top 3 competitors (excluding target)
      const top3Competitors = mapPackResults
        .filter((r) => !r.name.toLowerCase().includes(normalizedTargetName))
        .slice(0, 3)

      return NextResponse.json({
        success: true,
        data: {
          keyword,
          location: coordinates,
          targetRank,
          targetInTop3: targetRank !== null && targetRank <= 3,
          targetInTop10: targetRank !== null && targetRank <= 10,
          mapPackResults: top3Competitors,
          allResults: mapPackResults.slice(0, 10),
          totalResults: results.length,
        },
      })
    } catch (serpError) {
      console.error('SERP API error:', serpError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch map pack results',
          details: serpError instanceof Error ? serpError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in GBP comparison by keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get keyword comparison' },
      { status: 500 }
    )
  }
}
