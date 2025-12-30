// GET /api/site-audit/scans/[scanId]/duplicates - Get duplicate title/description pages

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getScanForUser,
  getDuplicateTitlePages,
  getDuplicateDescriptionPages,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]/duplicates
 * Get pages with duplicate titles or descriptions
 *
 * Query params:
 * - type: 'title' | 'description' | 'all' (default: 'all')
 */
export async function GET(
  request: Request,
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Fetch duplicates based on type
    let duplicateTitles: Awaited<ReturnType<typeof getDuplicateTitlePages>> = [];
    let duplicateDescriptions: Awaited<ReturnType<typeof getDuplicateDescriptionPages>> = [];

    if (type === 'title' || type === 'all') {
      duplicateTitles = await getDuplicateTitlePages(scanId);
    }

    if (type === 'description' || type === 'all') {
      duplicateDescriptions = await getDuplicateDescriptionPages(scanId);
    }

    return NextResponse.json({
      success: true,
      data: {
        duplicateTitles,
        duplicateDescriptions,
        totalDuplicateTitleGroups: duplicateTitles.length,
        totalDuplicateDescriptionGroups: duplicateDescriptions.length,
        totalDuplicateTitlePages: duplicateTitles.reduce((sum, g) => sum + g.count, 0),
        totalDuplicateDescriptionPages: duplicateDescriptions.reduce((sum, g) => sum + g.count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching duplicate pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch duplicate pages' },
      { status: 500 }
    );
  }
}
