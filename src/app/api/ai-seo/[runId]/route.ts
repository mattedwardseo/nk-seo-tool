/**
 * AI SEO Run Detail API
 * 
 * GET: Get detailed information about a single AI SEO run
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAISeoRun,
  getAISeoResults,
  getPlatformScores,
  type AISeoResult,
} from '@/lib/db/ai-seo-operations'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { runId } = await params

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'Run ID is required' },
        { status: 400 }
      )
    }

    // Get the run
    const run = await getAISeoRun(runId)
    
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    // Verify ownership by checking if domain belongs to user
    const domain = await prisma.domains.findFirst({
      where: {
        id: run.domainId,
        user_id: session.user.id,
      },
    })

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get platform scores
    const platformScores = await getPlatformScores(runId)

    // Get results if completed
    let results: AISeoResult[] = []
    if (run.status === 'COMPLETED') {
      results = await getAISeoResults(runId)
    }

    // Parse recommendations from stored JSON
    let recommendations: { priority: string; category: string; suggestion: string }[] = []
    if (run.status === 'COMPLETED' && run.recommendations) {
      try {
        const parsed = JSON.parse(run.recommendations)
        if (Array.isArray(parsed)) {
          recommendations = parsed
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    // Parse research insights from results (extract from raw_response)
    const researchInsights: Array<{
      keyword: string
      platform: string
      aiAnswer?: string
      citations?: Array<{ url: string; title: string; domain: string }>
      relatedQuestions?: string[]
      competitorMentions?: Array<{ name: string; url?: string }>
    }> = []
    
    if (run.status === 'COMPLETED' && results.length > 0) {
      for (const result of results) {
        if (result.rawResponse) {
          try {
            const parsed = JSON.parse(result.rawResponse)
            if (parsed.aiAnswer || parsed.citations || parsed.relatedQuestions) {
              researchInsights.push({
                keyword: result.keyword,
                platform: result.llmPlatform,
                aiAnswer: parsed.aiAnswer,
                citations: parsed.citations,
                relatedQuestions: parsed.relatedQuestions,
                competitorMentions: parsed.competitorMentions,
              })
            } else if (parsed.aggregated) {
              // This is an aggregated result (all platforms combined)
              researchInsights.push({
                keyword: result.keyword,
                platform: 'all',
                citations: parsed.aggregated.allCitations,
                relatedQuestions: parsed.aggregated.allRelatedQuestions,
                competitorMentions: parsed.aggregated.allCompetitors,
              })
            }
          } catch {
            // Invalid JSON, skip
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        run: {
          id: run.id,
          domainId: run.domainId,
          status: run.status,
          businessName: run.businessName,
          keywords: run.keywords,
          llmPlatforms: run.llmPlatforms,
          visibilityScore: run.visibilityScore,
          totalMentions: run.totalMentions,
          totalCitations: run.totalCitations,
          createdAt: run.createdAt.toISOString(),
          startedAt: run.startedAt?.toISOString() || null,
          completedAt: run.completedAt?.toISOString() || null,
          errorMessage: run.errorMessage,
          recommendations: run.recommendations,
        },
        platformScores: platformScores.map(s => ({
          llmPlatform: s.llmPlatform,
          mentionRate: s.mentionRate,
          citationRate: s.citationRate,
          visibilityScore: s.visibilityScore,
          sentimentScore: s.sentimentScore,
          averagePosition: s.averagePosition,
        })),
        results: results.map(r => ({
          id: r.id,
          keyword: r.keyword,
          llmPlatform: r.llmPlatform,
          isMentioned: r.isMentioned,
          mentionContext: r.mentionContext,
          mentionRank: r.mentionRank,
          isCited: r.isCited,
          citationUrl: r.citationUrl,
          sentiment: r.sentiment,
          competitorMentions: r.competitorMentions,
          rawResponse: r.rawResponse,
        })),
        recommendations,
        researchInsights,
      },
    })
  } catch (error) {
    console.error('Error fetching AI SEO run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI SEO run' },
      { status: 500 }
    )
  }
}

