import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { importCompetitorsFromGrid } from '@/lib/db/gbp-operations'

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

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    // Optional parameters from body
    let options: { minAvgRank?: number; minShareOfVoice?: number; limit?: number } = {}
    try {
      const body = await request.json()
      options = {
        minAvgRank: body.minAvgRank,
        minShareOfVoice: body.minShareOfVoice,
        limit: body.limit,
      }
    } catch {
      // No body is OK, use defaults
    }

    const result = await importCompetitorsFromGrid(domainId, options)

    // Build message
    let message = `Imported ${result.imported} competitor${result.imported !== 1 ? 's' : ''}`
    if (result.skipped > 0) {
      message += ` (${result.skipped} already existed)`
    }
    if (result.imported === 0 && result.skipped === 0) {
      message = 'No competitors found to import'
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        message,
      },
    })
  } catch (error) {
    console.error('Error importing GBP competitors from grid:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import competitors from grid' },
      { status: 500 }
    )
  }
}
