/**
 * GET /api/site-audit/scans/[scanId]/export
 * Export site audit pages as CSV
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getScanForUser, getSiteAuditPagesForExport } from '@/lib/db/site-audit-operations'

interface RouteParams {
  params: Promise<{ scanId: string }>
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // If contains comma, newline, or quote, wrap in quotes and escape existing quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * GET /api/site-audit/scans/[scanId]/export
 * Returns CSV file download of all pages
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { scanId } = await params
    const userId = session.user.id

    // Verify user owns this scan
    const scan = await getScanForUser(scanId, userId)
    if (!scan) {
      return NextResponse.json(
        { success: false, error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Get all pages for export
    const pages = await getSiteAuditPagesForExport(scanId)

    if (pages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pages to export' },
        { status: 404 }
      )
    }

    // Build CSV content
    const headers = [
      'URL',
      'Status Code',
      'OnPage Score',
      'Title',
      'Meta Description',
      'H1',
      'Word Count',
      'Issue Count',
      'Issue Types',
      'Is Redirect',
      'Redirect Location',
    ]

    const rows = pages.map((page) => [
      escapeCSV(page.url),
      escapeCSV(page.statusCode),
      escapeCSV(page.onpageScore),
      escapeCSV(page.title),
      escapeCSV(page.metaDescription),
      escapeCSV(page.h1),
      escapeCSV(page.wordCount),
      escapeCSV(page.issueCount),
      escapeCSV(page.issueTypes),
      escapeCSV(page.isRedirect),
      escapeCSV(page.redirectLocation),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // Generate filename with domain and date
    const domain = scan.domain.replace(/[^a-zA-Z0-9]/g, '-')
    const date = new Date().toISOString().split('T')[0]
    const filename = `site-audit-${domain}-${date}.csv`

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting site audit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export site audit' },
      { status: 500 }
    )
  }
}
