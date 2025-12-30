/**
 * Archive Operations
 * Database operations for managing unassigned and archived data (Phase 12.5)
 */

import { prisma } from '@/lib/prisma';

// Types for unassigned data
export interface UnassignedAudit {
  id: string;
  domain: string;
  status: string;
  createdAt: Date;
}

export interface UnassignedSiteAuditScan {
  id: string;
  domain: string;
  status: string;
  createdAt: Date;
  maxCrawlPages: number;
}

export interface UnassignedLocalCampaign {
  id: string;
  businessName: string;
  keywords: string[];
  status: string;
  createdAt: Date;
}

export interface UnassignedData {
  audits: UnassignedAudit[];
  siteAuditScans: UnassignedSiteAuditScan[];
  localCampaigns: UnassignedLocalCampaign[];
  totalCount: number;
}

// Types for archived data
export interface ArchivedAudit {
  id: string;
  domain: string;
  status: string;
  createdAt: Date;
  archivedAt: Date;
}

export interface ArchivedSiteAuditScan {
  id: string;
  domain: string;
  status: string;
  createdAt: Date;
  archivedAt: Date;
}

export interface ArchivedLocalCampaign {
  id: string;
  businessName: string;
  createdAt: Date;
  archivedAt: Date;
}

export interface ArchivedData {
  audits: ArchivedAudit[];
  siteAuditScans: ArchivedSiteAuditScan[];
  localCampaigns: ArchivedLocalCampaign[];
  totalCount: number;
}

/**
 * Get all unassigned data (domain_id is NULL) for a user
 */
export async function getUnassignedData(userId: string): Promise<UnassignedData> {
  const [audits, siteScans, campaigns] = await Promise.all([
    prisma.audits.findMany({
      where: {
        userId,
        domain_id: null,
      },
      select: {
        id: true,
        domain: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.site_audit_scans.findMany({
      where: {
        user_id: userId,
        domain_id: null,
      },
      select: {
        id: true,
        domain: true,
        status: true,
        created_at: true,
        max_crawl_pages: true,
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.local_campaigns.findMany({
      where: {
        user_id: userId,
        domain_id: null,
      },
      select: {
        id: true,
        business_name: true,
        keywords: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  return {
    audits: audits.map((a) => ({
      id: a.id,
      domain: a.domain,
      status: a.status,
      createdAt: a.createdAt,
    })),
    siteAuditScans: siteScans.map((s) => ({
      id: s.id,
      domain: s.domain,
      status: s.status,
      createdAt: s.created_at,
      maxCrawlPages: s.max_crawl_pages,
    })),
    localCampaigns: campaigns.map((c) => ({
      id: c.id,
      businessName: c.business_name,
      keywords: c.keywords,
      status: c.status,
      createdAt: c.created_at,
    })),
    totalCount: audits.length + siteScans.length + campaigns.length,
  };
}

/**
 * Get all archived data for a user
 */
export async function getArchivedData(userId: string): Promise<ArchivedData> {
  const [audits, siteScans, campaigns] = await Promise.all([
    prisma.archived_audits.findMany({
      where: { userId },
      orderBy: { archived_at: 'desc' },
    }),
    prisma.archived_site_audit_scans.findMany({
      where: { user_id: userId },
      orderBy: { archived_at: 'desc' },
    }),
    prisma.archived_local_campaigns.findMany({
      where: { user_id: userId },
      orderBy: { archived_at: 'desc' },
    }),
  ]);

  return {
    audits: audits.map((a) => ({
      id: a.id,
      domain: a.domain,
      status: a.status,
      createdAt: a.createdAt,
      archivedAt: a.archived_at,
    })),
    siteAuditScans: siteScans.map((s) => ({
      id: s.id,
      domain: s.domain,
      status: s.status,
      createdAt: s.created_at,
      archivedAt: s.archived_at,
    })),
    localCampaigns: campaigns.map((c) => ({
      id: c.id,
      businessName: c.business_name,
      createdAt: c.created_at,
      archivedAt: c.archived_at,
    })),
    totalCount: audits.length + siteScans.length + campaigns.length,
  };
}

/**
 * Assign unassigned audits to a domain
 */
export async function assignAuditsToDomain(
  userId: string,
  auditIds: string[],
  domainId: string
): Promise<number> {
  const result = await prisma.audits.updateMany({
    where: {
      id: { in: auditIds },
      userId,
      domain_id: null,
    },
    data: {
      domain_id: domainId,
    },
  });
  return result.count;
}

/**
 * Assign unassigned site audit scans to a domain
 */
export async function assignSiteAuditScansToDomain(
  userId: string,
  scanIds: string[],
  domainId: string
): Promise<number> {
  const result = await prisma.site_audit_scans.updateMany({
    where: {
      id: { in: scanIds },
      user_id: userId,
      domain_id: null,
    },
    data: {
      domain_id: domainId,
    },
  });
  return result.count;
}

/**
 * Assign unassigned local campaigns to a domain
 */
export async function assignLocalCampaignsToDomain(
  userId: string,
  campaignIds: string[],
  domainId: string
): Promise<number> {
  const result = await prisma.local_campaigns.updateMany({
    where: {
      id: { in: campaignIds },
      user_id: userId,
      domain_id: null,
    },
    data: {
      domain_id: domainId,
    },
  });
  return result.count;
}

/**
 * Move audits to archive
 */
export async function archiveAudits(
  userId: string,
  auditIds: string[]
): Promise<number> {
  // Fetch the audits to archive
  const audits = await prisma.audits.findMany({
    where: {
      id: { in: auditIds },
      userId,
    },
    select: {
      id: true,
      userId: true,
      domain: true,
      status: true,
      createdAt: true,
      step_results: true,
    },
  });

  if (audits.length === 0) return 0;

  // Create archived copies
  await prisma.archived_audits.createMany({
    data: audits.map((a) => ({
      id: a.id,
      userId: a.userId,
      domain: a.domain,
      status: a.status,
      createdAt: a.createdAt,
      step_results: a.step_results ?? undefined,
    })),
  });

  // Delete originals
  await prisma.audits.deleteMany({
    where: {
      id: { in: auditIds },
      userId,
    },
  });

  return audits.length;
}

/**
 * Move site audit scans to archive
 */
export async function archiveSiteAuditScans(
  userId: string,
  scanIds: string[]
): Promise<number> {
  // Fetch the scans to archive
  const scans = await prisma.site_audit_scans.findMany({
    where: {
      id: { in: scanIds },
      user_id: userId,
    },
    select: {
      id: true,
      user_id: true,
      domain: true,
      status: true,
      created_at: true,
    },
  });

  if (scans.length === 0) return 0;

  // Create archived copies
  await prisma.archived_site_audit_scans.createMany({
    data: scans.map((s) => ({
      id: s.id,
      user_id: s.user_id,
      domain: s.domain,
      status: s.status,
      created_at: s.created_at,
    })),
  });

  // Delete originals (cascade will delete related pages/summaries)
  await prisma.site_audit_scans.deleteMany({
    where: {
      id: { in: scanIds },
      user_id: userId,
    },
  });

  return scans.length;
}

/**
 * Move local campaigns to archive
 */
export async function archiveLocalCampaigns(
  userId: string,
  campaignIds: string[]
): Promise<number> {
  // Fetch the campaigns to archive
  const campaigns = await prisma.local_campaigns.findMany({
    where: {
      id: { in: campaignIds },
      user_id: userId,
    },
    select: {
      id: true,
      user_id: true,
      business_name: true,
      created_at: true,
    },
  });

  if (campaigns.length === 0) return 0;

  // Create archived copies
  await prisma.archived_local_campaigns.createMany({
    data: campaigns.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      business_name: c.business_name,
      created_at: c.created_at,
    })),
  });

  // Delete originals (cascade will delete related scans/results)
  await prisma.local_campaigns.deleteMany({
    where: {
      id: { in: campaignIds },
      user_id: userId,
    },
  });

  return campaigns.length;
}

/**
 * Delete archived items permanently
 */
export async function deleteArchivedAudits(
  userId: string,
  auditIds: string[]
): Promise<number> {
  const result = await prisma.archived_audits.deleteMany({
    where: {
      id: { in: auditIds },
      userId,
    },
  });
  return result.count;
}

export async function deleteArchivedSiteAuditScans(
  userId: string,
  scanIds: string[]
): Promise<number> {
  const result = await prisma.archived_site_audit_scans.deleteMany({
    where: {
      id: { in: scanIds },
      user_id: userId,
    },
  });
  return result.count;
}

export async function deleteArchivedLocalCampaigns(
  userId: string,
  campaignIds: string[]
): Promise<number> {
  const result = await prisma.archived_local_campaigns.deleteMany({
    where: {
      id: { in: campaignIds },
      user_id: userId,
    },
  });
  return result.count;
}
