/**
 * Competitors API
 *
 * GET /api/local-seo/campaigns/[id]/competitors - Get competitor stats from latest scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getLocalCampaign,
  getCompetitorStats,
} from '@/lib/db/local-campaign-operations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/competitors
 * Get competitor statistics from the latest completed scan
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

    // Get campaign with latest scan
    const campaign = await getLocalCampaign(id)
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const latestScan = campaign.grid_scans[0]
    if (!latestScan || latestScan.status !== 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: {
          scanId: null,
          targetBusiness: null,
          competitors: [],
          hasCompletedScan: false,
        },
      })
    }

    // Get query params for sorting
    const { searchParams } = new URL(request.url)
    const sortBy = (searchParams.get('sortBy') as 'avg_rank' | 'share_of_voice' | 'times_in_top_3') ?? 'avg_rank'
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    // Get competitor stats
    const allCompetitors = await getCompetitorStats(latestScan.id, { limit: limit + 1, sortBy })

    // Separate target business from competitors
    const targetStats = allCompetitors.find(
      (c) => c.business_name.toLowerCase() === campaign.business_name.toLowerCase()
    )
    const competitors = allCompetitors.filter(
      (c) => c.business_name.toLowerCase() !== campaign.business_name.toLowerCase()
    ).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        scanId: latestScan.id,
        scanDate: latestScan.completed_at,
        targetBusiness: targetStats
          ? {
              businessName: targetStats.business_name,
              avgRank: Number(targetStats.avg_rank),
              timesInTop3: targetStats.times_in_top_3,
              timesInTop10: targetStats.times_in_top_10,
              timesInTop20: targetStats.times_in_top_20,
              shareOfVoice: Number(targetStats.share_of_voice),
              rankChange: targetStats.rank_change ? Number(targetStats.rank_change) : null,
            }
          : null,
        competitors: competitors.map((c, index) => ({
          rank: index + 1,
          businessName: c.business_name,
          gmbCid: c.gmb_cid,
          rating: c.rating ? Number(c.rating) : null,
          reviewCount: c.review_count,
          avgRank: Number(c.avg_rank),
          timesInTop3: c.times_in_top_3,
          timesInTop10: c.times_in_top_10,
          timesInTop20: c.times_in_top_20,
          shareOfVoice: Number(c.share_of_voice),
          rankChange: c.rank_change ? Number(c.rank_change) : null,
        })),
        totalCompetitors: competitors.length,
        hasCompletedScan: true,
      },
    })
  } catch (error) {
    console.error('Error getting competitors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get competitors' },
      { status: 500 }
    )
  }
}
