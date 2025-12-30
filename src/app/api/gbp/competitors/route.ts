import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getGBPCompetitorsForDomain,
  addGBPCompetitor,
  removeGBPCompetitor,
} from '@/lib/db/gbp-operations'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')
    const sortBy = (searchParams.get('sortBy') as 'rank' | 'rating' | 'reviews') || 'rank'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    const competitors = await getGBPCompetitorsForDomain(domainId, { sortBy, limit })

    return NextResponse.json({ success: true, data: competitors })
  } catch (error) {
    console.error('Error fetching GBP competitors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GBP competitors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domainId, competitor } = body

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    if (!competitor?.gmbCid || !competitor?.businessName) {
      return NextResponse.json(
        { success: false, error: 'Competitor CID and business name are required' },
        { status: 400 }
      )
    }

    const competitorId = await addGBPCompetitor(domainId, competitor)

    return NextResponse.json({
      success: true,
      data: { id: competitorId },
    })
  } catch (error) {
    console.error('Error adding GBP competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add GBP competitor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const competitorId = searchParams.get('competitorId')

    if (!competitorId) {
      return NextResponse.json(
        { success: false, error: 'Competitor ID is required' },
        { status: 400 }
      )
    }

    await removeGBPCompetitor(competitorId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing GBP competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove GBP competitor' },
      { status: 500 }
    )
  }
}
