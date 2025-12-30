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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExternalLink, ChevronDown, ChevronUp, Link2, Check, X } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface BacklinkGapDomain {
  /** Referring domain that links to competitors */
  domain: string
  /** Domain rank/authority (0-1000) */
  rank: number
  /** Total backlinks from this domain across all targets */
  totalBacklinks: number
  /** Domains this referring domain links to (from our comparison set) */
  linksTo: string[]
  /** Whether it links to the target domain */
  linksToTarget: boolean
  /** First seen date */
  firstSeen?: string
  /** Domain type/category */
  type?: 'blog' | 'news' | 'directory' | 'forum' | 'social' | 'other'
  /** Spam score (0-100) */
  spamScore?: number
}

export interface BacklinkGapProps {
  /** Target domain being audited */
  targetDomain: string
  /** Competitor domains in the comparison */
  competitorDomains: string[]
  /** Referring domains with gap analysis */
  gapDomains: BacklinkGapDomain[]
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Initial rows to show */
  initialRows?: number
}

// ============================================================================
// Utility Functions
// ============================================================================

function getRankColor(rank: number): string {
  if (rank >= 700) return 'text-green-600 dark:text-green-400'
  if (rank >= 400) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getSpamColor(spamScore: number): string {
  if (spamScore <= 30) return 'text-green-600 dark:text-green-400'
  if (spamScore <= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getDomainTypeLabel(type: BacklinkGapDomain['type']): string {
  const labels: Record<NonNullable<BacklinkGapDomain['type']>, string> = {
    blog: 'Blog',
    news: 'News',
    directory: 'Directory',
    forum: 'Forum',
    social: 'Social',
    other: 'Other',
  }
  return type ? labels[type] : 'Unknown'
}

// ============================================================================
// Sub-components
// ============================================================================

interface LinkIndicatorProps {
  linksTo: boolean
}

function LinkIndicator({ linksTo }: LinkIndicatorProps): React.ReactElement {
  return linksTo ? (
    <div className="flex items-center justify-center">
      <Check className="h-4 w-4 text-green-500" />
    </div>
  ) : (
    <div className="flex items-center justify-center">
      <X className="text-muted-foreground/50 h-4 w-4" />
    </div>
  )
}

interface OpportunityBadgeProps {
  competitorCount: number
  totalCompetitors: number
}

function OpportunityBadge({
  competitorCount,
  totalCompetitors,
}: OpportunityBadgeProps): React.ReactElement {
  // Higher opportunity if more competitors have this link but target doesn't
  const opportunityScore = (competitorCount / totalCompetitors) * 100

  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  let label = 'Low'

  if (opportunityScore >= 75) {
    variant = 'default'
    label = 'High'
  } else if (opportunityScore >= 50) {
    variant = 'outline'
    label = 'Medium'
  }

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * BacklinkGap - Link gap analysis table
 *
 * Shows domains that link to competitors but not to the target domain,
 * representing link building opportunities.
 *
 * @example
 * ```tsx
 * <BacklinkGap
 *   targetDomain="example.com"
 *   competitorDomains={["competitor1.com", "competitor2.com"]}
 *   gapDomains={[
 *     { domain: "blogger.com", rank: 850, linksTo: ["competitor1.com"], linksToTarget: false, ... }
 *   ]}
 * />
 * ```
 */
export function BacklinkGap({
  targetDomain,
  competitorDomains,
  gapDomains,
  title = 'Backlink Gap Analysis',
  description = 'Domains linking to competitors but not to you',
  className,
  initialRows = 10,
}: BacklinkGapProps): React.ReactElement {
  const [showAll, setShowAll] = React.useState(false)

  // Filter to only show gaps (domains not linking to target)
  const gaps = gapDomains.filter((d) => !d.linksToTarget)
  const displayedGaps = showAll ? gaps : gaps.slice(0, initialRows)
  const hasMore = gaps.length > initialRows

  // Summary stats
  const totalOpportunities = gaps.length
  const highAuthority = gaps.filter((d) => d.rank >= 500).length

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {totalOpportunities} opportunities
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {highAuthority} high authority
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Link2 className="text-muted-foreground h-8 w-8" />
            <p className="mt-4 text-sm font-medium">No Link Gaps Found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Great job! Your backlink profile covers the same domains as your competitors.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px]">Referring Domain</TableHead>
                    <TableHead className="text-center">Rank</TableHead>
                    <TableHead className="text-center">{targetDomain.split('.')[0]}</TableHead>
                    {competitorDomains.slice(0, 3).map((domain) => (
                      <TableHead key={domain} className="text-center">
                        {domain.split('.')[0]}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Opportunity</TableHead>
                    <TableHead className="text-center">Spam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedGaps.map((gap) => {
                    const competitorLinkCount = gap.linksTo.length

                    return (
                      <TableRow key={gap.domain} className="hover:bg-muted/50">
                        {/* Referring Domain */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="max-w-[150px] truncate font-medium">{gap.domain}</span>
                            <a
                              href={`https://${gap.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {gap.type && (
                            <span className="text-muted-foreground text-xs">
                              {getDomainTypeLabel(gap.type)}
                            </span>
                          )}
                        </TableCell>

                        {/* Rank */}
                        <TableCell className="text-center">
                          <span className={cn('font-medium tabular-nums', getRankColor(gap.rank))}>
                            {gap.rank}
                          </span>
                        </TableCell>

                        {/* Target Domain (You) */}
                        <TableCell>
                          <LinkIndicator linksTo={gap.linksToTarget} />
                        </TableCell>

                        {/* Competitor columns */}
                        {competitorDomains.slice(0, 3).map((domain) => (
                          <TableCell key={domain}>
                            <LinkIndicator linksTo={gap.linksTo.includes(domain)} />
                          </TableCell>
                        ))}

                        {/* Opportunity Score */}
                        <TableCell className="text-center">
                          <OpportunityBadge
                            competitorCount={competitorLinkCount}
                            totalCompetitors={competitorDomains.length}
                          />
                        </TableCell>

                        {/* Spam Score */}
                        <TableCell className="text-center">
                          {gap.spamScore !== undefined ? (
                            <span
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                getSpamColor(gap.spamScore)
                              )}
                            >
                              {gap.spamScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="flex justify-center border-t p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="gap-2"
                >
                  {showAll ? (
                    <>
                      Show Less <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show {gaps.length - initialRows} More <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Summary Card Component
// ============================================================================

export interface BacklinkGapSummaryProps {
  /** Total link gap opportunities */
  totalOpportunities: number
  /** High authority opportunities (rank >= 500) */
  highAuthorityCount: number
  /** Average rank of gap domains */
  averageRank: number
  /** Potential traffic gain estimate */
  potentialTrafficGain?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact summary card for backlink gap analysis
 */
export function BacklinkGapSummary({
  totalOpportunities,
  highAuthorityCount,
  averageRank,
  potentialTrafficGain,
  className,
}: BacklinkGapSummaryProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Link Building Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{totalOpportunities}</p>
            <p className="text-muted-foreground text-xs">Gap domains</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{highAuthorityCount}</p>
            <p className="text-muted-foreground text-xs">High authority</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{Math.round(averageRank)}</p>
            <p className="text-muted-foreground text-xs">Avg. rank</p>
          </div>
          {potentialTrafficGain !== undefined && (
            <div>
              <p className="text-2xl font-bold text-blue-600">
                +{potentialTrafficGain.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-xs">Est. traffic</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface BacklinkGapSkeletonProps {
  className?: string
  rows?: number
}

/**
 * Loading skeleton for BacklinkGap
 */
export function BacklinkGapSkeleton({
  className,
  rows = 5,
}: BacklinkGapSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            <div className="bg-muted h-5 w-20 animate-pulse rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="bg-muted h-4 w-24 animate-pulse rounded" />
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
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                </TableCell>
                {[...Array(5)].map((_, colIndex) => (
                  <TableCell key={colIndex} className="text-center">
                    <div className="bg-muted mx-auto h-4 w-8 animate-pulse rounded" />
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

export default BacklinkGap
