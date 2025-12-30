/**
 * Integration Tests for Audit API Routes
 *
 * Tests for:
 * - POST /api/audits
 * - GET /api/audits
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { POST, GET } from '../route'

// Mock auth - must be before other mocks that import from auth-dependent modules
const mockUserId = 'clrnj8pu40000l208l8vz3b3e'
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: mockUserId, email: 'test@example.com', name: 'Test User' },
    })
  ),
}))

// Mock audit operations
vi.mock('@/lib/db/audit-operations', () => ({
  createAudit: vi.fn(),
  getUserAudits: vi.fn(),
  wasRecentlyAudited: vi.fn(),
}))

// Mock Inngest
vi.mock('@/lib/inngest', () => ({
  inngest: {
    send: vi.fn(),
  },
}))

import { createAudit, getUserAudits, wasRecentlyAudited } from '@/lib/db/audit-operations'
import { inngest } from '@/lib/inngest'

// Helper to create mock Request objects
function createMockRequest(options: { method?: string; body?: unknown; url?: string }): Request {
  const { method = 'POST', body, url = 'http://localhost/api/audits' } = options

  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/audits', () => {
  // Use valid CUID format (not UUID) - matches z.string().cuid() validation
  const validCuid = 'clrnj8pu40000l208l8vz3b3e'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(wasRecentlyAudited as Mock).mockResolvedValue(false)
    ;(createAudit as Mock).mockResolvedValue(validCuid)
    ;(inngest.send as Mock).mockResolvedValue(undefined)
  })

  it('creates audit with valid domain and userId', async () => {
    const request = createMockRequest({
      body: {
        domain: 'example-dental.com',
        userId: validCuid,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.auditId).toBe(validCuid)
    expect(data.data.status).toBe('PENDING')
    expect(createAudit).toHaveBeenCalledWith({
      userId: validCuid,
      domain: 'example-dental.com',
    })
    expect(inngest.send).toHaveBeenCalled()
  })

  it('normalizes domain by removing protocol and trailing slash', async () => {
    const request = createMockRequest({
      body: {
        domain: 'https://Example-Dental.com/',
        userId: validCuid,
      },
    })

    await POST(request)

    expect(createAudit).toHaveBeenCalledWith({
      userId: validCuid,
      domain: 'example-dental.com',
    })
  })

  it('returns 400 for missing domain', async () => {
    const request = createMockRequest({
      body: {
        userId: validCuid,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation failed')
  })

  it('returns 401 for unauthenticated user', async () => {
    // Override auth mock to return null session
    const { auth } = await import('@/lib/auth')
    ;(auth as Mock).mockResolvedValueOnce(null)

    const request = createMockRequest({
      body: {
        domain: 'example.com',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 429 if domain was recently audited', async () => {
    ;(wasRecentlyAudited as Mock).mockResolvedValue(true)

    const request = createMockRequest({
      body: {
        domain: 'example.com',
        userId: validCuid,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.code).toBe('RATE_LIMITED')
  })

  it('bypasses rate limit with skipCache option', async () => {
    ;(wasRecentlyAudited as Mock).mockResolvedValue(true)

    const request = createMockRequest({
      body: {
        domain: 'example.com',
        userId: validCuid,
        options: { skipCache: true },
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
  })

  it('returns 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid JSON in request body')
  })

  it('passes options to Inngest event', async () => {
    const request = createMockRequest({
      body: {
        domain: 'example.com',
        userId: validCuid,
        options: {
          priority: 'high',
          keywords: ['dentist', 'dental care'],
        },
      },
    })

    await POST(request)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'audit/requested',
      data: expect.objectContaining({
        options: {
          priority: 'high',
          keywords: ['dentist', 'dental care'],
        },
      }),
    })
  })

  it('handles database errors gracefully', async () => {
    ;(createAudit as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({
      body: {
        domain: 'example.com',
        userId: validCuid,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to create audit')
  })
})

describe('GET /api/audits', () => {
  // Use valid CUID format (not UUID) - matches z.string().cuid() validation
  const validCuid = 'clrnj8pu40002l208l8vz3b3g'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getUserAudits as Mock).mockResolvedValue({
      audits: [
        {
          id: validCuid,
          domain: 'example.com',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })
  })

  it('returns audits for valid userId', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: `http://localhost/api/audits?userId=${validCuid}`,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.pagination).toBeDefined()
  })

  it('returns 401 for unauthenticated user', async () => {
    // Override auth mock to return null session
    const { auth } = await import('@/lib/auth')
    ;(auth as Mock).mockResolvedValueOnce(null)

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost/api/audits',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('supports pagination parameters', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: `http://localhost/api/audits?userId=${validCuid}&page=2&limit=20`,
    })

    await GET(request)

    expect(getUserAudits).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
      })
    )
  })

  it('supports status filter', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: `http://localhost/api/audits?userId=${validCuid}&status=COMPLETED`,
    })

    await GET(request)

    expect(getUserAudits).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'COMPLETED',
      })
    )
  })

  it('uses default pagination values', async () => {
    const request = createMockRequest({
      method: 'GET',
      url: `http://localhost/api/audits?userId=${validCuid}`,
    })

    await GET(request)

    expect(getUserAudits).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      })
    )
  })

  it('handles database errors gracefully', async () => {
    ;(getUserAudits as Mock).mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({
      method: 'GET',
      url: `http://localhost/api/audits?userId=${validCuid}`,
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
