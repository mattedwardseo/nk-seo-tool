/**
 * Keyword Tracking Database Operations
 *
 * CRUD operations for keyword tracking runs, results, and schedules.
 * Follows patterns from site-audit-operations.ts
 */

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { KeywordTrackingRunStatus } from '@prisma/client'

// ============================================
// Types
// ============================================

export interface CreateRunInput {
  domainId: string
  locationName?: string
  languageCode?: string
  triggeredBy?: 'manual' | 'scheduled'
}

export interface RunSummary {
  id: string
  domainId: string
  status: KeywordTrackingRunStatus
  progress: number
  keywordsTracked: number
  avgPosition: number | null
  keywordsInTop3: number
  keywordsInTop10: number
  keywordsNotRanking: number
  improvedCount: number
  declinedCount: number
  createdAt: Date
  completedAt: Date | null
  triggeredBy: string | null
}

export interface RunDetail extends RunSummary {
  locationName: string
  languageCode: string
  keywordsInTop100: number
  unchangedCount: number
  newRankingsCount: number
  lostRankingsCount: number
  apiCallsUsed: number
  estimatedCost: number | null
  startedAt: Date | null
  errorMessage: string | null
}

export interface KeywordResult {
  id: string
  runId: string
  trackedKeywordId: string
  keyword: string
  searchVolume: number | null
  volumeDate: string | null // "YYYY-MM" when volume is from historical data
  cpc: number | null
  keywordDifficulty: number | null // 0-100 from DataForSEO
  position: number | null
  previousPosition: number | null
  positionChange: number | null
  // Historical position changes (Phase 17)
  change7d: number | null
  change30d: number | null
  change90d: number | null
  rankingUrl: string | null
  serpFeatures: string[]
  top3Domains: Array<{ domain: string; position: number; url: string }> | null
  // Local Pack data (Phase 16 Sprint 3)
  localPackPosition: number | null
  localPackRating: number | null
  localPackReviews: number | null
  localPackCid: string | null
  createdAt: Date
}

export interface SaveResultInput {
  trackedKeywordId: string
  keyword: string
  searchVolume: number | null
  volumeDate: string | null // "YYYY-MM" when volume is from historical data
  cpc: number | null
  keywordDifficulty: number | null // 0-100 from DataForSEO
  position: number | null
  previousPosition: number | null
  positionChange: number | null
  rankingUrl: string | null
  serpFeatures: string[]
  top3Domains: Array<{ domain: string; position: number; url: string }> | null
  // Local Pack data (Phase 16 Sprint 3)
  localPackPosition: number | null
  localPackRating: number | null
  localPackReviews: number | null
  localPackCid: string | null
}

export interface CompletionMetrics {
  keywordsTracked: number
  avgPosition: number | null
  keywordsInTop3: number
  keywordsInTop10: number
  keywordsInTop100: number
  keywordsNotRanking: number
  improvedCount: number
  declinedCount: number
  unchangedCount: number
  newRankingsCount: number
  lostRankingsCount: number
  apiCallsUsed: number
  estimatedCost?: number
}

export interface ScheduleInput {
  domainId: string
  frequency: 'weekly' | 'biweekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  timeOfDay?: string
  locationName?: string
  languageCode?: string
}

export interface Schedule {
  id: string
  domainId: string
  isEnabled: boolean
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  timeOfDay: string
  locationName: string
  languageCode: string
  nextRunAt: Date | null
  lastRunAt: Date | null
  lastRunId: string | null
}

export interface DueSchedule {
  id: string
  domainId: string
  userId: string
  locationName: string
  languageCode: string
}

export interface HistoryItem {
  runId: string
  position: number | null
  positionChange: number | null
  createdAt: Date
}

export interface StatusData {
  status: KeywordTrackingRunStatus
  progress: number
  errorMessage: string | null
  keywordsTracked: number
}

export interface ResultsOptions {
  limit?: number
  offset?: number
  sortBy?: 'position' | 'positionChange' | 'keyword' | 'searchVolume'
  sortOrder?: 'asc' | 'desc'
  positionFilter?: 'top3' | 'top10' | 'top100' | 'notRanking' | 'all'
  changeFilter?: 'improved' | 'declined' | 'unchanged' | 'new' | 'lost' | 'all'
}

// ============================================
// Run Operations
// ============================================

/**
 * Create a new keyword tracking run
 */
export async function createKeywordTrackingRun(
  userId: string,
  input: CreateRunInput
): Promise<string> {
  const run = await prisma.keyword_tracking_runs.create({
    data: {
      id: createId(),
      domain_id: input.domainId,
      user_id: userId,
      location_name: input.locationName ?? 'United States',
      language_code: input.languageCode ?? 'en',
      triggered_by: input.triggeredBy ?? 'manual',
      status: 'PENDING',
    },
  })

  return run.id
}

/**
 * Get a run by ID
 */
export async function getKeywordTrackingRun(
  runId: string
): Promise<RunDetail | null> {
  const run = await prisma.keyword_tracking_runs.findUnique({
    where: { id: runId },
  })

  if (!run) return null

  return {
    id: run.id,
    domainId: run.domain_id,
    status: run.status,
    progress: run.progress,
    keywordsTracked: run.keywords_tracked,
    avgPosition: run.avg_position ? Number(run.avg_position) : null,
    keywordsInTop3: run.keywords_in_top_3,
    keywordsInTop10: run.keywords_in_top_10,
    keywordsInTop100: run.keywords_in_top_100,
    keywordsNotRanking: run.keywords_not_ranking,
    improvedCount: run.improved_count,
    declinedCount: run.declined_count,
    unchangedCount: run.unchanged_count,
    newRankingsCount: run.new_rankings_count,
    lostRankingsCount: run.lost_rankings_count,
    apiCallsUsed: run.api_calls_used,
    estimatedCost: run.estimated_cost ? Number(run.estimated_cost) : null,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    createdAt: run.created_at,
    triggeredBy: run.triggered_by,
    locationName: run.location_name,
    languageCode: run.language_code,
    errorMessage: run.error_message,
  }
}

/**
 * Get a run for a specific user (with ownership check)
 */
export async function getRunForUser(
  runId: string,
  userId: string
): Promise<RunDetail | null> {
  const run = await prisma.keyword_tracking_runs.findFirst({
    where: {
      id: runId,
      user_id: userId,
    },
  })

  if (!run) return null

  return {
    id: run.id,
    domainId: run.domain_id,
    status: run.status,
    progress: run.progress,
    keywordsTracked: run.keywords_tracked,
    avgPosition: run.avg_position ? Number(run.avg_position) : null,
    keywordsInTop3: run.keywords_in_top_3,
    keywordsInTop10: run.keywords_in_top_10,
    keywordsInTop100: run.keywords_in_top_100,
    keywordsNotRanking: run.keywords_not_ranking,
    improvedCount: run.improved_count,
    declinedCount: run.declined_count,
    unchangedCount: run.unchanged_count,
    newRankingsCount: run.new_rankings_count,
    lostRankingsCount: run.lost_rankings_count,
    apiCallsUsed: run.api_calls_used,
    estimatedCost: run.estimated_cost ? Number(run.estimated_cost) : null,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    createdAt: run.created_at,
    triggeredBy: run.triggered_by,
    locationName: run.location_name,
    languageCode: run.language_code,
    errorMessage: run.error_message,
  }
}

/**
 * List runs for a domain with pagination
 */
export async function listDomainRuns(
  domainId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ runs: RunSummary[]; total: number }> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  const [runs, total] = await Promise.all([
    prisma.keyword_tracking_runs.findMany({
      where: { domain_id: domainId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.keyword_tracking_runs.count({
      where: { domain_id: domainId },
    }),
  ])

  return {
    runs: runs.map((run) => ({
      id: run.id,
      domainId: run.domain_id,
      status: run.status,
      progress: run.progress,
      keywordsTracked: run.keywords_tracked,
      avgPosition: run.avg_position ? Number(run.avg_position) : null,
      keywordsInTop3: run.keywords_in_top_3,
      keywordsInTop10: run.keywords_in_top_10,
      keywordsNotRanking: run.keywords_not_ranking,
      improvedCount: run.improved_count,
      declinedCount: run.declined_count,
      createdAt: run.created_at,
      completedAt: run.completed_at,
      triggeredBy: run.triggered_by,
    })),
    total,
  }
}

/**
 * Update run status
 */
export async function updateRunStatus(
  runId: string,
  status: KeywordTrackingRunStatus
): Promise<void> {
  const updates: Record<string, unknown> = { status }

  if (status === 'RUNNING') {
    updates.started_at = new Date()
  }

  await prisma.keyword_tracking_runs.update({
    where: { id: runId },
    data: updates,
  })
}

/**
 * Update run progress
 */
export async function updateRunProgress(
  runId: string,
  progress: number
): Promise<void> {
  await prisma.keyword_tracking_runs.update({
    where: { id: runId },
    data: { progress: Math.min(progress, 100) },
  })
}

/**
 * Complete a run with metrics
 */
export async function completeRun(
  runId: string,
  metrics: CompletionMetrics
): Promise<void> {
  await prisma.keyword_tracking_runs.update({
    where: { id: runId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      completed_at: new Date(),
      keywords_tracked: metrics.keywordsTracked,
      avg_position: metrics.avgPosition,
      keywords_in_top_3: metrics.keywordsInTop3,
      keywords_in_top_10: metrics.keywordsInTop10,
      keywords_in_top_100: metrics.keywordsInTop100,
      keywords_not_ranking: metrics.keywordsNotRanking,
      improved_count: metrics.improvedCount,
      declined_count: metrics.declinedCount,
      unchanged_count: metrics.unchangedCount,
      new_rankings_count: metrics.newRankingsCount,
      lost_rankings_count: metrics.lostRankingsCount,
      api_calls_used: metrics.apiCallsUsed,
      estimated_cost: metrics.estimatedCost,
    },
  })
}

/**
 * Fail a run with error message
 */
export async function failRun(
  runId: string,
  errorMessage: string
): Promise<void> {
  await prisma.keyword_tracking_runs.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      error_message: errorMessage,
      completed_at: new Date(),
    },
  })
}

/**
 * Delete a run (and cascade to results)
 */
export async function deleteRun(runId: string): Promise<void> {
  await prisma.keyword_tracking_runs.delete({
    where: { id: runId },
  })
}

/**
 * Get run status for polling
 */
export async function getRunStatus(runId: string): Promise<StatusData | null> {
  const run = await prisma.keyword_tracking_runs.findUnique({
    where: { id: runId },
    select: {
      status: true,
      progress: true,
      error_message: true,
      keywords_tracked: true,
    },
  })

  if (!run) return null

  return {
    status: run.status,
    progress: run.progress,
    errorMessage: run.error_message,
    keywordsTracked: run.keywords_tracked,
  }
}

// ============================================
// Result Operations
// ============================================

/**
 * Save keyword results for a run
 */
export async function saveKeywordResults(
  runId: string,
  results: SaveResultInput[]
): Promise<void> {
  const data = results.map((result) => ({
    id: createId(),
    run_id: runId,
    tracked_keyword_id: result.trackedKeywordId,
    keyword: result.keyword,
    search_volume: result.searchVolume,
    volume_date: result.volumeDate,
    cpc: result.cpc,
    keyword_difficulty: result.keywordDifficulty,
    position: result.position,
    previous_position: result.previousPosition,
    position_change: result.positionChange,
    ranking_url: result.rankingUrl,
    serp_features: result.serpFeatures,
    // Use undefined instead of null for JSON fields in createMany
    top_3_domains: result.top3Domains ?? undefined,
    // Local Pack data (Phase 16 Sprint 3)
    local_pack_position: result.localPackPosition,
    local_pack_rating: result.localPackRating,
    local_pack_reviews: result.localPackReviews,
    local_pack_cid: result.localPackCid,
  }))

  await prisma.keyword_tracking_results.createMany({
    data,
    skipDuplicates: true,
  })
}

/**
 * Get results for a run with filtering and pagination
 */
export async function getRunResults(
  runId: string,
  options?: ResultsOptions
): Promise<{ results: KeywordResult[]; total: number }> {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  const sortBy = options?.sortBy ?? 'position'
  const sortOrder = options?.sortOrder ?? 'asc'
  const positionFilter = options?.positionFilter ?? 'all'
  const changeFilter = options?.changeFilter ?? 'all'

  // Build where clause
  const where: Record<string, unknown> = { run_id: runId }

  // Position filter
  if (positionFilter !== 'all') {
    switch (positionFilter) {
      case 'top3':
        where.position = { lte: 3, not: null }
        break
      case 'top10':
        where.position = { lte: 10, not: null }
        break
      case 'top100':
        where.position = { lte: 100, not: null }
        break
      case 'notRanking':
        where.position = null
        break
    }
  }

  // Change filter
  if (changeFilter !== 'all') {
    switch (changeFilter) {
      case 'improved':
        where.position_change = { gt: 0 }
        break
      case 'declined':
        where.position_change = { lt: 0 }
        break
      case 'unchanged':
        where.position_change = 0
        break
      case 'new':
        where.AND = [
          { position: { not: null } },
          { previous_position: null },
        ]
        break
      case 'lost':
        where.AND = [
          { position: null },
          { previous_position: { not: null } },
        ]
        break
    }
  }

  // Build orderBy
  const orderByMap: Record<string, string> = {
    position: 'position',
    positionChange: 'position_change',
    keyword: 'keyword',
    searchVolume: 'search_volume',
  }

  // Get run metadata for historical comparison
  const run = await prisma.keyword_tracking_runs.findUnique({
    where: { id: runId },
    select: { domain_id: true, created_at: true },
  })

  const [results, total] = await Promise.all([
    prisma.keyword_tracking_results.findMany({
      where,
      orderBy: { [orderByMap[sortBy] ?? 'position']: sortOrder },
      take: limit,
      skip: offset,
    }),
    prisma.keyword_tracking_results.count({ where }),
  ])

  // Get historical positions for 7d, 30d, 90d comparisons
  let positions7d = new Map<string, number | null>()
  let positions30d = new Map<string, number | null>()
  let positions90d = new Map<string, number | null>()

  if (run) {
    const historicalData = await getHistoricalPositions(
      run.domain_id,
      run.created_at
    )
    positions7d = historicalData.positions7d
    positions30d = historicalData.positions30d
    positions90d = historicalData.positions90d
  }

  return {
    results: results.map((r) => ({
      id: r.id,
      runId: r.run_id,
      trackedKeywordId: r.tracked_keyword_id,
      keyword: r.keyword,
      searchVolume: r.search_volume,
      volumeDate: r.volume_date,
      cpc: r.cpc ? Number(r.cpc) : null,
      keywordDifficulty: r.keyword_difficulty,
      position: r.position,
      previousPosition: r.previous_position,
      positionChange: r.position_change,
      // Historical position changes (Phase 17)
      change7d: calculatePositionChange(r.position, positions7d.get(r.tracked_keyword_id) ?? null),
      change30d: calculatePositionChange(r.position, positions30d.get(r.tracked_keyword_id) ?? null),
      change90d: calculatePositionChange(r.position, positions90d.get(r.tracked_keyword_id) ?? null),
      rankingUrl: r.ranking_url,
      serpFeatures: r.serp_features,
      top3Domains: r.top_3_domains as Array<{
        domain: string
        position: number
        url: string
      }> | null,
      // Local Pack data (Phase 16 Sprint 3)
      localPackPosition: r.local_pack_position,
      localPackRating: r.local_pack_rating ? Number(r.local_pack_rating) : null,
      localPackReviews: r.local_pack_reviews,
      localPackCid: r.local_pack_cid,
      createdAt: r.created_at,
    })),
    total,
  }
}

/**
 * Get historical positions for a keyword across runs
 */
export async function getKeywordHistory(
  domainId: string,
  keyword: string,
  limit: number = 10
): Promise<HistoryItem[]> {
  const results = await prisma.keyword_tracking_results.findMany({
    where: {
      keyword,
      run: {
        domain_id: domainId,
        status: 'COMPLETED',
      },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      run_id: true,
      position: true,
      position_change: true,
      created_at: true,
    },
  })

  return results.map((r) => ({
    runId: r.run_id,
    position: r.position,
    positionChange: r.position_change,
    createdAt: r.created_at,
  }))
}

// ============================================
// Comparison Operations
// ============================================

/**
 * Get the previous run for a domain (excluding current run)
 */
export async function getPreviousRun(
  domainId: string,
  excludeRunId: string
): Promise<{ id: string } | null> {
  const run = await prisma.keyword_tracking_runs.findFirst({
    where: {
      domain_id: domainId,
      id: { not: excludeRunId },
      status: 'COMPLETED',
    },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  })

  return run
}

/**
 * Get results from a previous run for comparison
 */
export async function getPreviousResults(
  runId: string
): Promise<Map<string, { position: number | null }>> {
  const results = await prisma.keyword_tracking_results.findMany({
    where: { run_id: runId },
    select: {
      tracked_keyword_id: true,
      position: true,
    },
  })

  const map = new Map<string, { position: number | null }>()
  for (const r of results) {
    map.set(r.tracked_keyword_id, { position: r.position })
  }

  return map
}

/**
 * Get historical positions for keywords at specific time periods
 * Returns positions from runs closest to 7, 30, and 90 days ago
 */
export async function getHistoricalPositions(
  domainId: string,
  currentRunDate: Date
): Promise<{
  positions7d: Map<string, number | null>
  positions30d: Map<string, number | null>
  positions90d: Map<string, number | null>
}> {
  const date7d = new Date(currentRunDate)
  date7d.setDate(date7d.getDate() - 7)

  const date30d = new Date(currentRunDate)
  date30d.setDate(date30d.getDate() - 30)

  const date90d = new Date(currentRunDate)
  date90d.setDate(date90d.getDate() - 90)

  // Find runs closest to each target date
  const [run7d, run30d, run90d] = await Promise.all([
    // Run closest to 7 days ago (within 3 day window)
    prisma.keyword_tracking_runs.findFirst({
      where: {
        domain_id: domainId,
        status: 'COMPLETED',
        created_at: {
          gte: new Date(date7d.getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(date7d.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    }),
    // Run closest to 30 days ago (within 7 day window)
    prisma.keyword_tracking_runs.findFirst({
      where: {
        domain_id: domainId,
        status: 'COMPLETED',
        created_at: {
          gte: new Date(date30d.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(date30d.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    }),
    // Run closest to 90 days ago (within 14 day window)
    prisma.keyword_tracking_runs.findFirst({
      where: {
        domain_id: domainId,
        status: 'COMPLETED',
        created_at: {
          gte: new Date(date90d.getTime() - 14 * 24 * 60 * 60 * 1000),
          lte: new Date(date90d.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    }),
  ])

  // Fetch positions from each run
  const [results7d, results30d, results90d] = await Promise.all([
    run7d
      ? prisma.keyword_tracking_results.findMany({
          where: { run_id: run7d.id },
          select: { tracked_keyword_id: true, position: true },
        })
      : [],
    run30d
      ? prisma.keyword_tracking_results.findMany({
          where: { run_id: run30d.id },
          select: { tracked_keyword_id: true, position: true },
        })
      : [],
    run90d
      ? prisma.keyword_tracking_results.findMany({
          where: { run_id: run90d.id },
          select: { tracked_keyword_id: true, position: true },
        })
      : [],
  ])

  // Build maps
  const positions7d = new Map<string, number | null>()
  const positions30d = new Map<string, number | null>()
  const positions90d = new Map<string, number | null>()

  for (const r of results7d) {
    positions7d.set(r.tracked_keyword_id, r.position)
  }
  for (const r of results30d) {
    positions30d.set(r.tracked_keyword_id, r.position)
  }
  for (const r of results90d) {
    positions90d.set(r.tracked_keyword_id, r.position)
  }

  return { positions7d, positions30d, positions90d }
}

/**
 * Calculate position change (positive = improved)
 */
function calculatePositionChange(
  currentPosition: number | null,
  historicalPosition: number | null
): number | null {
  if (currentPosition === null || historicalPosition === null) {
    return null
  }
  // Lower position number is better, so improvement = historical - current
  return historicalPosition - currentPosition
}

// ============================================
// Schedule Operations
// ============================================

/**
 * Create a schedule for a domain
 */
export async function createSchedule(
  userId: string,
  input: ScheduleInput
): Promise<string> {
  const nextRunAt = calculateNextRunTime({
    frequency: input.frequency,
    dayOfWeek: input.dayOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    timeOfDay: input.timeOfDay ?? '06:00',
    lastRunAt: null,
  })

  const schedule = await prisma.keyword_tracking_schedules.create({
    data: {
      id: createId(),
      domain_id: input.domainId,
      user_id: userId,
      frequency: input.frequency,
      day_of_week: input.dayOfWeek,
      day_of_month: input.dayOfMonth,
      time_of_day: input.timeOfDay ?? '06:00',
      location_name: input.locationName ?? 'United States',
      language_code: input.languageCode ?? 'en',
      next_run_at: nextRunAt,
    },
  })

  return schedule.id
}

/**
 * Get schedule for a domain
 */
export async function getScheduleForDomain(
  domainId: string
): Promise<Schedule | null> {
  const schedule = await prisma.keyword_tracking_schedules.findUnique({
    where: { domain_id: domainId },
  })

  if (!schedule) return null

  return {
    id: schedule.id,
    domainId: schedule.domain_id,
    isEnabled: schedule.is_enabled,
    frequency: schedule.frequency,
    dayOfWeek: schedule.day_of_week,
    dayOfMonth: schedule.day_of_month,
    timeOfDay: schedule.time_of_day,
    locationName: schedule.location_name,
    languageCode: schedule.language_code,
    nextRunAt: schedule.next_run_at,
    lastRunAt: schedule.last_run_at,
    lastRunId: schedule.last_run_id,
  }
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  domainId: string,
  input: Partial<ScheduleInput> & { isEnabled?: boolean }
): Promise<void> {
  const current = await prisma.keyword_tracking_schedules.findUnique({
    where: { domain_id: domainId },
  })

  if (!current) throw new Error('Schedule not found')

  const updates: Record<string, unknown> = {}

  if (input.frequency !== undefined) updates.frequency = input.frequency
  if (input.dayOfWeek !== undefined) updates.day_of_week = input.dayOfWeek
  if (input.dayOfMonth !== undefined) updates.day_of_month = input.dayOfMonth
  if (input.timeOfDay !== undefined) updates.time_of_day = input.timeOfDay
  if (input.locationName !== undefined) updates.location_name = input.locationName
  if (input.languageCode !== undefined) updates.language_code = input.languageCode
  if (input.isEnabled !== undefined) updates.is_enabled = input.isEnabled

  // Recalculate next run time if schedule changed
  if (
    input.frequency !== undefined ||
    input.dayOfWeek !== undefined ||
    input.dayOfMonth !== undefined ||
    input.timeOfDay !== undefined
  ) {
    updates.next_run_at = calculateNextRunTime({
      frequency: (input.frequency as 'weekly' | 'biweekly' | 'monthly') ?? current.frequency,
      dayOfWeek: input.dayOfWeek ?? current.day_of_week,
      dayOfMonth: input.dayOfMonth ?? current.day_of_month,
      timeOfDay: input.timeOfDay ?? current.time_of_day,
      lastRunAt: current.last_run_at,
    })
  }

  await prisma.keyword_tracking_schedules.update({
    where: { domain_id: domainId },
    data: updates,
  })
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(domainId: string): Promise<void> {
  await prisma.keyword_tracking_schedules.delete({
    where: { domain_id: domainId },
  })
}

/**
 * Get schedules that are due to run
 */
export async function getSchedulesDue(
  limit: number = 20
): Promise<DueSchedule[]> {
  const now = new Date()

  const schedules = await prisma.keyword_tracking_schedules.findMany({
    where: {
      is_enabled: true,
      next_run_at: { lte: now },
    },
    take: limit,
    select: {
      id: true,
      domain_id: true,
      user_id: true,
      location_name: true,
      language_code: true,
    },
  })

  return schedules.map((s) => ({
    id: s.id,
    domainId: s.domain_id,
    userId: s.user_id,
    locationName: s.location_name,
    languageCode: s.language_code,
  }))
}

/**
 * Update schedule after a run completes
 */
export async function updateScheduleAfterRun(
  domainId: string,
  runId: string
): Promise<void> {
  const schedule = await prisma.keyword_tracking_schedules.findUnique({
    where: { domain_id: domainId },
  })

  if (!schedule) return

  const now = new Date()
  const nextRunAt = calculateNextRunTime({
    frequency: schedule.frequency as 'weekly' | 'biweekly' | 'monthly',
    dayOfWeek: schedule.day_of_week,
    dayOfMonth: schedule.day_of_month,
    timeOfDay: schedule.time_of_day,
    lastRunAt: now,
  })

  await prisma.keyword_tracking_schedules.update({
    where: { domain_id: domainId },
    data: {
      last_run_at: now,
      last_run_id: runId,
      next_run_at: nextRunAt,
    },
  })
}

/**
 * Calculate the next run time for a schedule
 */
export function calculateNextRunTime(schedule: {
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  timeOfDay: string
  lastRunAt: Date | null
}): Date {
  const now = new Date()
  const timeParts = schedule.timeOfDay.split(':').map(Number)
  const hours = timeParts[0] ?? 6
  const minutes = timeParts[1] ?? 0

  const next = new Date(now)
  next.setUTCHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'weekly': {
      const targetDay = schedule.dayOfWeek ?? 0 // Default to Sunday
      // Find next occurrence of target day
      while (next.getUTCDay() !== targetDay || next <= now) {
        next.setDate(next.getDate() + 1)
      }
      break
    }
    case 'biweekly': {
      const targetDay = schedule.dayOfWeek ?? 0
      // Find next occurrence of target day
      while (next.getUTCDay() !== targetDay || next <= now) {
        next.setDate(next.getDate() + 1)
      }
      // If last run was less than 14 days ago, add 14 days
      if (schedule.lastRunAt) {
        const daysSinceLastRun = Math.floor(
          (next.getTime() - schedule.lastRunAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceLastRun < 14) {
          next.setDate(next.getDate() + 14)
        }
      }
      break
    }
    case 'monthly': {
      const targetDay = schedule.dayOfMonth ?? 1
      next.setUTCDate(targetDay)
      // If we've passed this day this month, go to next month
      if (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      // Handle months with fewer days
      if (next.getUTCDate() !== targetDay) {
        next.setUTCDate(0) // Last day of previous month
      }
      break
    }
  }

  return next
}

/**
 * Count tracking runs for a domain (for tool counts)
 */
export async function countDomainRuns(domainId: string): Promise<number> {
  return prisma.keyword_tracking_runs.count({
    where: { domain_id: domainId },
  })
}
