/**
 * Scans List API
 *
 * GET /api/local-seo/campaigns/[id]/scans - List scans for a campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCampaignForUser, listCampaignScans } from '@/lib/db/local-campaign-operations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/scans
 * List all scans for a campaign
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const scans = await listCampaignScans(id, { limit, offset })

    // Format response
    const formattedScans = scans.map((scan) => ({
      id: scan.id,
      status: scan.status,
      avgRank: scan.avg_rank ? Number(scan.avg_rank) : null,
      shareOfVoice: scan.share_of_voice ? Number(scan.share_of_voice) : null,
      topCompetitor: scan.top_competitor,
      apiCallsUsed: scan.api_calls_used,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      createdAt: scan.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        scans: formattedScans,
        pagination: {
          limit,
          offset,
          hasMore: scans.length === limit,
        },
      },
    })
  } catch (error) {
    console.error('Error listing scans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list scans' },
      { status: 500 }
    )
  }
}
