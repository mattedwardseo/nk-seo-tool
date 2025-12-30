'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { KeywordAuditResults } from '@/components/seo-audit'
import { ArrowLeft, Loader2, AlertCircle, FileText, Search, Sparkles } from 'lucide-react'
import type { KeywordOptimizationReport } from '@/lib/seo/report-generator'

interface KeywordAuditDetail {
  id: string
  url: string
  targetKeyword: string
  locationName: string | null
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  errorMessage: string | null
  overallScore: number | null
  currentPosition: number | null
  searchVolume: number | null
  keywordDifficulty: number | null
  domainRank: number | null
  referringDomains: number | null
  apiCost: number | null
  reportMarkdown: string | null
  reportData: KeywordOptimizationReport | null
  createdAt: string
  completedAt: string | null
}

interface PageProps {
  params: Promise<{ domainId: string; id: string }>
}

export default function SEOAuditDetailPage({ params: promiseParams }: PageProps) {
  const { domainId, id } = use(promiseParams)
  const [audit, setAudit] = useState<KeywordAuditDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(false)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    async function fetchAudit() {
      try {
        const response = await fetch(`/api/seo-audit/analyze/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch audit')
        }

        setAudit(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudit()
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/seo-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Keyword Audit
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-medium">Audit Not Found</h3>
            <p className="text-sm text-muted-foreground">{error || 'The requested audit could not be found.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending or Analyzing state
  if (audit.status === 'PENDING' || audit.status === 'ANALYZING') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/seo-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Keyword Audit
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <h3 className="mb-2 text-lg font-medium">Analysis in Progress</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing &quot;{audit.targetKeyword}&quot; for {new URL(audit.url).hostname}...
            </p>
            <p className="mt-2 text-xs text-muted-foreground">This typically takes 30-60 seconds</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Failed state
  if (audit.status === 'FAILED') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/seo-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Keyword Audit
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-medium">Analysis Failed</h3>
            <p className="text-sm text-muted-foreground">{audit.errorMessage || 'An unknown error occurred.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Completed state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/seo-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Keyword Audit Results
          </h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300 border-violet-300/50">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Generated
          </Badge>
        </div>
        {audit.reportMarkdown && (
          <Button variant="outline" size="sm" onClick={() => setShowMarkdown(!showMarkdown)} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            {showMarkdown ? 'Show Dashboard' : 'Show Markdown'}
          </Button>
        )}
      </div>

      {showMarkdown && audit.reportMarkdown ? (
        <Card>
          <CardContent className="pt-6">
            <pre className="whitespace-pre-wrap text-sm">{audit.reportMarkdown}</pre>
          </CardContent>
        </Card>
      ) : audit.reportData ? (
        <KeywordAuditResults
          url={audit.url}
          targetKeyword={audit.targetKeyword}
          report={audit.reportData}
          metrics={{
            currentPosition: audit.currentPosition,
            searchVolume: audit.searchVolume,
            keywordDifficulty: audit.keywordDifficulty,
            domainRank: audit.domainRank,
            referringDomains: audit.referringDomains,
          }}
          apiCost={audit.apiCost}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No Report Data</h3>
            <p className="text-sm text-muted-foreground">Report data is not available for this audit.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
