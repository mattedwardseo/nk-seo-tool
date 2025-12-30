/**
 * AI SEO API Routes
 * 
 * GET: Fetch AI SEO runs for a domain
 * POST: Create a new AI SEO analysis run
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createAISeoRun,
  getAISeoRunsForDomain,
  getPlatformScores,
  getLatestVisibilityScore,
} from '@/lib/db/ai-seo-operations'
import { inngest } from '@/lib/inngest'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    // Get runs for the domain
    const runs = await getAISeoRunsForDomain(domainId, 10)

    // Get platform scores from latest completed run
    let platformScores: {
      platform: string
      mentionRate: number
      citationRate: number
      visibilityScore: number
      sentimentScore: number
    }[] = []

    const latestCompletedRun = runs.find(r => r.status === 'COMPLETED')
    if (latestCompletedRun) {
      const scores = await getPlatformScores(latestCompletedRun.id)
      platformScores = scores.map(s => ({
        platform: s.llmPlatform,
        mentionRate: s.mentionRate,
        citationRate: s.citationRate,
        visibilityScore: s.visibilityScore,
        sentimentScore: s.sentimentScore,
      }))
    }

    // Get latest visibility score
    const visibilityScore = await getLatestVisibilityScore(domainId)

    return NextResponse.json({
      success: true,
      data: {
        runs: runs.map(run => ({
          id: run.id,
          status: run.status,
          businessName: run.businessName,
          keywords: run.keywords,
          llmPlatforms: run.llmPlatforms,
          visibilityScore: run.visibilityScore,
          totalMentions: run.totalMentions,
          totalCitations: run.totalCitations,
          createdAt: run.createdAt.toISOString(),
          completedAt: run.completedAt?.toISOString() || null,
        })),
        platformScores,
        latestVisibilityScore: visibilityScore,
      },
    })
  } catch (error) {
    console.error('Error fetching AI SEO data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI SEO data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domainId, businessName, keywords, llmPlatforms } = body

    // Validate required fields
    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      )
    }

    if (!businessName || typeof businessName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one keyword is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(llmPlatforms) || llmPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one LLM platform is required' },
        { status: 400 }
      )
    }

    // Get domain info for the analysis (including location)
    const domainRecord = await prisma.domains.findUnique({
      where: { id: domainId },
      select: { 
        domain: true,
        city: true,
        state: true,
      },
    })

    if (!domainRecord) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Create the run
    let runId: string
    try {
      runId = await createAISeoRun({
        domainId,
        userId: session.user.id,
        businessName,
        keywords,
        llmPlatforms,
      })
    } catch (dbError) {
      console.error('Database error creating AI SEO run:', dbError)
      const msg = dbError instanceof Error ? dbError.message : 'Database error'
      return NextResponse.json(
        { success: false, error: `Database error: ${msg}` },
        { status: 500 }
      )
    }

    // Map platform names to DataForSEO format
    // LLM Mentions API only supports 'google' and 'chat_gpt'
    // Filter and normalize platform names
    const mappedPlatforms = llmPlatforms
      .map((p: string) => {
        const normalized = p.toLowerCase()
        if (normalized === 'chatgpt' || normalized === 'chat_gpt') return 'chat_gpt' as const
        if (normalized === 'google' || normalized === 'google ai overview') return 'google' as const
        return null
      })
      .filter((p): p is 'chat_gpt' | 'google' => p !== null)
    
    // If no valid platforms after mapping, return error
    if (mappedPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one supported LLM platform is required (google or chatgpt)' },
        { status: 400 }
      )
    }

    // Trigger the Inngest function to process the analysis
    try {
      await inngest.send({
        name: 'ai-seo/analysis.start',
        data: {
          runId,
          domainId,
          domain: domainRecord.domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''),
          businessName,
          keywords,
          llmPlatforms: mappedPlatforms,
          city: domainRecord.city || undefined,
          state: domainRecord.state || undefined,
          locationCode: 2840, // US - can be enhanced to map city/state to location codes later
        },
      })
    } catch (inngestError) {
      console.error('Inngest error:', inngestError)
      // Still return success since the run was created - it just won't process automatically
    }

    return NextResponse.json({
      success: true,
      data: {
        id: runId,
        message: 'AI SEO analysis started. Processing will complete in 1-2 minutes.',
      },
    })
  } catch (error) {
    console.error('Error creating AI SEO run:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to create AI SEO analysis: ${errorMessage}` },
      { status: 500 }
    )
  }
}

