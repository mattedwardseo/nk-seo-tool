/**
 * Keyword Tracking Run Detail API
 *
 * GET - Get run details
 * DELETE - Delete a run
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  getRunForUser,
  deleteRun,
  getRunResults,
} from '@/lib/db/keyword-tracking-operations'

const paramsSchema = z.object({
  runId: z.string().min(20).max(30).regex(/^[a-z0-9]+$/),
})

/**
 * GET /api/keyword-tracking/runs/[runId]
 * Get detailed run information
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
    const run = await getRunForUser(runId, session.user.id)

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get results summary if completed
    let resultsSummary = null
    if (run.status === 'COMPLETED') {
      const { results, total } = await getRunResults(runId, { limit: 10 })
      resultsSummary = {
        total,
        preview: results,
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...run,
        resultsSummary,
      },
    })
  } catch (error) {
    console.error('Error getting keyword tracking run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get run details' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/keyword-tracking/runs/[runId]
 * Delete a run and its results
 */
export async function DELETE(
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

    // Verify ownership
    const run = await getRunForUser(runId, session.user.id)
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    await deleteRun(runId)

    return NextResponse.json({
      success: true,
      message: 'Run deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting keyword tracking run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete run' },
      { status: 500 }
    )
  }
}
