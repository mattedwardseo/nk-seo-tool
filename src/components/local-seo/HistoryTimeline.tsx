'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { RANK_COLOR_CLASSES } from '@/lib/local-seo/types'

interface ScanHistoryItem {
  id: string
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED'
  avgRank: number | null
  shareOfVoice: number | null
  topCompetitor?: string | null
  apiCallsUsed?: number
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  // Mini grid data for thumbnail
  gridPoints?: Array<{
    row: number
    col: number
    rank: number | null
  }>
}

interface HistoryTimelineProps {
  scans: ScanHistoryItem[]
  gridSize?: number
  onSelectScan?: (scanId: string) => void
  selectedScanId?: string
}

function getStatusIcon(status: string): React.ReactElement {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'SCANNING':
      return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function MiniHeatmap({
  gridPoints,
  gridSize = 7,
}: {
  gridPoints: Array<{ row: number; col: number; rank: number | null }>
  gridSize: number
}): React.ReactElement {
  // Build grid matrix
  const matrix: (number | null)[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  )

  for (const point of gridPoints) {
    if (point.row >= 0 && point.row < gridSize && point.col >= 0 && point.col < gridSize) {
      matrix[point.row]![point.col] = point.rank
    }
  }

  const getRankColorClass = (rank: number | null): string => {
    if (rank === null) return RANK_COLOR_CLASSES.notRanking
    if (rank <= 3) return RANK_COLOR_CLASSES.top3
    if (rank <= 10) return RANK_COLOR_CLASSES.top10
    if (rank <= 20) return RANK_COLOR_CLASSES.top20
    return RANK_COLOR_CLASSES.notRanking
  }

  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        width: '56px',
        height: '56px',
      }}
    >
      {matrix.map((row, rowIndex) =>
        row.map((rank, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`rounded-sm ${getRankColorClass(rank)}`}
          />
        ))
      )}
    </div>
  )
}

function RankChange({
  current,
  previous,
}: {
  current: number | null
  previous: number | null
}): React.ReactElement {
  if (current === null || previous === null) {
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  const change = previous - current // Positive = improvement (lower rank is better)

  if (change > 0) {
    return (
      <span className="flex items-center text-green-600 text-xs">
        <TrendingUp className="h-3 w-3 mr-0.5" />+{change.toFixed(1)}
      </span>
    )
  }

  if (change < 0) {
    return (
      <span className="flex items-center text-red-600 text-xs">
        <TrendingDown className="h-3 w-3 mr-0.5" />
        {change.toFixed(1)}
      </span>
    )
  }

  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export function HistoryTimeline({
  scans,
  gridSize = 7,
  onSelectScan,
  selectedScanId,
}: HistoryTimelineProps): React.ReactElement {
  if (scans.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scan history yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Scan History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scans.map((scan, index) => {
            const previousScan = scans[index + 1]
            const isSelected = selectedScanId === scan.id

            return (
              <button
                key={scan.id}
                onClick={() => onSelectScan?.(scan.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Mini Heatmap */}
                {scan.gridPoints && scan.gridPoints.length > 0 ? (
                  <MiniHeatmap gridPoints={scan.gridPoints} gridSize={gridSize} />
                ) : (
                  <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
                    {getStatusIcon(scan.status)}
                  </div>
                )}

                {/* Scan Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        scan.status === 'COMPLETED'
                          ? 'secondary'
                          : scan.status === 'FAILED'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {scan.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(scan.completedAt ?? scan.createdAt)}
                    </span>
                  </div>

                  {scan.status === 'COMPLETED' && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Avg Rank: </span>
                        <span className="font-medium">
                          #{scan.avgRank?.toFixed(1) ?? 'N/A'}
                        </span>
                        <RankChange
                          current={scan.avgRank}
                          previous={previousScan?.avgRank ?? null}
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground">SoV: </span>
                        <span className="font-medium">
                          {scan.shareOfVoice?.toFixed(1) ?? 0}%
                        </span>
                      </div>
                      {scan.topCompetitor && (
                        <div className="truncate" title={scan.topCompetitor}>
                          <span className="text-muted-foreground">Top: </span>
                          <span className="font-medium">{scan.topCompetitor}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {scan.status === 'FAILED' && (
                    <p className="text-xs text-destructive">Scan failed</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
