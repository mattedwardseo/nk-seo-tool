// GET /api/calculators/seo - List SEO calculations for domain
// POST /api/calculators/seo - Create new SEO calculation

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { createSEOCalculation, getSEOCalculations } from '@/lib/db/calculator-operations'
import { CTR_PRESETS } from '@/lib/calculators/seo-calculator'

/**
 * Request validation schema for creating an SEO calculation
 */
const createCalculationSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
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
  combinedSearchVolume: z.number().int().min(0).default(5000),

  // Local Maps inputs
  localSearchVolume: z.number().int().min(0).optional(),
  localCtr: z.number().min(0).max(1).optional(),
  localConvRate: z.number().min(0).max(1).optional(),

  // CTR settings
  ctrScenario: z.enum(['good', 'average', 'bad', 'custom']).default('average'),
  ctrPercentage: z.number().min(0).max(1).optional(),

  // Funnel rates
  websiteConvRate: z.number().min(0).max(1).default(0.15),
  receptionRate: z.number().min(0).max(1).default(0.66),
  attendanceRate: z.number().min(0).max(1).default(0.85),
  referralRate: z.number().min(0).max(1).default(0.25),

  // Business inputs
  marketingInvestment: z.number().min(0).default(5000),
  avgShortTermValue: z.number().min(0).default(1000),
  avgLifetimeValue: z.number().min(0).default(10000),
  operatories: z.number().int().min(1).max(50).optional(),
  daysOpen: z.number().int().min(1).max(7).optional(),

  notes: z.string().max(2000).optional(),
})

/**
 * Query params schema for listing calculations
 */
const listCalculationsSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
})

/**
 * GET /api/calculators/seo
 * List SEO calculations for a domain
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawParams: Record<string, string> = {}

    const rawDomainId = searchParams.get('domainId')
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')

    if (rawDomainId) rawParams.domainId = rawDomainId
    if (rawPage) rawParams.page = rawPage
    if (rawLimit) rawParams.limit = rawLimit

    const parseResult = listCalculationsSchema.safeParse(rawParams)
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

    const { domainId, page, limit } = parseResult.data

    const result = await getSEOCalculations({
      domainId,
      userId: session.user.id,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: result.calculations,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('[SEO Calculator API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list calculations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calculators/seo
 * Create a new SEO calculation
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

    // Resolve CTR percentage from scenario if not explicitly provided
    let ctrPercentage = data.ctrPercentage
    if (ctrPercentage === undefined) {
      if (data.ctrScenario === 'custom') {
        ctrPercentage = CTR_PRESETS.average // Default for custom
      } else {
        ctrPercentage = CTR_PRESETS[data.ctrScenario]
      }
    }

    const calculationId = await createSEOCalculation({
      domainId: data.domainId,
      userId: session.user.id,
      name: data.name,
      keywordsSnapshot: data.keywordsSnapshot,
      combinedSearchVolume: data.combinedSearchVolume,
      localSearchVolume: data.localSearchVolume,
      localCtr: data.localCtr,
      localConvRate: data.localConvRate,
      ctrScenario: data.ctrScenario,
      ctrPercentage,
      websiteConvRate: data.websiteConvRate,
      receptionRate: data.receptionRate,
      attendanceRate: data.attendanceRate,
      referralRate: data.referralRate,
      marketingInvestment: data.marketingInvestment,
      avgShortTermValue: data.avgShortTermValue,
      avgLifetimeValue: data.avgLifetimeValue,
      operatories: data.operatories,
      daysOpen: data.daysOpen,
      notes: data.notes,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: calculationId,
          message: 'SEO calculation created successfully',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[SEO Calculator API] POST error:', error)

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
