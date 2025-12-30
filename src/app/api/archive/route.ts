/**
 * Archive API Route
 * GET - List unassigned and archived data
 * POST - Perform archive/assign operations
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUnassignedData,
  getArchivedData,
  assignAuditsToDomain,
  assignSiteAuditScansToDomain,
  assignLocalCampaignsToDomain,
  archiveAudits,
  archiveSiteAuditScans,
  archiveLocalCampaigns,
  deleteArchivedAudits,
  deleteArchivedSiteAuditScans,
  deleteArchivedLocalCampaigns,
} from '@/lib/db/archive-operations';
import { z } from 'zod';

// Validation schemas
const assignSchema = z.object({
  action: z.literal('assign'),
  type: z.enum(['audits', 'siteAuditScans', 'localCampaigns']),
  ids: z.array(z.string()).min(1),
  domainId: z.string().min(1),
});

const archiveSchema = z.object({
  action: z.literal('archive'),
  type: z.enum(['audits', 'siteAuditScans', 'localCampaigns']),
  ids: z.array(z.string()).min(1),
});

const deleteSchema = z.object({
  action: z.literal('delete'),
  type: z.enum(['audits', 'siteAuditScans', 'localCampaigns']),
  ids: z.array(z.string()).min(1),
});

const actionSchema = z.discriminatedUnion('action', [
  assignSchema,
  archiveSchema,
  deleteSchema,
]);

/**
 * GET /api/archive
 * Returns both unassigned and archived data
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const [unassigned, archived] = await Promise.all([
      getUnassignedData(session.user.id),
      getArchivedData(session.user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        unassigned,
        archived,
      },
    });
  } catch (error) {
    console.error('Error fetching archive data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch archive data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/archive
 * Perform assign, archive, or delete operations
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { action, type, ids } = parsed.data;
    let count = 0;

    if (action === 'assign') {
      const { domainId } = parsed.data;

      switch (type) {
        case 'audits':
          count = await assignAuditsToDomain(session.user.id, ids, domainId);
          break;
        case 'siteAuditScans':
          count = await assignSiteAuditScansToDomain(session.user.id, ids, domainId);
          break;
        case 'localCampaigns':
          count = await assignLocalCampaignsToDomain(session.user.id, ids, domainId);
          break;
      }
    } else if (action === 'archive') {
      switch (type) {
        case 'audits':
          count = await archiveAudits(session.user.id, ids);
          break;
        case 'siteAuditScans':
          count = await archiveSiteAuditScans(session.user.id, ids);
          break;
        case 'localCampaigns':
          count = await archiveLocalCampaigns(session.user.id, ids);
          break;
      }
    } else if (action === 'delete') {
      switch (type) {
        case 'audits':
          count = await deleteArchivedAudits(session.user.id, ids);
          break;
        case 'siteAuditScans':
          count = await deleteArchivedSiteAuditScans(session.user.id, ids);
          break;
        case 'localCampaigns':
          count = await deleteArchivedLocalCampaigns(session.user.id, ids);
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        type,
        count,
      },
    });
  } catch (error) {
    console.error('Error performing archive action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
