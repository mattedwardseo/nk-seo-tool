'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Star } from 'lucide-react'
import type { GridCellData } from './GridCell'

interface GridPointDetailProps {
  point: GridCellData | null
  targetBusinessName?: string
  onClose?: () => void
}

function getRankBadgeVariant(rank: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (rank <= 3) return 'default'
  if (rank <= 10) return 'secondary'
  return 'destructive'
}

export function GridPointDetail({
  point,
  targetBusinessName,
  onClose,
}: GridPointDetailProps): React.ReactElement | null {
  if (!point) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click on a grid cell to see details</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const rankings = point.topRankings ?? []
  const keyword = point.keyword ?? point.keywords?.[0]?.keyword ?? 'All keywords'

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Grid Point Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Row {point.row + 1}, Col {point.col + 1}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Keyword */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Keyword</p>
          <p className="text-sm font-medium">{keyword}</p>
        </div>

        {/* Target Business Rank */}
        {point.rank !== null && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Your Rank at This Location
            </p>
            <Badge variant={getRankBadgeVariant(point.rank)} className="text-lg px-3 py-1">
              #{point.rank}
            </Badge>
          </div>
        )}

        {point.rank === null && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Your Rank at This Location
            </p>
            <Badge variant="destructive" className="px-3 py-1">
              Not in Top 20
            </Badge>
          </div>
        )}

        {/* Multiple Keywords View */}
        {point.keywords && point.keywords.length > 1 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Rank by Keyword
            </p>
            <div className="space-y-1.5">
              {point.keywords.map((kw) => (
                <div
                  key={kw.keyword}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate flex-1 mr-2">{kw.keyword}</span>
                  <Badge
                    variant={kw.rank ? getRankBadgeVariant(kw.rank) : 'destructive'}
                    className="shrink-0"
                  >
                    {kw.rank ? `#${kw.rank}` : '20+'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Rankings at This Point */}
        {rankings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Top Rankings at This Location
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rankings.slice(0, 10).map((competitor, index) => {
                const isTarget =
                  targetBusinessName &&
                  competitor.name.toLowerCase().includes(targetBusinessName.toLowerCase())

                return (
                  <div
                    key={`${competitor.cid ?? index}-${competitor.name}`}
                    className={`p-2 rounded-lg border text-sm ${
                      isTarget ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={getRankBadgeVariant(competitor.rank)}
                        className="shrink-0"
                      >
                        #{competitor.rank}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{competitor.name}</p>
                        {competitor.rating && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{competitor.rating}</span>
                            {competitor.reviewCount !== undefined && (
                              <span>({competitor.reviewCount})</span>
                            )}
                          </div>
                        )}
                        {competitor.category && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {competitor.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
