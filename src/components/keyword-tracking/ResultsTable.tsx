'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Star, Info } from 'lucide-react'
import { PositionBadge } from './PositionBadge'
import { PositionChangeBadge } from './PositionChangeBadge'
import { ResultFilters, type FilterState } from './ResultFilters'

interface KeywordResult {
  id: string
  keyword: string
  searchVolume: number | null
  volumeDate: string | null
  cpc: number | null
  keywordDifficulty: number | null
  position: number | null
  previousPosition: number | null
  positionChange: number | null
  // Historical position changes (Phase 17)
  change7d: number | null
  change30d: number | null
  change90d: number | null
  rankingUrl: string | null
  serpFeatures: string[]
  // Local Pack data (Phase 16 Sprint 3)
  localPackPosition: number | null
  localPackRating: number | null
  localPackReviews: number | null
  localPackCid: string | null
}

interface ResultsTableProps {
  runId: string
}

/**
 * Format volume date for display
 * "2024-10" -> "Oct 2024"
 */
function formatVolumeDate(date: string | null): string | null {
  if (!date) return null
  const parts = date.split('-')
  if (parts.length < 2) return date
  const year = parts[0]
  const month = parts[1]
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = parseInt(month ?? '0', 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return date
  return `${monthNames[monthIndex]} ${year}`
}

/**
 * Get KD (Keyword Difficulty) badge styling
 */
function getKDBadgeClass(kd: number): string {
  if (kd <= 30) {
    return 'bg-success-bg text-success-foreground border-success-border'
  } else if (kd <= 60) {
    return 'bg-warning-bg text-warning-foreground border-warning-border'
  } else {
    return 'bg-error-bg text-error-foreground border-error-border'
  }
}

/**
 * Get KD label
 */
function getKDLabel(kd: number): string {
  if (kd <= 30) return 'Easy'
  if (kd <= 60) return 'Medium'
  return 'Hard'
}

/**
 * Compact historical change indicator
 */
function HistoricalChange({ change, period }: { change: number | null; period: string }): React.ReactElement {
  if (change === null) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`text-xs font-medium cursor-help ${
            isPositive
              ? 'text-green-600'
              : isNegative
              ? 'text-red-600'
              : 'text-muted-foreground'
          }`}
        >
          {isPositive ? '+' : ''}{change}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {isPositive
            ? `Improved ${change} positions`
            : isNegative
            ? `Dropped ${Math.abs(change)} positions`
            : 'No change'}{' '}
          vs {period} ago
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export function ResultsTable({ runId }: ResultsTableProps) {
  const [results, setResults] = useState<KeywordResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'position',
    sortOrder: 'asc',
    positionFilter: 'all',
    changeFilter: 'all',
  })
  const limit = 25

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          positionFilter: filters.positionFilter,
          changeFilter: filters.changeFilter,
        })

        const response = await fetch(
          `/api/keyword-tracking/runs/${runId}/results?${params}`
        )
        const data = await response.json()

        if (data.success) {
          setResults(data.data.results)
          setTotal(data.data.total)
        } else {
          setError(data.error || 'Failed to fetch results')
        }
      } catch {
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [runId, offset, filters])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setOffset(0) // Reset to first page on filter change
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setOffset(0)}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <ResultFilters filters={filters} onChange={handleFilterChange} />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Keyword</TableHead>
                <TableHead className="text-right w-[80px]">Volume</TableHead>
                <TableHead className="text-center w-[60px]">KD</TableHead>
                <TableHead className="text-right w-[60px]">CPC</TableHead>
                <TableHead className="text-center w-[60px]">Pos</TableHead>
                <TableHead className="text-center w-[50px]">Δ</TableHead>
                <TableHead className="text-center w-[50px]">7d</TableHead>
                <TableHead className="text-center w-[50px]">30d</TableHead>
                <TableHead className="text-center w-[50px]">90d</TableHead>
                <TableHead className="text-center w-[100px]">Local Pack</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <p className="text-muted-foreground">No results found</p>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    {/* Keyword with URL tooltip */}
                    <TableCell>
                      {result.rankingUrl ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <span className="font-medium">{result.keyword}</span>
                              <ExternalLink className="inline h-3 w-3 ml-1 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-md">
                            <p className="text-xs break-all">
                              <a
                                href={result.rankingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {result.rankingUrl}
                              </a>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="font-medium">{result.keyword}</span>
                      )}
                    </TableCell>

                    {/* Volume with date tooltip */}
                    <TableCell className="text-right">
                      {result.searchVolume !== null ? (
                        result.volumeDate ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help flex items-center justify-end gap-1">
                                {result.searchVolume.toLocaleString()}
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Data from {formatVolumeDate(result.volumeDate)}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span>{result.searchVolume.toLocaleString()}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* KD (Keyword Difficulty) */}
                    <TableCell className="text-center">
                      {result.keywordDifficulty !== null ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getKDBadgeClass(result.keywordDifficulty)}`}
                            >
                              {result.keywordDifficulty}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{getKDLabel(result.keywordDifficulty)} difficulty</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* CPC */}
                    <TableCell className="text-right">
                      {result.cpc ? `$${result.cpc.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    {/* Position */}
                    <TableCell className="text-center">
                      <PositionBadge position={result.position} />
                    </TableCell>

                    {/* Change */}
                    <TableCell className="text-center">
                      <PositionChangeBadge
                        position={result.position}
                        previousPosition={result.previousPosition}
                        positionChange={result.positionChange}
                      />
                    </TableCell>

                    {/* 7d Change */}
                    <TableCell className="text-center">
                      <HistoricalChange change={result.change7d} period="7 days" />
                    </TableCell>

                    {/* 30d Change */}
                    <TableCell className="text-center">
                      <HistoricalChange change={result.change30d} period="30 days" />
                    </TableCell>

                    {/* 90d Change */}
                    <TableCell className="text-center">
                      <HistoricalChange change={result.change90d} period="90 days" />
                    </TableCell>

                    {/* Local Pack */}
                    <TableCell className="text-center">
                      {result.localPackPosition !== null ? (
                        <Badge
                          variant="outline"
                          className="bg-success-bg text-success-foreground border-success-border"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          #{result.localPackPosition}
                          {result.localPackRating !== null && (
                            <span className="ml-1 flex items-center">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-0.5" />
                              {result.localPackRating.toFixed(1)}
                            </span>
                          )}
                        </Badge>
                      ) : result.serpFeatures.includes('local_pack') ? (
                        <span className="text-xs text-muted-foreground">Not in pack</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} keywords
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
