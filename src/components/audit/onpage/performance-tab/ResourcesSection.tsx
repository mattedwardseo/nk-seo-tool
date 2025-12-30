'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HardDrive, FileCode, Server, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { OnPageResources } from '@/types/audit'

interface ResourcesSectionProps {
  resources: OnPageResources | undefined
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

interface SizeMetricProps {
  label: string
  bytes: number
  maxBytes?: number
  description?: string
}

function SizeMetric({ label, bytes, maxBytes, description }: SizeMetricProps): React.ReactElement {
  const thresholds = SEO_THRESHOLDS.pageSize
  const status =
    bytes >= thresholds.max
      ? 'poor'
      : bytes >= thresholds.large
        ? 'warning'
        : 'good'

  const progressValue = maxBytes ? Math.min(100, (bytes / maxBytes) * 100) : 0

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            status === 'good' && 'border-green-500 text-green-600',
            status === 'warning' && 'border-yellow-500 text-yellow-600',
            status === 'poor' && 'border-red-500 text-red-600'
          )}
        >
          {status === 'good' && 'Good'}
          {status === 'warning' && 'Large'}
          {status === 'poor' && 'Too Large'}
        </Badge>
      </div>
      <div
        className={cn(
          'text-2xl font-bold',
          status === 'good' && 'text-green-600 dark:text-green-400',
          status === 'warning' && 'text-yellow-600 dark:text-yellow-400',
          status === 'poor' && 'text-red-600 dark:text-red-400'
        )}
      >
        {formatBytes(bytes)}
      </div>
      {maxBytes && (
        <Progress
          value={progressValue}
          className={cn(
            'h-1.5 mt-2',
            status === 'good' && '[&>div]:bg-green-500',
            status === 'warning' && '[&>div]:bg-yellow-500',
            status === 'poor' && '[&>div]:bg-red-500'
          )}
        />
      )}
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}

export function ResourcesSection({ resources }: ResourcesSectionProps): React.ReactElement {
  const thresholds = SEO_THRESHOLDS.pageSize

  if (!resources) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Resources & Size</CardTitle>
              <CardDescription>Page size and resource analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No resource data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate compression ratio
  const compressionRatio =
    resources.size > 0 && resources.encodedSize > 0
      ? ((1 - resources.encodedSize / resources.size) * 100).toFixed(1)
      : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Resources & Size</CardTitle>
            <CardDescription>Page size and resource analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <SizeMetric
            label="Page Size"
            bytes={resources.size}
            maxBytes={thresholds.max}
            description="Total uncompressed size"
          />
          <SizeMetric
            label="Encoded Size"
            bytes={resources.encodedSize}
            maxBytes={thresholds.max}
            description="Compressed size"
          />
          <SizeMetric
            label="Transfer Size"
            bytes={resources.totalTransferSize}
            maxBytes={thresholds.max}
            description="Total transferred"
          />
          <SizeMetric
            label="DOM Size"
            bytes={resources.totalDomSize}
            description="DOM tree size"
          />
        </div>

        {/* Server & Compression Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Server Info</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server</span>
                <span>{resources.server || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media Type</span>
                <span>{resources.mediaType || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL Length</span>
                <span>{resources.urlLength} chars</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Compression</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Encoding</span>
                <span className="flex items-center gap-1">
                  {resources.contentEncoding ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {resources.contentEncoding}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      None
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compression Ratio</span>
                <span className={cn(compressionRatio && parseFloat(compressionRatio) > 50 && 'text-green-600')}>
                  {compressionRatio ? `${compressionRatio}%` : 'N/A'}
                </span>
              </div>
              {resources.cacheControl && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cacheable</span>
                  <span className="flex items-center gap-1">
                    {resources.cacheControl.cachable ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Yes
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        No
                      </>
                    )}
                  </span>
                </div>
              )}
              {resources.cacheControl?.ttl !== null && resources.cacheControl?.ttl !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache TTL</span>
                  <span>{resources.cacheControl.ttl}s</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {resources.warnings && resources.warnings.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-sm">Warnings ({resources.warnings.length})</span>
            </div>
            <div className="space-y-2">
              {resources.warnings.slice(0, 5).map((warning, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-100/50 dark:bg-yellow-900/20 rounded">
                  <span className="text-muted-foreground">
                    Line {warning.line}:{warning.column} -
                  </span>{' '}
                  {warning.message}
                  {warning.statusCode && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {warning.statusCode}
                    </Badge>
                  )}
                </div>
              ))}
              {resources.warnings.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{resources.warnings.length - 5} more warnings
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ResourcesSection
