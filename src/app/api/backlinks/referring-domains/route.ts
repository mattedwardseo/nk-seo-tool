/**
 * GET /api/backlinks/referring-domains
 * Get paginated list of referring domains
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getReferringDomains } from '@/lib/db/backlinks-operations'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const domainId = url.searchParams.get('domainId')
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10)
    const sortBy = (url.searchParams.get('sortBy') as 'rank' | 'backlinks') ?? 'rank'
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc'

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

    const result = await getReferringDomains(domainId, {
      page,
      pageSize: Math.min(pageSize, 100), // Cap at 100
      sortBy,
      sortOrder,
    })

    return NextResponse.json({
      success: true,
      data: result.domains,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    })
  } catch (error) {
    console.error('[Backlinks Referring Domains API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referring domains' },
      { status: 500 }
    )
  }
}
