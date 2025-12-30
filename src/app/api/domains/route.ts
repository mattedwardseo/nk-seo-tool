/**
 * Domain API Routes
 * GET /api/domains - List user's domains
 * POST /api/domains - Create new domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserDomains, createDomain } from '@/lib/db/domain-operations';
import { z } from 'zod';

const createDomainSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().min(1).max(255),
  businessName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
});

/**
 * GET /api/domains
 * List all active domains for the current user
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
    const domains = await getUserDomains(session.user.id);

    return NextResponse.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domains
 * Create a new domain with default settings
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validated = createDomainSchema.parse(body);

    const domain = await createDomain({
      userId: session.user.id,
      name: validated.name,
      domain: validated.domain,
      businessName: validated.businessName,
      city: validated.city,
      state: validated.state,
    });

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

    console.error('Error creating domain:', error);
    
    // Pass through specific error messages (e.g., "A domain with this name already exists")
    const errorMessage = error instanceof Error ? error.message : 'Failed to create domain';
    const statusCode = error instanceof Error && errorMessage.includes('already exists') ? 409 : 500;
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
