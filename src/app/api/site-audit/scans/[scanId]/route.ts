// GET /api/site-audit/scans/[scanId] - Get full scan details
// DELETE /api/site-audit/scans/[scanId] - Delete a scan

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSiteAuditScanWithRelations,
  getScanForUser,
  deleteScan,
  getSiteAuditSummary,
} from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]
 * Get full scan details with summary
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

    // Get full scan with relations
    const fullScan = await getSiteAuditScanWithRelations(scanId);
    if (!fullScan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Get summary if available
    const summary = await getSiteAuditSummary(scanId);

    return NextResponse.json({
      success: true,
      data: {
        id: fullScan.id,
        domain: fullScan.domain,
        status: fullScan.status,
        progress: fullScan.progress,
        taskId: fullScan.taskId,
        maxCrawlPages: fullScan.maxCrawlPages,
        enableJavascript: fullScan.enableJavascript,
        enableBrowserRendering: fullScan.enableBrowserRendering,
        startUrl: fullScan.startUrl,
        startedAt: fullScan.startedAt,
        completedAt: fullScan.completedAt,
        apiCost: fullScan.apiCost ? Number(fullScan.apiCost) : null,
        errorMessage: fullScan.errorMessage,
        createdAt: fullScan.createdAt,
        updatedAt: fullScan.updatedAt,
        auditId: fullScan.auditId,
        summary: summary
          ? {
              totalPages: summary.totalPages,
              crawledPages: summary.crawledPages,
              crawlStopReason: summary.crawlStopReason,
              errorsCount: summary.errorsCount,
              warningsCount: summary.warningsCount,
              noticesCount: summary.noticesCount,
              onpageScore: summary.onpageScore
                ? Number(summary.onpageScore)
                : null,
              avgLcp: summary.avgLcp ? Number(summary.avgLcp) : null,
              avgCls: summary.avgCls ? Number(summary.avgCls) : null,
              totalImages: summary.totalImages,
              brokenResources: summary.brokenResources,
              internalLinks: summary.internalLinks,
              externalLinks: summary.externalLinks,
              brokenLinks: summary.brokenLinks,
              nonIndexable: summary.nonIndexable,
              duplicateTitle: summary.duplicateTitle,
              duplicateDescription: summary.duplicateDescription,
              domainInfo: summary.domainInfo,
              sslInfo: summary.sslInfo,
              pageMetricsChecks: summary.pageMetricsChecks,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error getting site audit scan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get site audit scan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/site-audit/scans/[scanId]
 * Delete a scan and all related data
 */
export async function DELETE(
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

    // Delete scan (cascades to summary and pages)
    await deleteScan(scanId);

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting site audit scan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete site audit scan' },
      { status: 500 }
    );
  }
}
