// GET /api/calculators/seo/[id] - Get single SEO calculation
// PATCH /api/calculators/seo/[id] - Update SEO calculation
// DELETE /api/calculators/seo/[id] - Delete SEO calculation

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  getSEOCalculation,
  updateSEOCalculation,
  deleteSEOCalculation,
} from '@/lib/db/calculator-operations'

/**
 * Update validation schema
 */
const updateCalculationSchema = z.object({
  name: z.string().max(200).optional(),

  // Keyword data
  keywordsSnapshot: z
    .array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number().int().min(0),
        cpc: z.number().min(0),
        position: z.number().int().min(1).max(100).optional(),
      })
    )
    .optional(),
  combinedSearchVolume: z.number().int().min(0).optional(),

  // Local Maps inputs
  localSearchVolume: z.number().int().min(0).optional(),
  localCtr: z.number().min(0).max(1).optional(),
  localConvRate: z.number().min(0).max(1).optional(),

  // CTR settings
  ctrScenario: z.enum(['good', 'average', 'bad', 'custom']).optional(),
  ctrPercentage: z.number().min(0).max(1).optional(),

  // Funnel rates
  websiteConvRate: z.number().min(0).max(1).optional(),
  receptionRate: z.number().min(0).max(1).optional(),
  attendanceRate: z.number().min(0).max(1).optional(),
  referralRate: z.number().min(0).max(1).optional(),

  // Business inputs
  marketingInvestment: z.number().min(0).optional(),
  avgShortTermValue: z.number().min(0).optional(),
  avgLifetimeValue: z.number().min(0).optional(),
  operatories: z.number().int().min(1).max(50).optional(),
  daysOpen: z.number().int().min(1).max(7).optional(),

  notes: z.string().max(2000).optional(),
})

/**
 * GET /api/calculators/seo/[id]
 * Get a single SEO calculation by ID
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

    const calculation = await getSEOCalculation({
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
    console.error('[SEO Calculator API] GET [id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculation' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/calculators/seo/[id]
 * Update an SEO calculation
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const parseResult = updateCalculationSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const updatedId = await updateSEOCalculation({
      id,
      userId: session.user.id,
      data: parseResult.data,
    })

    if (!updatedId) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedId,
        message: 'Calculation updated successfully',
      },
    })
  } catch (error) {
    console.error('[SEO Calculator API] PATCH error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update calculation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calculators/seo/[id]
 * Delete an SEO calculation
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

    const deleted = await deleteSEOCalculation({
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
    console.error('[SEO Calculator API] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete calculation' },
      { status: 500 }
    )
  }
}
