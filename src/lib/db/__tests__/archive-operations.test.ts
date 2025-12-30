/**
 * Unit Tests for Archive Operations
 *
 * Tests for:
 * - getUnassignedData
 * - getArchivedData
 * - assignAuditsToDomain
 * - assignSiteAuditScansToDomain
 * - assignLocalCampaignsToDomain
 * - archiveAudits
 * - archiveSiteAuditScans
 * - archiveLocalCampaigns
 * - deleteArchivedAudits
 * - deleteArchivedSiteAuditScans
 * - deleteArchivedLocalCampaigns
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    audits: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    site_audit_scans: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    local_campaigns: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    archived_audits: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    archived_site_audit_scans: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    archived_local_campaigns: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  getUnassignedData,
  getArchivedData,
  assignAuditsToDomain,
  assignSiteAuditScansToDomain,
  assignLocalCampaignsToDomain,
  archiveAudits,
  archiveSiteAuditScans,
  archiveLocalCampaigns,
  deleteArchivedAudits,
  deleteArchivedSiteAuditScans,
  deleteArchivedLocalCampaigns,
} from '../archive-operations'

// Sample test data
const mockUnassignedAudits = [
  {
    id: 'audit-1',
    domain: 'testdental.com',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'audit-2',
    domain: 'example.com',
    status: 'PENDING',
    createdAt: new Date('2024-01-02'),
  },
]

const mockUnassignedScans = [
  {
    id: 'scan-1',
    domain: 'testdental.com',
    status: 'COMPLETED',
    created_at: new Date('2024-01-01'),
    max_crawl_pages: 100,
  },
]

const mockUnassignedCampaigns = [
  {
    id: 'campaign-1',
    business_name: 'Test Dental',
    keywords: ['dentist chicago', 'dental implants'],
    status: 'ACTIVE',
    created_at: new Date('2024-01-01'),
  },
]

const mockArchivedAudits = [
  {
    id: 'archived-audit-1',
    userId: 'user-123',
    domain: 'old-site.com',
    status: 'COMPLETED',
    createdAt: new Date('2023-01-01'),
    archived_at: new Date('2024-01-01'),
  },
]

const mockArchivedScans = [
  {
    id: 'archived-scan-1',
    user_id: 'user-123',
    domain: 'old-site.com',
    status: 'COMPLETED',
    created_at: new Date('2023-01-01'),
    archived_at: new Date('2024-01-01'),
  },
]

const mockArchivedCampaigns = [
  {
    id: 'archived-campaign-1',
    user_id: 'user-123',
    business_name: 'Old Business',
    created_at: new Date('2023-01-01'),
    archived_at: new Date('2024-01-01'),
  },
]

describe('getUnassignedData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unassigned data for all types', async () => {
    ;(prisma.audits.findMany as Mock).mockResolvedValue(mockUnassignedAudits)
    ;(prisma.site_audit_scans.findMany as Mock).mockResolvedValue(mockUnassignedScans)
    ;(prisma.local_campaigns.findMany as Mock).mockResolvedValue(mockUnassignedCampaigns)

    const result = await getUnassignedData('user-123')

    expect(result.audits).toHaveLength(2)
    expect(result.siteAuditScans).toHaveLength(1)
    expect(result.localCampaigns).toHaveLength(1)
    expect(result.totalCount).toBe(4)
  })

  it('queries with domain_id = null filter', async () => {
    ;(prisma.audits.findMany as Mock).mockResolvedValue([])
    ;(prisma.site_audit_scans.findMany as Mock).mockResolvedValue([])
    ;(prisma.local_campaigns.findMany as Mock).mockResolvedValue([])

    await getUnassignedData('user-123')

    expect(prisma.audits.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        domain_id: null,
      },
      select: {
        id: true,
        domain: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(prisma.site_audit_scans.findMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-123',
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
    })

    expect(prisma.local_campaigns.findMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-123',
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
    })
  })

  it('transforms field names to camelCase', async () => {
    ;(prisma.audits.findMany as Mock).mockResolvedValue([])
    ;(prisma.site_audit_scans.findMany as Mock).mockResolvedValue(mockUnassignedScans)
    ;(prisma.local_campaigns.findMany as Mock).mockResolvedValue(mockUnassignedCampaigns)

    const result = await getUnassignedData('user-123')

    expect(result.siteAuditScans[0].createdAt).toBeInstanceOf(Date)
    expect(result.siteAuditScans[0].maxCrawlPages).toBe(100)
    expect(result.localCampaigns[0].businessName).toBe('Test Dental')
    expect(result.localCampaigns[0].keywords).toEqual(['dentist chicago', 'dental implants'])
  })

  it('returns empty arrays when no unassigned data', async () => {
    ;(prisma.audits.findMany as Mock).mockResolvedValue([])
    ;(prisma.site_audit_scans.findMany as Mock).mockResolvedValue([])
    ;(prisma.local_campaigns.findMany as Mock).mockResolvedValue([])

    const result = await getUnassignedData('user-123')

    expect(result.audits).toEqual([])
    expect(result.siteAuditScans).toEqual([])
    expect(result.localCampaigns).toEqual([])
    expect(result.totalCount).toBe(0)
  })
})

describe('getArchivedData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns archived data for all types', async () => {
    ;(prisma.archived_audits.findMany as Mock).mockResolvedValue(mockArchivedAudits)
    ;(prisma.archived_site_audit_scans.findMany as Mock).mockResolvedValue(mockArchivedScans)
    ;(prisma.archived_local_campaigns.findMany as Mock).mockResolvedValue(mockArchivedCampaigns)

    const result = await getArchivedData('user-123')

    expect(result.audits).toHaveLength(1)
    expect(result.siteAuditScans).toHaveLength(1)
    expect(result.localCampaigns).toHaveLength(1)
    expect(result.totalCount).toBe(3)
  })

  it('includes archivedAt timestamp', async () => {
    ;(prisma.archived_audits.findMany as Mock).mockResolvedValue(mockArchivedAudits)
    ;(prisma.archived_site_audit_scans.findMany as Mock).mockResolvedValue(mockArchivedScans)
    ;(prisma.archived_local_campaigns.findMany as Mock).mockResolvedValue(mockArchivedCampaigns)

    const result = await getArchivedData('user-123')

    expect(result.audits[0].archivedAt).toBeInstanceOf(Date)
    expect(result.siteAuditScans[0].archivedAt).toBeInstanceOf(Date)
    expect(result.localCampaigns[0].archivedAt).toBeInstanceOf(Date)
  })

  it('orders by archived_at descending', async () => {
    ;(prisma.archived_audits.findMany as Mock).mockResolvedValue([])
    ;(prisma.archived_site_audit_scans.findMany as Mock).mockResolvedValue([])
    ;(prisma.archived_local_campaigns.findMany as Mock).mockResolvedValue([])

    await getArchivedData('user-123')

    expect(prisma.archived_audits.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { archived_at: 'desc' },
    })
  })
})

describe('assignAuditsToDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns audits to domain and returns count', async () => {
    ;(prisma.audits.updateMany as Mock).mockResolvedValue({ count: 2 })

    const result = await assignAuditsToDomain('user-123', ['audit-1', 'audit-2'], 'domain-123')

    expect(prisma.audits.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['audit-1', 'audit-2'] },
        userId: 'user-123',
        domain_id: null,
      },
      data: {
        domain_id: 'domain-123',
      },
    })

    expect(result).toBe(2)
  })

  it('returns 0 when no audits found', async () => {
    ;(prisma.audits.updateMany as Mock).mockResolvedValue({ count: 0 })

    const result = await assignAuditsToDomain('user-123', ['nonexistent'], 'domain-123')

    expect(result).toBe(0)
  })
})

describe('assignSiteAuditScansToDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns scans to domain and returns count', async () => {
    ;(prisma.site_audit_scans.updateMany as Mock).mockResolvedValue({ count: 1 })

    const result = await assignSiteAuditScansToDomain('user-123', ['scan-1'], 'domain-123')

    expect(prisma.site_audit_scans.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['scan-1'] },
        user_id: 'user-123',
        domain_id: null,
      },
      data: {
        domain_id: 'domain-123',
      },
    })

    expect(result).toBe(1)
  })
})

describe('assignLocalCampaignsToDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assigns campaigns to domain and returns count', async () => {
    ;(prisma.local_campaigns.updateMany as Mock).mockResolvedValue({ count: 1 })

    const result = await assignLocalCampaignsToDomain('user-123', ['campaign-1'], 'domain-123')

    expect(prisma.local_campaigns.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['campaign-1'] },
        user_id: 'user-123',
        domain_id: null,
      },
      data: {
        domain_id: 'domain-123',
      },
    })

    expect(result).toBe(1)
  })
})

describe('archiveAudits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('moves audits to archive and deletes originals', async () => {
    const auditsToArchive = [
      {
        id: 'audit-1',
        userId: 'user-123',
        domain: 'test.com',
        status: 'COMPLETED',
        createdAt: new Date('2024-01-01'),
        step_results: { test: 'data' },
      },
    ]
    ;(prisma.audits.findMany as Mock).mockResolvedValue(auditsToArchive)
    ;(prisma.archived_audits.createMany as Mock).mockResolvedValue({ count: 1 })
    ;(prisma.audits.deleteMany as Mock).mockResolvedValue({ count: 1 })

    const result = await archiveAudits('user-123', ['audit-1'])

    expect(prisma.audits.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['audit-1'] },
        userId: 'user-123',
      },
      select: {
        id: true,
        userId: true,
        domain: true,
        status: true,
        createdAt: true,
        step_results: true,
      },
    })

    expect(prisma.archived_audits.createMany).toHaveBeenCalledWith({
      data: [
        {
          id: 'audit-1',
          userId: 'user-123',
          domain: 'test.com',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-01'),
          step_results: { test: 'data' },
        },
      ],
    })

    expect(prisma.audits.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['audit-1'] },
        userId: 'user-123',
      },
    })

    expect(result).toBe(1)
  })

  it('returns 0 when no audits found', async () => {
    ;(prisma.audits.findMany as Mock).mockResolvedValue([])

    const result = await archiveAudits('user-123', ['nonexistent'])

    expect(result).toBe(0)
    expect(prisma.archived_audits.createMany).not.toHaveBeenCalled()
    expect(prisma.audits.deleteMany).not.toHaveBeenCalled()
  })
})

describe('archiveSiteAuditScans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('moves scans to archive and deletes originals', async () => {
    const scansToArchive = [
      {
        id: 'scan-1',
        user_id: 'user-123',
        domain: 'test.com',
        status: 'COMPLETED',
        created_at: new Date('2024-01-01'),
      },
    ]
    ;(prisma.site_audit_scans.findMany as Mock).mockResolvedValue(scansToArchive)
    ;(prisma.archived_site_audit_scans.createMany as Mock).mockResolvedValue({ count: 1 })
    ;(prisma.site_audit_scans.deleteMany as Mock).mockResolvedValue({ count: 1 })

    const result = await archiveSiteAuditScans('user-123', ['scan-1'])

    expect(result).toBe(1)
    expect(prisma.archived_site_audit_scans.createMany).toHaveBeenCalled()
    expect(prisma.site_audit_scans.deleteMany).toHaveBeenCalled()
  })
})

describe('archiveLocalCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('moves campaigns to archive and deletes originals', async () => {
    const campaignsToArchive = [
      {
        id: 'campaign-1',
        user_id: 'user-123',
        business_name: 'Test Business',
        created_at: new Date('2024-01-01'),
      },
    ]
    ;(prisma.local_campaigns.findMany as Mock).mockResolvedValue(campaignsToArchive)
    ;(prisma.archived_local_campaigns.createMany as Mock).mockResolvedValue({ count: 1 })
    ;(prisma.local_campaigns.deleteMany as Mock).mockResolvedValue({ count: 1 })

    const result = await archiveLocalCampaigns('user-123', ['campaign-1'])

    expect(result).toBe(1)
    expect(prisma.archived_local_campaigns.createMany).toHaveBeenCalled()
    expect(prisma.local_campaigns.deleteMany).toHaveBeenCalled()
  })
})

describe('deleteArchivedAudits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permanently deletes archived audits', async () => {
    ;(prisma.archived_audits.deleteMany as Mock).mockResolvedValue({ count: 2 })

    const result = await deleteArchivedAudits('user-123', ['audit-1', 'audit-2'])

    expect(prisma.archived_audits.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['audit-1', 'audit-2'] },
        userId: 'user-123',
      },
    })

    expect(result).toBe(2)
  })
})

describe('deleteArchivedSiteAuditScans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permanently deletes archived scans', async () => {
    ;(prisma.archived_site_audit_scans.deleteMany as Mock).mockResolvedValue({ count: 1 })

    const result = await deleteArchivedSiteAuditScans('user-123', ['scan-1'])

    expect(prisma.archived_site_audit_scans.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['scan-1'] },
        user_id: 'user-123',
      },
    })

    expect(result).toBe(1)
  })
})

describe('deleteArchivedLocalCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permanently deletes archived campaigns', async () => {
    ;(prisma.archived_local_campaigns.deleteMany as Mock).mockResolvedValue({ count: 1 })

    const result = await deleteArchivedLocalCampaigns('user-123', ['campaign-1'])

    expect(prisma.archived_local_campaigns.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['campaign-1'] },
        user_id: 'user-123',
      },
    })

    expect(result).toBe(1)
  })
})
