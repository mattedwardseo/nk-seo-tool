/**
 * Keyword Tracking Run Status API
 *
 * GET - Get run status for polling
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getRunStatus, getRunForUser } from '@/lib/db/keyword-tracking-operations'

const paramsSchema = z.object({
  runId: z.string().min(20).max(30).regex(/^[a-z0-9]+$/),
})

/**
 * GET /api/keyword-tracking/runs/[runId]/status
 * Get run status for polling during execution
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const parseResult = paramsSchema.safeParse(resolvedParams)

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid run ID' },
        { status: 400 }
      )
    }

    const { runId } = parseResult.data

    // Verify ownership first
    const run = await getRunForUser(runId, session.user.id)
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    const status = await getRunStatus(runId)

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting run status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
