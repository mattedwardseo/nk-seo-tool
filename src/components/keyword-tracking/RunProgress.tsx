'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface StatusData {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  errorMessage: string | null
  keywordsTracked: number
}

interface RunProgressProps {
  runId: string
  onComplete?: () => void
}

export function RunProgress({ runId, onComplete }: RunProgressProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/keyword-tracking/runs/${runId}/status`)
        const data = await response.json()

        if (data.success) {
          setStatus(data.data)

          if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
            onComplete?.()
          }
        } else {
          setError(data.error || 'Failed to fetch status')
        }
      } catch (err) {
        setError('Failed to connect to server')
      }
    }

    // Initial fetch
    fetchStatus()

    // Poll every 2 seconds while running
    const interval = setInterval(() => {
      if (!status || status.status === 'PENDING' || status.status === 'RUNNING') {
        fetchStatus()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [runId, status?.status, onComplete])

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'COMPLETED') {
    return (
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            Tracking Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Successfully tracked {status.keywordsTracked} keywords.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'FAILED') {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Tracking Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {status.errorMessage || 'An error occurred during tracking.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {status.status === 'PENDING' ? 'Preparing...' : 'Tracking Keywords...'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          Fetching SERP positions for your keywords. This may take a few minutes.
        </p>
      </CardContent>
    </Card>
  )
}
