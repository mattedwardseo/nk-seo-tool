/**
 * Keywords API Routes
 *
 * GET /api/keywords?domain=xxx - List tracked keywords for a domain
 * POST /api/keywords - Add keyword(s) to track for a domain
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  getTrackedKeywords,
  addTrackedKeywords,
  normalizeDomain,
} from '@/lib/db/keyword-operations'

// Schema for GET query params
const getQuerySchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
})

// Schema for POST body
const addKeywordsSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  keywords: z
    .array(z.string().min(1).max(255))
    .min(1, 'At least one keyword is required')
    .max(50, 'Maximum 50 keywords per request'),
})

/**
 * GET /api/keywords?domain=xxx
 * List all active tracked keywords for a domain
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain')

    const validation = getQuerySchema.safeParse({ domain })
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const keywords = await getTrackedKeywords(
      session.user.id,
      validation.data.domain
    )

    return NextResponse.json({
      success: true,
      data: {
        domain: normalizeDomain(validation.data.domain),
        keywords: keywords.map((k) => ({
          id: k.id,
          keyword: k.keyword,
          isActive: k.is_active,
          createdAt: k.created_at.toISOString(),
        })),
        count: keywords.length,
      },
    })
  } catch (error) {
    console.error('Error fetching keywords:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch keywords' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/keywords
 * Add keyword(s) to track for a domain
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse body
    const body = await request.json()
    const validation = addKeywordsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { domain, keywords } = validation.data

    const result = await addTrackedKeywords(session.user.id, domain, keywords)

    // Fetch the updated list
    const updatedKeywords = await getTrackedKeywords(session.user.id, domain)

    return NextResponse.json({
      success: true,
      data: {
        domain: normalizeDomain(domain),
        added: result.added,
        existing: result.existing,
        keywords: updatedKeywords.map((k) => ({
          id: k.id,
          keyword: k.keyword,
          isActive: k.is_active,
          createdAt: k.created_at.toISOString(),
        })),
        count: updatedKeywords.length,
      },
    })
  } catch (error) {
    console.error('Error adding keywords:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add keywords' },
      { status: 500 }
    )
  }
}
