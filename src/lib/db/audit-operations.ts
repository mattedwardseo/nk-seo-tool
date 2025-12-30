// Phase 3: Audit Database Operations
// Prisma operations for audit CRUD and status management

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { AuditStatus, Prisma } from '@prisma/client'
import type {
  AuditStepType,
  OnPageStepResult,
  SerpStepResult,
  BacklinksStepResult,
  CompetitorStepResult,
  BusinessStepResult,
  AuditStepErrors,
} from '@/types/audit'
import { type ErrorCategory } from '@/lib/dataforseo/types'

/**
 * Step results JSON structure stored in database
 */
interface StepResultsJson {
  onPage?: OnPageStepResult
  serp?: SerpStepResult
  backlinks?: BacklinksStepResult
  competitors?: CompetitorStepResult
  business?: BusinessStepResult
  /** Step errors/warnings from partial failures */
  warnings?: AuditStepErrors
}

/**
 * Create a new audit record with optional enhanced fields
 */
export async function createAudit(params: {
  userId: string
  domain: string
  businessName?: string
  location?: string
  city?: string
  state?: string
  gmbPlaceId?: string
  targetKeywords?: string[]
  competitorDomains?: string[]
  domainId?: string
}): Promise<string> {
  const cleanedDomain = params.domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  // Auto-find domain record if not provided
  let domainId = params.domainId
  if (!domainId) {
    const domainRecord = await prisma.domains.findFirst({
      where: { user_id: params.userId, domain: cleanedDomain },
      select: { id: true },
    })
    if (domainRecord) {
      domainId = domainRecord.id
    }
  }

  const audit = await prisma.audits.create({
    data: {
      id: createId(),
      userId: params.userId,
      domain: cleanedDomain,
      domain_id: domainId,
      status: AuditStatus.PENDING,
      progress: 0,
      updatedAt: new Date(),
      // Phase 6: Enhanced audit inputs
      business_name: params.businessName || null,
      location: params.location || null,
      city: params.city || null,
      state: params.state || null,
      gmb_place_id: params.gmbPlaceId || null,
      target_keywords: params.targetKeywords || [],
      competitor_domains: params.competitorDomains || [],
    },
    select: { id: true },
  })
  return audit.id
}

/**
 * Get audit by ID with all fields
 */
export async function getAudit(auditId: string) {
  return prisma.audits.findUnique({
    where: { id: auditId },
    include: {
      users: { select: { id: true, email: true, name: true } },
    },
  })
}

/**
 * Get audit status and progress
 */
export async function getAuditStatus(auditId: string) {
  return prisma.audits.findUnique({
    where: { id: auditId },
    select: {
      id: true,
      status: true,
      progress: true,
      current_step: true,
      error_message: true,
      started_at: true,
      completed_at: true,
    },
  })
}

/**
 * Start an audit - set status to CRAWLING and record start time
 */
export async function startAudit(auditId: string): Promise<void> {
  await prisma.audits.update({
    where: { id: auditId },
    data: {
      status: AuditStatus.CRAWLING,
      progress: 5,
      started_at: new Date(),
      error_message: null,
    },
  })
}

/**
 * Update audit progress and current step
 */
export async function updateAuditProgress(params: {
  auditId: string
  progress: number
  current_step?: AuditStepType
  status?: AuditStatus
}): Promise<void> {
  await prisma.audits.update({
    where: { id: params.auditId },
    data: {
      progress: Math.min(100, Math.max(0, params.progress)),
      current_step: params.current_step ?? undefined,
      status: params.status ?? undefined,
    },
  })
}

/**
 * Save step result to the step_results JSON field
 */
export async function saveStepResult<T extends keyof StepResultsJson>(
  auditId: string,
  stepName: T,
  result: StepResultsJson[T]
): Promise<void> {
  const audit = await prisma.audits.findUnique({
    where: { id: auditId },
    select: { step_results: true },
  })

  const currentResults = (audit?.step_results as StepResultsJson) ?? {}
  const updatedResults: StepResultsJson = {
    ...currentResults,
    [stepName]: result,
  }

  await prisma.audits.update({
    where: { id: auditId },
    data: {
      step_results: updatedResults as Prisma.InputJsonValue,
    },
  })
}

/**
 * Complete an audit
 */
export async function completeAudit(params: {
  auditId: string
  /** Step warnings from partial failures */
  warnings?: AuditStepErrors
}): Promise<void> {
  // If there are warnings, merge them into step_results
  let updateData: Prisma.auditsUpdateInput = {
    status: AuditStatus.COMPLETED,
    progress: 100,
    current_step: null,
    completed_at: new Date(),
  }

  if (params.warnings && Object.keys(params.warnings).length > 0) {
    // Get current step_results and add warnings
    const audit = await prisma.audits.findUnique({
      where: { id: params.auditId },
      select: { step_results: true },
    })
    const currentResults = (audit?.step_results as StepResultsJson) ?? {}
    // Serialize warnings for JSON storage (convert Date to string)
    const serializedWarnings = Object.fromEntries(
      Object.entries(params.warnings).map(([key, error]) => [
        key,
        error
          ? {
              ...error,
              timestamp: error.timestamp.toISOString(),
            }
          : undefined,
      ])
    )
    updateData.step_results = {
      ...currentResults,
      warnings: serializedWarnings,
    } as unknown as Prisma.InputJsonValue
  }

  await prisma.audits.update({
    where: { id: params.auditId },
    data: updateData,
  })
}

/**
 * Mark audit as failed with error message
 */
export async function failAudit(params: {
  auditId: string
  error: string
  step?: AuditStepType
  /** Error category for debugging */
  errorCategory?: ErrorCategory
}): Promise<void> {
  // Store error category in step_results for debugging
  let step_resultsUpdate: Prisma.InputJsonValue | undefined

  if (params.errorCategory) {
    const audit = await prisma.audits.findUnique({
      where: { id: params.auditId },
      select: { step_results: true },
    })
    const currentResults = (audit?.step_results as StepResultsJson) ?? {}
    step_resultsUpdate = {
      ...currentResults,
      _failureInfo: {
        category: params.errorCategory,
        timestamp: new Date().toISOString(),
      },
    } as unknown as Prisma.InputJsonValue
  }

  await prisma.audits.update({
    where: { id: params.auditId },
    data: {
      status: AuditStatus.FAILED,
      error_message: params.error,
      current_step: params.step ?? null,
      completed_at: new Date(),
      ...(step_resultsUpdate && { step_results: step_resultsUpdate }),
    },
  })
}

/**
 * Get audits for a user with pagination
 */
export async function getUserAudits(params: {
  userId: string
  page?: number
  limit?: number
  status?: AuditStatus
  domainId?: string // Phase 12: Domain filtering
}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10
  const skip = (page - 1) * limit

  // Build where clause - if domainId provided, also try to match by domain string for legacy audits
  let domainFilter = {}
  if (params.domainId) {
    // Get the domain record to find the domain string
    const domainRecord = await prisma.domains.findUnique({
      where: { id: params.domainId },
      select: { domain: true },
    })

    if (domainRecord) {
      // Match by domain_id OR by domain string (for legacy audits without domain_id)
      domainFilter = {
        OR: [
          { domain_id: params.domainId },
          { domain_id: null, domain: domainRecord.domain },
        ],
      }
    } else {
      // Fallback to just domain_id if domain record not found
      domainFilter = { domain_id: params.domainId }
    }
  }

  const where = {
    userId: params.userId,
    ...(params.status && { status: params.status }),
    ...domainFilter,
  }

  const [audits, total] = await Promise.all([
    prisma.audits.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        domain: true,
        status: true,
        progress: true,
        createdAt: true,
        completed_at: true,
      },
    }),
    prisma.audits.count({ where }),
  ])

  return {
    audits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get recent audits for dashboard
 */
export async function getRecentAudits(userId: string, limit: number = 5) {
  return prisma.audits.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      domain: true,
      status: true,
      progress: true,
      createdAt: true,
    },
  })
}

/**
 * Check if domain was audited recently (within hours)
 */
export async function wasRecentlyAudited(
  domain: string,
  withinHours: number = 24
): Promise<boolean> {
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000)
  const normalizedDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const recent = await prisma.audits.findFirst({
    where: {
      domain: normalizedDomain,
      createdAt: { gte: cutoff },
      status: { in: [AuditStatus.COMPLETED, AuditStatus.CRAWLING, AuditStatus.ANALYZING] },
    },
    select: { id: true },
  })

  return recent !== null
}

/**
 * Delete an audit and its metrics
 */
export async function deleteAudit(auditId: string): Promise<void> {
  await prisma.audits.delete({
    where: { id: auditId },
  })
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalAudits, completedAuditsCount, thisMonthAudits, recentAudits] = await Promise.all([
    // Total audits count
    prisma.audits.count({
      where: { userId },
    }),
    // Completed audits count
    prisma.audits.count({
      where: {
        userId,
        status: AuditStatus.COMPLETED,
      },
    }),
    // This month's completed audits
    prisma.audits.count({
      where: {
        userId,
        status: AuditStatus.COMPLETED,
        completed_at: { gte: startOfMonth },
      },
    }),
    // Recent audits (limit 5)
    prisma.audits.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        domain: true,
        status: true,
        progress: true,
        createdAt: true,
        completed_at: true,
      },
    }),
  ])

  return {
    totalAudits,
    completedAudits: completedAuditsCount,
    thisMonthAudits,
    scheduledAudits: 0, // Scheduling feature not yet implemented
    recentAudits,
  }
}

/**
 * Get full audit result with all step data
 */
export async function getFullAuditResult(auditId: string) {
  const audit = await prisma.audits.findUnique({
    where: { id: auditId },
    include: {
      audit_metrics: {
        orderBy: { recorded_at: 'desc' },
        take: 100,
      },
    },
  })

  if (!audit) return null

  const step_results = audit.step_results as StepResultsJson | null

  return {
    id: audit.id,
    userId: audit.userId,
    domain: audit.domain,
    status: audit.status,
    progress: audit.progress,
    stepResults: {
      onPage: step_results?.onPage ?? null,
      serp: step_results?.serp ?? null,
      backlinks: step_results?.backlinks ?? null,
      competitors: step_results?.competitors ?? null,
      business: step_results?.business ?? null,
    },
    warnings: step_results?.warnings ?? null,
    error: audit.error_message,
    startedAt: audit.started_at,
    completedAt: audit.completed_at,
    createdAt: audit.createdAt,
    metrics: audit.audit_metrics,
  }
}
