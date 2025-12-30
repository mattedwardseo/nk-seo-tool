/**
 * Keyword Optimization Audit Database Operations
 *
 * CRUD operations for keyword_optimization_audits table
 */

import { prisma } from '@/lib/prisma'
import type { KeywordAuditStatus } from '@prisma/client'
import type { KeywordOptimizationData } from '@/lib/seo/keyword-optimization-service'
import type { KeywordOptimizationReport } from '@/lib/seo/report-generator'

export interface CreateKeywordAuditInput {
  userId: string
  domainId?: string
  url: string
  targetKeyword: string
  locationName?: string
  languageCode?: string
}

export interface KeywordAuditSummary {
  id: string
  url: string
  targetKeyword: string
  locationName: string | null
  status: KeywordAuditStatus
  overallScore: number | null
  currentPosition: number | null
  searchVolume: number | null
  keywordDifficulty: number | null
  apiCost: number | null
  createdAt: Date
  completedAt: Date | null
}

export interface KeywordAuditDetail extends KeywordAuditSummary {
  domainId: string | null
  userId: string
  languageCode: string
  errorMessage: string | null
  titleScore: number | null
  metaScore: number | null
  headingScore: number | null
  contentScore: number | null
  internalLinksScore: number | null
  domainRank: number | null
  referringDomains: number | null
  reportMarkdown: string | null
  reportData: KeywordOptimizationReport | null
  rankedKeywordsData: unknown
  serpData: unknown
  backlinksData: unknown
  keywordSuggestions: unknown
  startedAt: Date | null
}

/**
 * Create a new keyword optimization audit
 */
export async function createKeywordAudit(input: CreateKeywordAuditInput): Promise<string> {
  const audit = await prisma.keyword_optimization_audits.create({
    data: {
      user_id: input.userId,
      domain_id: input.domainId,
      url: input.url,
      target_keyword: input.targetKeyword,
      location_name: input.locationName,
      language_code: input.languageCode ?? 'en',
      status: 'PENDING',
    },
    select: { id: true },
  })

  return audit.id
}

/**
 * Update audit status
 */
export async function updateKeywordAuditStatus(
  auditId: string,
  status: KeywordAuditStatus,
  errorMessage?: string
): Promise<void> {
  const updateData: {
    status: KeywordAuditStatus
    error_message?: string
    started_at?: Date
    completed_at?: Date
  } = { status }

  if (status === 'ANALYZING') {
    updateData.started_at = new Date()
  }

  if (status === 'COMPLETED' || status === 'FAILED') {
    updateData.completed_at = new Date()
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  await prisma.keyword_optimization_audits.update({
    where: { id: auditId },
    data: updateData,
  })
}

/**
 * Save the gathered data from DataForSEO
 */
export async function saveKeywordAuditData(
  auditId: string,
  data: KeywordOptimizationData
): Promise<void> {
  await prisma.keyword_optimization_audits.update({
    where: { id: auditId },
    data: {
      // Store raw API data
      ranked_keywords_data: data.rankedKeywords as unknown as object,
      serp_data: {
        serpFeatures: data.serpFeatures,
        topCompetitors: data.topCompetitors,
      },
      backlinks_data: {
        referringDomains: data.referringDomains,
        backlinks: data.backlinks,
        spamScore: data.spamScore,
      },
      keyword_suggestions: data.keywordOpportunities as unknown as object,

      // Store key metrics for filtering/sorting
      current_position: data.currentPosition,
      search_volume: data.searchVolume,
      keyword_difficulty: data.keywordDifficulty,
      domain_rank: data.domainRank,
      referring_domains: data.referringDomains,
      api_cost: data.apiCost,
    },
  })
}

/**
 * Save the generated report
 */
export async function saveKeywordAuditReport(
  auditId: string,
  report: KeywordOptimizationReport
): Promise<void> {
  await prisma.keyword_optimization_audits.update({
    where: { id: auditId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date(),
      report_markdown: report.markdownReport,
      report_data: report as unknown as object,
      overall_score: report.scores.overall,
      title_score: report.scores.title,
      meta_score: report.scores.meta,
      heading_score: report.scores.headings,
      content_score: report.scores.content,
      internal_links_score: report.scores.internalLinks,
    },
  })
}

/**
 * Get audit by ID
 */
export async function getKeywordAudit(
  auditId: string,
  userId: string
): Promise<KeywordAuditDetail | null> {
  const audit = await prisma.keyword_optimization_audits.findFirst({
    where: {
      id: auditId,
      user_id: userId,
    },
  })

  if (!audit) return null

  return {
    id: audit.id,
    domainId: audit.domain_id,
    userId: audit.user_id,
    url: audit.url,
    targetKeyword: audit.target_keyword,
    locationName: audit.location_name,
    languageCode: audit.language_code,
    status: audit.status,
    errorMessage: audit.error_message,
    overallScore: audit.overall_score,
    titleScore: audit.title_score,
    metaScore: audit.meta_score,
    headingScore: audit.heading_score,
    contentScore: audit.content_score,
    internalLinksScore: audit.internal_links_score,
    currentPosition: audit.current_position,
    searchVolume: audit.search_volume,
    keywordDifficulty: audit.keyword_difficulty,
    domainRank: audit.domain_rank,
    referringDomains: audit.referring_domains,
    apiCost: audit.api_cost ? Number(audit.api_cost) : null,
    reportMarkdown: audit.report_markdown,
    reportData: audit.report_data as KeywordOptimizationReport | null,
    rankedKeywordsData: audit.ranked_keywords_data,
    serpData: audit.serp_data,
    backlinksData: audit.backlinks_data,
    keywordSuggestions: audit.keyword_suggestions,
    startedAt: audit.started_at,
    completedAt: audit.completed_at,
    createdAt: audit.created_at,
  }
}

/**
 * List keyword audits for a user
 */
export async function getUserKeywordAudits(options: {
  userId: string
  domainId?: string
  page?: number
  limit?: number
  status?: KeywordAuditStatus
}): Promise<{
  audits: KeywordAuditSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}> {
  const { userId, domainId, page = 1, limit = 10, status } = options

  const where = {
    user_id: userId,
    ...(domainId && { domain_id: domainId }),
    ...(status && { status }),
  }

  const [audits, total] = await Promise.all([
    prisma.keyword_optimization_audits.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        url: true,
        target_keyword: true,
        location_name: true,
        status: true,
        overall_score: true,
        current_position: true,
        search_volume: true,
        keyword_difficulty: true,
        api_cost: true,
        created_at: true,
        completed_at: true,
      },
    }),
    prisma.keyword_optimization_audits.count({ where }),
  ])

  return {
    audits: audits.map((a) => ({
      id: a.id,
      url: a.url,
      targetKeyword: a.target_keyword,
      locationName: a.location_name,
      status: a.status,
      overallScore: a.overall_score,
      currentPosition: a.current_position,
      searchVolume: a.search_volume,
      keywordDifficulty: a.keyword_difficulty,
      apiCost: a.api_cost ? Number(a.api_cost) : null,
      createdAt: a.created_at,
      completedAt: a.completed_at,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Delete a keyword audit
 */
export async function deleteKeywordAudit(auditId: string, userId: string): Promise<boolean> {
  const result = await prisma.keyword_optimization_audits.deleteMany({
    where: {
      id: auditId,
      user_id: userId,
    },
  })

  return result.count > 0
}
