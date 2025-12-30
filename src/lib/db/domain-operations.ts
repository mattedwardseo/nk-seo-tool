/**
 * Domain Operations
 * Database operations for domain-centric architecture (Phase 12)
 */

import { prisma } from '@/lib/prisma';
import type { DomainStatus } from '@prisma/client';

export interface CreateDomainInput {
  userId: string;
  name: string;
  domain: string;
  businessName?: string;
  city?: string;
  state?: string;
}

export interface UpdateDomainInput {
  name?: string;
  businessName?: string;
  city?: string;
  state?: string;
  status?: DomainStatus;
  isPinned?: boolean;
}

export interface DomainWithSettings {
  id: string;
  userId: string;
  name: string;
  domain: string;
  businessName: string | null;
  city: string | null;
  state: string | null;
  status: DomainStatus;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    id: string;
    // SEO Calculator defaults
    seoDefaultCtrScenario: string;
    seoDefaultWebsiteConvRate: number;
    seoDefaultReceptionRate: number;
    seoDefaultAttendanceRate: number;
    seoDefaultReferralRate: number;
    seoDefaultMarketingInvest: number;
    seoDefaultStv: number;
    seoDefaultLtv: number;
    seoDefaultLocalCtr: number;
    // Google Ads defaults
    adsDefaultDailyBudget: number;
    adsDefaultAvgCpc: number;
    adsDefaultImpressionShare: number;
    // Capacity defaults
    capDefaultOperatories: number;
    capDefaultDaysOpen: number;
    capDefaultHoursPerDay: number;
    capDefaultApptDuration: number;
    // Site Audit defaults
    siteAuditMaxPages: number;
    siteAuditEnableJavascript: boolean;
    // Local SEO defaults
    localSeoGridSize: number;
    localSeoRadiusMiles: number;
  } | null;
}

export interface ToolCounts {
  audits: number;
  siteScans: number;
  localCampaigns: number;
  seoCalculations: number;
  trackedKeywords: number;
  keywordAudits: number;
  keywordTrackingRuns: number;
}

/**
 * Get all domains for a user
 */
export async function getUserDomains(
  userId: string
): Promise<DomainWithSettings[]> {
  const domains = await prisma.domains.findMany({
    where: {
      user_id: userId,
      status: 'ACTIVE',
    },
    include: {
      domain_settings: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return domains.map((d) => ({
    id: d.id,
    userId: d.user_id,
    name: d.name,
    domain: d.domain,
    businessName: d.business_name,
    city: d.city,
    state: d.state,
    status: d.status,
    isPinned: d.is_pinned,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    settings: d.domain_settings
      ? {
          id: d.domain_settings.id,
          // SEO Calculator defaults
          seoDefaultCtrScenario: d.domain_settings.seo_default_ctr_scenario,
          seoDefaultWebsiteConvRate: Number(d.domain_settings.seo_default_website_conv_rate),
          seoDefaultReceptionRate: Number(d.domain_settings.seo_default_reception_rate),
          seoDefaultAttendanceRate: Number(d.domain_settings.seo_default_attendance_rate),
          seoDefaultReferralRate: Number(d.domain_settings.seo_default_referral_rate),
          seoDefaultMarketingInvest: Number(d.domain_settings.seo_default_marketing_invest),
          seoDefaultStv: Number(d.domain_settings.seo_default_stv),
          seoDefaultLtv: Number(d.domain_settings.seo_default_ltv),
          seoDefaultLocalCtr: Number(d.domain_settings.seo_default_local_ctr),
          // Google Ads defaults
          adsDefaultDailyBudget: Number(d.domain_settings.ads_default_daily_budget),
          adsDefaultAvgCpc: Number(d.domain_settings.ads_default_avg_cpc),
          adsDefaultImpressionShare: Number(d.domain_settings.ads_default_impression_share),
          // Capacity defaults
          capDefaultOperatories: d.domain_settings.cap_default_operatories,
          capDefaultDaysOpen: d.domain_settings.cap_default_days_open,
          capDefaultHoursPerDay: Number(d.domain_settings.cap_default_hours_per_day),
          capDefaultApptDuration: d.domain_settings.cap_default_appt_duration,
          // Site Audit defaults
          siteAuditMaxPages: d.domain_settings.site_audit_max_pages,
          siteAuditEnableJavascript: d.domain_settings.site_audit_enable_javascript,
          // Local SEO defaults
          localSeoGridSize: d.domain_settings.local_seo_grid_size,
          localSeoRadiusMiles: Number(d.domain_settings.local_seo_radius_miles),
        }
      : null,
  }));
}

/**
 * Get a single domain by ID
 */
export async function getDomainById(
  domainId: string,
  userId: string
): Promise<DomainWithSettings | null> {
  const domain = await prisma.domains.findFirst({
    where: {
      id: domainId,
      user_id: userId,
    },
    include: {
      domain_settings: true,
    },
  });

  if (!domain) return null;

  return {
    id: domain.id,
    userId: domain.user_id,
    name: domain.name,
    domain: domain.domain,
    businessName: domain.business_name,
    city: domain.city,
    state: domain.state,
    status: domain.status,
    isPinned: domain.is_pinned,
    createdAt: domain.created_at,
    updatedAt: domain.updated_at,
    settings: domain.domain_settings
      ? {
          id: domain.domain_settings.id,
          // SEO Calculator defaults
          seoDefaultCtrScenario: domain.domain_settings.seo_default_ctr_scenario,
          seoDefaultWebsiteConvRate: Number(domain.domain_settings.seo_default_website_conv_rate),
          seoDefaultReceptionRate: Number(domain.domain_settings.seo_default_reception_rate),
          seoDefaultAttendanceRate: Number(domain.domain_settings.seo_default_attendance_rate),
          seoDefaultReferralRate: Number(domain.domain_settings.seo_default_referral_rate),
          seoDefaultMarketingInvest: Number(domain.domain_settings.seo_default_marketing_invest),
          seoDefaultStv: Number(domain.domain_settings.seo_default_stv),
          seoDefaultLtv: Number(domain.domain_settings.seo_default_ltv),
          seoDefaultLocalCtr: Number(domain.domain_settings.seo_default_local_ctr),
          // Google Ads defaults
          adsDefaultDailyBudget: Number(domain.domain_settings.ads_default_daily_budget),
          adsDefaultAvgCpc: Number(domain.domain_settings.ads_default_avg_cpc),
          adsDefaultImpressionShare: Number(domain.domain_settings.ads_default_impression_share),
          // Capacity defaults
          capDefaultOperatories: domain.domain_settings.cap_default_operatories,
          capDefaultDaysOpen: domain.domain_settings.cap_default_days_open,
          capDefaultHoursPerDay: Number(domain.domain_settings.cap_default_hours_per_day),
          capDefaultApptDuration: domain.domain_settings.cap_default_appt_duration,
          // Site Audit defaults
          siteAuditMaxPages: domain.domain_settings.site_audit_max_pages,
          siteAuditEnableJavascript: domain.domain_settings.site_audit_enable_javascript,
          // Local SEO defaults
          localSeoGridSize: domain.domain_settings.local_seo_grid_size,
          localSeoRadiusMiles: Number(domain.domain_settings.local_seo_radius_miles),
        }
      : null,
  };
}

/**
 * Create a new domain with default settings
 * If an archived domain with the same domain name exists, reactivate it instead
 */
export async function createDomain(
  input: CreateDomainInput
): Promise<DomainWithSettings> {
  // Check if an active domain with the same domain name already exists
  const existingActive = await prisma.domains.findFirst({
    where: {
      user_id: input.userId,
      domain: input.domain,
      status: 'ACTIVE',
    },
  });

  if (existingActive) {
    throw new Error('A domain with this name already exists');
  }

  // Check if an archived domain with the same domain name exists
  const existingArchived = await prisma.domains.findFirst({
    where: {
      user_id: input.userId,
      domain: input.domain,
      status: 'ARCHIVED',
    },
    include: {
      domain_settings: true,
    },
  });

  let domain;

  if (existingArchived) {
    // Reactivate and update the archived domain
    domain = await prisma.domains.update({
      where: {
        id: existingArchived.id,
      },
      data: {
        name: input.name,
        business_name: input.businessName,
        city: input.city,
        state: input.state,
        status: 'ACTIVE',
      },
      include: {
        domain_settings: true,
      },
    });

    // Ensure domain_settings exists (should already exist, but create if missing)
    if (!domain.domain_settings) {
      await prisma.domain_settings.create({
        data: {
          domain_id: domain.id,
          site_audit_max_pages: 100,
          site_audit_enable_javascript: true,
          local_seo_grid_size: 7,
          local_seo_radius_miles: 5,
        },
      });
      // Refetch to include settings
      const updated = await prisma.domains.findUnique({
        where: { id: domain.id },
        include: { domain_settings: true },
      });
      if (updated) domain = updated;
    }
  } else {
    // Create new domain
    domain = await prisma.domains.create({
      data: {
        user_id: input.userId,
        name: input.name,
        domain: input.domain,
        business_name: input.businessName,
        city: input.city,
        state: input.state,
        status: 'ACTIVE',
        domain_settings: {
          create: {
            // Uses Prisma defaults - no need to specify values
            // SEO Calculator: seo_default_* fields with sensible defaults
            // Google Ads: ads_default_* fields
            // Capacity: cap_default_* fields
            // Site Audit defaults
            site_audit_max_pages: 100,
            site_audit_enable_javascript: true,
            // Local SEO defaults
            local_seo_grid_size: 7,
            local_seo_radius_miles: 5,
          },
        },
      },
      include: {
        domain_settings: true,
      },
    });
  }

  return {
    id: domain.id,
    userId: domain.user_id,
    name: domain.name,
    domain: domain.domain,
    businessName: domain.business_name,
    city: domain.city,
    state: domain.state,
    status: domain.status,
    isPinned: domain.is_pinned,
    createdAt: domain.created_at,
    updatedAt: domain.updated_at,
    settings: domain.domain_settings
      ? {
          id: domain.domain_settings.id,
          // SEO Calculator defaults
          seoDefaultCtrScenario: domain.domain_settings.seo_default_ctr_scenario,
          seoDefaultWebsiteConvRate: Number(domain.domain_settings.seo_default_website_conv_rate),
          seoDefaultReceptionRate: Number(domain.domain_settings.seo_default_reception_rate),
          seoDefaultAttendanceRate: Number(domain.domain_settings.seo_default_attendance_rate),
          seoDefaultReferralRate: Number(domain.domain_settings.seo_default_referral_rate),
          seoDefaultMarketingInvest: Number(domain.domain_settings.seo_default_marketing_invest),
          seoDefaultStv: Number(domain.domain_settings.seo_default_stv),
          seoDefaultLtv: Number(domain.domain_settings.seo_default_ltv),
          seoDefaultLocalCtr: Number(domain.domain_settings.seo_default_local_ctr),
          // Google Ads defaults
          adsDefaultDailyBudget: Number(domain.domain_settings.ads_default_daily_budget),
          adsDefaultAvgCpc: Number(domain.domain_settings.ads_default_avg_cpc),
          adsDefaultImpressionShare: Number(domain.domain_settings.ads_default_impression_share),
          // Capacity defaults
          capDefaultOperatories: domain.domain_settings.cap_default_operatories,
          capDefaultDaysOpen: domain.domain_settings.cap_default_days_open,
          capDefaultHoursPerDay: Number(domain.domain_settings.cap_default_hours_per_day),
          capDefaultApptDuration: domain.domain_settings.cap_default_appt_duration,
          // Site Audit defaults
          siteAuditMaxPages: domain.domain_settings.site_audit_max_pages,
          siteAuditEnableJavascript: domain.domain_settings.site_audit_enable_javascript,
          // Local SEO defaults
          localSeoGridSize: domain.domain_settings.local_seo_grid_size,
          localSeoRadiusMiles: Number(domain.domain_settings.local_seo_radius_miles),
        }
      : null,
  };
}

/**
 * Update a domain
 */
export async function updateDomain(
  domainId: string,
  userId: string,
  input: UpdateDomainInput
): Promise<DomainWithSettings> {
  const domain = await prisma.domains.update({
    where: {
      id: domainId,
      user_id: userId,
    },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.businessName !== undefined && { business_name: input.businessName }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
    },
    include: {
      domain_settings: true,
    },
  });

  return {
    id: domain.id,
    userId: domain.user_id,
    name: domain.name,
    domain: domain.domain,
    businessName: domain.business_name,
    city: domain.city,
    state: domain.state,
    status: domain.status,
    isPinned: domain.is_pinned,
    createdAt: domain.created_at,
    updatedAt: domain.updated_at,
    settings: domain.domain_settings
      ? {
          id: domain.domain_settings.id,
          // SEO Calculator defaults
          seoDefaultCtrScenario: domain.domain_settings.seo_default_ctr_scenario,
          seoDefaultWebsiteConvRate: Number(domain.domain_settings.seo_default_website_conv_rate),
          seoDefaultReceptionRate: Number(domain.domain_settings.seo_default_reception_rate),
          seoDefaultAttendanceRate: Number(domain.domain_settings.seo_default_attendance_rate),
          seoDefaultReferralRate: Number(domain.domain_settings.seo_default_referral_rate),
          seoDefaultMarketingInvest: Number(domain.domain_settings.seo_default_marketing_invest),
          seoDefaultStv: Number(domain.domain_settings.seo_default_stv),
          seoDefaultLtv: Number(domain.domain_settings.seo_default_ltv),
          seoDefaultLocalCtr: Number(domain.domain_settings.seo_default_local_ctr),
          // Google Ads defaults
          adsDefaultDailyBudget: Number(domain.domain_settings.ads_default_daily_budget),
          adsDefaultAvgCpc: Number(domain.domain_settings.ads_default_avg_cpc),
          adsDefaultImpressionShare: Number(domain.domain_settings.ads_default_impression_share),
          // Capacity defaults
          capDefaultOperatories: domain.domain_settings.cap_default_operatories,
          capDefaultDaysOpen: domain.domain_settings.cap_default_days_open,
          capDefaultHoursPerDay: Number(domain.domain_settings.cap_default_hours_per_day),
          capDefaultApptDuration: domain.domain_settings.cap_default_appt_duration,
          // Site Audit defaults
          siteAuditMaxPages: domain.domain_settings.site_audit_max_pages,
          siteAuditEnableJavascript: domain.domain_settings.site_audit_enable_javascript,
          // Local SEO defaults
          localSeoGridSize: domain.domain_settings.local_seo_grid_size,
          localSeoRadiusMiles: Number(domain.domain_settings.local_seo_radius_miles),
        }
      : null,
  };
}

/**
 * Archive a domain (soft delete)
 */
export async function archiveDomain(
  domainId: string,
  userId: string
): Promise<void> {
  await prisma.domains.update({
    where: {
      id: domainId,
      user_id: userId,
    },
    data: {
      status: 'ARCHIVED',
    },
  });
}

/**
 * Get tool counts for a domain (for sidebar badges)
 */
export async function getDomainToolCounts(
  domainId: string,
  userId: string
): Promise<ToolCounts> {
  const [audits, siteScans, localCampaigns, seoCalculations, trackedKeywords, keywordAudits, keywordTrackingRuns] =
    await Promise.all([
      prisma.audits.count({
        where: {
          domain_id: domainId,
          userId: userId,
        },
      }),
      prisma.site_audit_scans.count({
        where: {
          domain_id: domainId,
          user_id: userId,
        },
      }),
      prisma.local_campaigns.count({
        where: {
          domain_id: domainId,
          user_id: userId,
          status: 'ACTIVE',
        },
      }),
      prisma.seo_calculations.count({
        where: {
          domain_id: domainId,
          user_id: userId,
        },
      }),
      prisma.tracked_keywords.count({
        where: {
          domain_id: domainId,
          user_id: userId,
          is_active: true,
        },
      }),
      prisma.keyword_optimization_audits.count({
        where: {
          domain_id: domainId,
          user_id: userId,
        },
      }),
      prisma.keyword_tracking_runs.count({
        where: {
          domain_id: domainId,
          user_id: userId,
        },
      }),
    ]);

  return {
    audits,
    siteScans,
    localCampaigns,
    seoCalculations,
    trackedKeywords,
    keywordAudits,
    keywordTrackingRuns,
  };
}

/**
 * Update domain settings
 */
export async function updateDomainSettings(
  domainId: string,
  userId: string,
  settings: {
    siteAuditMaxPages?: number;
    siteAuditEnableJavascript?: boolean;
    localSeoGridSize?: number;
    localSeoRadiusMiles?: number;
  }
): Promise<void> {
  // Verify domain ownership
  const domain = await prisma.domains.findFirst({
    where: {
      id: domainId,
      user_id: userId,
    },
    include: {
      domain_settings: true,
    },
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  if (!domain.domain_settings) {
    // Create settings if they don't exist
    await prisma.domain_settings.create({
      data: {
        domain_id: domainId,
        site_audit_max_pages: settings.siteAuditMaxPages ?? 100,
        site_audit_enable_javascript:
          settings.siteAuditEnableJavascript ?? true,
        local_seo_grid_size: settings.localSeoGridSize ?? 7,
        local_seo_radius_miles: settings.localSeoRadiusMiles ?? 5,
      },
    });
  } else {
    // Update existing settings
    await prisma.domain_settings.update({
      where: {
        domain_id: domainId,
      },
      data: {
        ...(settings.siteAuditMaxPages !== undefined && {
          site_audit_max_pages: settings.siteAuditMaxPages,
        }),
        ...(settings.siteAuditEnableJavascript !== undefined && {
          site_audit_enable_javascript: settings.siteAuditEnableJavascript,
        }),
        ...(settings.localSeoGridSize !== undefined && {
          local_seo_grid_size: settings.localSeoGridSize,
        }),
        ...(settings.localSeoRadiusMiles !== undefined && {
          local_seo_radius_miles: settings.localSeoRadiusMiles,
        }),
      },
    });
  }
}
