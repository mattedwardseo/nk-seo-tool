/**
 * Keyword Tracking Results API
 *
 * GET - Get paginated keyword results for a run
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getRunForUser, getRunResults } from '@/lib/db/keyword-tracking-operations'

const paramsSchema = z.object({
  runId: z.string().min(20).max(30).regex(/^[a-z0-9]+$/),
})

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z
    .enum(['position', 'positionChange', 'keyword', 'searchVolume'])
    .optional()
    .default('position'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  positionFilter: z
    .enum(['top3', 'top10', 'top100', 'notRanking', 'all'])
    .optional()
    .default('all'),
  changeFilter: z
    .enum(['improved', 'declined', 'unchanged', 'new', 'lost', 'all'])
    .optional()
    .default('all'),
})

/**
 * GET /api/keyword-tracking/runs/[runId]/results
 * Get paginated keyword results with filtering/sorting
 */
export async function GET(
  request: Request,
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
    const paramsResult = paramsSchema.safeParse(resolvedParams)

    if (!paramsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid run ID' },
        { status: 400 }
      )
    }

    const { runId } = paramsResult.data

    // Verify ownership
    const run = await getRunForUser(runId, session.user.id)
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      positionFilter: searchParams.get('positionFilter'),
      changeFilter: searchParams.get('changeFilter'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: queryResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { limit, offset, sortBy, sortOrder, positionFilter, changeFilter } =
      queryResult.data

    const { results, total } = await getRunResults(runId, {
      limit,
      offset,
      sortBy,
      sortOrder,
      positionFilter,
      changeFilter,
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
        total,
        limit,
        offset,
        hasMore: offset + results.length < total,
        filters: {
          positionFilter,
          changeFilter,
          sortBy,
          sortOrder,
        },
      },
    })
  } catch (error) {
    console.error('Error getting run results:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get results' },
      { status: 500 }
    )
  }
}
