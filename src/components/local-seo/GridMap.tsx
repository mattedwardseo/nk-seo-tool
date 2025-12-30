'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GridCell, type GridCellData } from './GridCell'
import { GridLegend } from './GridLegend'
import { GridPointDetail } from './GridPointDetail'
import { MapPin, Map, LayoutGrid } from 'lucide-react'

// Dynamic import for MapWithGrid to avoid SSR issues with Leaflet
const MapWithGrid = dynamic(() => import('./MapWithGrid').then((mod) => ({ default: mod.MapWithGrid })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-muted/30 rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  ),
})

interface GridMapPoint {
  row: number
  col: number
  lat: number
  lng: number
  rank: number | null
  keyword?: string
  keywords?: Array<{
    keyword: string
    rank: number | null
    topRankings?: unknown[]
  }>
  avgRank?: number | null
  topRankings?: Array<{
    name: string
    rank: number
    cid?: string
    rating?: number
    reviewCount?: number
    category?: string
  }>
}

interface GridMapProps {
  points: GridMapPoint[]
  gridSize: number
  centerLat: number
  centerLng: number
  targetBusinessName?: string
  keyword?: string
  isLoading?: boolean
  showLegend?: boolean
  showDetails?: boolean
  radiusMiles?: number
  defaultView?: 'map' | 'grid'
  aggregates?: {
    avgRank: number | null
    shareOfVoice: number
    timesInTop3: number
    timesNotRanking: number
    totalPoints?: number
  }
}

export function GridMap({
  points,
  gridSize,
  centerLat,
  centerLng,
  targetBusinessName,
  keyword,
  isLoading = false,
  showLegend = true,
  showDetails = true,
  radiusMiles = 5,
  defaultView = 'map',
  aggregates,
}: GridMapProps): React.ReactElement {
  const [selectedPoint, setSelectedPoint] = useState<GridCellData | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<GridCellData | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'grid'>(defaultView)

  // Build grid matrix from points
  const gridMatrix = useMemo(() => {
    const matrix: (GridCellData | null)[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => null)
    )

    for (const point of points) {
      if (point.row >= 0 && point.row < gridSize && point.col >= 0 && point.col < gridSize) {
        matrix[point.row]![point.col] = {
          row: point.row,
          col: point.col,
          lat: point.lat,
          lng: point.lng,
          rank: point.rank,
          keyword: point.keyword,
          keywords: point.keywords,
          avgRank: point.avgRank,
          topRankings: point.topRankings,
        }
      }
    }

    return matrix
  }, [points, gridSize])

  const centerRow = Math.floor(gridSize / 2)
  const centerCol = Math.floor(gridSize / 2)

  // Auto-select center point on initial load
  useEffect(() => {
    if (!selectedPoint && gridMatrix[centerRow] && gridMatrix[centerRow][centerCol]) {
      setSelectedPoint(gridMatrix[centerRow][centerCol])
    }
  }, [gridMatrix, centerRow, centerCol, selectedPoint])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Local Rankings Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid gap-4 ${showDetails ? 'lg:grid-cols-3' : ''}`}>
      {/* Grid Map */}
      <Card className={showDetails ? 'lg:col-span-2' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Local Rankings Grid
            </CardTitle>
            <div className="flex items-center gap-2">
              {keyword && (
                <span className="text-sm font-normal text-muted-foreground">
                  Keyword: <span className="font-medium">{keyword}</span>
                </span>
              )}
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border p-0.5">
                <Button
                  variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
          {aggregates && (
            <div className="flex flex-wrap gap-4 text-sm mt-2">
              <div>
                <span className="text-muted-foreground">Avg Rank: </span>
                <span className="font-semibold">
                  {aggregates.avgRank?.toFixed(1) ?? 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Share of Voice: </span>
                <span className="font-semibold">{aggregates.shareOfVoice.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Top 3: </span>
                <span className="font-semibold text-green-600">
                  {aggregates.timesInTop3}/{aggregates.totalPoints ?? points.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Not Ranking: </span>
                <span className="font-semibold text-red-600">{aggregates.timesNotRanking}</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map View */}
          {viewMode === 'map' && (
            <MapWithGrid
              points={points}
              gridSize={gridSize}
              centerLat={centerLat}
              centerLng={centerLng}
              targetBusinessName={targetBusinessName}
              radiusMiles={radiusMiles}
              selectedKeyword={keyword}
              onPointClick={setSelectedPoint}
            />
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <>
              <div
                className="grid gap-1 p-4 bg-muted/30 rounded-lg mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  maxWidth: `${gridSize * 56}px`,
                }}
              >
                {gridMatrix.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    if (!cell) {
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-12 h-12 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground text-xs"
                        >
                          ?
                        </div>
                      )
                    }

                    return (
                      <GridCell
                        key={`${rowIndex}-${colIndex}`}
                        data={cell}
                        isSelected={selectedPoint?.row === rowIndex && selectedPoint?.col === colIndex}
                        isCenter={rowIndex === centerRow && colIndex === centerCol}
                        onClick={setSelectedPoint}
                        onHover={setHoveredPoint}
                      />
                    )
                  })
                )}
              </div>

              {/* Legend */}
              {showLegend && (
                <div className="flex justify-center pt-2">
                  <GridLegend compact />
                </div>
              )}

              {/* Center point info */}
              <p className="text-xs text-center text-muted-foreground">
                <MapPin className="h-3 w-3 inline mr-1" />
                Center: {centerLat.toFixed(5)}, {centerLng.toFixed(5)}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Panel */}
      {showDetails && (
        <div className="lg:col-span-1">
          <GridPointDetail
            point={selectedPoint ?? hoveredPoint}
            targetBusinessName={targetBusinessName}
            onClose={() => setSelectedPoint(null)}
          />
        </div>
      )}
    </div>
  )
}
