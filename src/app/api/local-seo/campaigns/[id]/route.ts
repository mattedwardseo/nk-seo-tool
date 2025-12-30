/**
 * Individual Campaign API
 *
 * GET /api/local-seo/campaigns/[id] - Get campaign details
 * PUT /api/local-seo/campaigns/[id] - Update campaign
 * DELETE /api/local-seo/campaigns/[id] - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  getLocalCampaign,
  getCampaignForUser,
  updateLocalCampaign,
  deleteLocalCampaign,
} from '@/lib/db/local-campaign-operations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Validation schema for updating a campaign
const updateCampaignSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  scanFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  gridRadiusMiles: z.number().min(1).max(25).optional(),
})

/**
 * GET /api/local-seo/campaigns/[id]
 * Get campaign details with latest scan and GBP snapshot
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

    // Get full campaign data
    const campaign = await getLocalCampaign(id)
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Format response
    const latestScan = campaign.grid_scans[0] ?? null
    const latestGBP = campaign.gbp_snapshots[0] ?? null

    return NextResponse.json({
      success: true,
      data: {
        id: campaign.id,
        businessName: campaign.business_name,
        gmbPlaceId: campaign.gmb_place_id,
        gmbCid: campaign.gmb_cid,
        centerLat: Number(campaign.center_lat),
        centerLng: Number(campaign.center_lng),
        gridSize: campaign.grid_size,
        gridRadiusMiles: Number(campaign.grid_radius_miles),
        keywords: campaign.keywords,
        status: campaign.status,
        scanFrequency: campaign.scan_frequency,
        nextScanAt: campaign.next_scan_at,
        lastScanAt: campaign.last_scan_at,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        latestScan: latestScan
          ? {
              id: latestScan.id,
              status: latestScan.status,
              avgRank: latestScan.avg_rank ? Number(latestScan.avg_rank) : null,
              shareOfVoice: latestScan.share_of_voice ? Number(latestScan.share_of_voice) : null,
              topCompetitor: latestScan.top_competitor,
              createdAt: latestScan.created_at,
              completedAt: latestScan.completed_at,
            }
          : null,
        latestGBP: latestGBP
          ? {
              rating: latestGBP.rating ? Number(latestGBP.rating) : null,
              reviewCount: latestGBP.review_count,
              completenessScore: latestGBP.completeness_score,
              address: latestGBP.address,
              phone: latestGBP.phone,
              website: latestGBP.website,
              categories: latestGBP.categories,
              createdAt: latestGBP.created_at,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Error getting campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get campaign' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/local-seo/campaigns/[id]
 * Update campaign settings
 */
export async function PUT(
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

    const body = await request.json()
    const validationResult = updateCampaignSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    await updateLocalCampaign(id, validationResult.data)

    return NextResponse.json({
      success: true,
      data: { message: 'Campaign updated successfully' },
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/local-seo/campaigns/[id]
 * Delete a campaign and all related data
 */
export async function DELETE(
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

    await deleteLocalCampaign(id)

    return NextResponse.json({
      success: true,
      data: { message: 'Campaign deleted successfully' },
    })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
