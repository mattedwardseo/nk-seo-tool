/**
 * Integration Tests for Audit Details API Routes
 *
 * Tests for:
 * - GET /api/audits/[id]
 * - DELETE /api/audits/[id]
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { GET, DELETE } from '../route'

// Use valid CUID format (not UUID) - matches z.string().cuid() validation
const validCuid = 'clrnj8pu40000l208l8vz3b3e'

// Mock auth - must be before other mocks
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: validCuid, email: 'test@example.com', name: 'Test User' },
    })
  ),
}))

// Mock audit operations
vi.mock('@/lib/db/audit-operations', () => ({
  getFullAuditResult: vi.fn(),
  deleteAudit: vi.fn(),
}))

import { getFullAuditResult, deleteAudit } from '@/lib/db/audit-operations'

// Helper types
interface RouteContext {
  params: Promise<{ id: string }>
}

// Helper to create mock context
function createMockContext(id: string): RouteContext {
  return {
    params: Promise.resolve({ id }),
  }
}

// Helper to create mock Request objects
function createMockRequest(method: string = 'GET'): Request {
  return new Request(`http://localhost/api/audits/test-id`, { method })
}

const mockAuditResult = {
  id: validCuid,
  userId: validCuid,
  domain: 'example-dental.com',
  status: 'COMPLETED',
  progress: 100,
  currentStep: 'scoring',
  scores: {
    overall: 75,
    technical: 80,
    content: 70,
    local: 85,
    backlinks: 65,
  },
  stepResults: {
    onpage: { pageSpeed: 85, mobileScore: 90 },
    serp: { avgPosition: 5, top10Count: 7 },
    backlinks: { referringDomains: 50 },
    business: { hasGmbListing: true },
  },
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
}

describe('GET /api/audits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getFullAuditResult as Mock).mockResolvedValue(mockAuditResult)
  })

  it('returns audit details for valid ID', async () => {
    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(validCuid)
    expect(data.data.domain).toBe('example-dental.com')
    expect(data.data.scores).toBeDefined()
    expect(data.data.stepResults).toBeDefined()
  })

  it('returns 400 for invalid UUID format', async () => {
    const request = createMockRequest()
    const context = createMockContext('not-a-valid-uuid')

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid audit ID format')
  })

  it('returns 404 when audit not found', async () => {
    ;(getFullAuditResult as Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Audit not found')
  })

  it('handles database errors gracefully', async () => {
    ;(getFullAuditResult as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch audit')
  })

  it('calls getFullAuditResult with correct ID', async () => {
    const request = createMockRequest()
    const context = createMockContext(validCuid)

    await GET(request, context)

    expect(getFullAuditResult).toHaveBeenCalledWith(validCuid)
  })
})

describe('DELETE /api/audits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getFullAuditResult as Mock).mockResolvedValue(mockAuditResult)
    ;(deleteAudit as Mock).mockResolvedValue(undefined)
  })

  it('deletes audit for valid ID', async () => {
    const request = createMockRequest('DELETE')
    const context = createMockContext(validCuid)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Audit deleted successfully')
    expect(deleteAudit).toHaveBeenCalledWith(validCuid)
  })

  it('returns 400 for invalid UUID format', async () => {
    const request = createMockRequest('DELETE')
    const context = createMockContext('not-a-valid-uuid')

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid audit ID format')
  })

  it('returns 404 when audit not found', async () => {
    ;(getFullAuditResult as Mock).mockResolvedValue(null)

    const request = createMockRequest('DELETE')
    const context = createMockContext(validCuid)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Audit not found')
  })

  it('handles database errors gracefully', async () => {
    ;(deleteAudit as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('DELETE')
    const context = createMockContext(validCuid)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to delete audit')
  })

  it('checks if audit exists before deleting', async () => {
    const request = createMockRequest('DELETE')
    const context = createMockContext(validCuid)

    await DELETE(request, context)

    expect(getFullAuditResult).toHaveBeenCalledWith(validCuid)
    expect(deleteAudit).toHaveBeenCalledWith(validCuid)
  })
})
