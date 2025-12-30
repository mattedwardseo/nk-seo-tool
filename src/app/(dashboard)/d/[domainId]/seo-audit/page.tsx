'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KeywordAuditList } from '@/components/seo-audit'
import { Plus, Search, Sparkles } from 'lucide-react'
import { useDomain } from '@/contexts/DomainContext'

interface KeywordAuditSummary {
  id: string
  url: string
  targetKeyword: string
  locationName: string | null
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  overallScore: number | null
  currentPosition: number | null
  searchVolume: number | null
  keywordDifficulty: number | null
  apiCost: number | null
  createdAt: string
  completedAt: string | null
}

export default function SEOAuditPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [audits, setAudits] = useState<KeywordAuditSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    async function fetchAudits() {
      try {
        const urlParams = new URLSearchParams({
          domainId: domainId,
        })
        const response = await fetch(`/api/seo-audit/analyze?${urlParams.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch audits')
        }

        setAudits(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudits()
  }, [domainId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Search className="h-6 w-6" />
              Keyword Optimization Audits
            </h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300 border-violet-300/50">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Claude AI analyzes and generates actionable recommendations
          </p>
        </div>
        <Link href={domainUrl('/seo-audit/new')}>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      <KeywordAuditList audits={audits} isLoading={isLoading} basePath={domainUrl('/seo-audit')} />
    </div>
  )
}
