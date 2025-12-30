'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Loader2,
  Trash2,
  AlertCircle,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDomain } from '@/contexts/DomainContext'
import {
  RunOverview,
  ResultsTable,
  RunProgress,
} from '@/components/keyword-tracking'

interface RunDetail {
  id: string
  domainId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  keywordsTracked: number
  avgPosition: number | null
  keywordsInTop3: number
  keywordsInTop10: number
  keywordsInTop100: number
  keywordsNotRanking: number
  improvedCount: number
  declinedCount: number
  unchangedCount: number
  newRankingsCount: number
  lostRankingsCount: number
  apiCallsUsed: number
  estimatedCost: number | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  locationName: string
  languageCode: string
  errorMessage: string | null
}

export default function RunDetailPage({
  params: promiseParams,
}: {
  params: Promise<{ domainId: string; runId: string }>
}) {
  const { domainId, runId } = use(promiseParams)
  const router = useRouter()
  const { selectedDomain } = useDomain()
  const [run, setRun] = useState<RunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const fetchRun = async () => {
    try {
      const response = await fetch(`/api/keyword-tracking/runs/${runId}`)
      const data = await response.json()

      if (data.success) {
        setRun(data.data)
      } else {
        setError(data.error || 'Failed to load run')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRun()
  }, [runId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tracking run?')) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/keyword-tracking/runs/${runId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        router.push(domainUrl('/keyword-tracking'))
      } else {
        setError(data.error || 'Failed to delete run')
        setDeleting(false)
      }
    } catch {
      setError('Failed to delete run')
      setDeleting(false)
    }
  }

  const handleComplete = () => {
    fetchRun()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/keyword-tracking')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Keyword Tracking</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/keyword-tracking')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Run not found</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Run not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show progress for pending/running
  if (run.status === 'PENDING' || run.status === 'RUNNING') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/keyword-tracking')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Tracking Run
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Started {format(new Date(run.createdAt), 'PPp')}
            </p>
          </div>
        </div>

        <RunProgress runId={runId} onComplete={handleComplete} />
      </div>
    )
  }

  // Show failed state
  if (run.status === 'FAILED') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/keyword-tracking')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Tracking Run
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(new Date(run.createdAt), 'PPp')}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="cursor-pointer"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Tracking Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {run.errorMessage || 'An error occurred during tracking.'}
            </p>
            <Link href={domainUrl('/keyword-tracking/new')}>
              <Button className="mt-4 cursor-pointer">Try Again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show completed state
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/keyword-tracking')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Tracking Results
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {selectedDomain?.name || 'Loading...'} - {format(new Date(run.createdAt), 'PPp')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="cursor-pointer"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RunOverview run={run} />
        </TabsContent>

        <TabsContent value="keywords">
          <ResultsTable runId={runId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
