'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketShareData {
  domain: string
  share: number
  traffic: number
  color: string
}

interface MarketShareChartProps {
  clientDomain: string
  data: MarketShareData[]
  totalMarketTraffic?: number
  isLoading?: boolean
}

export function MarketShareChart({
  clientDomain,
  data,
  totalMarketTraffic,
  isLoading,
}: MarketShareChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-500" />
            Local Market Share
          </CardTitle>
          <CardDescription>Calculating market visibility...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-500" />
            Local Market Share
          </CardTitle>
          <CardDescription>No market data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete an audit with competitors to see market share visualization.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort by share descending
  const sortedData = [...data].sort((a, b) => b.share - a.share)
  const clientShare = data.find((d) => d.domain === clientDomain)?.share ?? 0
  const clientRank = sortedData.findIndex((d) => d.domain === clientDomain) + 1

  // Generate pie chart segments
  let cumulativePercent = 0
  const segments = sortedData.map((item) => {
    const startPercent = cumulativePercent
    cumulativePercent += item.share
    return {
      ...item,
      startPercent,
      endPercent: cumulativePercent,
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              Local Market Share
            </CardTitle>
            <CardDescription>Your share of local search visibility</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{clientShare.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              #{clientRank} of {data.length}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual pie chart representation */}
        <div className="flex items-center justify-center gap-8">
          {/* SVG Pie Chart */}
          <div className="relative h-48 w-48">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {segments.map((segment) => {
                const startAngle = (segment.startPercent / 100) * 360
                const endAngle = (segment.endPercent / 100) * 360
                const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                const startX = 50 + 45 * Math.cos((Math.PI * startAngle) / 180)
                const startY = 50 + 45 * Math.sin((Math.PI * startAngle) / 180)
                const endX = 50 + 45 * Math.cos((Math.PI * endAngle) / 180)
                const endY = 50 + 45 * Math.sin((Math.PI * endAngle) / 180)

                const isClient = segment.domain === clientDomain

                return (
                  <path
                    key={segment.domain}
                    d={`M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="1"
                    className={cn(
                      'transition-all duration-200',
                      isClient && 'drop-shadow-lg'
                    )}
                    style={{
                      transform: isClient ? 'scale(1.05)' : undefined,
                      transformOrigin: '50% 50%',
                    }}
                  />
                )
              })}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{clientShare.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">Your share</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {sortedData.slice(0, 6).map((item) => {
              const isClient = item.domain === clientDomain
              return (
                <div
                  key={item.domain}
                  className={cn(
                    'flex items-center gap-2 rounded px-2 py-1',
                    isClient && 'bg-primary/10'
                  )}
                >
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      isClient && 'font-semibold'
                    )}
                  >
                    {truncateDomain(item.domain)}
                    {isClient && ' (You)'}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {item.share.toFixed(1)}%
                  </span>
                </div>
              )
            })}
            {sortedData.length > 6 && (
              <div className="text-xs text-muted-foreground">
                +{sortedData.length - 6} others
              </div>
            )}
          </div>
        </div>

        {/* Total market context */}
        {totalMarketTraffic && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p>
                Total local market search traffic:{' '}
                <strong>{totalMarketTraffic.toLocaleString()}</strong> monthly searches
              </p>
              <p>
                Your estimated traffic:{' '}
                <strong>
                  {Math.round((clientShare / 100) * totalMarketTraffic).toLocaleString()}
                </strong>{' '}
                visits/month
              </p>
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground">
          {clientShare < 10 && (
            <p>
              Your current market share suggests significant room for growth.
              Improving rankings for high-volume keywords could substantially increase visibility.
            </p>
          )}
          {clientShare >= 10 && clientShare < 25 && (
            <p>
              You have a solid presence in your local market.
              Focus on capturing top positions for remaining keywords.
            </p>
          )}
          {clientShare >= 25 && (
            <p>
              You&apos;re a market leader in local search visibility!
              Maintain rankings and consider expanding to adjacent keywords.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function truncateDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, '')
  return cleaned.length > 15 ? cleaned.substring(0, 15) + '...' : cleaned
}

// Helper to generate default colors
export function generateMarketShareColors(domains: string[], clientDomain: string): string[] {
  const palette = [
    '#3b82f6', // blue - client
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#10b981', // emerald
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
  ]

  return domains.map((domain, idx) => {
    if (domain === clientDomain) return palette[0] ?? '#3b82f6'
    const colorIndex = (idx % (palette.length - 1)) + 1
    return palette[colorIndex] ?? '#6b7280'
  })
}
