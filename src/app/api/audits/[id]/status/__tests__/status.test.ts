/**
 * Integration Tests for Audit Status API Route
 *
 * Tests for:
 * - GET /api/audits/[id]/status
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { GET } from '../route'

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
  getAuditStatus: vi.fn(),
}))

import { getAuditStatus } from '@/lib/db/audit-operations'

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
  return new Request('http://localhost/api/audits/test-id/status')
}

describe('GET /api/audits/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns status for completed audit', async () => {
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'scoring',
      errorMessage: null,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('COMPLETED')
    expect(data.data.progress).toBe(100)
    expect(data.data.isComplete).toBe(true)
    expect(data.data.isFailed).toBe(false)
    expect(data.data.isInProgress).toBe(false)
  })

  it('returns status for in-progress audit', async () => {
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'CRAWLING',
      progress: 25,
      currentStep: 'onpage_crawl',
      errorMessage: null,
      startedAt: new Date(Date.now() - 30000),
      completedAt: null,
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('CRAWLING')
    expect(data.data.progress).toBe(25)
    expect(data.data.isComplete).toBe(false)
    expect(data.data.isInProgress).toBe(true)
  })

  it('returns status for failed audit', async () => {
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'FAILED',
      progress: 50,
      currentStep: 'serp_analysis',
      errorMessage: 'Rate limit exceeded',
      startedAt: new Date(Date.now() - 60000),
      completedAt: null,
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('FAILED')
    expect(data.data.isFailed).toBe(true)
    expect(data.data.errorMessage).toBe('Rate limit exceeded')
  })

  it('includes current step description', async () => {
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'ANALYZING',
      progress: 50,
      currentStep: 'serp_analysis',
      errorMessage: null,
      startedAt: new Date(Date.now() - 30000),
      completedAt: null,
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(data.data.currentStepDescription).toBe('Checking keyword rankings and search presence')
  })

  it('calculates estimated time remaining', async () => {
    // Started 30 seconds ago, 50% complete
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'ANALYZING',
      progress: 50,
      currentStep: 'backlinks_analysis',
      errorMessage: null,
      startedAt: new Date(Date.now() - 30000),
      completedAt: null,
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    // Should estimate ~30 seconds remaining (same time to go 50% more)
    expect(data.data.estimatedSecondsRemaining).toBeGreaterThan(20)
    expect(data.data.estimatedSecondsRemaining).toBeLessThan(40)
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
    ;(getAuditStatus as Mock).mockResolvedValue(null)

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Audit not found')
  })

  it('handles database errors gracefully', async () => {
    ;(getAuditStatus as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch audit status')
  })

  it('handles null startedAt gracefully', async () => {
    ;(getAuditStatus as Mock).mockResolvedValue({
      id: validCuid,
      status: 'PENDING',
      progress: 0,
      currentStep: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    })

    const request = createMockRequest()
    const context = createMockContext(validCuid)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.estimatedSecondsRemaining).toBeNull()
  })
})
