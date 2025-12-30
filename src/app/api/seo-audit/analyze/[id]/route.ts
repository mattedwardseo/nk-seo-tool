/**
 * GET /api/seo-audit/analyze/[id] - Get a specific keyword audit
 * DELETE /api/seo-audit/analyze/[id] - Delete a keyword audit
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getKeywordAudit, deleteKeywordAudit } from '@/lib/db/keyword-audit-operations'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/seo-audit/analyze/[id]
 * Get a specific keyword audit by ID
 */
export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: auditId } = await context.params
    const userId = session.user.id

    // Validate audit ID format
    if (!auditId || auditId.length < 20 || auditId.length > 30) {
      return NextResponse.json({ success: false, error: 'Invalid audit ID' }, { status: 400 })
    }

    // Fetch audit
    const audit = await getKeywordAudit(auditId, userId)

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: audit,
    })
  } catch (error) {
    console.error('Error fetching keyword audit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch keyword audit' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/seo-audit/analyze/[id]
 * Delete a keyword audit
 */
export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: auditId } = await context.params
    const userId = session.user.id

    // Validate audit ID format
    if (!auditId || auditId.length < 20 || auditId.length > 30) {
      return NextResponse.json({ success: false, error: 'Invalid audit ID' }, { status: 400 })
    }

    // Delete audit
    const deleted = await deleteKeywordAudit(auditId, userId)

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Audit deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting keyword audit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete keyword audit' },
      { status: 500 }
    )
  }
}
