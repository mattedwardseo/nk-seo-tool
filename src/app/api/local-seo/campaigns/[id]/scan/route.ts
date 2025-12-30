/**
 * Trigger Scan API
 *
 * POST /api/local-seo/campaigns/[id]/scan - Trigger a new grid scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getCampaignForUser } from '@/lib/db/local-campaign-operations'
import { inngest } from '@/lib/inngest'
import { estimateScanCost } from '@/lib/local-seo'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Validation schema for triggering a scan
const triggerScanSchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).optional(),
})

/**
 * POST /api/local-seo/campaigns/[id]/scan
 * Trigger a new grid scan for the campaign
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

    // Validate ownership and get campaign
    const campaign = await getCampaignForUser(id, session.user.id)
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Check campaign status
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not active' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const validationResult = triggerScanSchema.safeParse(body)

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

    // Determine keywords to scan
    const keywords = validationResult.data.keywords ?? campaign.keywords
    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keywords to scan' },
        { status: 400 }
      )
    }

    // Calculate cost estimate
    const costEstimate = estimateScanCost(campaign.grid_size, keywords.length)

    // Trigger the scan via Inngest
    await inngest.send({
      name: 'local-seo/scan.requested',
      data: {
        campaignId: id,
        userId: session.user.id,
        keywords: validationResult.data.keywords,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Scan triggered successfully',
        keywordCount: keywords.length,
        gridPoints: costEstimate.totalPoints,
        estimatedCost: costEstimate.estimatedCost,
      },
    })
  } catch (error) {
    console.error('Error triggering scan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger scan' },
      { status: 500 }
    )
  }
}
