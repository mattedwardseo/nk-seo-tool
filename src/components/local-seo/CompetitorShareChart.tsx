'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-react'

interface CompetitorShare {
  name?: string
  businessName?: string
  shareOfVoice: number
  isTarget?: boolean
}

interface CompetitorShareChartProps {
  competitors: CompetitorShare[]
  maxDisplay?: number
}

const colors = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
  '#64748b', // slate-500
]

export function CompetitorShareChart({
  competitors,
  maxDisplay = 8,
}: CompetitorShareChartProps): React.ReactElement {
  // Sort by share of voice and take top N
  const sortedCompetitors = [...competitors]
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice)
    .slice(0, maxDisplay)

  const totalShare = sortedCompetitors.reduce((acc, c) => acc + c.shareOfVoice, 0)
  const othersShare = Math.max(0, 100 - totalShare)

  // Calculate percentages for the donut chart
  const segments = sortedCompetitors.map((c, i) => ({
    ...c,
    name: c.name ?? c.businessName ?? 'Unknown',
    color: c.isTarget ? '#3b82f6' : colors[i % colors.length],
    percentage: c.shareOfVoice,
  }))

  if (othersShare > 0) {
    segments.push({
      name: 'Others',
      shareOfVoice: othersShare,
      color: '#e5e7eb',
      percentage: othersShare,
    })
  }

  // Create SVG donut chart segments
  let cumulativePercentage = 0
  const svgSegments = segments.map((segment) => {
    const startAngle = (cumulativePercentage / 100) * 360
    const endAngle = ((cumulativePercentage + segment.percentage) / 100) * 360
    cumulativePercentage += segment.percentage

    const startRadians = (startAngle - 90) * (Math.PI / 180)
    const endRadians = (endAngle - 90) * (Math.PI / 180)

    const x1 = 50 + 40 * Math.cos(startRadians)
    const y1 = 50 + 40 * Math.sin(startRadians)
    const x2 = 50 + 40 * Math.cos(endRadians)
    const y2 = 50 + 40 * Math.sin(endRadians)

    const largeArcFlag = segment.percentage > 50 ? 1 : 0

    return {
      ...segment,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
    }
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Share of Voice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {svgSegments.map((segment, i) => (
                <path
                  key={i}
                  d={segment.path}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">
                {sortedCompetitors[0]?.shareOfVoice.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5 overflow-hidden">
            {segments.slice(0, 6).map((segment) => (
              <div
                key={segment.name}
                className={`flex items-center gap-2 text-sm ${
                  segment.isTarget ? 'font-semibold' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate flex-1" title={segment.name}>
                  {segment.name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {segment.shareOfVoice.toFixed(1)}%
                </span>
              </div>
            ))}
            {segments.length > 6 && (
              <p className="text-xs text-muted-foreground pl-5">
                +{segments.length - 6} more
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
