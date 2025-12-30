// GET /api/site-audit/scans/[scanId]/pages - Paginated pages with filtering

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getScanForUser,
  getSiteAuditPages,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * Query params schema for listing pages
 */
const listPagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  filter: z.enum(['errors', 'warnings', 'all']).optional().default('all'),
  sortBy: z
    .enum(['onpageScore', 'issueCount', 'statusCode'])
    .optional()
    .default('issueCount'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/site-audit/scans/[scanId]/pages
 * Get paginated pages with filtering and sorting
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

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const rawParams: Record<string, string> = {};
    const rawLimit = searchParams.get('limit');
    const rawOffset = searchParams.get('offset');
    const rawFilter = searchParams.get('filter');
    const rawSortBy = searchParams.get('sortBy');
    const rawSortOrder = searchParams.get('sortOrder');

    if (rawLimit) rawParams.limit = rawLimit;
    if (rawOffset) rawParams.offset = rawOffset;
    if (rawFilter) rawParams.filter = rawFilter;
    if (rawSortBy) rawParams.sortBy = rawSortBy;
    if (rawSortOrder) rawParams.sortOrder = rawSortOrder;

    // Validate query params
    const parseResult = listPagesSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { limit, offset, filter, sortBy, sortOrder } = parseResult.data;

    // Fetch pages from database
    const result = await getSiteAuditPages(scanId, {
      limit,
      offset,
      filter,
      sortBy,
      sortOrder,
    });

    // Convert Decimal to number for JSON serialization
    const pages = result.pages.map((page) => ({
      ...page,
      onpageScore: page.onpageScore ? Number(page.onpageScore) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        pages,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error getting site audit pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get site audit pages' },
      { status: 500 }
    );
  }
}
