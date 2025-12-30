'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ScanProgressProps {
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED'
  progress: number
  currentKeyword?: string
  pointsCompleted?: number
  totalPoints?: number
  startedAt?: Date | null
  errorMessage?: string | null
  compact?: boolean
}

function getStatusIcon(status: string): React.ReactElement {
  switch (status) {
    case 'SCANNING':
      return <Loader2 className="h-4 w-4 animate-spin" />
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'SCANNING':
      return 'default'
    case 'COMPLETED':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}

function formatDuration(startedAt: Date | null): string {
  if (!startedAt) return ''
  const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function ScanProgressIndicator({
  status,
  progress,
  currentKeyword,
  pointsCompleted,
  totalPoints,
  startedAt,
  errorMessage,
  compact = false,
}: ScanProgressProps): React.ReactElement {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {getStatusIcon(status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium">
              {status === 'SCANNING' ? 'Scanning...' : status}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status)}
              <Badge variant={getStatusVariant(status)}>{status}</Badge>
            </div>
            {startedAt && status === 'SCANNING' && (
              <span className="text-sm text-muted-foreground">
                Elapsed: {formatDuration(startedAt)}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Keyword */}
          {status === 'SCANNING' && currentKeyword && (
            <div className="text-sm">
              <span className="text-muted-foreground">Currently scanning: </span>
              <span className="font-medium">{currentKeyword}</span>
            </div>
          )}

          {/* Points Progress */}
          {pointsCompleted !== undefined && totalPoints !== undefined && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{pointsCompleted}</span> of{' '}
              <span className="font-medium">{totalPoints}</span> grid points scanned
            </div>
          )}

          {/* Error Message */}
          {status === 'FAILED' && errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Completed Message */}
          {status === 'COMPLETED' && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
              Scan completed successfully. Results are ready to view.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
