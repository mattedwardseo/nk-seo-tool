// GET /api/site-audit/scans/[scanId]/non-indexable - Get non-indexable pages

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getScanForUser,
  getNonIndexablePages,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]/non-indexable
 * Get all pages that are not indexable (noindex, robots blocked, canonical issues)
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { scanId } = await params;
    const userId = session.user.id;

    // Verify user owns this scan
    const scan = await getScanForUser(scanId, userId);
    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Get non-indexable pages
    const pages = await getNonIndexablePages(scanId);

    // Group by reason for summary
    const reasonCounts: Record<string, number> = {};
    for (const page of pages) {
      reasonCounts[page.reason] = (reasonCounts[page.reason] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        pages,
        total: pages.length,
        byReason: reasonCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching non-indexable pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch non-indexable pages' },
      { status: 500 }
    );
  }
}
