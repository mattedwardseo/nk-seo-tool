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
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface CompetitorMetrics {
  /** Domain name */
  domain: string
  /** Domain rank (0-1000) */
  rank: number
  /** Estimated monthly organic traffic */
  organicTraffic: number
  /** Total backlinks count */
  backlinks: number
  /** Number of referring domains */
  referringDomains: number
  /** Number of ranking keywords */
  rankingKeywords: number
  /** Keywords in top 10 */
  top10Keywords: number
  /** Estimated traffic value (USD) */
  trafficValue?: number
  /** Is this the target domain? */
  isTarget?: boolean
}

export interface CompetitorComparisonProps {
  /** Target domain being audited */
  targetDomain: string
  /** Target domain metrics */
  targetMetrics: CompetitorMetrics
  /** Competitor domains with metrics */
  competitors: CompetitorMetrics[]
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Maximum competitors to display */
  maxCompetitors?: number
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

/**
 * Calculate relative bar width for metric comparison
 */
function calculateBarWidth(value: number, maxValue: number): number {
  if (maxValue === 0) return 0
  return Math.min(100, (value / maxValue) * 100)
}

/**
 * Get comparison indicator between target and competitor
 */
function getComparisonIndicator(
  targetValue: number,
  competitorValue: number
): 'better' | 'worse' | 'equal' {
  const diff = targetValue - competitorValue
  const threshold = competitorValue * 0.05 // 5% threshold for "equal"

  if (Math.abs(diff) <= threshold) return 'equal'
  return diff > 0 ? 'better' : 'worse'
}

// ============================================================================
// Sub-components
// ============================================================================

interface MetricBarProps {
  value: number
  maxValue: number
  isTarget?: boolean
  comparison?: 'better' | 'worse' | 'equal'
}

function MetricBar({ value, maxValue, isTarget, comparison }: MetricBarProps): React.ReactElement {
  const width = calculateBarWidth(value, maxValue)

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isTarget
              ? 'bg-primary'
              : comparison === 'better'
                ? 'bg-green-500'
                : comparison === 'worse'
                  ? 'bg-red-400'
                  : 'bg-muted-foreground/50'
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="min-w-[60px] text-right text-sm tabular-nums">{formatNumber(value)}</span>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CompetitorComparison - Side-by-side competitor analysis
 *
 * Displays a comparison table showing how the target domain stacks up
 * against competitors across key SEO metrics.
 *
 * @example
 * ```tsx
 * <CompetitorComparison
 *   targetDomain="example.com"
 *   targetMetrics={{ domain: "example.com", rank: 500, ... }}
 *   competitors={[{ domain: "competitor1.com", ... }]}
 * />
 * ```
 */
export function CompetitorComparison({
  targetDomain,
  targetMetrics,
  competitors,
  title = 'Competitor Comparison',
  description = 'See how your site compares to top competitors',
  className,
  maxCompetitors = 5,
}: CompetitorComparisonProps): React.ReactElement {
  // Combine target and competitors, sort by rank
  const allDomains = [
    { ...targetMetrics, domain: targetDomain, isTarget: true },
    ...competitors.slice(0, maxCompetitors).map((c) => ({ ...c, isTarget: false })),
  ].sort((a, b) => b.rank - a.rank)

  // Calculate max values for bar scaling
  const maxValues = {
    rank: Math.max(...allDomains.map((d) => d.rank)),
    organicTraffic: Math.max(...allDomains.map((d) => d.organicTraffic)),
    backlinks: Math.max(...allDomains.map((d) => d.backlinks)),
    referringDomains: Math.max(...allDomains.map((d) => d.referringDomains)),
    rankingKeywords: Math.max(...allDomains.map((d) => d.rankingKeywords)),
  }

  // Calculate target position in rankings
  const targetPosition = allDomains.findIndex((d) => d.isTarget) + 1

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={targetPosition <= 2 ? 'default' : 'secondary'}>
            #{targetPosition} of {allDomains.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px]">Domain</TableHead>
                <TableHead className="text-right">Rank</TableHead>
                <TableHead className="text-right">Traffic</TableHead>
                <TableHead className="text-right">Backlinks</TableHead>
                <TableHead className="text-right">Ref. Domains</TableHead>
                <TableHead className="text-right">Keywords</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDomains.map((domain) => {
                const rankComparison = getComparisonIndicator(targetMetrics.rank, domain.rank)
                const trafficComparison = getComparisonIndicator(
                  targetMetrics.organicTraffic,
                  domain.organicTraffic
                )
                const backlinksComparison = getComparisonIndicator(
                  targetMetrics.backlinks,
                  domain.backlinks
                )
                const domainsComparison = getComparisonIndicator(
                  targetMetrics.referringDomains,
                  domain.referringDomains
                )
                const keywordsComparison = getComparisonIndicator(
                  targetMetrics.rankingKeywords,
                  domain.rankingKeywords
                )

                return (
                  <TableRow
                    key={domain.domain}
                    className={cn(
                      domain.isTarget && 'bg-primary/5 font-medium',
                      'hover:bg-muted/50'
                    )}
                  >
                    {/* Domain */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {domain.isTarget && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                        <span className="max-w-[120px] truncate">{domain.domain}</span>
                        {!domain.isTarget && (
                          <a
                            href={`https://${domain.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    {/* Rank */}
                    <TableCell>
                      <MetricBar
                        value={domain.rank}
                        maxValue={maxValues.rank}
                        isTarget={domain.isTarget}
                        comparison={domain.isTarget ? undefined : rankComparison}
                      />
                    </TableCell>

                    {/* Traffic */}
                    <TableCell>
                      <MetricBar
                        value={domain.organicTraffic}
                        maxValue={maxValues.organicTraffic}
                        isTarget={domain.isTarget}
                        comparison={domain.isTarget ? undefined : trafficComparison}
                      />
                    </TableCell>

                    {/* Backlinks */}
                    <TableCell>
                      <MetricBar
                        value={domain.backlinks}
                        maxValue={maxValues.backlinks}
                        isTarget={domain.isTarget}
                        comparison={domain.isTarget ? undefined : backlinksComparison}
                      />
                    </TableCell>

                    {/* Referring Domains */}
                    <TableCell>
                      <MetricBar
                        value={domain.referringDomains}
                        maxValue={maxValues.referringDomains}
                        isTarget={domain.isTarget}
                        comparison={domain.isTarget ? undefined : domainsComparison}
                      />
                    </TableCell>

                    {/* Keywords */}
                    <TableCell>
                      <MetricBar
                        value={domain.rankingKeywords}
                        maxValue={maxValues.rankingKeywords}
                        isTarget={domain.isTarget}
                        comparison={domain.isTarget ? undefined : keywordsComparison}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface CompetitorComparisonSkeletonProps {
  className?: string
  rows?: number
}

/**
 * Loading skeleton for CompetitorComparison
 */
export function CompetitorComparisonSkeleton({
  className,
  rows = 5,
}: CompetitorComparisonSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="bg-muted h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              </TableHead>
              {[...Array(5)].map((_, i) => (
                <TableHead key={i}>
                  <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(rows)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                </TableCell>
                {[...Array(5)].map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-2 w-24 animate-pulse rounded-full" />
                      <div className="bg-muted h-4 w-12 animate-pulse rounded" />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

export interface CompetitorComparisonEmptyProps {
  className?: string
}

/**
 * Empty state when no competitor data is available
 */
export function CompetitorComparisonEmpty({
  className,
}: CompetitorComparisonEmptyProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Competitor Comparison</CardTitle>
        <CardDescription>See how your site compares to top competitors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-muted rounded-full p-3">
            <svg
              className="text-muted-foreground h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium">No Competitor Data</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Competitor analysis data is not yet available for this audit.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompetitorComparison
