/**
 * Integration Tests for Audit Retry API Route
 *
 * Tests for:
 * - POST /api/audits/[id]/retry
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { POST } from '../route'
import { AuditStatus } from '@prisma/client'

// Use valid CUID format
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
  getAudit: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    audits: {
      update: vi.fn(),
    },
  },
}))

// Mock Inngest
vi.mock('@/lib/inngest', () => ({
  inngest: {
    send: vi.fn(),
  },
}))

import { getAudit } from '@/lib/db/audit-operations'
import { prisma } from '@/lib/prisma'
import { inngest } from '@/lib/inngest'

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
function createMockRequest(): Request {
  return new Request('http://localhost/api/audits/test-id/retry', {
    method: 'POST',
  })
}

// Note: validCuid is defined above and used for auth mock
const userCuid = validCuid // Use same ID for both auth and audit ownership

const createMockAudit = (status: AuditStatus) => ({
  id: validCuid,
  domain: 'example-dental.com',
  userId: userCuid,
  status,
  progress: status === 'COMPLETED' ? 100 : 50,
  currentStep: 'serp_analysis',
  errorMessage: status === 'FAILED' ? 'Rate limit exceeded' : null,
  createdAt: new Date(),
  startedAt: new Date(),
  completedAt: status === 'COMPLETED' ? new Date() : null,
})

describe('POST /api/audits/[id]/retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.audits.update as Mock).mockResolvedValue({})
    ;(inngest.send as Mock).mockResolvedValue(undefined)
  })

  it('retries failed audit successfully', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.FAILED))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.auditId).toBe(validCuid)
    expect(data.data.status).toBe('PENDING')
    expect(data.data.message).toBe('Audit has been queued for retry')
  })

  it('resets audit status for retry', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.FAILED))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    await POST(request, context)

    expect(prisma.audits.update).toHaveBeenCalledWith({
      where: { id: validCuid },
      data: expect.objectContaining({
        status: AuditStatus.PENDING,
        progress: 0,
        current_step: null,
        error_message: null,
        started_at: null,
        completed_at: null,
      }),
    })
  })

  it('triggers Inngest with skipCache true', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.FAILED))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    await POST(request, context)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'audit/requested',
      data: expect.objectContaining({
        auditId: validCuid,
        domain: 'example-dental.com',
        userId: userCuid,
        options: {
          skipCache: true,
        },
      }),
    })
  })

  it('returns 400 for completed audit', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.COMPLETED))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.code).toBe('INVALID_STATUS')
    expect(data.error).toContain('COMPLETED')
  })

  it('returns 400 for pending audit', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.PENDING))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.code).toBe('INVALID_STATUS')
  })

  it('returns 400 for in-progress audit', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.CRAWLING))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.code).toBe('INVALID_STATUS')
  })

  it('returns 400 for invalid UUID format', async () => {
    const request = createMockRequest()
    const context = createMockContext('not-a-valid-uuid')

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid audit ID format')
  })

  it('returns 404 when audit not found', async () => {
    ;(getAudit as Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Audit not found')
  })

  it('handles database errors gracefully', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.FAILED))
    ;(prisma.audits.update as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to retry audit')
  })

  it('handles Inngest errors gracefully', async () => {
    ;(getAudit as Mock).mockResolvedValue(createMockAudit(AuditStatus.FAILED))
    ;(inngest.send as Mock).mockRejectedValue(new Error('Inngest error'))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await POST(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
