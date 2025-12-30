/**
 * GBP Snapshot API
 *
 * GET /api/local-seo/campaigns/[id]/gbp - Get latest GBP snapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getLatestGBPSnapshot,
  getGBPSnapshotHistory,
} from '@/lib/db/local-campaign-operations'
import type { RatingDistribution, DayHours, AttributeCategory } from '@/lib/local-seo/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/gbp
 * Get GBP data with optional history
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Validate ownership
    const ownership = await getCampaignForUser(id, session.user.id)
    if (!ownership) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const historyLimit = parseInt(searchParams.get('historyLimit') ?? '10', 10)

    // Get latest snapshot
    const snapshot = await getLatestGBPSnapshot(id)

    if (!snapshot) {
      return NextResponse.json({
        success: true,
        data: {
          hasSnapshot: false,
          snapshot: null,
          history: [],
        },
      })
    }

    // Parse JSON fields
    const ratingDistribution = snapshot.rating_distribution as RatingDistribution | null
    const workHours = parseWorkHours(snapshot.work_hours)
    const attributes = parseAttributes(snapshot.attributes)
    const photos = snapshot.photos as { count?: number; urls?: string[] } | null

    // Get history if requested
    let history: Array<{
      id: string
      rating: number | null
      reviewCount: number | null
      completenessScore: number | null
      createdAt: Date
    }> = []

    if (includeHistory) {
      const historyData = await getGBPSnapshotHistory(id, { limit: historyLimit })
      history = historyData.map((h) => ({
        id: h.id,
        rating: h.rating ? Number(h.rating) : null,
        reviewCount: h.review_count,
        completenessScore: h.completeness_score,
        createdAt: h.created_at,
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSnapshot: true,
        snapshot: {
          id: snapshot.id,
          businessName: snapshot.business_name,
          gmbPlaceId: snapshot.gmb_place_id,
          gmbCid: snapshot.gmb_cid,
          rating: snapshot.rating ? Number(snapshot.rating) : null,
          reviewCount: snapshot.review_count,
          ratingDistribution,
          completenessScore: snapshot.completeness_score,
          address: snapshot.address,
          phone: snapshot.phone,
          website: snapshot.website,
          categories: snapshot.categories,
          attributes,
          workHours,
          photoCount: photos?.count ?? 0,
          photoUrls: photos?.urls ?? [],
          createdAt: snapshot.created_at,
        },
        history,
      },
    })
  } catch (error) {
    console.error('Error getting GBP snapshot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get GBP data' },
      { status: 500 }
    )
  }
}

/**
 * Parse work hours from JSON to structured format
 */
function parseWorkHours(
  workHours: unknown
): DayHours[] {
  if (!workHours || typeof workHours !== 'object') return []

  const hours = workHours as { work_hours?: Record<string, string[]> }
  const result: DayHours[] = []
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  for (const day of dayOrder) {
    const dayHours = hours.work_hours?.[day.toLowerCase()]
    if (dayHours && dayHours.length > 0) {
      // Parse format like "09:00 - 17:00"
      const [open, close] = dayHours[0]!.split(' - ')
      result.push({
        day,
        open: open ?? 'Closed',
        close: close ?? '',
        isOpen: true,
      })
    } else {
      result.push({
        day,
        open: 'Closed',
        close: '',
        isOpen: false,
      })
    }
  }

  return result
}

/**
 * Parse attributes from JSON to categorized format
 */
function parseAttributes(
  attributes: unknown
): AttributeCategory[] {
  if (!attributes || typeof attributes !== 'object') return []

  const attrs = attributes as Record<string, unknown>
  const categories: AttributeCategory[] = []

  // DataForSEO returns attributes in categories like:
  // { accessibility: [...], amenities: [...], offerings: [...], payments: [...] }
  const categoryNames: Record<string, string> = {
    accessibility: 'Accessibility',
    amenities: 'Amenities',
    offerings: 'Offerings',
    payments: 'Payment Methods',
    highlights: 'Highlights',
    planning: 'Planning',
    from_the_business: 'From the Business',
    service_options: 'Service Options',
    dining_options: 'Dining Options',
    health_and_safety: 'Health & Safety',
  }

  for (const [key, displayName] of Object.entries(categoryNames)) {
    const attrList = attrs[key]
    if (Array.isArray(attrList) && attrList.length > 0) {
      categories.push({
        category: displayName,
        attributes: attrList.map((a) => String(a)),
      })
    }
  }

  return categories
}
