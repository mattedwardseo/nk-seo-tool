/**
 * Grid Data API
 *
 * GET /api/local-seo/campaigns/[id]/scans/[scanId]/grid - Get grid point data for heatmap
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getCampaignForUser,
  getGridScan,
  getGridPointsForKeyword,
  getAllGridPoints,
} from '@/lib/db/local-campaign-operations'
import type { CompetitorRanking } from '@/lib/local-seo/types'

interface RouteParams {
  params: Promise<{ id: string; scanId: string }>
}

/**
 * GET /api/local-seo/campaigns/[id]/scans/[scanId]/grid
 * Get grid point data for visualization
 *
 * Query params:
 * - keyword: Filter by specific keyword (optional, returns all keywords if not specified)
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

    const { id, scanId } = await params

    // Validate ownership
    const ownership = await getCampaignForUser(id, session.user.id)
    if (!ownership) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Get scan details for grid size
    const scan = await getGridScan(scanId)
    if (!scan || scan.campaign_id !== id) {
      return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 })
    }

    // Check if specific keyword is requested
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')

    // Get grid points
    const gridPoints = keyword
      ? await getGridPointsForKeyword(scanId, keyword)
      : await getAllGridPoints(scanId)

    if (gridPoints.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          scanId,
          keyword: keyword ?? 'all',
          gridSize: scan.local_campaigns.grid_size,
          points: [],
          aggregates: {
            avgRank: null,
            shareOfVoice: 0,
            timesInTop3: 0,
            timesNotRanking: 0,
          },
        },
      })
    }

    // Calculate aggregates
    let totalRank = 0
    let rankedCount = 0
    let timesInTop3 = 0
    let timesNotRanking = 0

    // Format points
    const formattedPoints = gridPoints.map((point) => {
      if (point.rank !== null) {
        totalRank += point.rank
        rankedCount++
        if (point.rank <= 3) timesInTop3++
      } else {
        timesNotRanking++
      }

      return {
        row: point.grid_row,
        col: point.grid_col,
        lat: Number(point.lat),
        lng: Number(point.lng),
        keyword: point.keyword,
        rank: point.rank,
        topRankings: (point.top_rankings as unknown as CompetitorRanking[]) ?? [],
      }
    })

    // If filtering by keyword, group by position for the grid
    // Otherwise, return all points
    const groupedPoints = keyword
      ? formattedPoints
      : groupByPosition(formattedPoints)

    const avgRank = rankedCount > 0 ? Number((totalRank / rankedCount).toFixed(2)) : null
    const shareOfVoice =
      gridPoints.length > 0
        ? Number(((timesInTop3 / gridPoints.length) * 100).toFixed(2))
        : 0

    return NextResponse.json({
      success: true,
      data: {
        scanId,
        campaignId: id,
        keyword: keyword ?? 'all',
        gridSize: scan.local_campaigns.grid_size,
        centerLat: Number(scan.local_campaigns.center_lat),
        centerLng: Number(scan.local_campaigns.center_lng),
        points: groupedPoints,
        aggregates: {
          avgRank,
          shareOfVoice,
          timesInTop3,
          timesNotRanking,
          totalPoints: gridPoints.length,
        },
      },
    })
  } catch (error) {
    console.error('Error getting grid data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get grid data' },
      { status: 500 }
    )
  }
}

/**
 * Groups grid points by position (row, col) for multi-keyword view
 */
function groupByPosition(
  points: Array<{
    row: number
    col: number
    lat: number
    lng: number
    keyword: string
    rank: number | null
    topRankings: CompetitorRanking[]
  }>
): Array<{
  row: number
  col: number
  lat: number
  lng: number
  keywords: Array<{
    keyword: string
    rank: number | null
    topRankings: CompetitorRanking[]
  }>
  avgRank: number | null
}> {
  const grouped = new Map<
    string,
    {
      row: number
      col: number
      lat: number
      lng: number
      keywords: Array<{
        keyword: string
        rank: number | null
        topRankings: CompetitorRanking[]
      }>
    }
  >()

  for (const point of points) {
    const key = `${point.row}-${point.col}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        row: point.row,
        col: point.col,
        lat: point.lat,
        lng: point.lng,
        keywords: [],
      })
    }

    grouped.get(key)!.keywords.push({
      keyword: point.keyword,
      rank: point.rank,
      topRankings: point.topRankings,
    })
  }

  // Calculate average rank per position
  return Array.from(grouped.values()).map((pos) => {
    const ranks = pos.keywords.filter((k) => k.rank !== null).map((k) => k.rank!)
    const avgRank = ranks.length > 0 ? Number((ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2)) : null

    return {
      ...pos,
      avgRank,
    }
  })
}
