// GET /api/audits/[id]/competitors/serp-comparison
// Fetches LIVE side-by-side SERP rankings for client vs competitors using DataForSEO
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBatchSerpRankings } from '@/lib/competitors'
import type { SerpStepResult, CompetitorStepResult } from '@/types/audit'

interface StepResults {
  serp?: SerpStepResult
  competitors?: CompetitorStepResult
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: auditId } = await params

    // Check for live=true query param
    const url = new URL(request.url)
    const useLiveData = url.searchParams.get('live') === 'true'

    // Fetch audit with step results
    const audit = await prisma.audits.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        domain: true,
        userId: true,
        step_results: true,
        competitor_domains: true,
        target_keywords: true,
        city: true,
        state: true,
      },
    })

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 })
    }

    if (audit.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const stepResults = audit.step_results as StepResults | null
    const serpData = stepResults?.serp
    const competitorData = stepResults?.competitors

    // Get all competitor domains (user-specified + discovered)
    const competitorDomains = [
      ...audit.competitor_domains,
      ...(competitorData?.competitors?.map((c) => c.domain) ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i) // Unique domains

    // Use trackedKeywords or discoveryKeywords
    const keywords = serpData?.trackedKeywords ?? serpData?.discoveryKeywords ?? []

    if (keywords.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          comparisons: [],
          competitorDomains,
          summary: { totalKeywords: 0, clientRanking: 0, clientTop3: 0 },
          message: 'No keywords available. Run audit first.',
        },
      })
    }

    // Build location name from city/state if available
    const locationName =
      audit.city && audit.state
        ? `${audit.city},${audit.state},United States`
        : 'United States'

    let comparisons

    if (useLiveData && competitorDomains.length > 0) {
      // ============================================================
      // LIVE DATA: Fetch real-time SERP rankings from DataForSEO
      // ============================================================
      console.log('[SERP Comparison] Fetching LIVE data for', keywords.length, 'keywords')

      // Limit to top 10 keywords by search volume for live queries (cost control)
      const topKeywords = [...keywords]
        .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))
        .slice(0, 10)
        .map((kw) => ({
          keyword: kw.keyword,
          searchVolume: kw.searchVolume ?? 0,
          cpc: kw.cpc ?? 0,
        }))

      const liveResults = await getBatchSerpRankings(
        topKeywords,
        audit.domain,
        competitorDomains.slice(0, 3), // Top 3 competitors
        locationName
      )

      comparisons = liveResults.map((result) => ({
        keyword: result.keyword,
        searchVolume: result.searchVolume,
        cpc: result.cpc,
        clientPosition: result.clientPosition,
        competitorPositions: result.competitorPositions,
        positionDiff: calculatePositionDiff(result.clientPosition, result.competitorPositions),
        serpFeatures: result.serpFeatures,
        isLive: true,
      }))
    } else {
      // ============================================================
      // CACHED DATA: Use existing audit step results
      // ============================================================
      comparisons = keywords.map((kw) => {
        const competitorPositions: Record<string, number | null> = {}
        for (const domain of competitorDomains) {
          competitorPositions[domain] = null // No live data
        }

        return {
          keyword: kw.keyword,
          searchVolume: kw.searchVolume ?? 0,
          cpc: kw.cpc ?? 0,
          clientPosition: kw.position ?? null,
          competitorPositions,
          positionDiff: null,
          serpFeatures: [],
          isLive: false,
        }
      })
    }

    // Sort by search volume descending
    comparisons.sort((a, b) => b.searchVolume - a.searchVolume)

    // Calculate summary stats
    const clientRanking = comparisons.filter(
      (c) => c.clientPosition !== null && c.clientPosition <= 10
    ).length
    const clientTop3 = comparisons.filter(
      (c) => c.clientPosition !== null && c.clientPosition <= 3
    ).length

    // Count wins (client ranks higher than all competitors)
    let wins = 0
    let losses = 0
    for (const comp of comparisons) {
      if (comp.clientPosition === null) continue
      const competitorPositions = Object.values(comp.competitorPositions).filter(
        (p): p is number => p !== null
      )
      if (competitorPositions.length === 0) continue

      const bestCompetitor = Math.min(...competitorPositions)
      if (comp.clientPosition < bestCompetitor) {
        wins++
      } else if (comp.clientPosition > bestCompetitor) {
        losses++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clientDomain: audit.domain,
        competitorDomains,
        comparisons,
        summary: {
          totalKeywords: comparisons.length,
          clientRanking,
          clientTop3,
          wins,
          losses,
          ties: comparisons.length - wins - losses,
        },
        isLiveData: useLiveData,
      },
    })
  } catch (error) {
    console.error('[SERP Comparison API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SERP comparison' },
      { status: 500 }
    )
  }
}

/**
 * Calculate position difference between client and best competitor
 */
function calculatePositionDiff(
  clientPosition: number | null,
  competitorPositions: Record<string, number | null>
): number | null {
  if (clientPosition === null) return null

  const competitorValues = Object.values(competitorPositions).filter(
    (p): p is number => p !== null
  )
  if (competitorValues.length === 0) return null

  const bestCompetitor = Math.min(...competitorValues)
  return clientPosition - bestCompetitor // Negative = client is winning
}
