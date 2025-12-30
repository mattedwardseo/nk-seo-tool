// GET /api/site-audit/scans/[scanId]/status - Lightweight status for polling

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getScanStatus, getScanForUser } from '@/lib/db/site-audit-operations';

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

/**
 * GET /api/site-audit/scans/[scanId]/status
 * Lightweight status endpoint for polling during scan progress
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

    // Get lightweight status
    const status = await getScanStatus(scanId);
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: status.id,
        status: status.status,
        progress: status.progress,
        taskId: status.taskId,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
        errorMessage: status.errorMessage,
      },
    });
  } catch (error) {
    console.error('Error getting site audit scan status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get site audit scan status' },
      { status: 500 }
    );
  }
}
