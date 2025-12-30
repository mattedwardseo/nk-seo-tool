/**
 * Domain Detail API Routes
 * GET /api/domains/[id] - Get domain details
 * PATCH /api/domains/[id] - Update domain
 * DELETE /api/domains/[id] - Archive domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getDomainById,
  updateDomain,
  archiveDomain,
} from '@/lib/db/domain-operations';
import { z } from 'zod';

const updateDomainSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  businessName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  isPinned: z.boolean().optional(),
});

/**
 * GET /api/domains/[id]
 * Get domain details with settings
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
      data: domain,
    });
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/domains/[id]
 * Update domain information
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
    const validated = updateDomainSchema.parse(body);

    const domain = await updateDomain(id, session.user.id, validated);

    return NextResponse.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating domain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/domains/[id]
 * Archive domain (soft delete)
 */
export async function DELETE(
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
    await archiveDomain(id, session.user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error archiving domain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive domain' },
      { status: 500 }
    );
  }
}
