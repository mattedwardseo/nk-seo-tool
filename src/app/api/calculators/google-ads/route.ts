// GET /api/calculators/google-ads - List Google Ads calculations for a domain
// POST /api/calculators/google-ads - Create a new Google Ads calculation

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  createGoogleAdsCalculation,
  getGoogleAdsCalculations,
} from '@/lib/db/calculator-operations'

/**
 * Create validation schema
 */
const createCalculationSchema = z.object({
  domainId: z.string().min(1),
  name: z.string().max(200).optional(),

  // Ad campaign inputs
  totalBudget: z.number().min(0).default(5000),
  mgmtFeeType: z.enum(['percentage', 'fixed']).default('percentage'),
  mgmtFeeValue: z.number().min(0).default(0.3),
  avgCpc: z.number().min(0).default(7),

  // Funnel rates
  websiteConvRate: z.number().min(0).max(1).default(0.15),
  receptionRate: z.number().min(0).max(1).default(0.66),
  attendanceRate: z.number().min(0).max(1).default(0.85),
  referralRate: z.number().min(0).max(1).default(0.25),

  // Business inputs
  avgShortTermValue: z.number().min(0).default(1000),
  avgLifetimeValue: z.number().min(0).default(10000),

  notes: z.string().max(2000).optional(),
})

/**
 * GET /api/calculators/google-ads
 * Get all Google Ads calculations for a domain
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domainId is required' },
        { status: 400 }
      )
    }

    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const calculations = await getGoogleAdsCalculations({
      domainId,
      userId: session.user.id,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      data: calculations,
    })
  } catch (error) {
    console.error('[Google Ads Calculator API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calculators/google-ads
 * Create a new Google Ads calculation
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parseResult = createCalculationSchema.safeParse(body)

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

    const data = parseResult.data

    const id = await createGoogleAdsCalculation({
      domainId: data.domainId,
      userId: session.user.id,
      name: data.name,
      totalBudget: data.totalBudget,
      mgmtFeeType: data.mgmtFeeType,
      mgmtFeeValue: data.mgmtFeeValue,
      avgCpc: data.avgCpc,
      websiteConvRate: data.websiteConvRate,
      receptionRate: data.receptionRate,
      attendanceRate: data.attendanceRate,
      referralRate: data.referralRate,
      avgShortTermValue: data.avgShortTermValue,
      avgLifetimeValue: data.avgLifetimeValue,
      notes: data.notes,
    })

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'Calculation created successfully',
      },
    })
  } catch (error) {
    console.error('[Google Ads Calculator API] POST error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create calculation' },
      { status: 500 }
    )
  }
}
