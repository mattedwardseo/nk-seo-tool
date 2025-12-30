// POST /api/audits - Create and trigger a new SEO audit
// GET /api/audits - List audits for authenticated user

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { inngest } from '@/lib/inngest'
import { createAudit, getUserAudits, wasRecentlyAudited } from '@/lib/db/audit-operations'
import { generateKeywordsForLocation } from '@/lib/keywords/preset-keywords'
import { addTrackedKeywords } from '@/lib/db/keyword-operations'

/**
 * Request validation schema for creating an audit
 */
const createAuditSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
    ),
  // Phase 6: Enhanced audit inputs
  businessName: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  // City/State for preset keyword generation
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  gmbPlaceId: z.string().max(100).optional(),
  targetKeywords: z.array(z.string()).max(20).optional(),
  competitorDomains: z.array(z.string()).max(5).optional(),
  options: z
    .object({
      skipCache: z.boolean().optional(),
      priority: z.enum(['low', 'normal', 'high']).optional(),
      keywords: z.array(z.string()).max(10).optional(),
    })
    .optional(),
})

/**
 * Query params schema for listing audits
 */
const listAuditsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['PENDING', 'CRAWLING', 'ANALYZING', 'COMPLETED', 'FAILED']).optional(),
  // Phase 12: Domain filtering
  domainId: z.string().optional(),
})

/**
 * POST /api/audits
 * Create a new audit and trigger the background job
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate request body
    const parseResult = createAuditSchema.safeParse(body)
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

    const {
      domain,
      businessName,
      location,
      city,
      state,
      gmbPlaceId,
      targetKeywords,
      competitorDomains,
      options,
    } = parseResult.data

    // Check if domain was recently audited (rate limiting)
    const recentlyAudited = await wasRecentlyAudited(domain, 1) // 1 hour cooldown
    if (recentlyAudited && !options?.skipCache) {
      return NextResponse.json(
        {
          success: false,
          error: 'This domain was audited recently. Please wait before requesting another audit.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      )
    }

    // Generate preset keywords if city/state provided
    if (city && state) {
      const presetKeywords = generateKeywordsForLocation(city, state)
      console.log(
        `[Audit API] Generated ${presetKeywords.length} preset keywords for ${city}, ${state}`
      )

      // Track preset keywords for this domain
      const result = await addTrackedKeywords(userId, domain, presetKeywords)
      console.log(
        `[Audit API] Tracked keywords for ${domain}: ${result.added} new, ${result.existing} existing`
      )
    }

    // Create audit record in database with enhanced fields
    const auditId = await createAudit({
      userId,
      domain,
      businessName,
      location,
      city,
      state,
      gmbPlaceId,
      targetKeywords,
      competitorDomains,
    })

    // Trigger Inngest background job with enhanced data
    await inngest.send({
      name: 'audit/requested',
      data: {
        auditId,
        domain,
        userId,
        options,
        // Phase 6: Enhanced audit inputs
        businessName,
        location,
        city,
        state,
        gmbPlaceId,
        targetKeywords,
        competitorDomains,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          auditId,
          domain,
          status: 'PENDING',
          message: 'Audit has been queued and will start shortly',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating audit:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, error: 'Failed to create audit' }, { status: 500 })
  }
}

/**
 * GET /api/audits
 * List audits for authenticated user with pagination
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    // Parse query parameters (only include non-null values)
    const rawParams: Record<string, string> = {}
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')
    const rawStatus = searchParams.get('status')
    const rawDomainId = searchParams.get('domainId') // Phase 12: Domain filtering

    if (rawPage) rawParams.page = rawPage
    if (rawLimit) rawParams.limit = rawLimit
    if (rawStatus) rawParams.status = rawStatus
    if (rawDomainId) rawParams.domainId = rawDomainId

    // Validate query params
    const parseResult = listAuditsSchema.safeParse(rawParams)
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

    const { page, limit, status, domainId } = parseResult.data

    // Fetch audits from database
    const result = await getUserAudits({
      userId,
      page,
      limit,
      status: status as
        | 'PENDING'
        | 'CRAWLING'
        | 'ANALYZING'
        | 'COMPLETED'
        | 'FAILED'
        | undefined,
      domainId, // Phase 12: Domain filtering
    })

    return NextResponse.json({
      success: true,
      data: result.audits,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Error listing audits:', error)
    return NextResponse.json({ success: false, error: 'Failed to list audits' }, { status: 500 })
  }
}
