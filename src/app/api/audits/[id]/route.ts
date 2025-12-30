// GET /api/audits/[id] - Get full audit details
// DELETE /api/audits/[id] - Delete an audit

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getFullAuditResult, deleteAudit } from '@/lib/db/audit-operations'

/**
 * Path params validation
 */
// CUID2 format: 24 lowercase alphanumeric characters (not starting with 'c' like CUID1)
const paramsSchema = z.object({
  id: z.string().min(20).max(30).regex(/^[a-z0-9]+$/, 'Invalid audit ID format'),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/audits/[id]
 * Get full audit details including step results and scores
 */
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
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

    // Fetch full audit result
    const audit = await getFullAuditResult(id)

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

    return NextResponse.json({
      success: true,
      data: audit,
    })
  } catch (error) {
    console.error('Error fetching audit:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch audit' }, { status: 500 })
  }
}

/**
 * DELETE /api/audits/[id]
 * Delete an audit and its associated data
 */
export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
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

    // Check if audit exists first
    const audit = await getFullAuditResult(id)
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

    // Delete the audit
    await deleteAudit(id)

    return NextResponse.json({
      success: true,
      message: 'Audit deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting audit:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete audit' }, { status: 500 })
  }
}
