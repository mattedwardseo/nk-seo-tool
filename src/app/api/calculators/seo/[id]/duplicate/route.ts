// POST /api/calculators/seo/[id]/duplicate - Duplicate an SEO calculation

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { duplicateSEOCalculation } from '@/lib/db/calculator-operations'

/**
 * Request validation schema
 */
const duplicateSchema = z.object({
  newName: z.string().max(200).optional(),
})

/**
 * POST /api/calculators/seo/[id]/duplicate
 * Duplicate an existing SEO calculation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Parse optional body for newName
    let newName: string | undefined
    try {
      const body = await request.json()
      const parseResult = duplicateSchema.safeParse(body)
      if (parseResult.success) {
        newName = parseResult.data.newName
      }
    } catch {
      // Body is optional, ignore parse errors
    }

    const newCalculationId = await duplicateSEOCalculation({
      id,
      userId: session.user.id,
      newName,
    })

    if (!newCalculationId) {
      return NextResponse.json(
        { success: false, error: 'Original calculation not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newCalculationId,
          message: 'Calculation duplicated successfully',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[SEO Calculator API] Duplicate error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate calculation' },
      { status: 500 }
    )
  }
}
