// GET /api/audits/[id]/competitors - Get full competitor comparison data
// Includes competitor discovery using DataForSEO Labs API
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { discoverCompetitors, getHistoricalRankOverview } from '@/lib/competitors'
import type { CompetitorStepResult, SerpStepResult } from '@/types/audit'

interface StepResults {
  competitors?: CompetitorStepResult
  serp?: SerpStepResult
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
        status: true,
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

    // Verify user owns this audit
    if (audit.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const stepResults = audit.step_results as StepResults | null
    const competitorData = stepResults?.competitors ?? null
    const serpData = stepResults?.serp ?? null

    // Get keyword rankings for client domain from SERP data
    const clientKeywordRankings: Array<{
      keyword: string
      position: number | null
      searchVolume: number
      cpc: number
    }> = []

    const keywords = serpData?.trackedKeywords ?? serpData?.discoveryKeywords ?? []
    for (const kw of keywords) {
      clientKeywordRankings.push({
        keyword: kw.keyword,
        position: kw.position ?? null,
        searchVolume: kw.searchVolume ?? 0,
        cpc: kw.cpc ?? 0,
      })
    }

    // Build location name from city/state if available
    const locationName =
      audit.city && audit.state
        ? `${audit.city},${audit.state},United States`
        : 'United States'

    // Combine user-specified and discovered competitors
    let allCompetitors = [
      ...audit.competitor_domains.map((domain) => ({
        domain,
        rank: null as number | null,
        backlinks: null as number | null,
        referringDomains: null as number | null,
        organicTraffic: null as number | null,
        etv: null as number | null,
        intersections: null as number | null,
        isAutoDetected: false,
      })),
      ...(competitorData?.competitors ?? []).map((c) => ({
        domain: c.domain,
        rank: c.rank,
        backlinks: c.backlinks,
        referringDomains: c.referringDomains,
        organicTraffic: c.organicTraffic,
        etv: c.trafficValue,
        intersections: null as number | null,
        isAutoDetected: true,
      })),
    ]

    // Deduplicate by domain
    const seenDomains = new Set<string>()
    allCompetitors = allCompetitors.filter((c) => {
      if (seenDomains.has(c.domain)) return false
      seenDomains.add(c.domain)
      return true
    })

    // Live competitor discovery
    let discoveredCompetitors: Array<{
      domain: string
      avgPosition: number
      intersections: number
      etv: number
      organicTraffic: number
    }> = []

    let historicalTrend: Array<{
      date: string
      organicTraffic: number
      etv: number
      keywordsRanking: number
    }> = []

    if (useLiveData) {
      // ============================================================
      // LIVE DATA: Discover competitors using DataForSEO Labs
      // ============================================================
      console.log('[Competitors] Fetching LIVE competitor discovery for', audit.domain)

      try {
        const discovered = await discoverCompetitors(audit.domain, locationName, 10)
        discoveredCompetitors = discovered.map((c) => ({
          domain: c.domain,
          avgPosition: c.avgPosition,
          intersections: c.intersections,
          etv: c.etv,
          organicTraffic: c.organicTraffic,
        }))

        // Merge discovered competitors into the main list
        for (const disc of discoveredCompetitors) {
          const existing = allCompetitors.find((c) => c.domain === disc.domain)
          if (existing) {
            // Update with live data
            existing.etv = disc.etv
            existing.organicTraffic = disc.organicTraffic
            existing.intersections = disc.intersections
          } else {
            // Add new competitor
            allCompetitors.push({
              domain: disc.domain,
              rank: null,
              backlinks: null,
              referringDomains: null,
              organicTraffic: disc.organicTraffic,
              etv: disc.etv,
              intersections: disc.intersections,
              isAutoDetected: true,
            })
          }
        }
      } catch (error) {
        console.error('[Competitors] Discovery error:', error)
      }

      // ============================================================
      // LIVE DATA: Get historical rank overview
      // ============================================================
      try {
        const history = await getHistoricalRankOverview(audit.domain, locationName)
        historicalTrend = history.slice(0, 12).map((h) => ({
          date: h.date,
          organicTraffic: h.organicTraffic,
          etv: h.etv,
          keywordsRanking: h.keywordsRanking,
        }))
      } catch (error) {
        console.error('[Competitors] Historical data error:', error)
      }
    }

    // Sort competitors by ETV (estimated traffic value)
    allCompetitors.sort((a, b) => (b.etv ?? 0) - (a.etv ?? 0))

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        audit: {
          id: audit.id,
          domain: audit.domain,
          status: audit.status,
          city: audit.city,
          state: audit.state,
        },
        competitors: allCompetitors,
        discoveredCompetitors,
        historicalTrend,
        competitorDomains: audit.competitor_domains,
        targetKeywords: audit.target_keywords,
        clientKeywordRankings,
        summary: {
          competitorCount: allCompetitors.length,
          avgCompetitorRank:
            allCompetitors.filter((c) => c.rank !== null).length > 0
              ? Math.round(
                  allCompetitors
                    .filter((c) => c.rank !== null)
                    .reduce((sum, c) => sum + (c.rank ?? 0), 0) /
                    allCompetitors.filter((c) => c.rank !== null).length
                )
              : null,
          avgCompetitorBacklinks:
            allCompetitors.filter((c) => c.backlinks !== null).length > 0
              ? Math.round(
                  allCompetitors
                    .filter((c) => c.backlinks !== null)
                    .reduce((sum, c) => sum + (c.backlinks ?? 0), 0) /
                    allCompetitors.filter((c) => c.backlinks !== null).length
                )
              : null,
          totalKeywordsTracked: clientKeywordRankings.length,
        },
        isLiveData: useLiveData,
      },
    })
  } catch (error) {
    console.error('[Competitors API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competitor data' },
      { status: 500 }
    )
  }
}
