import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGBPProfileForDomain, saveGBPProfile } from '@/lib/db/gbp-operations'

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

    const profile = await getGBPProfileForDomain(domainId)

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'No GBP profile found for this domain' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error fetching GBP profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GBP profile' },
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
    const { domainId, ...profileData } = body

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    if (!profileData.businessName) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      )
    }

    const profileId = await saveGBPProfile({
      domainId,
      ...profileData,
    })

    return NextResponse.json({
      success: true,
      data: { id: profileId },
    })
  } catch (error) {
    console.error('Error saving GBP profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save GBP profile' },
      { status: 500 }
    )
  }
}
