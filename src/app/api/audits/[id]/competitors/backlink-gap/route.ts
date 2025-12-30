// GET /api/audits/[id]/competitors/backlink-gap
// Fetches LIVE backlink gap analysis - domains linking to competitors but not client
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBacklinkGap } from '@/lib/competitors'
import type { BacklinksStepResult, CompetitorStepResult } from '@/types/audit'

interface StepResults {
  backlinks?: BacklinksStepResult
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
      },
    })

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 })
    }

    if (audit.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const stepResults = audit.step_results as StepResults | null
    const backlinksData = stepResults?.backlinks
    const competitorData = stepResults?.competitors

    // Get all competitor domains
    const allCompetitorDomains = [
      ...audit.competitor_domains,
      ...(competitorData?.competitors?.map((c) => c.domain) ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i)

    // Client backlink stats from audit data
    const clientBacklinks = backlinksData?.totalBacklinks ?? 0
    const clientReferringDomains = backlinksData?.referringDomains ?? 0

    // Build competitor stats from existing data
    const competitorStats = allCompetitorDomains.map((domain) => {
      const compData = competitorData?.competitors?.find((c) => c.domain === domain)
      return {
        domain,
        backlinks: compData?.backlinks ?? null,
        referringDomains: compData?.referringDomains ?? null,
        rank: compData?.rank ?? null,
      }
    })

    // Calculate averages
    const competitorsWithData = competitorStats.filter((c) => c.backlinks !== null)
    const avgCompetitorBacklinks =
      competitorsWithData.length > 0
        ? Math.round(
            competitorsWithData.reduce((sum, c) => sum + (c.backlinks ?? 0), 0) /
              competitorsWithData.length
          )
        : 0
    const avgCompetitorReferringDomains =
      competitorsWithData.length > 0
        ? Math.round(
            competitorsWithData.reduce((sum, c) => sum + (c.referringDomains ?? 0), 0) /
              competitorsWithData.length
          )
        : 0

    let gapDomains: Array<{
      domain: string
      backlinks: number
      referringDomains: number
      rank: number
      spamScore: number
      linksToCompetitors: string[]
    }> = []

    if (useLiveData && allCompetitorDomains.length > 0) {
      // ============================================================
      // LIVE DATA: Fetch real-time backlink gap from DataForSEO
      // ============================================================
      console.log('[Backlink Gap] Fetching LIVE data for', allCompetitorDomains.length, 'competitors')

      try {
        gapDomains = await getBacklinkGap(
          audit.domain,
          allCompetitorDomains.slice(0, 5), // Top 5 competitors
          20 // Top 20 gap opportunities
        )

        // Filter out spammy domains (spam score > 50)
        gapDomains = gapDomains.filter((d) => d.spamScore < 50)
      } catch (error) {
        console.error('[Backlink Gap] Live API error:', error)
        // Continue with empty gap data
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clientDomain: audit.domain,
        clientBacklinks,
        clientReferringDomains,
        competitors: competitorStats,
        gapDomains,
        summary: {
          totalGapDomains: gapDomains.length,
          avgCompetitorBacklinks,
          avgCompetitorReferringDomains,
          backlinkGap: avgCompetitorBacklinks - clientBacklinks,
          referringDomainGap: avgCompetitorReferringDomains - clientReferringDomains,
          // Opportunity score: higher = more opportunity
          opportunityScore: calculateOpportunityScore(
            clientBacklinks,
            clientReferringDomains,
            avgCompetitorBacklinks,
            avgCompetitorReferringDomains,
            gapDomains.length
          ),
        },
        isLiveData: useLiveData && gapDomains.length > 0,
        recommendations: generateBacklinkRecommendations(
          clientBacklinks,
          avgCompetitorBacklinks,
          gapDomains
        ),
      },
    })
  } catch (error) {
    console.error('[Backlink Gap API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backlink gap data' },
      { status: 500 }
    )
  }
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(
  clientBacklinks: number,
  clientReferringDomains: number,
  avgCompetitorBacklinks: number,
  avgCompetitorReferringDomains: number,
  gapDomainsCount: number
): number {
  // Base score from backlink gap
  const backlinkRatio =
    avgCompetitorBacklinks > 0 ? clientBacklinks / avgCompetitorBacklinks : 1
  const domainRatio =
    avgCompetitorReferringDomains > 0 ? clientReferringDomains / avgCompetitorReferringDomains : 1

  // Lower ratios = more opportunity
  const ratioScore = Math.max(0, 100 - (backlinkRatio + domainRatio) * 25)

  // Add bonus for gap domains found
  const gapBonus = Math.min(30, gapDomainsCount * 1.5)

  return Math.round(Math.min(100, ratioScore + gapBonus))
}

/**
 * Generate actionable recommendations
 */
function generateBacklinkRecommendations(
  clientBacklinks: number,
  avgCompetitorBacklinks: number,
  gapDomains: Array<{ domain: string; rank: number; linksToCompetitors: string[] }>
): string[] {
  const recommendations: string[] = []

  const gap = avgCompetitorBacklinks - clientBacklinks
  if (gap > 100) {
    recommendations.push(
      `You have ${gap.toLocaleString()} fewer backlinks than your average competitor. Focus on link building.`
    )
  } else if (gap > 0) {
    recommendations.push(
      `You're ${gap.toLocaleString()} backlinks behind competitors. A targeted campaign can close this gap.`
    )
  } else {
    recommendations.push(
      `Great job! You have more backlinks than your average competitor. Focus on quality over quantity.`
    )
  }

  // Find high-authority gap domains
  const highAuthorityGaps = gapDomains.filter((d) => d.rank > 50).slice(0, 3)
  if (highAuthorityGaps.length > 0) {
    recommendations.push(
      `Target these high-authority domains that link to competitors: ${highAuthorityGaps.map((d) => d.domain).join(', ')}`
    )
  }

  // Find domains linking to multiple competitors
  const multiCompetitorDomains = gapDomains
    .filter((d) => d.linksToCompetitors.length >= 2)
    .slice(0, 3)
  if (multiCompetitorDomains.length > 0) {
    recommendations.push(
      `These sites link to multiple competitors and may be industry directories: ${multiCompetitorDomains.map((d) => d.domain).join(', ')}`
    )
  }

  return recommendations
}
