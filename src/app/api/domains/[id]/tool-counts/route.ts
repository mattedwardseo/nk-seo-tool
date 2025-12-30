/**
 * Domain Tool Counts API Route
 * GET /api/domains/[id]/tool-counts - Get counts for sidebar badges
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDomainToolCounts } from '@/lib/db/domain-operations';

/**
 * GET /api/domains/[id]/tool-counts
 * Get tool counts for domain (for sidebar badges)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const counts = await getDomainToolCounts(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Error fetching tool counts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool counts' },
      { status: 500 }
    );
  }
}
