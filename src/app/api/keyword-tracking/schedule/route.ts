/**
 * Keyword Tracking Schedule API
 *
 * GET - Get schedule for a domain
 * POST - Create a schedule
 * PATCH - Update a schedule
 * DELETE - Delete a schedule
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getScheduleForDomain,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '@/lib/db/keyword-tracking-operations'


const createScheduleSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0 = Sunday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .default('06:00'),
  locationName: z.string().optional().default('United States'),
  languageCode: z.string().optional().default('en'),
})

const updateScheduleSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required'),
  isEnabled: z.boolean().optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  locationName: z.string().optional(),
  languageCode: z.string().optional(),
})

/**
 * GET /api/keyword-tracking/schedule?domainId=X
 * Get schedule for a domain
 */
export async function GET(request: Request): Promise<NextResponse> {
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

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    const schedule = await getScheduleForDomain(domainId)

    return NextResponse.json({
      success: true,
      data: schedule, // null if no schedule exists
    })
  } catch (error) {
    console.error('Error getting schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get schedule' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/keyword-tracking/schedule
 * Create a new schedule
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parseResult = createScheduleSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const {
      domainId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      locationName,
      languageCode,
    } = parseResult.data

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Check if schedule already exists
    const existing = await getScheduleForDomain(domainId)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule already exists. Use PATCH to update.' },
        { status: 409 }
      )
    }

    // Validate day fields based on frequency
    if (frequency === 'weekly' || frequency === 'biweekly') {
      if (dayOfWeek === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: 'dayOfWeek is required for weekly/biweekly schedules',
          },
          { status: 400 }
        )
      }
    } else if (frequency === 'monthly') {
      if (dayOfMonth === undefined) {
        return NextResponse.json(
          { success: false, error: 'dayOfMonth is required for monthly schedules' },
          { status: 400 }
        )
      }
    }

    await createSchedule(session.user.id, {
      domainId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      locationName,
      languageCode,
    })

    const schedule = await getScheduleForDomain(domainId)

    return NextResponse.json(
      {
        success: true,
        data: schedule,
        message: 'Schedule created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/keyword-tracking/schedule
 * Update an existing schedule
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parseResult = updateScheduleSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { domainId, ...updates } = parseResult.data

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Check if schedule exists
    const existing = await getScheduleForDomain(domainId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found. Use POST to create.' },
        { status: 404 }
      )
    }

    await updateSchedule(domainId, updates)

    const schedule = await getScheduleForDomain(domainId)

    return NextResponse.json({
      success: true,
      data: schedule,
      message: 'Schedule updated successfully',
    })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/keyword-tracking/schedule?domainId=X
 * Delete a schedule
 */
export async function DELETE(request: Request): Promise<NextResponse> {
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

    // Verify domain ownership
    const domain = await prisma.domains.findFirst({
      where: {
        id: domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Check if schedule exists
    const existing = await getScheduleForDomain(domainId)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    await deleteSchedule(domainId)

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
