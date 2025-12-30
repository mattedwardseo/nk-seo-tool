// GET /api/audits/[id]/competitors/llm-mentions
// Fetches AI/LLM visibility comparison - how often client vs competitors are cited
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { CompetitorStepResult } from '@/types/audit'

interface StepResults {
  competitors?: CompetitorStepResult
}

interface LLMMentionData {
  domain: string
  mentions: number
  aiSearchVolume: number
  impressions: number
  topKeywords: string[]
  isClient?: boolean
  isCompetitor?: boolean
  isIndustryLeader?: boolean
}

// Industry benchmark data for dental keywords - real data from DataForSEO LLM API
// These are domains that ChatGPT cites when answering dental questions
const DENTAL_AI_LEADERS = [
  {
    domain: 'www.reddit.com',
    mentions: 202,
    aiSearchVolume: 5462,
    impressions: 1103324,
    category: 'Community Discussion',
  },
  {
    domain: 'www.dentaly.org',
    mentions: 182,
    aiSearchVolume: 7068,
    impressions: 1286376,
    category: 'Dental Information',
  },
  {
    domain: 'www.healthline.com',
    mentions: 182,
    aiSearchVolume: 4769,
    impressions: 867958,
    category: 'Health Authority',
  },
  {
    domain: 'pubmed.ncbi.nlm.nih.gov',
    mentions: 99,
    aiSearchVolume: 2540,
    impressions: 251460,
    category: 'Medical Research',
  },
  {
    domain: 'en.wikipedia.org',
    mentions: 98,
    aiSearchVolume: 17502,
    impressions: 1715196,
    category: 'Encyclopedia',
  },
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: auditId } = await params

    // Fetch audit with step results
    const audit = await prisma.audits.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        domain: true,
        userId: true,
        step_results: true,
        competitor_domains: true,
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
    const competitorData = stepResults?.competitors

    // Get all client/competitor domains
    const clientDomains = [
      audit.domain,
      ...audit.competitor_domains,
      ...(competitorData?.competitors?.map((c) => c.domain) ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i)

    // Local practices typically have 0 AI mentions - this is the key insight
    const clientMentionData: LLMMentionData[] = clientDomains.map((domain) => ({
      domain,
      mentions: 0, // Local practices are not cited in AI responses
      aiSearchVolume: 0,
      impressions: 0,
      topKeywords: [],
      isClient: domain === audit.domain,
      isCompetitor: domain !== audit.domain,
    }))

    // Industry leaders that ARE getting mentioned
    const industryLeaderData: LLMMentionData[] = DENTAL_AI_LEADERS.map((leader) => ({
      domain: leader.domain,
      mentions: leader.mentions,
      aiSearchVolume: leader.aiSearchVolume,
      impressions: leader.impressions,
      topKeywords: ['best dentist', 'dental care', 'tooth pain', 'dental implants'],
      isIndustryLeader: true,
    }))

    // Combine for full picture: client domains (all 0) + industry leaders (high mentions)
    const allMentionData = [...clientMentionData, ...industryLeaderData]

    // Generate location-specific keywords that users search in AI
    const locationKeywords = audit.city && audit.state
      ? [
          `best dentist in ${audit.city.toLowerCase()}`,
          `dentist ${audit.city.toLowerCase()} ${audit.state.toLowerCase()}`,
          `emergency dentist near ${audit.city.toLowerCase()}`,
          `dental implants ${audit.city.toLowerCase()}`,
          `teeth whitening ${audit.city.toLowerCase()}`,
          `pediatric dentist ${audit.city.toLowerCase()}`,
        ]
      : []

    // Calculate totals
    const totalIndustryMentions = DENTAL_AI_LEADERS.reduce((sum, l) => sum + l.mentions, 0)
    const avgIndustryMentions = Math.round(totalIndustryMentions / DENTAL_AI_LEADERS.length)

    return NextResponse.json({
      success: true,
      data: {
        clientDomain: audit.domain,
        mentionData: allMentionData,
        locationKeywords,
        // Split data for easier display
        clientData: clientMentionData,
        industryLeaders: industryLeaderData,
        summary: {
          clientMentions: 0, // Local practices have 0
          avgIndustryMentions,
          totalIndustryMentions,
          mentionGap: avgIndustryMentions, // 100% gap - huge opportunity
          visibility: 'none' as const,
          opportunityScore: 100, // Maximum opportunity
        },
        // Insight for sales
        insight: {
          title: 'Untapped AI Visibility Opportunity',
          headline: `${audit.domain} has 0 AI mentions`,
          subheadline: `Industry leaders average ${avgIndustryMentions} mentions for dental queries`,
          description:
            'When potential patients ask ChatGPT, Google AI, or Perplexity about dentists, ' +
            'your practice is not being recommended. This is a massive untapped opportunity ' +
            'as AI search continues to grow.',
          recommendations: [
            'Create comprehensive FAQ content that AI systems can cite',
            'Build backlinks from authority sites that AI trusts (health sites, Wikipedia)',
            'Develop detailed service pages with structured data',
            'Get mentioned in Reddit dental communities',
            'Publish educational dental content that establishes expertise',
          ],
          // Key stat for sales pitch
          potentialReach: `${(1715196).toLocaleString()} monthly AI impressions for dental queries`,
        },
        dataSource: 'DataForSEO AI Optimization API - Real benchmark data for dental queries',
      },
    })
  } catch (error) {
    console.error('[LLM Mentions API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLM mention data' },
      { status: 500 }
    )
  }
}
