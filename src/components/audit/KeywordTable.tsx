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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatHistoricalDataDate } from '@/lib/dataforseo/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Clock } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface KeywordData {
  /** Keyword text */
  keyword: string
  /** Current position in Google Organic (1-100+) */
  position: number | null
  /** Previous position for trend */
  previousPosition?: number | null
  /** Monthly search volume */
  searchVolume: number
  /** Competition value 0-1 (multiply by 100 for display) */
  competition?: number
  /** Competition level: LOW, MEDIUM, HIGH */
  competitionLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  /** Cost per click (USD) */
  cpc?: number
  /** URL ranking for this keyword */
  rankingUrl?: string
  /** Estimated Traffic Value (monthly) */
  etv?: number
  /** Estimated paid traffic cost (monthly) */
  trafficCost?: number
  /** Whether this is a new ranking */
  isNew?: boolean
  /** Whether position improved */
  isUp?: boolean
  /** Date when historical data was collected (YYYY-MM format) */
  historicalDataDate?: string
  /** Low estimate for top of page bid (Google Ads) */
  lowTopOfPageBid?: number
  /** High estimate for top of page bid (Google Ads) */
  highTopOfPageBid?: number
}

export interface KeywordTableProps {
  /** Keywords data */
  keywords: KeywordData[]
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Initial rows to show */
  initialRows?: number
  /** Enable search filtering */
  searchable?: boolean
  /** Sort by field */
  defaultSort?: 'position' | 'volume' | 'competition' | 'keyword' | 'etv' | 'trafficCost'
  /** Show ETV column */
  showEtv?: boolean
  /** Show Traffic Cost column */
  showTrafficCost?: boolean
  /** Show CPC column */
  showCpc?: boolean
  /** Compact mode - fewer columns */
  compact?: boolean
}

// ============================================================================
// Utility Functions
// ============================================================================

function getPositionColor(position: number | null): string {
  if (position === null) return 'text-muted-foreground'
  if (position <= 3) return 'text-green-600 dark:text-green-400'
  if (position <= 10) return 'text-blue-600 dark:text-blue-400'
  if (position <= 20) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-muted-foreground'
}

/**
 * Get background color class for competition level
 * LOW (0-29): Green - easier to rank
 * MEDIUM (30-59): Yellow - moderate difficulty
 * HIGH (60+): Red - harder to rank
 */
function getCompetitionBgColor(
  competition: number | undefined,
  level: 'LOW' | 'MEDIUM' | 'HIGH' | undefined
): string {
  // Prefer using the level if available
  if (level === 'LOW') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (level === 'MEDIUM')
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  if (level === 'HIGH') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'

  // Fallback to competition value (0-1 scale, convert to 0-100)
  if (competition !== undefined) {
    const pct = competition * 100
    if (pct < 30) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    if (pct < 60)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }

  return ''
}

function formatSearchVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`
  return volume.toString()
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (value >= 1) return `$${value.toFixed(0)}`
  return `$${value.toFixed(2)}`
}

// ============================================================================
// Main Component
// ============================================================================

type SortField = 'position' | 'volume' | 'competition' | 'keyword' | 'etv' | 'trafficCost'
type SortDirection = 'asc' | 'desc'

/**
 * KeywordTable - Keyword tracking table with rankings and competition data
 *
 * Displays keywords with Google Organic position, search volume,
 * competition level, and bid estimates.
 */
export function KeywordTable({
  keywords,
  title = 'Keyword Rankings',
  description = 'Track your keyword positions and competition',
  className,
  initialRows = 15,
  searchable = true,
  defaultSort = 'position',
  showEtv = false,
  showTrafficCost = false,
  showCpc = false,
  compact = false,
}: KeywordTableProps): React.ReactElement {
  const [showAll, setShowAll] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<SortField>(defaultSort)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')

  // Filter keywords by search
  const filteredKeywords = React.useMemo(() => {
    if (!searchQuery.trim()) return keywords
    const query = searchQuery.toLowerCase()
    return keywords.filter((k) => k.keyword.toLowerCase().includes(query))
  }, [keywords, searchQuery])

  // Sort keywords
  const sortedKeywords = React.useMemo(() => {
    return [...filteredKeywords].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'position':
          const posA = a.position ?? 999
          const posB = b.position ?? 999
          comparison = posA - posB
          break
        case 'volume':
          comparison = b.searchVolume - a.searchVolume
          break
        case 'competition':
          comparison = (a.competition ?? 0) - (b.competition ?? 0)
          break
        case 'keyword':
          comparison = a.keyword.localeCompare(b.keyword)
          break
        case 'etv':
          comparison = (b.etv ?? 0) - (a.etv ?? 0)
          break
        case 'trafficCost':
          comparison = (b.trafficCost ?? 0) - (a.trafficCost ?? 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredKeywords, sortField, sortDirection])

  // Pagination
  const displayedKeywords = showAll ? sortedKeywords : sortedKeywords.slice(0, initialRows)
  const hasMore = sortedKeywords.length > initialRows

  // Handle sort
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>

        {/* Search */}
        {searchable && (
          <div className="relative mt-4">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {displayedKeywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="text-muted-foreground h-8 w-8" />
            <p className="mt-4 text-sm font-medium">No Keywords Found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {searchQuery ? 'Try a different search term' : 'No keyword data available'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[280px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 gap-1"
                        onClick={() => handleSort('keyword')}
                      >
                        Keyword
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 gap-1"
                        onClick={() => handleSort('position')}
                      >
                        Google Organic
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 gap-1"
                        onClick={() => handleSort('volume')}
                      >
                        Volume
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    {showEtv && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 gap-1"
                          onClick={() => handleSort('etv')}
                        >
                          ETV
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                    )}
                    {showTrafficCost && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 gap-1"
                          onClick={() => handleSort('trafficCost')}
                        >
                          Traffic $
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                    )}
                    {showCpc && <TableHead>CPC</TableHead>}
                    {!compact && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8 gap-1"
                          onClick={() => handleSort('competition')}
                        >
                          Competition
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                    )}
                    {!compact && <TableHead>Low Bid</TableHead>}
                    {!compact && <TableHead>High Bid</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedKeywords.map((kw, index) => (
                    <TableRow key={`${kw.keyword}-${index}`} className="hover:bg-muted/50">
                      {/* Keyword */}
                      <TableCell>
                        <span className="font-medium">{kw.keyword}</span>
                        {kw.rankingUrl && (
                          <p className="text-muted-foreground max-w-[250px] truncate text-xs">
                            {kw.rankingUrl}
                          </p>
                        )}
                      </TableCell>

                      {/* Google Organic Position */}
                      <TableCell>
                        <span
                          className={cn(
                            'text-lg font-bold tabular-nums',
                            getPositionColor(kw.position)
                          )}
                        >
                          {kw.position ?? '—'}
                        </span>
                      </TableCell>

                      {/* Search Volume */}
                      <TableCell>
                        <span className="flex items-center gap-1 tabular-nums">
                          {formatSearchVolume(kw.searchVolume)}
                          {kw.historicalDataDate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Clock className="text-muted-foreground h-3 w-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Data from {formatHistoricalDataDate(kw.historicalDataDate)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      </TableCell>

                      {/* ETV (Estimated Traffic Value) */}
                      {showEtv && (
                        <TableCell>
                          <span className="text-green-600 tabular-nums dark:text-green-400">
                            {kw.etv !== undefined ? formatCurrency(kw.etv) : '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Traffic Cost */}
                      {showTrafficCost && (
                        <TableCell>
                          <span className="text-blue-600 tabular-nums dark:text-blue-400">
                            {kw.trafficCost !== undefined ? formatCurrency(kw.trafficCost) : '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* CPC */}
                      {showCpc && (
                        <TableCell>
                          <span className="tabular-nums">
                            {kw.cpc !== undefined ? `$${kw.cpc.toFixed(2)}` : '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Competition - colored background based on level */}
                      {!compact && (
                        <TableCell>
                          {kw.competition !== undefined || kw.competitionLevel ? (
                            <span
                              className={cn(
                                'inline-block rounded px-2 py-0.5 text-sm font-medium tabular-nums',
                                getCompetitionBgColor(kw.competition, kw.competitionLevel)
                              )}
                            >
                              {kw.competition !== undefined
                                ? Math.round(kw.competition * 100)
                                : kw.competitionLevel}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Low Bid */}
                      {!compact && (
                        <TableCell>
                          <span className="tabular-nums">
                            {kw.lowTopOfPageBid !== undefined
                              ? `$${kw.lowTopOfPageBid.toFixed(2)}`
                              : '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* High Bid */}
                      {!compact && (
                        <TableCell>
                          <span className="tabular-nums">
                            {kw.highTopOfPageBid !== undefined
                              ? `$${kw.highTopOfPageBid.toFixed(2)}`
                              : '—'}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Show More/Less */}
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
                      Show {sortedKeywords.length - initialRows} More{' '}
                      <ChevronDown className="h-4 w-4" />
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
// Skeleton Component
// ============================================================================

export interface KeywordTableSkeletonProps {
  className?: string
  rows?: number
}

export function KeywordTableSkeleton({
  className,
  rows = 10,
}: KeywordTableSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="bg-muted h-6 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        <div className="bg-muted mt-4 h-10 w-full animate-pulse rounded" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(7)].map((_, i) => (
                <TableHead key={i}>
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
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
                {[...Array(6)].map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div className="bg-muted h-4 w-12 animate-pulse rounded" />
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

export default KeywordTable
