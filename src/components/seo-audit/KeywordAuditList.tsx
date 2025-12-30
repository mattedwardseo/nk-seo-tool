'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ExternalLink, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

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

interface KeywordAuditListProps {
  audits: KeywordAuditSummary[]
  isLoading?: boolean
  basePath?: string // Base path for audit links (e.g., "/d/abc123/seo-audit")
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
  },
  ANALYZING: {
    label: 'Analyzing',
    variant: 'default' as const,
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    variant: 'destructive' as const,
    icon: XCircle,
  },
}

export function KeywordAuditList({ audits, isLoading, basePath = '/seo-audit' }: KeywordAuditListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No audits yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Run your first keyword optimization audit to see results here.
          </p>
          <Link href={`${basePath}/new`}>
            <Button>
              <Search className="mr-2 h-4 w-4" />
              New Audit
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {audits.map((audit) => {
        const status = statusConfig[audit.status]
        const StatusIcon = status.icon

        return (
          <Link key={audit.id} href={`${basePath}/${audit.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">&quot;{audit.targetKeyword}&quot;</h3>
                      <Badge variant={status.variant}>
                        <StatusIcon
                          className={`mr-1 h-3 w-3 ${audit.status === 'ANALYZING' ? 'animate-spin' : ''}`}
                        />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      {new URL(audit.url).hostname}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleDateString()} at{' '}
                      {new Date(audit.createdAt).toLocaleTimeString()}
                      {audit.locationName && ` - ${audit.locationName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {audit.status === 'COMPLETED' && (
                      <>
                        <div className="text-2xl font-bold">
                          {audit.overallScore !== null ? `${audit.overallScore}/100` : '---'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {audit.currentPosition ? `#${audit.currentPosition}` : 'Not ranking'}
                          {audit.searchVolume && ` - ${audit.searchVolume.toLocaleString()} vol`}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
