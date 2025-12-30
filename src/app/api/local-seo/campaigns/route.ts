/**
 * Local SEO Campaigns API
 *
 * GET /api/local-seo/campaigns - List user's campaigns
 * POST /api/local-seo/campaigns - Create new campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  createLocalCampaign,
  listUserCampaigns,
  countUserCampaigns,
} from '@/lib/db/local-campaign-operations'
import { inngest } from '@/lib/inngest'
import { estimateScanCost } from '@/lib/local-seo'

// Validation schema for creating a campaign
const createCampaignSchema = z.object({
  businessName: z.string().min(1).max(200),
  gmbPlaceId: z.string().max(100).optional(),
  gmbCid: z.string().max(50).optional(),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  gridSize: z.number().int().min(3).max(11).default(7),
  gridRadiusMiles: z.number().min(1).max(25).default(5),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10),
  scanFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  triggerInitialScan: z.boolean().default(true),
})

/**
 * GET /api/local-seo/campaigns
 * List all campaigns for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | null
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const [campaigns, total] = await Promise.all([
      listUserCampaigns(session.user.id, {
        status: status || undefined,
        limit,
        offset,
      }),
      countUserCampaigns(session.user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + campaigns.length < total,
        },
      },
    })
  } catch (error) {
    console.error('Error listing campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/local-seo/campaigns
 * Create a new local SEO campaign
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createCampaignSchema.safeParse(body)

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

    const input = validationResult.data

    // Calculate cost estimate
    const costEstimate = estimateScanCost(input.gridSize, input.keywords.length)

    // Create the campaign
    const campaignId = await createLocalCampaign(session.user.id, {
      businessName: input.businessName,
      gmbPlaceId: input.gmbPlaceId,
      gmbCid: input.gmbCid,
      centerLat: input.centerLat,
      centerLng: input.centerLng,
      gridSize: input.gridSize,
      gridRadiusMiles: input.gridRadiusMiles,
      keywords: input.keywords,
      scanFrequency: input.scanFrequency,
    })

    // Trigger initial scan if requested
    if (input.triggerInitialScan) {
      await inngest.send({
        name: 'local-seo/scan.requested',
        data: {
          campaignId,
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        gridPointCount: costEstimate.totalPoints,
        estimatedCostPerScan: costEstimate.estimatedCost,
        initialScanTriggered: input.triggerInitialScan,
      },
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
