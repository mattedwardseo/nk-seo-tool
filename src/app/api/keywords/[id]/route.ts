/**
 * Individual Keyword API Routes
 *
 * PATCH /api/keywords/[id] - Toggle keyword active status
 * DELETE /api/keywords/[id] - Remove a tracked keyword
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  toggleTrackedKeyword,
  deleteTrackedKeyword,
} from '@/lib/db/keyword-operations'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/keywords/[id]
 * Toggle keyword active/inactive status
 */
export async function PATCH(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Keyword ID is required' },
        { status: 400 }
      )
    }

    const keyword = await toggleTrackedKeyword(session.user.id, id)

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: keyword.id,
        keyword: keyword.keyword,
        domain: keyword.domain,
        isActive: keyword.is_active,
        updatedAt: keyword.updated_at.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error toggling keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle keyword' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/keywords/[id]
 * Permanently delete a tracked keyword
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Keyword ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteTrackedKeyword(session.user.id, id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Keyword not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Keyword deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting keyword:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete keyword' },
      { status: 500 }
    )
  }
}
