/**
 * Unit Tests for Domain Operations
 *
 * Tests for:
 * - getUserDomains
 * - getDomainById
 * - createDomain
 * - updateDomain
 * - archiveDomain
 * - getDomainToolCounts
 * - updateDomainSettings
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    domains: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    domain_settings: {
      create: vi.fn(),
      update: vi.fn(),
    },
    audits: {
      count: vi.fn(),
    },
    site_audit_scans: {
      count: vi.fn(),
    },
    local_campaigns: {
      count: vi.fn(),
    },
    seo_calculations: {
      count: vi.fn(),
    },
    tracked_keywords: {
      count: vi.fn(),
    },
    keyword_optimization_audits: {
      count: vi.fn(),
    },
    keyword_tracking_runs: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  getUserDomains,
  getDomainById,
  createDomain,
  updateDomain,
  archiveDomain,
  getDomainToolCounts,
  updateDomainSettings,
} from '../domain-operations'

// Sample domain data for testing
const mockDomainSettings = {
  id: 'settings-123',
  seo_default_ctr_scenario: 'average',
  seo_default_website_conv_rate: 0.03,
  seo_default_reception_rate: 0.8,
  seo_default_attendance_rate: 0.9,
  seo_default_referral_rate: 0.15,
  seo_default_marketing_invest: 2000,
  seo_default_stv: 500,
  seo_default_ltv: 3500,
  seo_default_local_ctr: 0.28,
  ads_default_daily_budget: 50,
  ads_default_avg_cpc: 5,
  ads_default_impression_share: 0.7,
  cap_default_operatories: 4,
  cap_default_days_open: 5,
  cap_default_hours_per_day: 8,
  cap_default_appt_duration: 30,
  site_audit_max_pages: 100,
  site_audit_enable_javascript: true,
  local_seo_grid_size: 7,
  local_seo_radius_miles: 5,
}

const mockDomain = {
  id: 'domain-123',
  user_id: 'user-123',
  name: 'Test Dental',
  domain: 'testdental.com',
  business_name: 'Test Dental Practice',
  city: 'Chicago',
  state: 'IL',
  status: 'ACTIVE' as const,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  domain_settings: mockDomainSettings,
}

describe('getUserDomains', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all active domains for a user', async () => {
    ;(prisma.domains.findMany as Mock).mockResolvedValue([mockDomain])

    const result = await getUserDomains('user-123')

    expect(prisma.domains.findMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-123',
        status: 'ACTIVE',
      },
      include: {
        domain_settings: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('domain-123')
    expect(result[0].name).toBe('Test Dental')
    expect(result[0].domain).toBe('testdental.com')
  })

  it('returns empty array when user has no domains', async () => {
    ;(prisma.domains.findMany as Mock).mockResolvedValue([])

    const result = await getUserDomains('user-123')

    expect(result).toHaveLength(0)
  })

  it('correctly transforms domain settings to camelCase', async () => {
    ;(prisma.domains.findMany as Mock).mockResolvedValue([mockDomain])

    const result = await getUserDomains('user-123')

    expect(result[0].settings).toBeDefined()
    expect(result[0].settings!.seoDefaultCtrScenario).toBe('average')
    expect(result[0].settings!.seoDefaultWebsiteConvRate).toBe(0.03)
    expect(result[0].settings!.capDefaultOperatories).toBe(4)
    expect(result[0].settings!.siteAuditMaxPages).toBe(100)
    expect(result[0].settings!.localSeoGridSize).toBe(7)
  })

  it('handles domains without settings', async () => {
    const domainWithoutSettings = { ...mockDomain, domain_settings: null }
    ;(prisma.domains.findMany as Mock).mockResolvedValue([domainWithoutSettings])

    const result = await getUserDomains('user-123')

    expect(result[0].settings).toBeNull()
  })
})

describe('getDomainById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns domain when found', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(mockDomain)

    const result = await getDomainById('domain-123', 'user-123')

    expect(prisma.domains.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'domain-123',
        user_id: 'user-123',
      },
      include: {
        domain_settings: true,
      },
    })

    expect(result).not.toBeNull()
    expect(result!.id).toBe('domain-123')
    expect(result!.businessName).toBe('Test Dental Practice')
    expect(result!.city).toBe('Chicago')
  })

  it('returns null when domain not found', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(null)

    const result = await getDomainById('nonexistent', 'user-123')

    expect(result).toBeNull()
  })

  it('returns null when user does not own domain', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(null)

    const result = await getDomainById('domain-123', 'wrong-user')

    expect(result).toBeNull()
  })
})

describe('createDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates domain with default settings', async () => {
    ;(prisma.domains.create as Mock).mockResolvedValue(mockDomain)

    const result = await createDomain({
      userId: 'user-123',
      name: 'Test Dental',
      domain: 'testdental.com',
      businessName: 'Test Dental Practice',
      city: 'Chicago',
      state: 'IL',
    })

    expect(prisma.domains.create).toHaveBeenCalledWith({
      data: {
        user_id: 'user-123',
        name: 'Test Dental',
        domain: 'testdental.com',
        business_name: 'Test Dental Practice',
        city: 'Chicago',
        state: 'IL',
        status: 'ACTIVE',
        domain_settings: {
          create: {
            site_audit_max_pages: 100,
            site_audit_enable_javascript: true,
            local_seo_grid_size: 7,
            local_seo_radius_miles: 5,
          },
        },
      },
      include: {
        domain_settings: true,
      },
    })

    expect(result.id).toBe('domain-123')
    expect(result.name).toBe('Test Dental')
    expect(result.status).toBe('ACTIVE')
  })

  it('creates domain with minimal fields', async () => {
    const minimalDomain = {
      ...mockDomain,
      business_name: null,
      city: null,
      state: null,
    }
    ;(prisma.domains.create as Mock).mockResolvedValue(minimalDomain)

    const result = await createDomain({
      userId: 'user-123',
      name: 'Test Site',
      domain: 'testsite.com',
    })

    expect(result.businessName).toBeNull()
    expect(result.city).toBeNull()
    expect(result.state).toBeNull()
  })
})

describe('updateDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates domain fields', async () => {
    const updatedDomain = {
      ...mockDomain,
      name: 'Updated Name',
      business_name: 'Updated Business',
    }
    ;(prisma.domains.update as Mock).mockResolvedValue(updatedDomain)

    const result = await updateDomain('domain-123', 'user-123', {
      name: 'Updated Name',
      businessName: 'Updated Business',
    })

    expect(prisma.domains.update).toHaveBeenCalledWith({
      where: {
        id: 'domain-123',
        user_id: 'user-123',
      },
      data: {
        name: 'Updated Name',
        business_name: 'Updated Business',
        city: undefined,
        state: undefined,
        status: undefined,
      },
      include: {
        domain_settings: true,
      },
    })

    expect(result.name).toBe('Updated Name')
  })

  it('can update domain status', async () => {
    const archivedDomain = { ...mockDomain, status: 'ARCHIVED' as const }
    ;(prisma.domains.update as Mock).mockResolvedValue(archivedDomain)

    const result = await updateDomain('domain-123', 'user-123', {
      status: 'ARCHIVED',
    })

    expect(result.status).toBe('ARCHIVED')
  })
})

describe('archiveDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets domain status to ARCHIVED', async () => {
    ;(prisma.domains.update as Mock).mockResolvedValue({
      ...mockDomain,
      status: 'ARCHIVED',
    })

    await archiveDomain('domain-123', 'user-123')

    expect(prisma.domains.update).toHaveBeenCalledWith({
      where: {
        id: 'domain-123',
        user_id: 'user-123',
      },
      data: {
        status: 'ARCHIVED',
      },
    })
  })
})

describe('getDomainToolCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.audits.count as Mock).mockResolvedValue(5)
    ;(prisma.site_audit_scans.count as Mock).mockResolvedValue(3)
    ;(prisma.local_campaigns.count as Mock).mockResolvedValue(2)
    ;(prisma.seo_calculations.count as Mock).mockResolvedValue(8)
    ;(prisma.tracked_keywords.count as Mock).mockResolvedValue(15)
    ;(prisma.keyword_optimization_audits.count as Mock).mockResolvedValue(4)
    ;(prisma.keyword_tracking_runs.count as Mock).mockResolvedValue(6)
  })

  it('returns counts for all tool types', async () => {
    const result = await getDomainToolCounts('domain-123', 'user-123')

    expect(result).toEqual({
      audits: 5,
      siteScans: 3,
      localCampaigns: 2,
      seoCalculations: 8,
      trackedKeywords: 15,
      keywordAudits: 4,
      keywordTrackingRuns: 6,
    })
  })

  it('queries with correct filters', async () => {
    await getDomainToolCounts('domain-123', 'user-123')

    expect(prisma.audits.count).toHaveBeenCalledWith({
      where: {
        domain_id: 'domain-123',
        userId: 'user-123',
      },
    })

    expect(prisma.local_campaigns.count).toHaveBeenCalledWith({
      where: {
        domain_id: 'domain-123',
        user_id: 'user-123',
        status: 'ACTIVE',
      },
    })

    expect(prisma.tracked_keywords.count).toHaveBeenCalledWith({
      where: {
        domain_id: 'domain-123',
        user_id: 'user-123',
        is_active: true,
      },
    })
  })
})

describe('updateDomainSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates existing settings', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(mockDomain)
    ;(prisma.domain_settings.update as Mock).mockResolvedValue({})

    await updateDomainSettings('domain-123', 'user-123', {
      siteAuditMaxPages: 200,
      localSeoGridSize: 9,
    })

    expect(prisma.domain_settings.update).toHaveBeenCalledWith({
      where: {
        domain_id: 'domain-123',
      },
      data: {
        site_audit_max_pages: 200,
        local_seo_grid_size: 9,
      },
    })
  })

  it('creates settings if they do not exist', async () => {
    const domainWithoutSettings = { ...mockDomain, domain_settings: null }
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(domainWithoutSettings)
    ;(prisma.domain_settings.create as Mock).mockResolvedValue({})

    await updateDomainSettings('domain-123', 'user-123', {
      siteAuditMaxPages: 150,
    })

    expect(prisma.domain_settings.create).toHaveBeenCalledWith({
      data: {
        domain_id: 'domain-123',
        site_audit_max_pages: 150,
        site_audit_enable_javascript: true,
        local_seo_grid_size: 7,
        local_seo_radius_miles: 5,
      },
    })
  })

  it('throws error if domain not found', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(null)

    await expect(
      updateDomainSettings('nonexistent', 'user-123', {
        siteAuditMaxPages: 100,
      })
    ).rejects.toThrow('Domain not found')
  })

  it('only updates provided fields', async () => {
    ;(prisma.domains.findFirst as Mock).mockResolvedValue(mockDomain)
    ;(prisma.domain_settings.update as Mock).mockResolvedValue({})

    await updateDomainSettings('domain-123', 'user-123', {
      siteAuditEnableJavascript: false,
    })

    expect(prisma.domain_settings.update).toHaveBeenCalledWith({
      where: {
        domain_id: 'domain-123',
      },
      data: {
        site_audit_enable_javascript: false,
      },
    })
  })
})
