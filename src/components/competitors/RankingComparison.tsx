'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Trophy, ArrowUp, ArrowDown, Minus, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface SerpComparisonRow {
  keyword: string
  searchVolume: number
  cpc: number
  clientPosition: number | null
  competitorPositions: Record<string, number | null>
  positionDiff: number | null
}

interface RankingComparisonProps {
  clientDomain: string
  competitorDomains: string[]
  comparisons: SerpComparisonRow[]
  isLoading?: boolean
}

export function RankingComparison({
  clientDomain: _clientDomain,
  competitorDomains,
  comparisons,
  isLoading,
}: RankingComparisonProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredComparisons = comparisons.filter((row) =>
    row.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking Comparison
          </CardTitle>
          <CardDescription>Loading SERP rankings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking Comparison
          </CardTitle>
          <CardDescription>No ranking data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete an audit to see side-by-side keyword rankings vs competitors.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary stats
  const clientRanking = comparisons.filter(
    (c) => c.clientPosition !== null && c.clientPosition <= 10
  ).length
  const clientTop3 = comparisons.filter(
    (c) => c.clientPosition !== null && c.clientPosition <= 3
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking Comparison
            </CardTitle>
            <CardDescription>
              Your rankings vs {competitorDomains.length} competitor{competitorDomains.length !== 1 && 's'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{clientTop3}</div>
            <div className="text-xs text-muted-foreground">Top 3 positions</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2">
          <Badge variant="secondary">{comparisons.length} keywords tracked</Badge>
          <Badge variant="secondary">{clientRanking} in top 10</Badge>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            {clientTop3} in top 3
          </Badge>
        </div>

        {/* Visual Position Comparison Chart */}
        {comparisons.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-3 text-sm font-medium">Position Comparison (Top Keywords)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={comparisons
                  .filter(c => c.clientPosition !== null || Object.values(c.competitorPositions).some(p => p !== null))
                  .sort((a, b) => b.searchVolume - a.searchVolume)
                  .slice(0, 6)
                  .map(c => {
                    const bestCompetitorPos = Math.min(
                      ...Object.values(c.competitorPositions)
                        .filter((p): p is number => p !== null && p > 0)
                        .concat([100])
                    )
                    return {
                      keyword: c.keyword.length > 18 ? c.keyword.substring(0, 18) + '...' : c.keyword,
                      'You': c.clientPosition ?? 100,
                      'Best Competitor': bestCompetitorPos === 100 ? null : bestCompetitorPos,
                      youWinning: (c.clientPosition ?? 100) <= (bestCompetitorPos === 100 ? 100 : bestCompetitorPos),
                    }
                  })}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 30]}
                  tickFormatter={(v) => v > 20 ? '20+' : `#${v}`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="keyword"
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => value >= 100 ? 'Not ranking' : `#${value}`}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="You" fill="#3b82f6" name="You" radius={[0, 4, 4, 0]}>
                  {comparisons
                    .filter(c => c.clientPosition !== null || Object.values(c.competitorPositions).some(p => p !== null))
                    .sort((a, b) => b.searchVolume - a.searchVolume)
                    .slice(0, 6)
                    .map((entry, index) => {
                      const bestCompPos = Math.min(
                        ...Object.values(entry.competitorPositions)
                          .filter((p): p is number => p !== null && p > 0)
                          .concat([100])
                      )
                      const isWinning = (entry.clientPosition ?? 100) <= bestCompPos
                      return (
                        <Cell
                          key={`cell-you-${index}`}
                          fill={isWinning ? '#22c55e' : '#3b82f6'}
                        />
                      )
                    })}
                </Bar>
                <Bar dataKey="Best Competitor" fill="#ef4444" name="Best Competitor" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-green-500"></span> You&apos;re winning
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-blue-500"></span> You
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-red-500"></span> Best competitor
              </span>
            </div>
          </div>
        )}

        {/* Search filter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Comparison table */}
        <div className="max-h-[400px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[200px]">Keyword</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-center">
                  <span className="font-semibold text-primary">You</span>
                </TableHead>
                {competitorDomains.slice(0, 3).map((domain) => (
                  <TableHead key={domain} className="text-center">
                    <span className="text-xs">{truncateDomain(domain)}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComparisons.map((row) => (
                <TableRow key={row.keyword}>
                  <TableCell className="font-medium">
                    <span className="line-clamp-1">{row.keyword}</span>
                    <span className="text-xs text-muted-foreground">
                      ${row.cpc.toFixed(2)} CPC
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.searchVolume.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <PositionBadge position={row.clientPosition} highlighted />
                  </TableCell>
                  {competitorDomains.slice(0, 3).map((domain) => (
                    <TableCell key={domain} className="text-center">
                      <PositionBadge position={row.competitorPositions[domain]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Top 3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>Top 10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span>Page 2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-gray-400" />
            <span>Not ranking</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PositionBadge({
  position,
  highlighted,
}: {
  position: number | null | undefined
  highlighted?: boolean
}) {
  if (position === null || position === undefined) {
    return (
      <Badge variant="outline" className="text-gray-400">
        <Minus className="mr-1 h-3 w-3" />—
      </Badge>
    )
  }

  const getVariant = () => {
    if (position <= 3) return 'bg-green-500 hover:bg-green-600'
    if (position <= 10) return 'bg-blue-500 hover:bg-blue-600'
    if (position <= 20) return 'bg-amber-500 hover:bg-amber-600'
    return 'bg-gray-500 hover:bg-gray-600'
  }

  const getTrend = () => {
    // Would compare to previous position if available
    return null
  }

  return (
    <Badge
      className={cn(
        'min-w-[50px] justify-center',
        getVariant(),
        highlighted && 'ring-2 ring-primary ring-offset-1'
      )}
    >
      #{position}
      {getTrend() === 'up' && <ArrowUp className="ml-1 h-3 w-3" />}
      {getTrend() === 'down' && <ArrowDown className="ml-1 h-3 w-3" />}
    </Badge>
  )
}

function truncateDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, '').replace(/\.com$|\.net$|\.org$/, '')
  return cleaned.length > 12 ? cleaned.substring(0, 12) + '...' : cleaned
}
