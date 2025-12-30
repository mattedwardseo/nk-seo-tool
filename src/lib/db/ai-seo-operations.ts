/**
 * AI SEO Database Operations
 * 
 * Handles CRUD operations for AI SEO visibility tracking
 */

import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'
import type { AISeoRunStatus, AISeoSentiment } from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface CreateAISeoRunInput {
  domainId: string
  userId: string
  businessName: string
  keywords: string[]
  llmPlatforms?: string[]
}

export interface AISeoRunSummary {
  id: string
  domainId: string
  status: AISeoRunStatus
  businessName: string
  keywords: string[]
  llmPlatforms: string[]
  visibilityScore: number | null
  totalMentions: number
  totalCitations: number
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  errorMessage: string | null
  recommendations: string | null
}

export interface AISeoResultInput {
  runId: string
  keyword: string
  llmPlatform: string
  isMentioned: boolean
  mentionContext?: string | null
  mentionRank?: number | null
  isCited: boolean
  citationUrl?: string | null
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  competitorMentions?: string[]
  rawResponse?: string | null
}

export interface AISeoResult {
  id: string
  runId: string
  keyword: string
  llmPlatform: string
  isMentioned: boolean
  mentionContext: string | null
  mentionRank: number | null
  isCited: boolean
  citationUrl: string | null
  sentiment: AISeoSentiment
  competitorMentions: string[] | null
  rawResponse: string | null
  createdAt: Date
}

export interface AIPlatformScore {
  llmPlatform: string
  mentionRate: number
  averagePosition: number | null
  sentimentScore: number
  citationRate: number
  visibilityScore: number
}

// ============================================================================
// Run Operations
// ============================================================================

/**
 * Create a new AI SEO run
 */
export async function createAISeoRun(input: CreateAISeoRunInput): Promise<string> {
  const id = createId()
  
  await prisma.ai_seo_runs.create({
    data: {
      id,
      domain_id: input.domainId,
      user_id: input.userId,
      business_name: input.businessName,
      keywords: input.keywords,
      llm_platforms: input.llmPlatforms || ['chatgpt', 'gemini', 'perplexity'],
      status: 'PENDING',
    },
  })
  
  return id
}

/**
 * Get an AI SEO run by ID
 */
export async function getAISeoRun(runId: string): Promise<AISeoRunSummary | null> {
  const run = await prisma.ai_seo_runs.findUnique({
    where: { id: runId },
  })
  
  if (!run) return null
  
  return {
    id: run.id,
    domainId: run.domain_id,
    status: run.status,
    businessName: run.business_name,
    keywords: run.keywords,
    llmPlatforms: run.llm_platforms,
    visibilityScore: run.visibility_score,
    totalMentions: run.total_mentions || 0,
    totalCitations: run.total_citations || 0,
    createdAt: run.created_at,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    errorMessage: run.error_message,
  }
}

/**
 * Get AI SEO runs for a domain
 */
export async function getAISeoRunsForDomain(
  domainId: string,
  limit = 10
): Promise<AISeoRunSummary[]> {
  const runs = await prisma.ai_seo_runs.findMany({
    where: { domain_id: domainId },
    orderBy: { created_at: 'desc' },
    take: limit,
  })
  
  return runs.map((run) => ({
    id: run.id,
    domainId: run.domain_id,
    status: run.status,
    businessName: run.business_name,
    keywords: run.keywords,
    llmPlatforms: run.llm_platforms,
    visibilityScore: run.visibility_score,
    totalMentions: run.total_mentions || 0,
    totalCitations: run.total_citations || 0,
    createdAt: run.created_at,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    errorMessage: run.error_message,
    recommendations: run.recommendations,
  }))
}

/**
 * Update AI SEO run status
 */
export async function updateAISeoRunStatus(
  runId: string,
  status: AISeoRunStatus,
  extra?: {
    startedAt?: Date
    completedAt?: Date
    errorMessage?: string
    visibilityScore?: number
    totalMentions?: number
    totalCitations?: number
  }
): Promise<void> {
  const updateData: Record<string, unknown> = { status }
  
  if (status === 'RUNNING') {
    updateData.started_at = new Date()
  }
  
  if (extra?.startedAt) updateData.started_at = extra.startedAt
  if (extra?.completedAt) updateData.completed_at = extra.completedAt
  if (extra?.errorMessage) updateData.error_message = extra.errorMessage
  if (extra?.visibilityScore !== undefined) updateData.visibility_score = extra.visibilityScore
  if (extra?.totalMentions !== undefined) updateData.total_mentions = extra.totalMentions
  if (extra?.totalCitations !== undefined) updateData.total_citations = extra.totalCitations

  await prisma.ai_seo_runs.update({
    where: { id: runId },
    data: updateData,
  })
}

/**
 * Complete an AI SEO run with final results
 */
export async function completeAISeoRun(
  runId: string,
  results: {
    visibilityScore: number
    totalMentions: number
    totalCitations: number
    recommendations?: string
  }
): Promise<void> {
  await prisma.ai_seo_runs.update({
    where: { id: runId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date(),
      visibility_score: results.visibilityScore,
      total_mentions: results.totalMentions,
      total_citations: results.totalCitations,
      recommendations: results.recommendations,
    },
  })
}

/**
 * Mark an AI SEO run as failed
 */
export async function failAISeoRun(
  runId: string,
  errorMessage: string
): Promise<void> {
  await prisma.ai_seo_runs.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      completed_at: new Date(),
      error_message: errorMessage,
    },
  })
}

// ============================================================================
// Results Operations
// ============================================================================

export interface CreateAISeoResultInput {
  runId: string
  llmPlatform: string
  keyword: string | null
  mentionRate: number
  citationRate: number
  visibilityScore: number
  sentimentScore: number
  impressions: number
  mentionsCount: number
  rawResponse?: string
}

/**
 * Create an AI SEO result (new format with aggregated metrics)
 */
export async function createAISeoResult(input: CreateAISeoResultInput): Promise<string> {
  const id = createId()
  
  await prisma.ai_seo_results.create({
    data: {
      id,
      run_id: input.runId,
      keyword: input.keyword || '',
      llm_platform: input.llmPlatform,
      is_mentioned: input.mentionsCount > 0,
      mention_context: null,
      mention_rank: null,
      is_cited: input.citationRate > 0,
      citation_url: null,
      sentiment: 'NEUTRAL',
      competitor_mentions: null,
      raw_response: input.rawResponse,
    },
  })
  
  // Also store in platform scores if this is an aggregate result
  if (!input.keyword) {
    await prisma.ai_seo_platform_scores.upsert({
      where: {
        run_id_llm_platform: {
          run_id: input.runId,
          llm_platform: input.llmPlatform,
        },
      },
      create: {
        id: createId(),
        run_id: input.runId,
        llm_platform: input.llmPlatform,
        mention_rate: input.mentionRate,
        average_position: null,
        sentiment_score: input.sentimentScore,
        citation_rate: input.citationRate,
        visibility_score: input.visibilityScore,
      },
      update: {
        mention_rate: input.mentionRate,
        sentiment_score: input.sentimentScore,
        citation_rate: input.citationRate,
        visibility_score: input.visibilityScore,
      },
    })
  }
  
  return id
}

/**
 * Add a result to an AI SEO run (legacy format)
 */
export async function addAISeoResult(input: AISeoResultInput): Promise<string> {
  const id = createId()
  
  await prisma.ai_seo_results.create({
    data: {
      id,
      run_id: input.runId,
      keyword: input.keyword,
      llm_platform: input.llmPlatform,
      is_mentioned: input.isMentioned,
      mention_context: input.mentionContext,
      mention_rank: input.mentionRank,
      is_cited: input.isCited,
      citation_url: input.citationUrl,
      sentiment: input.sentiment,
      competitor_mentions: input.competitorMentions || null,
      raw_response: input.rawResponse,
    },
  })
  
  return id
}

/**
 * Get results for an AI SEO run
 */
export async function getAISeoResults(runId: string): Promise<AISeoResult[]> {
  const results = await prisma.ai_seo_results.findMany({
    where: { run_id: runId },
    orderBy: [
      { keyword: 'asc' },
      { llm_platform: 'asc' },
    ],
  })
  
  return results.map((r) => ({
    id: r.id,
    runId: r.run_id,
    keyword: r.keyword,
    llmPlatform: r.llm_platform,
    isMentioned: r.is_mentioned,
    mentionContext: r.mention_context,
    mentionRank: r.mention_rank,
    isCited: r.is_cited,
    citationUrl: r.citation_url,
    sentiment: r.sentiment,
    competitorMentions: r.competitor_mentions as string[] | null,
    rawResponse: r.raw_response,
    createdAt: r.created_at,
  }))
}

/**
 * Get results grouped by keyword
 */
export async function getAISeoResultsByKeyword(
  runId: string
): Promise<Map<string, AISeoResult[]>> {
  const results = await getAISeoResults(runId)
  const grouped = new Map<string, AISeoResult[]>()
  
  for (const result of results) {
    const existing = grouped.get(result.keyword) || []
    existing.push(result)
    grouped.set(result.keyword, existing)
  }
  
  return grouped
}

// ============================================================================
// Platform Scores Operations
// ============================================================================

/**
 * Update or create platform scores for a run
 */
export async function upsertPlatformScores(
  runId: string,
  scores: AIPlatformScore[]
): Promise<void> {
  for (const score of scores) {
    const id = createId()
    
    await prisma.ai_seo_platform_scores.upsert({
      where: {
        run_id_llm_platform: {
          run_id: runId,
          llm_platform: score.llmPlatform,
        },
      },
      create: {
        id,
        run_id: runId,
        llm_platform: score.llmPlatform,
        mention_rate: score.mentionRate,
        average_position: score.averagePosition,
        sentiment_score: score.sentimentScore,
        citation_rate: score.citationRate,
        visibility_score: score.visibilityScore,
      },
      update: {
        mention_rate: score.mentionRate,
        average_position: score.averagePosition,
        sentiment_score: score.sentimentScore,
        citation_rate: score.citationRate,
        visibility_score: score.visibilityScore,
      },
    })
  }
}

/**
 * Get platform scores for a run
 */
export async function getPlatformScores(runId: string): Promise<AIPlatformScore[]> {
  const scores = await prisma.ai_seo_platform_scores.findMany({
    where: { run_id: runId },
    orderBy: { llm_platform: 'asc' },
  })
  
  return scores.map((s) => ({
    llmPlatform: s.llm_platform,
    mentionRate: Number(s.mention_rate),
    averagePosition: s.average_position ? Number(s.average_position) : null,
    sentimentScore: Number(s.sentiment_score),
    citationRate: Number(s.citation_rate),
    visibilityScore: s.visibility_score,
  }))
}

// ============================================================================
// Competitor Operations
// ============================================================================

/**
 * Add or update an AI SEO competitor
 */
export async function upsertAISeoCompetitor(
  domainId: string,
  competitorName: string,
  competitorDomain?: string
): Promise<string> {
  const id = createId()
  
  const result = await prisma.ai_seo_competitors.upsert({
    where: {
      domain_id_competitor_name: {
        domain_id: domainId,
        competitor_name: competitorName,
      },
    },
    create: {
      id,
      domain_id: domainId,
      competitor_name: competitorName,
      competitor_domain: competitorDomain,
    },
    update: {
      competitor_domain: competitorDomain,
    },
  })
  
  return result.id
}

/**
 * Get AI SEO competitors for a domain
 */
export async function getAISeoCompetitors(domainId: string): Promise<{
  id: string
  competitorName: string
  competitorDomain: string | null
  lastVisibilityScore: number | null
  lastUpdated: Date | null
}[]> {
  const competitors = await prisma.ai_seo_competitors.findMany({
    where: { domain_id: domainId },
    orderBy: { competitor_name: 'asc' },
  })
  
  return competitors.map((c) => ({
    id: c.id,
    competitorName: c.competitor_name,
    competitorDomain: c.competitor_domain,
    lastVisibilityScore: c.last_visibility_score,
    lastUpdated: c.last_updated,
  }))
}

/**
 * Delete an AI SEO competitor
 */
export async function deleteAISeoCompetitor(competitorId: string): Promise<void> {
  await prisma.ai_seo_competitors.delete({
    where: { id: competitorId },
  })
}

// ============================================================================
// Analytics & Aggregation
// ============================================================================

/**
 * Calculate visibility score from results
 */
export function calculateVisibilityScoreFromResults(results: AISeoResult[]): number {
  if (results.length === 0) return 0
  
  let score = 0
  const weights = {
    mention: 35,
    position: 25,
    sentiment: 20,
    citation: 20,
  }
  
  // Mention rate
  const mentionCount = results.filter((r) => r.isMentioned).length
  const mentionRate = mentionCount / results.length
  score += mentionRate * weights.mention
  
  // Position score (lower is better)
  const mentionedResults = results.filter((r) => r.isMentioned && r.mentionRank !== null)
  if (mentionedResults.length > 0) {
    const avgPosition = mentionedResults.reduce((sum, r) => sum + (r.mentionRank || 0), 0) / mentionedResults.length
    const positionScore = Math.max(0, 1 - (avgPosition - 1) / 9)
    score += positionScore * weights.position
  }
  
  // Sentiment score
  let sentimentTotal = 0
  for (const r of results.filter((r) => r.isMentioned)) {
    if (r.sentiment === 'POSITIVE') sentimentTotal += 1
    else if (r.sentiment === 'NEUTRAL') sentimentTotal += 0.5
    // NEGATIVE = 0
  }
  const sentimentScore = results.filter((r) => r.isMentioned).length > 0
    ? sentimentTotal / results.filter((r) => r.isMentioned).length
    : 0.5
  score += sentimentScore * weights.sentiment
  
  // Citation rate
  const citationCount = results.filter((r) => r.isCited).length
  const citationRate = citationCount / results.length
  score += citationRate * weights.citation
  
  return Math.round(score)
}

/**
 * Get latest visibility score for a domain
 */
export async function getLatestVisibilityScore(domainId: string): Promise<number | null> {
  const latestRun = await prisma.ai_seo_runs.findFirst({
    where: {
      domain_id: domainId,
      status: 'COMPLETED',
    },
    orderBy: { completed_at: 'desc' },
    select: { visibility_score: true },
  })
  
  return latestRun?.visibility_score ?? null
}

/**
 * Get visibility trend for a domain
 */
export async function getVisibilityTrend(
  domainId: string,
  limit = 10
): Promise<{ date: Date; score: number }[]> {
  const runs = await prisma.ai_seo_runs.findMany({
    where: {
      domain_id: domainId,
      status: 'COMPLETED',
      visibility_score: { not: null },
    },
    orderBy: { completed_at: 'desc' },
    take: limit,
    select: {
      completed_at: true,
      visibility_score: true,
    },
  })
  
  return runs
    .filter((r) => r.completed_at && r.visibility_score !== null)
    .map((r) => ({
      date: r.completed_at!,
      score: r.visibility_score!,
    }))
    .reverse()
}

