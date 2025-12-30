/**
 * Site Audit Database Operations
 *
 * Prisma operations for full site crawl audits using DataForSEO OnPage API.
 */

import { prisma } from '@/lib/prisma';
import { SiteAuditStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface CreateScanInput {
  domain: string;
  maxCrawlPages?: number;
  enableJavascript?: boolean;
  enableBrowserRendering?: boolean;
  storeRawHtml?: boolean;
  calculateKeywordDensity?: boolean;
  startUrl?: string;
  auditId?: string;
  domainId?: string; // Optional domain link
}

export interface ScanListItem {
  id: string;
  domain: string;
  status: SiteAuditStatus;
  progress: number;
  maxCrawlPages: number;
  createdAt: Date;
  completedAt: Date | null;
  summary: {
    crawledPages: number;
    onpageScore: number | null;
    errorsCount: number;
  } | null;
}

export interface SummaryData {
  totalPages: number;
  crawledPages: number;
  crawlStopReason?: string;
  errorsCount: number;
  warningsCount: number;
  noticesCount: number;
  onpageScore?: number;
  avgLcp?: number | null;
  avgCls?: number | null;
  totalImages: number;
  brokenResources: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  nonIndexable: number;
  duplicateTitle: number;
  duplicateDescription: number;
  duplicateContent: number;
  domainInfo?: Record<string, unknown>;
  sslInfo?: Record<string, unknown>;
  pageMetricsChecks?: Record<string, unknown>;
}

export interface PageData {
  url: string;
  statusCode: number;
  onpageScore?: number;
  title?: string;
  description?: string;
  h1Tags?: string[];
  wordCount?: number;
  redirectLocation?: string;
  isRedirect?: boolean;
  pageTiming?: Record<string, unknown>;
  checks?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  issueTypes?: string[];
  issueCount?: number;
}

export interface CompletionMetrics {
  totalPages: number;
  apiCost?: number;
}

// ============================================================================
// Scan Operations
// ============================================================================

/**
 * Create a new site audit scan
 */
export async function createSiteAuditScan(
  userId: string,
  input: CreateScanInput
): Promise<string> {
  // Auto-find domain record if not provided
  let domainId = input.domainId;
  if (!domainId) {
    const domainRecord = await prisma.domains.findFirst({
      where: { user_id: userId, domain: input.domain },
      select: { id: true },
    });
    if (domainRecord) {
      domainId = domainRecord.id;
    }
  }

  const scan = await prisma.site_audit_scans.create({
    data: {
      user_id: userId,
      domain: input.domain,
      domain_id: domainId,
      max_crawl_pages: input.maxCrawlPages ?? 100,
      enable_javascript: input.enableJavascript ?? true,
      enable_browser_rendering: input.enableBrowserRendering ?? true,
      store_raw_html: input.storeRawHtml ?? false,
      calculate_keyword_density: input.calculateKeywordDensity ?? false,
      start_url: input.startUrl,
      audit_id: input.auditId,
      status: SiteAuditStatus.PENDING,
      progress: 0,
    },
    select: { id: true },
  });
  return scan.id;
}

/**
 * Get site audit scan by ID
 */
export async function getSiteAuditScan(scanId: string) {
  return prisma.site_audit_scans.findUnique({
    where: { id: scanId },
  });
}

/**
 * Get site audit scan with relations
 */
export async function getSiteAuditScanWithRelations(scanId: string) {
  const scan = await prisma.site_audit_scans.findUnique({
    where: { id: scanId },
    include: {
      users: { select: { id: true, email: true, name: true } },
      audits: { select: { id: true, domain: true } },
      summary: true,
    },
  });

  if (!scan) return null;

  // Map snake_case to camelCase for API response
  return {
    id: scan.id,
    userId: scan.user_id,
    domain: scan.domain,
    status: scan.status,
    progress: scan.progress,
    taskId: scan.task_id,
    maxCrawlPages: scan.max_crawl_pages,
    enableJavascript: scan.enable_javascript,
    enableBrowserRendering: scan.enable_browser_rendering,
    storeRawHtml: scan.store_raw_html,
    calculateKeywordDensity: scan.calculate_keyword_density,
    startUrl: scan.start_url,
    auditId: scan.audit_id,
    startedAt: scan.started_at,
    completedAt: scan.completed_at,
    apiCost: scan.api_cost,
    errorMessage: scan.error_message,
    createdAt: scan.created_at,
    updatedAt: scan.updated_at,
    users: scan.users,
    audits: scan.audits,
    summary: scan.summary,
  };
}

/**
 * Get scan for user validation
 */
export async function getScanForUser(scanId: string, userId: string) {
  return prisma.site_audit_scans.findFirst({
    where: { id: scanId, user_id: userId },
  });
}

/**
 * Update scan status
 */
export async function updateScanStatus(
  scanId: string,
  status: SiteAuditStatus
): Promise<void> {
  const data: Prisma.site_audit_scansUpdateInput = { status };

  // Set started_at when transitioning to SUBMITTING
  if (status === SiteAuditStatus.SUBMITTING) {
    data.started_at = new Date();
  }

  await prisma.site_audit_scans.update({
    where: { id: scanId },
    data,
  });
}

/**
 * Update scan progress
 */
export async function updateScanProgress(
  scanId: string,
  progress: number
): Promise<void> {
  await prisma.site_audit_scans.update({
    where: { id: scanId },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  });
}

/**
 * Update scan task ID (from DataForSEO)
 */
export async function updateScanTaskId(
  scanId: string,
  taskId: string
): Promise<void> {
  await prisma.site_audit_scans.update({
    where: { id: scanId },
    data: { task_id: taskId },
  });
}

/**
 * Complete a site audit scan
 */
export async function completeScan(
  scanId: string,
  metrics: CompletionMetrics
): Promise<void> {
  await prisma.site_audit_scans.update({
    where: { id: scanId },
    data: {
      status: SiteAuditStatus.COMPLETED,
      completed_at: new Date(),
      progress: 100,
      api_cost: metrics.apiCost,
    },
  });
}

/**
 * Fail a site audit scan
 */
export async function failScan(
  scanId: string,
  errorMessage: string
): Promise<void> {
  await prisma.site_audit_scans.update({
    where: { id: scanId },
    data: {
      status: SiteAuditStatus.FAILED,
      completed_at: new Date(),
      error_message: errorMessage,
    },
  });
}

/**
 * Delete a site audit scan and all related data
 */
export async function deleteScan(scanId: string): Promise<void> {
  await prisma.site_audit_scans.delete({
    where: { id: scanId },
  });
}

/**
 * List scans for a user
 */
export async function listUserScans(
  userId: string,
  options?: {
    status?: SiteAuditStatus;
    limit?: number;
    offset?: number;
    domainId?: string; // Domain filtering
  }
): Promise<ScanListItem[]> {
  // Build domain filter - if domainId provided, also match by domain string for legacy scans
  let domainFilter = {};
  if (options?.domainId) {
    const domainRecord = await prisma.domains.findUnique({
      where: { id: options.domainId },
      select: { domain: true },
    });

    if (domainRecord) {
      // Match by domain_id OR by domain string (for legacy scans without domain_id)
      domainFilter = {
        OR: [
          { domain_id: options.domainId },
          { domain_id: null, domain: domainRecord.domain },
        ],
      };
    } else {
      domainFilter = { domain_id: options.domainId };
    }
  }

  const scans = await prisma.site_audit_scans.findMany({
    where: {
      user_id: userId,
      ...(options?.status && { status: options.status }),
      ...domainFilter,
    },
    orderBy: { created_at: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    include: {
      summary: {
        select: {
          crawled_pages: true,
          onpage_score: true,
          errors_count: true,
        },
      },
    },
  });

  return scans.map((s) => ({
    id: s.id,
    domain: s.domain,
    status: s.status,
    progress: s.progress,
    maxCrawlPages: s.max_crawl_pages,
    createdAt: s.created_at,
    completedAt: s.completed_at,
    summary: s.summary
      ? {
          crawledPages: s.summary.crawled_pages,
          onpageScore: s.summary.onpage_score
            ? Number(s.summary.onpage_score)
            : null,
          errorsCount: s.summary.errors_count,
        }
      : null,
  }));
}

/**
 * Get scan status for polling
 */
export async function getScanStatus(scanId: string) {
  const scan = await prisma.site_audit_scans.findUnique({
    where: { id: scanId },
    select: {
      id: true,
      status: true,
      progress: true,
      task_id: true,
      started_at: true,
      completed_at: true,
      error_message: true,
    },
  });

  if (!scan) return null;

  return {
    id: scan.id,
    status: scan.status,
    progress: scan.progress,
    taskId: scan.task_id,
    startedAt: scan.started_at,
    completedAt: scan.completed_at,
    errorMessage: scan.error_message,
  };
}

// ============================================================================
// Summary Operations
// ============================================================================

/**
 * Save site audit summary
 */
export async function saveSiteAuditSummary(
  scanId: string,
  summary: SummaryData
): Promise<void> {
  await prisma.site_audit_summaries.create({
    data: {
      scan_id: scanId,
      total_pages: summary.totalPages,
      crawled_pages: summary.crawledPages,
      crawl_stop_reason: summary.crawlStopReason,
      errors_count: summary.errorsCount,
      warnings_count: summary.warningsCount,
      notices_count: summary.noticesCount,
      onpage_score: summary.onpageScore,
      avg_lcp: summary.avgLcp,
      avg_cls: summary.avgCls,
      total_images: summary.totalImages,
      broken_resources: summary.brokenResources,
      internal_links: summary.internalLinks,
      external_links: summary.externalLinks,
      broken_links: summary.brokenLinks,
      non_indexable: summary.nonIndexable,
      duplicate_title: summary.duplicateTitle,
      duplicate_description: summary.duplicateDescription,
      duplicate_content: summary.duplicateContent,
      domain_info: summary.domainInfo as Prisma.InputJsonValue,
      ssl_info: summary.sslInfo as Prisma.InputJsonValue,
      page_metrics_checks: summary.pageMetricsChecks as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get site audit summary
 */
export async function getSiteAuditSummary(scanId: string) {
  const summary = await prisma.site_audit_summaries.findUnique({
    where: { scan_id: scanId },
  });

  if (!summary) return null;

  // Map snake_case to camelCase
  return {
    id: summary.id,
    scanId: summary.scan_id,
    totalPages: summary.total_pages,
    crawledPages: summary.crawled_pages,
    crawlStopReason: summary.crawl_stop_reason,
    errorsCount: summary.errors_count,
    warningsCount: summary.warnings_count,
    noticesCount: summary.notices_count,
    onpageScore: summary.onpage_score ? Number(summary.onpage_score) : null,
    avgLcp: summary.avg_lcp ? Number(summary.avg_lcp) : null,
    avgCls: summary.avg_cls ? Number(summary.avg_cls) : null,
    totalImages: summary.total_images,
    brokenResources: summary.broken_resources,
    internalLinks: summary.internal_links,
    externalLinks: summary.external_links,
    brokenLinks: summary.broken_links,
    nonIndexable: summary.non_indexable,
    duplicateTitle: summary.duplicate_title,
    duplicateDescription: summary.duplicate_description,
    duplicateContent: summary.duplicate_content,
    domainInfo: summary.domain_info,
    sslInfo: summary.ssl_info,
    pageMetricsChecks: summary.page_metrics_checks,
    createdAt: summary.created_at,
  };
}

// ============================================================================
// Page Operations
// ============================================================================

/**
 * Generate URL hash for deduplication
 */
function generateUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 64);
}

/**
 * Extract issue types from checks object
 */
function extractIssueTypes(checks: Record<string, unknown>): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(checks)) {
    // DataForSEO returns boolean checks - true means the check passed
    // So we look for false values as issues
    if (value === false) {
      issues.push(key);
    }
  }
  return issues;
}

/**
 * Save site audit pages in batch
 */
export async function saveSiteAuditPages(
  scanId: string,
  pages: PageData[]
): Promise<void> {
  // Process in batches of 100 for efficiency
  const batchSize = 100;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    await prisma.site_audit_pages.createMany({
      data: batch.map((page) => {
        const issueTypes = page.checks
          ? extractIssueTypes(page.checks as Record<string, unknown>)
          : page.issueTypes ?? [];

        return {
          scan_id: scanId,
          url: page.url,
          url_hash: generateUrlHash(page.url),
          status_code: page.statusCode,
          onpage_score: page.onpageScore,
          title: page.title?.slice(0, 1000),
          description: page.description?.slice(0, 2000),
          h1_tags: page.h1Tags ?? [],
          word_count: page.wordCount,
          redirect_location: page.redirectLocation?.slice(0, 2000),
          is_redirect: page.isRedirect ?? false,
          page_timing: page.pageTiming as Prisma.InputJsonValue,
          checks: page.checks as Prisma.InputJsonValue,
          meta: page.meta as Prisma.InputJsonValue,
          issue_types: issueTypes,
          issue_count: page.issueCount ?? issueTypes.length,
        };
      }),
      skipDuplicates: true,
    });
  }
}

/**
 * Get pages for a scan with pagination and filtering
 */
export async function getSiteAuditPages(
  scanId: string,
  options?: {
    limit?: number;
    offset?: number;
    filter?: 'errors' | 'warnings' | 'all';
    sortBy?: 'onpageScore' | 'issueCount' | 'statusCode' | 'url';
    sortOrder?: 'asc' | 'desc';
  }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Map camelCase sort options to snake_case
  const sortByMap: Record<string, string> = {
    onpageScore: 'onpage_score',
    issueCount: 'issue_count',
    statusCode: 'status_code',
    url: 'url',
  };
  const sortBy = sortByMap[options?.sortBy ?? 'issueCount'] ?? 'issue_count';
  const sortOrder = options?.sortOrder ?? 'desc';

  // Build where clause based on filter
  const where: Prisma.site_audit_pagesWhereInput = { scan_id: scanId };

  if (options?.filter === 'errors') {
    where.OR = [
      { status_code: { gte: 400 } },
      { issue_count: { gt: 5 } },
    ];
  } else if (options?.filter === 'warnings') {
    where.issue_count = { gt: 0, lte: 5 };
  }

  const [pages, total] = await Promise.all([
    prisma.site_audit_pages.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
      select: {
        id: true,
        url: true,
        status_code: true,
        onpage_score: true,
        title: true,
        description: true,
        h1_tags: true,
        issue_types: true,
        issue_count: true,
      },
    }),
    prisma.site_audit_pages.count({ where }),
  ]);

  // Map to camelCase for API response
  const mappedPages = pages.map((p) => ({
    id: p.id,
    url: p.url,
    statusCode: p.status_code,
    onpageScore: p.onpage_score ? Number(p.onpage_score) : null,
    title: p.title,
    metaDescription: p.description,
    h1: p.h1_tags && p.h1_tags.length > 0 ? p.h1_tags[0] : null,
    issueTypes: p.issue_types,
    issueCount: p.issue_count,
  }));

  return {
    pages: mappedPages,
    total,
    limit,
    offset,
    hasMore: offset + pages.length < total,
  };
}

/**
 * Get a single page with full details
 */
export async function getSiteAuditPage(pageId: string) {
  const page = await prisma.site_audit_pages.findUnique({
    where: { id: pageId },
  });

  if (!page) return null;

  return {
    id: page.id,
    scanId: page.scan_id,
    url: page.url,
    urlHash: page.url_hash,
    statusCode: page.status_code,
    onpageScore: page.onpage_score ? Number(page.onpage_score) : null,
    title: page.title,
    description: page.description,
    h1Tags: page.h1_tags,
    wordCount: page.word_count,
    redirectLocation: page.redirect_location,
    isRedirect: page.is_redirect,
    pageTiming: page.page_timing,
    checks: page.checks,
    meta: page.meta,
    issueTypes: page.issue_types,
    issueCount: page.issue_count,
    createdAt: page.created_at,
  };
}

/**
 * Get page by URL for a scan
 */
export async function getSiteAuditPageByUrl(scanId: string, url: string) {
  const urlHash = generateUrlHash(url);
  const page = await prisma.site_audit_pages.findUnique({
    where: {
      scan_id_url_hash: { scan_id: scanId, url_hash: urlHash },
    },
  });

  if (!page) return null;

  return {
    id: page.id,
    scanId: page.scan_id,
    url: page.url,
    statusCode: page.status_code,
    onpageScore: page.onpage_score ? Number(page.onpage_score) : null,
    title: page.title,
    issueTypes: page.issue_types,
    issueCount: page.issue_count,
  };
}

// ============================================================================
// Statistics Helpers
// ============================================================================

/**
 * Count scans for a user
 */
export async function countUserScans(userId: string): Promise<number> {
  return prisma.site_audit_scans.count({
    where: { user_id: userId },
  });
}

/**
 * Get page count for a scan
 */
export async function getScanPageCount(scanId: string): Promise<number> {
  return prisma.site_audit_pages.count({
    where: { scan_id: scanId },
  });
}

/**
 * Get issue distribution for a scan
 */
export async function getIssueDistribution(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: { scan_id: scanId },
    select: { issue_types: true, status_code: true },
  });

  const distribution: Record<string, number> = {};
  let errorPages = 0;
  let warningPages = 0;
  let okPages = 0;

  for (const page of pages) {
    // Count by status code
    if (page.status_code >= 400) {
      errorPages++;
    } else if (page.issue_types.length > 0) {
      warningPages++;
    } else {
      okPages++;
    }

    // Count individual issue types
    for (const issue of page.issue_types) {
      distribution[issue] = (distribution[issue] || 0) + 1;
    }
  }

  return {
    totalPages: pages.length,
    errorPages,
    warningPages,
    okPages,
    issueTypes: distribution,
  };
}

// ============================================================================
// Enhanced Issue Queries
// ============================================================================

/**
 * Get pages with duplicate titles, grouped by title
 */
export async function getDuplicateTitlePages(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: {
      scan_id: scanId,
      title: { not: null },
    },
    select: {
      id: true,
      url: true,
      title: true,
      status_code: true,
      onpage_score: true,
    },
    orderBy: { title: 'asc' },
  });

  // Group pages by title
  const titleGroups = new Map<string, typeof pages>();
  for (const page of pages) {
    if (!page.title) continue;
    const existing = titleGroups.get(page.title) || [];
    existing.push(page);
    titleGroups.set(page.title, existing);
  }

  // Filter to only groups with duplicates (2+ pages)
  const duplicates: Array<{
    title: string;
    count: number;
    pages: Array<{
      id: string;
      url: string;
      statusCode: number;
      onpageScore: number | null;
    }>;
  }> = [];

  for (const [title, groupPages] of titleGroups) {
    if (groupPages.length > 1) {
      duplicates.push({
        title,
        count: groupPages.length,
        pages: groupPages.map((p) => ({
          id: p.id,
          url: p.url,
          statusCode: p.status_code,
          onpageScore: p.onpage_score ? Number(p.onpage_score) : null,
        })),
      });
    }
  }

  return duplicates.sort((a, b) => b.count - a.count);
}

/**
 * Get pages with duplicate descriptions, grouped by description
 */
export async function getDuplicateDescriptionPages(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: {
      scan_id: scanId,
      description: { not: null },
    },
    select: {
      id: true,
      url: true,
      title: true,
      description: true,
      status_code: true,
      onpage_score: true,
    },
    orderBy: { description: 'asc' },
  });

  // Group pages by description
  const descGroups = new Map<string, typeof pages>();
  for (const page of pages) {
    if (!page.description) continue;
    const existing = descGroups.get(page.description) || [];
    existing.push(page);
    descGroups.set(page.description, existing);
  }

  // Filter to only groups with duplicates (2+ pages)
  const duplicates: Array<{
    description: string;
    count: number;
    pages: Array<{
      id: string;
      url: string;
      title: string | null;
      statusCode: number;
      onpageScore: number | null;
    }>;
  }> = [];

  for (const [description, groupPages] of descGroups) {
    if (groupPages.length > 1) {
      duplicates.push({
        description,
        count: groupPages.length,
        pages: groupPages.map((p) => ({
          id: p.id,
          url: p.url,
          title: p.title,
          statusCode: p.status_code,
          onpageScore: p.onpage_score ? Number(p.onpage_score) : null,
        })),
      });
    }
  }

  return duplicates.sort((a, b) => b.count - a.count);
}

/**
 * Get all redirect pages with their target URLs
 */
export async function getRedirectPages(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: {
      scan_id: scanId,
      is_redirect: true,
    },
    select: {
      id: true,
      url: true,
      redirect_location: true,
      status_code: true,
      title: true,
    },
    orderBy: { url: 'asc' },
  });

  return pages.map((p) => ({
    id: p.id,
    url: p.url,
    redirectLocation: p.redirect_location,
    statusCode: p.status_code,
    title: p.title,
  }));
}

/**
 * Get non-indexable pages (noindex, canonical issues, robots blocked)
 */
export async function getNonIndexablePages(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: {
      scan_id: scanId,
    },
    select: {
      id: true,
      url: true,
      title: true,
      status_code: true,
      onpage_score: true,
      checks: true,
    },
  });

  // Filter pages that have non-indexable indicators
  const nonIndexable: Array<{
    id: string;
    url: string;
    title: string | null;
    statusCode: number;
    onpageScore: number | null;
    reason: string;
  }> = [];

  for (const page of pages) {
    const checks = page.checks as Record<string, boolean> | null;
    if (!checks) continue;

    // Check for various non-indexable conditions
    let reason = '';

    // Check for noindex
    if (checks.noindex === true || checks.no_index === true) {
      reason = 'noindex tag';
    }
    // Check for canonical pointing elsewhere (if canonical exists but points away)
    else if (checks.has_canonical === false && checks.canonical === false) {
      reason = 'missing canonical';
    }
    // Check for robots.txt blocking
    else if (checks.robots_txt_blocked === true) {
      reason = 'blocked by robots.txt';
    }
    // Check for 4xx/5xx status codes
    else if (page.status_code >= 400) {
      reason = `HTTP ${page.status_code}`;
    }

    if (reason) {
      nonIndexable.push({
        id: page.id,
        url: page.url,
        title: page.title,
        statusCode: page.status_code,
        onpageScore: page.onpage_score ? Number(page.onpage_score) : null,
        reason,
      });
    }
  }

  return nonIndexable;
}

/**
 * Get pages by specific issue type
 */
export async function getPagesByIssueType(
  scanId: string,
  issueType: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const [pages, total] = await Promise.all([
    prisma.site_audit_pages.findMany({
      where: {
        scan_id: scanId,
        issue_types: { has: issueType },
      },
      select: {
        id: true,
        url: true,
        title: true,
        status_code: true,
        onpage_score: true,
        issue_count: true,
      },
      orderBy: { issue_count: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.site_audit_pages.count({
      where: {
        scan_id: scanId,
        issue_types: { has: issueType },
      },
    }),
  ]);

  return {
    pages: pages.map((p) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      statusCode: p.status_code,
      onpageScore: p.onpage_score ? Number(p.onpage_score) : null,
      issueCount: p.issue_count,
    })),
    total,
    limit,
    offset,
    hasMore: offset + pages.length < total,
  };
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Get all pages for CSV export (no pagination)
 */
export async function getSiteAuditPagesForExport(scanId: string) {
  const pages = await prisma.site_audit_pages.findMany({
    where: { scan_id: scanId },
    orderBy: { url: 'asc' },
    select: {
      url: true,
      status_code: true,
      onpage_score: true,
      title: true,
      description: true,
      h1_tags: true,
      word_count: true,
      issue_types: true,
      issue_count: true,
      is_redirect: true,
      redirect_location: true,
    },
  });

  return pages.map((p) => ({
    url: p.url,
    statusCode: p.status_code,
    onpageScore: p.onpage_score ? Number(p.onpage_score) : null,
    title: p.title,
    metaDescription: p.description,
    h1: p.h1_tags && p.h1_tags.length > 0 ? p.h1_tags[0] : null,
    wordCount: p.word_count,
    issueTypes: p.issue_types.join(', '),
    issueCount: p.issue_count,
    isRedirect: p.is_redirect,
    redirectLocation: p.redirect_location,
  }));
}
