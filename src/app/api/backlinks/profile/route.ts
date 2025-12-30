/**
 * GET /api/backlinks/profile
 * Get backlink profile for a domain
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBacklinkProfile } from '@/lib/db/backlinks-operations'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const domainId = url.searchParams.get('domainId')
    const includeDetails = url.searchParams.get('includeDetails') === 'true'

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domainId is required' },
        { status: 400 }
      )
    }

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain not found' }, { status: 404 })
    }

    const profile = await getBacklinkProfile(domainId, includeDetails)

    return NextResponse.json({
      success: true,
      data: profile,
      domain: domain.domain,
    })
  } catch (error) {
    console.error('[Backlinks Profile API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backlink profile' },
      { status: 500 }
    )
  }
}
