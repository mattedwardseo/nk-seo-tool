/**
 * Integration Tests for Archive API Routes
 *
 * Tests for:
 * - GET /api/archive
 * - POST /api/archive (assign, archive, delete actions)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { GET, POST } from '../route'

// Mock auth - must be before other mocks
const mockUserId = 'user-123'
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    })
  ),
}))

// Mock archive operations
vi.mock('@/lib/db/archive-operations', () => ({
  getUnassignedData: vi.fn(),
  getArchivedData: vi.fn(),
  assignAuditsToDomain: vi.fn(),
  assignSiteAuditScansToDomain: vi.fn(),
  assignLocalCampaignsToDomain: vi.fn(),
  archiveAudits: vi.fn(),
  archiveSiteAuditScans: vi.fn(),
  archiveLocalCampaigns: vi.fn(),
  deleteArchivedAudits: vi.fn(),
  deleteArchivedSiteAuditScans: vi.fn(),
  deleteArchivedLocalCampaigns: vi.fn(),
}))

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
} from '@/lib/db/archive-operations'

// Sample data for tests
const mockUnassignedData = {
  audits: [{ id: 'audit-1', domain: 'test.com', status: 'COMPLETED', createdAt: new Date() }],
  siteAuditScans: [{ id: 'scan-1', domain: 'test.com', status: 'COMPLETED', createdAt: new Date(), maxCrawlPages: 100 }],
  localCampaigns: [{ id: 'campaign-1', businessName: 'Test', keywords: ['test'], status: 'ACTIVE', createdAt: new Date() }],
  totalCount: 3,
}

const mockArchivedData = {
  audits: [{ id: 'archived-1', domain: 'old.com', status: 'COMPLETED', createdAt: new Date(), archivedAt: new Date() }],
  siteAuditScans: [],
  localCampaigns: [],
  totalCount: 1,
}

// Helper to create mock Request objects
function createMockRequest(options: { method?: string; body?: unknown; url?: string }): Request {
  const { method = 'POST', body, url = 'http://localhost/api/archive' } = options

  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/archive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getUnassignedData as Mock).mockResolvedValue(mockUnassignedData)
    ;(getArchivedData as Mock).mockResolvedValue(mockArchivedData)
  })

  it('returns unassigned and archived data', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Check structure rather than deep equality (Date objects serialize to strings)
    expect(data.data.unassigned.audits).toHaveLength(1)
    expect(data.data.unassigned.siteAuditScans).toHaveLength(1)
    expect(data.data.unassigned.localCampaigns).toHaveLength(1)
    expect(data.data.unassigned.totalCount).toBe(3)
    expect(data.data.archived.audits).toHaveLength(1)
    expect(data.data.archived.totalCount).toBe(1)
  })

  it('calls operations with correct user ID', async () => {
    await GET()

    expect(getUnassignedData).toHaveBeenCalledWith(mockUserId)
    expect(getArchivedData).toHaveBeenCalledWith(mockUserId)
  })

  it('returns 401 for unauthenticated user', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth as Mock).mockResolvedValueOnce(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('handles database errors gracefully', async () => {
    ;(getUnassignedData as Mock).mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch archive data')
  })
})

describe('POST /api/archive - Assign Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(assignAuditsToDomain as Mock).mockResolvedValue(2)
    ;(assignSiteAuditScansToDomain as Mock).mockResolvedValue(1)
    ;(assignLocalCampaignsToDomain as Mock).mockResolvedValue(1)
  })

  it('assigns audits to domain', async () => {
    const request = createMockRequest({
      body: {
        action: 'assign',
        type: 'audits',
        ids: ['audit-1', 'audit-2'],
        domainId: 'domain-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('assign')
    expect(data.data.type).toBe('audits')
    expect(data.data.count).toBe(2)

    expect(assignAuditsToDomain).toHaveBeenCalledWith(
      mockUserId,
      ['audit-1', 'audit-2'],
      'domain-123'
    )
  })

  it('assigns site audit scans to domain', async () => {
    const request = createMockRequest({
      body: {
        action: 'assign',
        type: 'siteAuditScans',
        ids: ['scan-1'],
        domainId: 'domain-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(assignSiteAuditScansToDomain).toHaveBeenCalledWith(
      mockUserId,
      ['scan-1'],
      'domain-123'
    )
  })

  it('assigns local campaigns to domain', async () => {
    const request = createMockRequest({
      body: {
        action: 'assign',
        type: 'localCampaigns',
        ids: ['campaign-1'],
        domainId: 'domain-123',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(assignLocalCampaignsToDomain).toHaveBeenCalledWith(
      mockUserId,
      ['campaign-1'],
      'domain-123'
    )
  })

  it('returns 400 for assign without domainId', async () => {
    const request = createMockRequest({
      body: {
        action: 'assign',
        type: 'audits',
        ids: ['audit-1'],
        // domainId missing
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid request')
  })
})

describe('POST /api/archive - Archive Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(archiveAudits as Mock).mockResolvedValue(2)
    ;(archiveSiteAuditScans as Mock).mockResolvedValue(1)
    ;(archiveLocalCampaigns as Mock).mockResolvedValue(1)
  })

  it('archives audits', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'audits',
        ids: ['audit-1', 'audit-2'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('archive')
    expect(data.data.type).toBe('audits')
    expect(data.data.count).toBe(2)

    expect(archiveAudits).toHaveBeenCalledWith(mockUserId, ['audit-1', 'audit-2'])
  })

  it('archives site audit scans', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'siteAuditScans',
        ids: ['scan-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(archiveSiteAuditScans).toHaveBeenCalledWith(mockUserId, ['scan-1'])
  })

  it('archives local campaigns', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'localCampaigns',
        ids: ['campaign-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(archiveLocalCampaigns).toHaveBeenCalledWith(mockUserId, ['campaign-1'])
  })
})

describe('POST /api/archive - Delete Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(deleteArchivedAudits as Mock).mockResolvedValue(2)
    ;(deleteArchivedSiteAuditScans as Mock).mockResolvedValue(1)
    ;(deleteArchivedLocalCampaigns as Mock).mockResolvedValue(1)
  })

  it('deletes archived audits', async () => {
    const request = createMockRequest({
      body: {
        action: 'delete',
        type: 'audits',
        ids: ['archived-1', 'archived-2'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.action).toBe('delete')
    expect(data.data.type).toBe('audits')
    expect(data.data.count).toBe(2)

    expect(deleteArchivedAudits).toHaveBeenCalledWith(mockUserId, ['archived-1', 'archived-2'])
  })

  it('deletes archived site audit scans', async () => {
    const request = createMockRequest({
      body: {
        action: 'delete',
        type: 'siteAuditScans',
        ids: ['scan-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(deleteArchivedSiteAuditScans).toHaveBeenCalledWith(mockUserId, ['scan-1'])
  })

  it('deletes archived local campaigns', async () => {
    const request = createMockRequest({
      body: {
        action: 'delete',
        type: 'localCampaigns',
        ids: ['campaign-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.data.count).toBe(1)
    expect(deleteArchivedLocalCampaigns).toHaveBeenCalledWith(mockUserId, ['campaign-1'])
  })
})

describe('POST /api/archive - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid action', async () => {
    const request = createMockRequest({
      body: {
        action: 'invalid',
        type: 'audits',
        ids: ['audit-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid request')
  })

  it('returns 400 for invalid type', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'invalidType',
        ids: ['audit-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns 400 for empty ids array', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'audits',
        ids: [],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns 400 for missing ids', async () => {
    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'audits',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns 401 for unauthenticated user', async () => {
    const { auth } = await import('@/lib/auth')
    ;(auth as Mock).mockResolvedValueOnce(null)

    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'audits',
        ids: ['audit-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('handles database errors gracefully', async () => {
    ;(archiveAudits as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({
      body: {
        action: 'archive',
        type: 'audits',
        ids: ['audit-1'],
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to perform action')
  })
})
