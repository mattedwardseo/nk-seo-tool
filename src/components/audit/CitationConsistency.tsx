'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Building2,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type CitationStatus = 'consistent' | 'inconsistent' | 'missing' | 'partial'

export interface NAPData {
  /** Business name as listed */
  name: string
  /** Address as listed */
  address: string
  /** Phone number as listed */
  phone: string
}

export interface CitationSource {
  /** Source identifier */
  id: string
  /** Source name (e.g., "Google Business Profile", "Yelp") */
  name: string
  /** Source URL */
  url?: string
  /** Source logo URL */
  logoUrl?: string
  /** NAP data found on this source */
  napData: NAPData | null
  /** Overall status */
  status: CitationStatus
  /** Individual field statuses */
  fieldStatus: {
    name: CitationStatus
    address: CitationStatus
    phone: CitationStatus
  }
  /** Domain authority/importance */
  importance?: 'high' | 'medium' | 'low'
  /** Last verified date */
  lastVerified?: string
}

export interface CitationConsistencyData {
  /** Canonical/correct NAP data */
  canonicalNap: NAPData
  /** Citation sources */
  sources: CitationSource[]
  /** Overall consistency score (0-100) */
  consistencyScore: number
  /** Counts by status */
  statusCounts: {
    consistent: number
    inconsistent: number
    missing: number
    partial: number
  }
}

export interface CitationConsistencyProps {
  /** Citation consistency data */
  data: CitationConsistencyData
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Show only problematic citations */
  showOnlyIssues?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  CitationStatus,
  {
    label: string
    color: string
    bgColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  consistent: {
    label: 'Consistent',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Check,
  },
  inconsistent: {
    label: 'Inconsistent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: X,
  },
  partial: {
    label: 'Partial',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: AlertTriangle,
  },
  missing: {
    label: 'Missing',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: X,
  },
}

const IMPORTANCE_CONFIG: Record<
  NonNullable<CitationSource['importance']>,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  high: { label: 'High', variant: 'default' },
  medium: { label: 'Medium', variant: 'secondary' },
  low: { label: 'Low', variant: 'outline' },
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatusIconProps {
  status: CitationStatus
  className?: string
}

function StatusIcon({ status, className }: StatusIconProps): React.ReactElement {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return <Icon className={cn('h-4 w-4', config.color, className)} />
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CitationConsistency - NAP validation display
 *
 * Shows NAP (Name, Address, Phone) consistency across citation sources.
 *
 * @example
 * ```tsx
 * <CitationConsistency
 *   data={{
 *     canonicalNap: { name: "Example Dental", address: "123 Main St", phone: "(555) 123-4567" },
 *     sources: [...],
 *     consistencyScore: 85,
 *     statusCounts: { consistent: 8, inconsistent: 2, missing: 1, partial: 1 }
 *   }}
 * />
 * ```
 */
export function CitationConsistency({
  data,
  title = 'Citation Consistency',
  description = 'NAP (Name, Address, Phone) consistency across directories',
  className,
  showOnlyIssues = false,
}: CitationConsistencyProps): React.ReactElement {
  // Filter sources
  const displaySources = showOnlyIssues
    ? data.sources.filter((s) => s.status !== 'consistent')
    : data.sources

  // Calculate summary
  const issueCount = data.statusCounts.inconsistent + data.statusCounts.partial

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={data.consistencyScore >= 80 ? 'default' : 'destructive'}>
              {data.consistencyScore}% consistent
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Canonical NAP */}
        <div className="bg-muted/30 rounded-lg border p-4">
          <h4 className="mb-3 text-sm font-medium">Correct Business Information</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <Building2 className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Business Name</p>
                <p className="font-medium">{data.canonicalNap.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Address</p>
                <p className="font-medium">{data.canonicalNap.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Phone</p>
                <p className="font-medium">{data.canonicalNap.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consistency Meter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Consistency</span>
            <span className="font-medium">{data.consistencyScore}%</span>
          </div>
          <Progress value={data.consistencyScore} className="h-2" />
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(data.statusCounts).map(([status, count]) => {
              const config = STATUS_CONFIG[status as CitationStatus]
              return (
                <div key={status} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: config.color.replace('text-', '').includes('-')
                        ? ''
                        : config.color,
                    }}
                  />
                  <span className={config.color}>{count}</span>
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Citations Table */}
        {displaySources.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySources.map((source) => (
                  <TableRow key={source.id} className="hover:bg-muted/50">
                    {/* Source */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {source.logoUrl ? (
                          <img src={source.logoUrl} alt={source.name} className="h-5 w-5 rounded" />
                        ) : (
                          <Globe className="text-muted-foreground h-4 w-4" />
                        )}
                        <div>
                          <span className="font-medium">{source.name}</span>
                          {source.importance && (
                            <Badge
                              variant={IMPORTANCE_CONFIG[source.importance].variant}
                              className="ml-2 text-xs"
                            >
                              {IMPORTANCE_CONFIG[source.importance].label}
                            </Badge>
                          )}
                        </div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Overall Status */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <StatusIcon status={source.status} />
                        <span className={cn('text-sm', STATUS_CONFIG[source.status].color)}>
                          {STATUS_CONFIG[source.status].label}
                        </span>
                      </div>
                    </TableCell>

                    {/* Name Status */}
                    <TableCell>
                      <StatusIcon status={source.fieldStatus.name} />
                    </TableCell>

                    {/* Address Status */}
                    <TableCell>
                      <StatusIcon status={source.fieldStatus.address} />
                    </TableCell>

                    {/* Phone Status */}
                    <TableCell>
                      <StatusIcon status={source.fieldStatus.phone} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="h-8 w-8 text-green-500" />
            <p className="mt-4 font-medium text-green-600">All Citations Consistent!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your business information is consistent across all sources.
            </p>
          </div>
        )}

        {/* Issues Summary */}
        {issueCount > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {issueCount} Citation {issueCount === 1 ? 'Issue' : 'Issues'} Found
                </p>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  Inconsistent NAP information can hurt your local SEO rankings. Consider updating
                  these listings to match your correct business information.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Compact Summary
// ============================================================================

export interface CitationSummaryProps {
  consistencyScore: number
  totalSources: number
  issueCount: number
  className?: string
}

/**
 * Compact citation summary for overview displays
 */
export function CitationSummary({
  consistencyScore,
  totalSources,
  issueCount,
  className,
}: CitationSummaryProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">NAP Consistency</span>
        <Badge variant={consistencyScore >= 80 ? 'default' : 'destructive'}>
          {consistencyScore}%
        </Badge>
      </div>
      <Progress value={consistencyScore} className="h-2" />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{totalSources} citations tracked</span>
        {issueCount > 0 && <span className="text-red-600">{issueCount} issues</span>}
      </div>
    </div>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface CitationConsistencySkeletonProps {
  className?: string
}

export function CitationConsistencySkeleton({
  className,
}: CitationConsistencySkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="bg-muted h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-72 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted h-24 w-full animate-pulse rounded-lg" />
        <div className="space-y-2">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-2 w-full animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-muted h-12 w-full animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CitationConsistency
