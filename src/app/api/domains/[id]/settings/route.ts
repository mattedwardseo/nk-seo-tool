/**
 * Domain Settings API Routes
 * GET /api/domains/[id]/settings - Get domain settings
 * PATCH /api/domains/[id]/settings - Update domain settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDomainById,
  updateDomainSettings,
} from '@/lib/db/domain-operations';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  siteAuditMaxPages: z.number().int().min(1).max(10000).optional(),
  siteAuditEnableJavascript: z.boolean().optional(),
  localSeoGridSize: z.number().int().min(3).max(15).optional(),
  localSeoRadiusMiles: z.number().positive().optional(),
});

/**
 * GET /api/domains/[id]/settings
 * Get domain settings
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
    const domain = await getDomainById(id, session.user.id);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: domain.settings,
    });
  } catch (error) {
    console.error('Error fetching domain settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/domains/[id]/settings
 * Update domain settings
 */
export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const validated = updateSettingsSchema.parse(body);

    await updateDomainSettings(id, session.user.id, validated);

    // Fetch updated domain to return
    const domain = await getDomainById(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: domain?.settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating domain settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
