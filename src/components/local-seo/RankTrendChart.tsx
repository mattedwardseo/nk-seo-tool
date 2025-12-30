'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface RankDataPoint {
  date: Date
  avgRank: number | null
  shareOfVoice: number | null
}

interface RankTrendChartProps {
  data: RankDataPoint[]
  height?: number
}

export function RankTrendChart({
  data,
  height = 200,
}: RankTrendChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ranking Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">No historical data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for chart
  const validData = data.filter((d) => d.avgRank !== null)
  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ranking Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">No ranking data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find min/max for scaling
  const ranks = validData.map((d) => d.avgRank!)
  const minRank = Math.min(...ranks)
  const maxRank = Math.max(...ranks)
  const rankRange = maxRank - minRank || 1

  // Scale rank to y position (inverted - lower rank is better/higher on chart)
  const scaleY = (rank: number): number => {
    const normalized = (rank - minRank) / rankRange
    return height - 40 - normalized * (height - 60) // Leave space for labels
  }

  // Generate path
  const chartWidth = 100 // percentage
  const xStep = chartWidth / (validData.length - 1 || 1)

  const pathPoints = validData.map((d, i) => ({
    x: i * xStep,
    y: scaleY(d.avgRank!),
  }))

  const pathD = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`)
    .join(' ')

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Ranking Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-muted-foreground">
            <span>#{minRank.toFixed(0)}</span>
            <span>#{((minRank + maxRank) / 2).toFixed(0)}</span>
            <span>#{maxRank.toFixed(0)}</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full">
            <svg
              className="w-full"
              style={{ height: height - 24 }}
              viewBox={`0 0 100 ${height - 24}`}
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line
                x1="0"
                y1="20"
                x2="100%"
                y2="20"
                stroke="#e5e7eb"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#e5e7eb"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1={height - 44}
                x2="100%"
                y2={height - 44}
                stroke="#e5e7eb"
                strokeDasharray="2"
              />

              {/* Area fill */}
              <path
                d={`${pathD} L 100% ${height - 40} L 0% ${height - 40} Z`}
                fill="url(#rankGradient)"
                opacity="0.2"
              />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Points */}
              {pathPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={`${p.x}%`}
                  cy={p.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="rankGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              {validData.length <= 7 ? (
                validData.map((d, i) => (
                  <span key={i}>{formatDate(d.date)}</span>
                ))
              ) : (
                <>
                  <span>{formatDate(validData[0]!.date)}</span>
                  <span>{formatDate(validData[Math.floor(validData.length / 2)]!.date)}</span>
                  <span>{formatDate(validData[validData.length - 1]!.date)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-semibold">
              #{validData[validData.length - 1]?.avgRank?.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Best: </span>
            <span className="font-semibold text-green-600">#{minRank.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Worst: </span>
            <span className="font-semibold text-red-600">#{maxRank.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
