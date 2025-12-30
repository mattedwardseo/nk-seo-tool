// GET /api/calculators/google-ads/[id] - Get single Google Ads calculation
// DELETE /api/calculators/google-ads/[id] - Delete Google Ads calculation

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getGoogleAdsCalculation,
  deleteGoogleAdsCalculation,
} from '@/lib/db/calculator-operations'

/**
 * GET /api/calculators/google-ads/[id]
 * Get a single Google Ads calculation by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const calculation = await getGoogleAdsCalculation({
      id,
      userId: session.user.id,
    })

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: calculation,
    })
  } catch (error) {
    console.error('[Google Ads Calculator API] GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calculators/google-ads/[id]
 * Delete a Google Ads calculation
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const deleted = await deleteGoogleAdsCalculation({
      id,
      userId: session.user.id,
    })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Calculation deleted successfully',
      },
    })
  } catch (error) {
    console.error('[Google Ads Calculator API] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete calculation' },
      { status: 500 }
    )
  }
}
