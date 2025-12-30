// POST /api/site-audit - Create and trigger a new site audit scan
// GET /api/site-audit - List site audit scans for authenticated user

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { inngest } from '@/lib/inngest';
import {
  createSiteAuditScan,
  listUserScans,
} from '@/lib/db/site-audit-operations';
import { SiteAuditStatus } from '@prisma/client';

/**
 * Request validation schema for creating a site audit scan
 */
const createScanSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
    ),
  maxCrawlPages: z.coerce.number().int().min(10).max(500).optional().default(100),
  startUrl: z.string().url().optional(),
  auditId: z.string().optional(), // Optional link to existing audit
  storeRawHtml: z.boolean().optional().default(false),
  calculateKeywordDensity: z.boolean().optional().default(false),
});

/**
 * Query params schema for listing scans
 */
const listScansSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z
    .enum(['PENDING', 'SUBMITTING', 'CRAWLING', 'FETCHING_RESULTS', 'COMPLETED', 'FAILED'])
    .optional(),
  domainId: z.string().optional(), // Domain filtering
});

/**
 * POST /api/site-audit
 * Create a new site audit scan and trigger the background job
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const parseResult = createScanSchema.safeParse(body);
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

    const {
      domain,
      maxCrawlPages,
      startUrl,
      auditId,
      storeRawHtml,
      calculateKeywordDensity,
    } = parseResult.data;

    // Create scan record in database
    const scanId = await createSiteAuditScan(userId, {
      domain,
      maxCrawlPages,
      startUrl,
      auditId,
      storeRawHtml,
      calculateKeywordDensity,
      enableJavascript: true, // Always on
      enableBrowserRendering: true, // Always on for CWV
    });

    // Trigger Inngest background job
    await inngest.send({
      name: 'site-audit/scan.requested',
      data: {
        scanId,
        domain,
        userId,
        config: {
          maxCrawlPages,
          enableJavascript: true,
          enableBrowserRendering: true,
          storeRawHtml,
          calculateKeywordDensity,
          startUrl,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          scanId,
          domain,
          status: 'PENDING',
          message: 'Site audit scan has been queued and will start shortly',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating site audit scan:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create site audit scan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/site-audit
 * List site audit scans for authenticated user
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const rawParams: Record<string, string> = {};
    const rawLimit = searchParams.get('limit');
    const rawOffset = searchParams.get('offset');
    const rawStatus = searchParams.get('status');
    const rawDomainId = searchParams.get('domainId');

    if (rawLimit) rawParams.limit = rawLimit;
    if (rawOffset) rawParams.offset = rawOffset;
    if (rawStatus) rawParams.status = rawStatus;
    if (rawDomainId) rawParams.domainId = rawDomainId;

    // Validate query params
    const parseResult = listScansSchema.safeParse(rawParams);
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

    const { limit, offset, status, domainId } = parseResult.data;

    // Fetch scans from database
    const scans = await listUserScans(userId, {
      limit,
      offset,
      status: status as SiteAuditStatus | undefined,
      domainId,
    });

    return NextResponse.json({
      success: true,
      data: scans,
    });
  } catch (error) {
    console.error('Error listing site audit scans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list site audit scans' },
      { status: 500 }
    );
  }
}
