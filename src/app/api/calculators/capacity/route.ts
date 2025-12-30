import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  createCapacityCalculation,
  getCapacityCalculations,
} from '@/lib/db/calculator-operations'

const createCapacitySchema = z.object({
  domainId: z.string().min(1),
  name: z.string().optional(),

  // Practice setup
  operatories: z.number().int().min(1).max(50),
  daysOpenPerWeek: z.number().int().min(1).max(7),
  hoursPerDay: z.number().min(1).max(24),
  appointmentDuration: z.number().int().min(15).max(480), // 15 min to 8 hours

  // Current state (optional)
  currentPatientsMonthly: z.number().int().min(0).optional(),
  currentRevenueMonthly: z.number().min(0).optional(),

  // Value metrics
  avgShortTermValue: z.number().min(0),
  avgLifetimeValue: z.number().min(0),

  notes: z.string().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const domainId = searchParams.get('domainId')

  if (!domainId) {
    return NextResponse.json(
      { success: false, error: 'domainId is required' },
      { status: 400 }
    )
  }

  try {
    const calculations = await getCapacityCalculations({
      domainId,
      userId: session.user.id,
    })

    return NextResponse.json({ success: true, data: calculations })
  } catch (error) {
    console.error('Error fetching capacity calculations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createCapacitySchema.parse(body)

    const id = await createCapacityCalculation({
      ...data,
      userId: session.user.id,
    })

    return NextResponse.json({ success: true, data: { id } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating capacity calculation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create calculation' },
      { status: 500 }
    )
  }
}
