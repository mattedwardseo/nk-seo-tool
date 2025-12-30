/**
 * POST /api/seo-audit/analyze - Run a keyword optimization audit
 * GET /api/seo-audit/analyze - List keyword audits for authenticated user
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  createKeywordAudit,
  updateKeywordAuditStatus,
  saveKeywordAuditData,
  saveKeywordAuditReport,
  getUserKeywordAudits,
} from '@/lib/db/keyword-audit-operations'
import { gatherKeywordOptimizationData } from '@/lib/seo/keyword-optimization-service'
import { generateKeywordOptimizationReport } from '@/lib/seo/report-generator'

/**
 * Request validation schema for creating an audit
 */
const createAuditSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .max(2000)
    .transform((val) => {
      // Ensure URL has protocol
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`
      }
      return val
    }),
  targetKeyword: z.string().min(1, 'Target keyword is required').max(255),
  locationName: z.string().max(200).optional(),
  languageCode: z.string().max(5).optional().default('en'),
  domainId: z.string().optional(),
})

/**
 * Query params schema for listing audits
 */
const listAuditsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['PENDING', 'ANALYZING', 'COMPLETED', 'FAILED']).optional(),
  domainId: z.string().optional(),
})

/**
 * POST /api/seo-audit/analyze
 * Create and run a keyword optimization audit synchronously
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate request body
    const parseResult = createAuditSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { url, targetKeyword, locationName, languageCode, domainId } = parseResult.data

    // Create audit record
    const auditId = await createKeywordAudit({
      userId,
      domainId,
      url,
      targetKeyword,
      locationName,
      languageCode,
    })

    // Update status to analyzing
    await updateKeywordAuditStatus(auditId, 'ANALYZING')

    try {
      // Step 1: Gather data from DataForSEO
      console.log(`[SEO Audit] Gathering data for ${url} - "${targetKeyword}"`)
      const data = await gatherKeywordOptimizationData(url, targetKeyword, locationName)

      // Save the raw data
      await saveKeywordAuditData(auditId, data)
      console.log(`[SEO Audit] Data gathered. API cost: $${data.apiCost.toFixed(4)}`)

      // Step 2: Generate report using Claude
      console.log(`[SEO Audit] Generating report with Claude...`)
      const report = await generateKeywordOptimizationReport(url, data)

      // Save the report
      await saveKeywordAuditReport(auditId, report)
      console.log(`[SEO Audit] Report generated. Overall score: ${report.scores.overall}/100`)

      return NextResponse.json(
        {
          success: true,
          data: {
            auditId,
            url,
            targetKeyword,
            status: 'COMPLETED',
            scores: report.scores,
            executiveSummary: report.executiveSummary,
            apiCost: data.apiCost,
          },
        },
        { status: 201 }
      )
    } catch (analysisError) {
      console.error(`[SEO Audit] Analysis failed:`, analysisError)

      // Update status to failed
      const errorMessage =
        analysisError instanceof Error ? analysisError.message : 'Analysis failed'
      await updateKeywordAuditStatus(auditId, 'FAILED', errorMessage)

      return NextResponse.json(
        {
          success: false,
          error: 'Analysis failed',
          auditId,
          details: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating keyword audit:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create keyword audit' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/seo-audit/analyze
 * List keyword audits for authenticated user with pagination
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const rawParams: Record<string, string> = {}
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')
    const rawStatus = searchParams.get('status')
    const rawDomainId = searchParams.get('domainId')

    if (rawPage) rawParams.page = rawPage
    if (rawLimit) rawParams.limit = rawLimit
    if (rawStatus) rawParams.status = rawStatus
    if (rawDomainId) rawParams.domainId = rawDomainId

    // Validate query params
    const parseResult = listAuditsSchema.safeParse(rawParams)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { page, limit, status, domainId } = parseResult.data

    // Fetch audits from database
    const result = await getUserKeywordAudits({
      userId,
      page,
      limit,
      status: status as 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED' | undefined,
      domainId,
    })

    return NextResponse.json({
      success: true,
      data: result.audits,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('Error listing keyword audits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list keyword audits' },
      { status: 500 }
    )
  }
}
