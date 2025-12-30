'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Timer, Server, Download, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { OnPageTiming } from '@/types/audit'

interface PageTimingSectionProps {
  timing: OnPageTiming | undefined
}

interface TimingRowProps {
  label: string
  value: number | null | undefined
  icon: React.ReactNode
  threshold?: number
  description?: string
}

function TimingRow({ label, value, icon, threshold, description }: TimingRowProps): React.ReactElement {
  const hasValue = value !== null && value !== undefined
  const status = hasValue && threshold ? (value <= threshold ? 'good' : 'poor') : undefined

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
      <div className="text-right">
        {hasValue ? (
          <span
            className={cn(
              'font-mono text-sm',
              status === 'good' && 'text-green-600 dark:text-green-400',
              status === 'poor' && 'text-red-600 dark:text-red-400',
              !status && 'text-foreground'
            )}
          >
            {value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value.toFixed(0)}ms`}
          </span>
        ) : (
          <span className="text-muted-foreground italic text-sm">N/A</span>
        )}
      </div>
    </div>
  )
}

export function PageTimingSection({ timing }: PageTimingSectionProps): React.ReactElement {
  const thresholds = SEO_THRESHOLDS.performance

  if (!timing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Page Timing</CardTitle>
              <CardDescription>Connection and render timing metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No timing data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Page Timing</CardTitle>
            <CardDescription>Connection and render timing metrics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Connection Timing */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Connection
            </h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <TimingRow
                label="Connection Time"
                value={timing.connectionTime}
                icon={<Server className="h-4 w-4" />}
                description="Time to establish connection"
              />
              <TimingRow
                label="TLS Handshake"
                value={timing.timeToSecureConnection}
                icon={<Server className="h-4 w-4" />}
                description="SSL/TLS negotiation"
              />
              <TimingRow
                label="Request Sent"
                value={timing.requestSentTime}
                icon={<Server className="h-4 w-4" />}
                description="Time to send HTTP request"
              />
              <TimingRow
                label="TTFB (Waiting)"
                value={timing.waitingTime}
                icon={<Server className="h-4 w-4" />}
                threshold={thresholds.maxTTFB}
                description="Time to First Byte"
              />
            </div>
          </div>

          {/* Download & Render Timing */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download & Render
            </h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <TimingRow
                label="Download Time"
                value={timing.downloadTime}
                icon={<Download className="h-4 w-4" />}
                description="Time to download response"
              />
              <TimingRow
                label="DOM Complete"
                value={timing.domComplete}
                icon={<Timer className="h-4 w-4" />}
                threshold={thresholds.maxDomComplete}
                description="When DOM parsing finished"
              />
              <TimingRow
                label="Time to Interactive"
                value={timing.timeToInteractive}
                icon={<Timer className="h-4 w-4" />}
                threshold={thresholds.maxTTI}
                description="When page becomes interactive"
              />
              <TimingRow
                label="Total Duration"
                value={timing.durationTime}
                icon={<Timer className="h-4 w-4" />}
                threshold={thresholds.maxLoadTime}
                description="Total page load time"
              />
            </div>
          </div>
        </div>

        {/* Fetch timing if available */}
        {(timing.fetchStart !== null || timing.fetchEnd !== null) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Fetch Timing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold">
                  {timing.fetchStart !== null ? `${timing.fetchStart.toFixed(0)}ms` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Fetch Start</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold">
                  {timing.fetchEnd !== null ? `${timing.fetchEnd.toFixed(0)}ms` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Fetch End</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PageTimingSection
