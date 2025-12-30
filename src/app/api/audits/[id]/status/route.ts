// GET /api/audits/[id]/status - Get audit progress and status (lightweight)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getAuditStatus } from '@/lib/db/audit-operations'

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
 * Step descriptions for user-friendly progress messages
 */
const stepDescriptions: Record<string, string> = {
  onpage_crawl: 'Analyzing technical SEO and page performance',
  serp_analysis: 'Checking keyword rankings and search presence',
  backlinks_analysis: 'Evaluating backlink profile and authority',
  business_data: 'Gathering business listing and review data',
  scoring: 'Calculating final scores and recommendations',
}

/**
 * GET /api/audits/[id]/status
 * Lightweight endpoint for polling audit progress
 * Returns only status, progress, and current step - no heavy data
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

    // Fetch status (lightweight query)
    const status = await getAuditStatus(id)

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Audit not found',
        },
        { status: 404 }
      )
    }

    // Calculate estimated time remaining (rough estimate)
    let estimatedSecondsRemaining: number | null = null
    if (status.started_at && status.progress > 0 && status.progress < 100) {
      const elapsedMs = Date.now() - status.started_at.getTime()
      const estimatedTotalMs = (elapsedMs / status.progress) * 100
      estimatedSecondsRemaining = Math.round((estimatedTotalMs - elapsedMs) / 1000)
    }

    // Get step description
    const currentStepDescription = status.current_step
      ? stepDescriptions[status.current_step] || status.current_step
      : null

    return NextResponse.json({
      success: true,
      data: {
        id: status.id,
        status: status.status,
        progress: status.progress,
        currentStep: status.current_step,
        currentStepDescription,
        errorMessage: status.error_message,
        startedAt: status.started_at,
        completedAt: status.completed_at,
        estimatedSecondsRemaining,
        isComplete: status.status === 'COMPLETED',
        isFailed: status.status === 'FAILED',
        isInProgress: ['PENDING', 'CRAWLING', 'ANALYZING'].includes(status.status),
      },
    })
  } catch (error) {
    console.error('Error fetching audit status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit status' },
      { status: 500 }
    )
  }
}
