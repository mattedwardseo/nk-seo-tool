// GET /api/site-audit/scans/[scanId]/pages/[pageId] - Get full page details

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getScanForUser,
  getSiteAuditPage,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string; pageId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]/pages/[pageId]
 * Get full details for a specific page
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

    const { scanId, pageId } = await params;
    const userId = session.user.id;

    // Verify user owns this scan
    const scan = await getScanForUser(scanId, userId);
    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Get full page details
    const page = await getSiteAuditPage(pageId);
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Verify page belongs to this scan
    if (page.scanId !== scanId) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching page details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page details' },
      { status: 500 }
    );
  }
}
