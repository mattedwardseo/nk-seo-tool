'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { HistoricalRankItem } from '@/lib/dataforseo/schemas'

// ============================================================================
// Types
// ============================================================================

export interface KeywordTrendChartProps {
  /** Historical rank data from DataForSEO Labs API */
  data?: HistoricalRankItem[]
  /** Additional CSS classes */
  className?: string
}

interface ChartDataPoint {
  month: string
  'Top 3': number
  '4-10': number
  '11-20': number
  '21-50': number
  '51-100': number
}

// ============================================================================
// Color Configuration - SEMrush-style palette
// ============================================================================

// SEMrush-style: Green for Top 3, then blue gradient light to dark
const POSITION_COLORS = {
  'Top 3': '#22c55e', // Green (bottom of stack - best rankings)
  '4-10': '#1d4ed8', // Dark blue
  '11-20': '#3b82f6', // Medium blue
  '21-50': '#60a5fa', // Light blue
  '51-100': '#7dd3fc', // Lightest sky blue (top of stack)
} as const

const POSITION_CATEGORIES = [
  'Top 3',
  '4-10',
  '11-20',
  '21-50',
  '51-100',
] as const

// ============================================================================
// Custom Tooltip Component
// ============================================================================

interface TooltipPayload {
  value?: number
  dataKey?: string
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.dataKey}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-gray-200 pt-2 text-sm dark:border-gray-700">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            Total
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Transform API data to chart-friendly format
 * Maps DataForSEO position buckets to SEMrush-style categories
 */
function transformData(items: HistoricalRankItem[]): ChartDataPoint[] {
  // Sort by date ascending (oldest first for left-to-right chart)
  const sorted = [...items].sort((a, b) => {
    const dateA = new Date(a.year, a.month - 1)
    const dateB = new Date(b.year, b.month - 1)
    return dateA.getTime() - dateB.getTime()
  })

  return sorted.map((item) => {
    const org = item.metrics.organic

    // Map API buckets to SEMrush-style buckets
    const top3 = (org?.pos_1 ?? 0) + (org?.pos_2_3 ?? 0)
    const pos4_10 = org?.pos_4_10 ?? 0
    const pos11_20 = org?.pos_11_20 ?? 0
    const pos21_50 =
      (org?.pos_21_30 ?? 0) + (org?.pos_31_40 ?? 0) + (org?.pos_41_50 ?? 0)
    const pos51_100 =
      (org?.pos_51_60 ?? 0) +
      (org?.pos_61_70 ?? 0) +
      (org?.pos_71_80 ?? 0) +
      (org?.pos_81_90 ?? 0) +
      (org?.pos_91_100 ?? 0)

    // Format month label (e.g., "Jul 25")
    const date = new Date(item.year, item.month - 1)
    const monthLabel = date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })

    return {
      month: monthLabel,
      'Top 3': top3,
      '4-10': pos4_10,
      '11-20': pos11_20,
      '21-50': pos21_50,
      '51-100': pos51_100,
    }
  })
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ============================================================================
// Component
// ============================================================================

/**
 * KeywordTrendChart - SEMrush-style stacked bar chart showing keyword position trends
 *
 * Displays 6 months of historical ranking distribution data.
 * Position buckets: Top 3, 4-10, 11-20, 21-50, 51-100
 *
 * @example
 * ```tsx
 * <KeywordTrendChart data={audit.stepResults.serp?.keywordTrend} />
 * ```
 */
export function KeywordTrendChart({
  data,
  className,
}: KeywordTrendChartProps): React.ReactElement {
  // Handle loading/empty states
  if (!data || data.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Organic Keywords Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 flex h-[180px] items-center justify-center rounded-lg border border-dashed">
            <span className="text-muted-foreground text-sm">
              No historical data available
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for chart
  const chartData = transformData(data)

  // Get latest and previous month for comparison
  const latestMonth = data[0] // API returns newest first
  const previousMonth = data.length > 1 ? data[1] : null

  const currentTotal = latestMonth?.metrics.organic?.count ?? 0
  const previousTotal = previousMonth?.metrics.organic?.count ?? 0
  const percentChange = calculatePercentChange(currentTotal, previousTotal)

  // Determine trend icon
  const TrendIcon =
    percentChange > 0 ? TrendingUp : percentChange < 0 ? TrendingDown : Minus
  const trendColor =
    percentChange > 0
      ? 'text-emerald-600'
      : percentChange < 0
        ? 'text-red-600'
        : 'text-gray-500'

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Organic Keywords Trend</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {currentTotal.toLocaleString()}
              </span>
              <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
                <TrendIcon className="h-4 w-4" />
                <span>{Math.abs(percentChange).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {POSITION_CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: POSITION_COLORS[cat] }}
                />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              className="fill-gray-500 dark:fill-gray-400"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              className="fill-gray-500 dark:fill-gray-400"
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            {/* Stack order: bottom to top (Top 3 at bottom, 51-100 at top) */}
            <Bar
              dataKey="Top 3"
              stackId="stack"
              fill={POSITION_COLORS['Top 3']}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="4-10"
              stackId="stack"
              fill={POSITION_COLORS['4-10']}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="11-20"
              stackId="stack"
              fill={POSITION_COLORS['11-20']}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="21-50"
              stackId="stack"
              fill={POSITION_COLORS['21-50']}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="51-100"
              stackId="stack"
              fill={POSITION_COLORS['51-100']}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Skeleton
// ============================================================================

export function KeywordTrendChartSkeleton({
  className,
}: {
  className?: string
}): React.ReactElement {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted h-[160px] animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  )
}

export default KeywordTrendChart
