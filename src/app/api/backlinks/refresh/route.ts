/**
 * POST /api/backlinks/refresh
 * Fetch fresh backlink data from DataForSEO
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { refreshBacklinkProfile } from '@/lib/db/backlinks-operations'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { domainId } = body

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domainId is required' },
        { status: 400 }
      )
    }

    // Verify domain ownership and get domain name
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain not found' }, { status: 404 })
    }

    console.log(`[Backlinks Refresh] Fetching data for ${domain.domain}`)

    const profile = await refreshBacklinkProfile(domainId, domain.domain)

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Backlink profile refreshed successfully',
    })
  } catch (error) {
    console.error('[Backlinks Refresh API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh backlink profile' },
      { status: 500 }
    )
  }
}
