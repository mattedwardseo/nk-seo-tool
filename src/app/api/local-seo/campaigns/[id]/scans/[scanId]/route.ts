/**
 * Individual Scan API
 *
 * GET /api/local-seo/campaigns/[id]/scans/[scanId] - Get scan details
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getGridScan,
  getCompetitorStats,
} from '@/lib/db/local-campaign-operations'

interface RouteParams {
  params: Promise<{ id: string; scanId: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/scans/[scanId]
 * Get detailed scan information including competitor stats
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

    const { id, scanId } = await params

    // Validate ownership
    const ownership = await getCampaignForUser(id, session.user.id)
    if (!ownership) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Get scan details
    const scan = await getGridScan(scanId)
    if (!scan || scan.campaign_id !== id) {
      return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 })
    }

    // Get competitor stats
    const { searchParams } = new URL(request.url)
    const sortBy = (searchParams.get('sortBy') as 'avg_rank' | 'share_of_voice' | 'times_in_top_3') ?? 'avg_rank'
    const limit = parseInt(searchParams.get('competitorLimit') ?? '20', 10)

    const competitors = await getCompetitorStats(scanId, { limit, sortBy })

    // Find target business in competitors
    const targetStats = competitors.find(
      (c) => c.business_name.toLowerCase() === scan.local_campaigns.business_name.toLowerCase()
    )
    const otherCompetitors = competitors.filter(
      (c) => c.business_name.toLowerCase() !== scan.local_campaigns.business_name.toLowerCase()
    )

    return NextResponse.json({
      success: true,
      data: {
        scan: {
          id: scan.id,
          campaignId: scan.campaign_id,
          status: scan.status,
          progress: scan.progress,
          avgRank: scan.avg_rank ? Number(scan.avg_rank) : null,
          shareOfVoice: scan.share_of_voice ? Number(scan.share_of_voice) : null,
          topCompetitor: scan.top_competitor,
          apiCallsUsed: scan.api_calls_used,
          estimatedCost: scan.estimated_cost ? Number(scan.estimated_cost) : null,
          failedPoints: scan.failed_points,
          errorMessage: scan.error_message,
          startedAt: scan.started_at,
          completedAt: scan.completed_at,
          createdAt: scan.created_at,
        },
        campaign: {
          businessName: scan.local_campaigns.business_name,
          keywords: scan.local_campaigns.keywords,
          gridSize: scan.local_campaigns.grid_size,
          gridRadiusMiles: Number(scan.local_campaigns.grid_radius_miles),
          centerLat: Number(scan.local_campaigns.center_lat),
          centerLng: Number(scan.local_campaigns.center_lng),
        },
        targetStats: targetStats
          ? {
              avgRank: Number(targetStats.avg_rank),
              timesInTop3: targetStats.times_in_top_3,
              timesInTop10: targetStats.times_in_top_10,
              timesInTop20: targetStats.times_in_top_20,
              shareOfVoice: Number(targetStats.share_of_voice),
              rankChange: targetStats.rank_change ? Number(targetStats.rank_change) : null,
            }
          : null,
        competitors: otherCompetitors.map((c) => ({
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
      },
    })
  } catch (error) {
    console.error('Error getting scan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scan' },
      { status: 500 }
    )
  }
}
