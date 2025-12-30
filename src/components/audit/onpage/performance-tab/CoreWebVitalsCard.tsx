'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gauge, Clock, Move, Pointer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { OnPageTiming, OnPageMeta } from '@/types/audit'
import type { CwvStatus } from '../types'

interface CoreWebVitalsCardProps {
  timing: OnPageTiming | undefined
  meta: OnPageMeta | undefined
}

interface VitalMetricProps {
  label: string
  shortLabel: string
  value: number | null | undefined
  unit: string
  thresholds: { good: number; moderate: number }
  icon: React.ReactNode
  description: string
}

function getStatus(value: number, thresholds: { good: number; moderate: number }): CwvStatus {
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.moderate) return 'needs-improvement'
  return 'poor'
}

function VitalMetric({
  label,
  shortLabel,
  value,
  unit,
  thresholds,
  icon,
  description,
}: VitalMetricProps): React.ReactElement {
  const hasValue = value !== null && value !== undefined
  const status: CwvStatus = hasValue ? getStatus(value, thresholds) : 'poor'

  // Calculate progress value (inverse for time-based metrics - lower is better)
  const maxValue = thresholds.moderate * 1.5
  const progressValue = hasValue ? Math.max(0, Math.min(100, ((maxValue - value) / maxValue) * 100)) : 0

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-lg',
              status === 'good' && 'bg-green-100 dark:bg-green-900/30',
              status === 'needs-improvement' && 'bg-yellow-100 dark:bg-yellow-900/30',
              status === 'poor' && 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {icon}
          </div>
          <div>
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-muted-foreground">{shortLabel}</div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'capitalize',
            status === 'good' && 'border-green-500 text-green-600',
            status === 'needs-improvement' && 'border-yellow-500 text-yellow-600',
            status === 'poor' && 'border-red-500 text-red-600'
          )}
        >
          {status.replace('-', ' ')}
        </Badge>
      </div>

      <div className="mb-2">
        <span
          className={cn(
            'text-3xl font-bold',
            status === 'good' && 'text-green-600 dark:text-green-400',
            status === 'needs-improvement' && 'text-yellow-600 dark:text-yellow-400',
            status === 'poor' && 'text-red-600 dark:text-red-400'
          )}
        >
          {hasValue ? (unit === 'ms' ? value.toFixed(0) : value.toFixed(2)) : 'N/A'}
        </span>
        {hasValue && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
      </div>

      <Progress
        value={progressValue}
        className={cn(
          'h-2',
          status === 'good' && '[&>div]:bg-green-500',
          status === 'needs-improvement' && '[&>div]:bg-yellow-500',
          status === 'poor' && '[&>div]:bg-red-500'
        )}
      />

      <div className="mt-2 text-xs text-muted-foreground">
        <span>Good: ≤{thresholds.good}{unit}</span>
        <span className="mx-2">|</span>
        <span>Needs improvement: ≤{thresholds.moderate}{unit}</span>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  )
}

export function CoreWebVitalsCard({ timing, meta }: CoreWebVitalsCardProps): React.ReactElement {
  const thresholds = SEO_THRESHOLDS.coreWebVitals

  // Get CLS from meta (it's stored there in the current data structure)
  const cls = meta?.cumulativeLayoutShift

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Core Web Vitals</CardTitle>
            <CardDescription>Google&apos;s page experience metrics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <VitalMetric
            label="Largest Contentful Paint"
            shortLabel="LCP"
            value={timing?.largestContentfulPaint}
            unit="ms"
            thresholds={thresholds.lcp}
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            description="Measures loading performance. Should occur within 2.5 seconds."
          />
          <VitalMetric
            label="First Input Delay"
            shortLabel="FID"
            value={timing?.firstInputDelay}
            unit="ms"
            thresholds={thresholds.fid}
            icon={<Pointer className="h-4 w-4 text-purple-600" />}
            description="Measures interactivity. Should be less than 100 milliseconds."
          />
          <VitalMetric
            label="Cumulative Layout Shift"
            shortLabel="CLS"
            value={cls}
            unit=""
            thresholds={thresholds.cls}
            icon={<Move className="h-4 w-4 text-orange-600" />}
            description="Measures visual stability. Should be less than 0.1."
          />
        </div>

        {/* Additional timing metrics */}
        {timing?.timeToInteractive !== null && timing?.timeToInteractive !== undefined && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Additional Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold">{timing.timeToInteractive.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">TTI (ms)</div>
              </div>
              {timing.domComplete !== null && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{timing.domComplete.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">DOM Complete (ms)</div>
                </div>
              )}
              {timing.waitingTime !== null && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{timing.waitingTime.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">TTFB (ms)</div>
                </div>
              )}
              {timing.durationTime !== null && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{timing.durationTime.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Total Time (ms)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CoreWebVitalsCard
