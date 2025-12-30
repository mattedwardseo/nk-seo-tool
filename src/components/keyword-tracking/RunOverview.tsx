'use client'

import { format } from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  BarChart3,
  Clock,
  DollarSign,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface RunDetail {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
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
  startedAt: string | Date | null
  completedAt: string | Date | null
  createdAt: string | Date
  locationName: string
  languageCode: string
  errorMessage: string | null
}

interface RunOverviewProps {
  run: RunDetail
}

export function RunOverview({ run }: RunOverviewProps) {
  const completedAt = run.completedAt ? new Date(run.completedAt) : null
  const startedAt = run.startedAt ? new Date(run.startedAt) : null

  const duration =
    completedAt && startedAt
      ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
      : null

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Keywords Tracked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{run.keywordsTracked}</div>
          <p className="text-xs text-muted-foreground">
            {run.keywordsInTop10} in top 10, {run.keywordsNotRanking} not ranking
          </p>
        </CardContent>
      </Card>

      {/* Average Position */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.avgPosition ? `#${run.avgPosition.toFixed(1)}` : '—'}
          </div>
          <p className="text-xs text-muted-foreground">
            Across ranking keywords
          </p>
        </CardContent>
      </Card>

      {/* Top 3 Rankings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Top 3 Rankings</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {run.keywordsInTop3}
          </div>
          <p className="text-xs text-muted-foreground">
            {run.keywordsInTop10} in top 10, {run.keywordsInTop100} in top 100
          </p>
        </CardContent>
      </Card>

      {/* Position Changes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Changes</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {run.improvedCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-lg font-bold text-red-600 dark:text-red-400">
                {run.declinedCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold text-muted-foreground">
                {run.unchangedCount}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {run.newRankingsCount} new, {run.lostRankingsCount} lost
          </p>
        </CardContent>
      </Card>

      {/* Run Details */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-xs text-muted-foreground">
                  {duration ? formatDuration(duration) : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-muted-foreground">{run.locationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Est. Cost</p>
                <p className="text-xs text-muted-foreground">
                  ${run.estimatedCost?.toFixed(4) ?? '0.00'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-xs text-muted-foreground">
                  {completedAt ? format(completedAt, 'PPp') : '—'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
