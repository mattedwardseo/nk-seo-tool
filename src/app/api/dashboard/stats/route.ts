import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDashboardStats } from '@/lib/db/audit-operations'

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the authenticated user
 *
 * Response:
 * - totalAudits: number - Total number of audits for the user
 * - completedAudits: number - Number of completed audits
 * - thisMonthAudits: number - Audits completed this month
 * - averageScore: number | null - Average overall score (null if no completed audits)
 * - scheduledAudits: number - Number of scheduled audits (always 0 until scheduling is implemented)
 * - recentAudits: array - 5 most recent audits
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getDashboardStats(session.user.id)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
      },
      { status: 500 }
    )
  }
}
