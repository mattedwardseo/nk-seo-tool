/**
 * Keyword Tracking API
 *
 * POST - Create and trigger a new tracking run
 * GET - List runs for a domain
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { inngest } from '@/lib/inngest'
import {
  createKeywordTrackingRun,
  listDomainRuns,
} from '@/lib/db/keyword-tracking-operations'
import { prisma } from '@/lib/prisma'

const createRunSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  locationName: z.string().optional().default('United States'),
  languageCode: z.string().optional().default('en'),
})

const listRunsSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

/**
 * POST /api/keyword-tracking
 * Create and trigger a new keyword tracking run
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parseResult = createRunSchema.safeParse(body)

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

    const { domainId, locationName, languageCode } = parseResult.data
    const userId = session.user.id

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: userId,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Check for tracked keywords
    const keywordCount = await prisma.tracked_keywords.count({
      where: {
        domain_id: domainId,
        is_active: true,
      },
    })

    if (keywordCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tracked keywords found. Add keywords to the keyword library first.',
        },
        { status: 400 }
      )
    }

    // Create run
    const runId = await createKeywordTrackingRun(userId, {
      domainId,
      locationName,
      languageCode,
      triggeredBy: 'manual',
    })

    // Trigger Inngest background job
    await inngest.send({
      name: 'keyword-tracking/run.requested',
      data: {
        runId,
        domainId,
        userId,
        config: { locationName, languageCode },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          runId,
          status: 'PENDING',
          message: `Tracking ${keywordCount} keywords. Check status for progress.`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating keyword tracking run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tracking run' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/keyword-tracking?domainId=X
 * List tracking runs for a domain
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Only include params that are actually present
    const rawParams: Record<string, string> = {}
    const rawDomainId = searchParams.get('domainId')
    const rawLimit = searchParams.get('limit')
    const rawOffset = searchParams.get('offset')

    if (rawDomainId) rawParams.domainId = rawDomainId
    if (rawLimit) rawParams.limit = rawLimit
    if (rawOffset) rawParams.offset = rawOffset

    const parseResult = listRunsSchema.safeParse(rawParams)

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

    const { domainId, limit, offset } = parseResult.data

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    const { runs, total } = await listDomainRuns(domainId, { limit, offset })

    return NextResponse.json({
      success: true,
      data: {
        runs,
        total,
        limit,
        offset,
        hasMore: offset + runs.length < total,
      },
    })
  } catch (error) {
    console.error('Error listing keyword tracking runs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list tracking runs' },
      { status: 500 }
    )
  }
}
