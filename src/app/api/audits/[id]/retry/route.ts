// POST /api/audits/[id]/retry - Retry a failed audit

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AuditStatus, Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { inngest } from '@/lib/inngest'
import { getAudit } from '@/lib/db/audit-operations'
import { prisma } from '@/lib/prisma'

/**
 * Path params validation
 */
// CUID2 format validation
const paramsSchema = z.object({
  id: z.string().min(20).max(30).regex(/^[a-z0-9]+$/, 'Invalid audit ID format'),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/audits/[id]/retry
 * Retry a failed audit - resets status and triggers new background job
 */
export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    // Validate audit ID
    const parseResult = paramsSchema.safeParse(params)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid audit ID format',
        },
        { status: 400 }
      )
    }

    const { id } = parseResult.data

    // Fetch the audit
    const audit = await getAudit(id)

    if (!audit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audit not found',
        },
        { status: 404 }
      )
    }

    // Verify ownership
    if (audit.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      )
    }

    // Only allow retry for failed audits
    if (audit.status !== AuditStatus.FAILED) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot retry audit with status '${audit.status}'. Only failed audits can be retried.`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      )
    }

    // Reset audit status for retry
    await prisma.audits.update({
      where: { id },
      data: {
        status: AuditStatus.PENDING,
        progress: 0,
        current_step: null,
        error_message: null,
        started_at: null,
        completed_at: null,
        // Clear previous step results for a fresh start
        step_results: Prisma.JsonNull,
      },
    })

    // Trigger new Inngest background job
    await inngest.send({
      name: 'audit/requested',
      data: {
        auditId: id,
        domain: audit.domain,
        userId: audit.userId,
        options: {
          skipCache: true, // Always skip cache on retry
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        auditId: id,
        domain: audit.domain,
        status: 'PENDING',
        message: 'Audit has been queued for retry',
      },
    })
  } catch (error) {
    console.error('Error retrying audit:', error)
    return NextResponse.json({ success: false, error: 'Failed to retry audit' }, { status: 500 })
  }
}
