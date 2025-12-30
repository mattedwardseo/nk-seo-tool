'use client'

import { useState } from 'react'
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
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from 'lucide-react'

export interface CompetitorData {
  rank?: number
  businessName: string
  gmbCid?: string | null
  rating?: number | null
  reviewCount?: number | null
  avgRank: number
  timesInTop3: number
  timesInTop10: number
  timesInTop20: number
  shareOfVoice: number
  rankChange?: number | null
}

interface CompetitorTableProps {
  competitors: CompetitorData[]
  targetBusiness?: CompetitorData | null
  totalGridPoints?: number
  isLoading?: boolean
}

type SortField = 'avgRank' | 'shareOfVoice' | 'timesInTop3' | 'rating' | 'reviewCount'
type SortOrder = 'asc' | 'desc'

function RankChangeIndicator({ change }: { change: number | null | undefined }): React.ReactElement {
  if (change === null || change === undefined) {
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  if (change > 0) {
    return (
      <span className="flex items-center text-green-600">
        <TrendingUp className="h-4 w-4 mr-1" />
        <span className="text-xs">+{change.toFixed(1)}</span>
      </span>
    )
  }

  if (change < 0) {
    return (
      <span className="flex items-center text-red-600">
        <TrendingDown className="h-4 w-4 mr-1" />
        <span className="text-xs">{change.toFixed(1)}</span>
      </span>
    )
  }

  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function getRankBadgeVariant(avgRank: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (avgRank <= 3) return 'default'
  if (avgRank <= 10) return 'secondary'
  if (avgRank <= 20) return 'outline'
  return 'destructive'
}

export function CompetitorTable({
  competitors,
  targetBusiness,
  totalGridPoints,
  isLoading = false,
}: CompetitorTableProps): React.ReactElement {
  const [sortField, setSortField] = useState<SortField>('avgRank')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'avgRank' ? 'asc' : 'desc')
    }
  }

  const sortedCompetitors = [...competitors].sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }): React.ReactElement => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortOrder === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Target Business Highlight */}
      {targetBusiness && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Business</p>
              <p className="text-lg font-bold">{targetBusiness.businessName}</p>
            </div>
            <Badge variant="default" className="text-lg px-3 py-1">
              Avg #{targetBusiness.avgRank.toFixed(1)}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Share of Voice</p>
              <p className="font-semibold">{targetBusiness.shareOfVoice.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Top 3</p>
              <p className="font-semibold text-green-600">
                {targetBusiness.timesInTop3}
                {totalGridPoints && ` / ${totalGridPoints}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Top 10</p>
              <p className="font-semibold">{targetBusiness.timesInTop10}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Change</p>
              <RankChangeIndicator change={targetBusiness.rankChange} />
            </div>
          </div>
        </div>
      )}

      {/* Competitors Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>
                <SortButton field="rating">Rating</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="avgRank">Avg Rank</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="timesInTop3">Top 3</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="shareOfVoice">SoV</SortButton>
              </TableHead>
              <TableHead className="w-20">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading competitors...
                </TableCell>
              </TableRow>
            ) : sortedCompetitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No competitors found
                </TableCell>
              </TableRow>
            ) : (
              sortedCompetitors.map((competitor, index) => (
                <TableRow key={`${competitor.gmbCid ?? competitor.businessName}-${index}`}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-[200px]">
                        {competitor.businessName}
                      </span>
                      {competitor.gmbCid && (
                        <a
                          href={`https://www.google.com/maps?cid=${competitor.gmbCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {competitor.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{competitor.rating.toFixed(1)}</span>
                        {competitor.reviewCount !== null && (
                          <span className="text-muted-foreground text-xs">
                            ({competitor.reviewCount})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRankBadgeVariant(competitor.avgRank)}>
                      #{competitor.avgRank.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {competitor.timesInTop3}
                    </span>
                    <span className="text-muted-foreground">
                      / {competitor.timesInTop10}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{competitor.shareOfVoice.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell>
                    <RankChangeIndicator change={competitor.rankChange} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
