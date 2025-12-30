import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runGBPAnalysis } from '@/lib/db/gbp-operations'

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

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    // For GET, we'd need to store/retrieve cached analysis
    // For now, return null (no cached analysis)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error fetching GBP analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GBP analysis' },
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

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')

    const body = await request.json()
    const { cityName } = body

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    if (!cityName) {
      return NextResponse.json(
        { success: false, error: 'City name is required for analysis' },
        { status: 400 }
      )
    }

    const analysis = await runGBPAnalysis(domainId, cityName)

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'No GBP profile found for this domain' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    console.error('Error running GBP analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to run GBP analysis' },
      { status: 500 }
    )
  }
}
