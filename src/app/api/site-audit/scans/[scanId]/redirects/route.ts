// GET /api/site-audit/scans/[scanId]/redirects - Get redirect pages

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getScanForUser,
  getRedirectPages,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]/redirects
 * Get all pages that are redirects with their target URLs
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

    // Get redirect pages
    const redirects = await getRedirectPages(scanId);

    // Group by status code for summary
    const statusCounts: Record<number, number> = {};
    for (const redirect of redirects) {
      statusCounts[redirect.statusCode] = (statusCounts[redirect.statusCode] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        redirects,
        total: redirects.length,
        byStatusCode: statusCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching redirect pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch redirect pages' },
      { status: 500 }
    );
  }
}
