'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RunSummary {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  keywordsTracked: number
  avgPosition: number | null
  keywordsInTop3: number
  keywordsInTop10: number
  keywordsNotRanking: number
  improvedCount: number
  declinedCount: number
  createdAt: string | Date
  completedAt: string | Date | null
  triggeredBy: string | null
}

interface RunCardProps {
  run: RunSummary
  basePath?: string // Base path for run links (e.g., "/d/abc123/keyword-tracking")
}

export function RunCard({ run, basePath = '/keyword-tracking' }: RunCardProps) {
  const createdAt = new Date(run.createdAt)

  const statusConfig: Record<
    string,
    { icon: typeof Clock; label: string; color: string; animate?: boolean }
  > = {
    PENDING: {
      icon: Clock,
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    RUNNING: {
      icon: Loader2,
      label: 'Running',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      animate: true,
    },
    COMPLETED: {
      icon: CheckCircle,
      label: 'Completed',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    FAILED: {
      icon: XCircle,
      label: 'Failed',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const status = statusConfig[run.status]!
  const StatusIcon = status.icon

  return (
    <Link href={`${basePath}/${run.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium" suppressHydrationWarning>
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </CardTitle>
            <div className="flex items-center gap-2">
              {run.triggeredBy === 'scheduled' && (
                <Badge variant="outline" className="text-xs">
                  <Play className="h-3 w-3 mr-1" />
                  Auto
                </Badge>
              )}
              <Badge className={cn('flex items-center gap-1', status.color)}>
                <StatusIcon
                  className={cn('h-3 w-3', status.animate && 'animate-spin')}
                />
                {status.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {run.status === 'RUNNING' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{run.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${run.progress}%` }}
                />
              </div>
            </div>
          ) : run.status === 'COMPLETED' ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{run.keywordsTracked}</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {run.avgPosition ? `#${run.avgPosition.toFixed(1)}` : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Avg Position</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{run.keywordsInTop10}</p>
                <p className="text-xs text-muted-foreground">Top 10</p>
              </div>
            </div>
          ) : run.status === 'FAILED' ? (
            <p className="text-sm text-muted-foreground">
              Run failed. Click to view details.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting to start...
            </p>
          )}

          {run.status === 'COMPLETED' && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {run.improvedCount}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {run.declinedCount}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {run.keywordsNotRanking} not ranking
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
