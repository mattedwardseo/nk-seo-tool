import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCapacityCalculation,
  deleteCapacityCalculation,
} from '@/lib/db/calculator-operations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const calculation = await getCapacityCalculation({
      id,
      userId: session.user.id,
    })

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: calculation })
  } catch (error) {
    console.error('Error fetching capacity calculation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const deleted = await deleteCapacityCalculation({
      id,
      userId: session.user.id,
    })

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting capacity calculation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete calculation' },
      { status: 500 }
    )
  }
}
