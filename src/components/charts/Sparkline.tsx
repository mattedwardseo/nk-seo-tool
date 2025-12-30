'use client'

import * as React from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface SparklineDataPoint {
  value: number
  label?: string
}

export interface SparklineProps {
  /** Data points for the sparkline */
  data: SparklineDataPoint[] | number[]
  /** Width of the sparkline */
  width?: number
  /** Height of the sparkline */
  height?: number
  /** Line color - auto-detects trend if not specified */
  color?: 'green' | 'red' | 'blue' | 'gray' | 'auto'
  /** Show endpoint dot */
  showEndpoint?: boolean
  /** Line stroke width */
  strokeWidth?: number
  /** Curve type */
  curveType?: 'linear' | 'monotone' | 'natural'
  /** Additional CSS classes */
  className?: string
  /** Accessible label */
  ariaLabel?: string
}

// ============================================================================
// Constants
// ============================================================================

const COLOR_MAP = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  gray: '#6b7280',
} as const

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeData(data: SparklineDataPoint[] | number[]): SparklineDataPoint[] {
  if (data.length === 0) return []

  if (typeof data[0] === 'number') {
    return (data as number[]).map((value, index) => ({
      value,
      label: `Point ${index + 1}`,
    }))
  }

  return data as SparklineDataPoint[]
}

function detectTrend(data: SparklineDataPoint[]): 'up' | 'down' | 'neutral' {
  if (data.length < 2) return 'neutral'

  const first = data[0]?.value ?? 0
  const last = data[data.length - 1]?.value ?? 0

  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'neutral'
}

function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return COLOR_MAP.green
    case 'down':
      return COLOR_MAP.red
    default:
      return COLOR_MAP.gray
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Sparkline - Inline mini chart for trends
 *
 * Word-sized visualization (40-80px × 20-30px per research).
 * Shows 7-30 day windows with auto-detected trend coloring.
 *
 * @example
 * ```tsx
 * // Simple array of values
 * <Sparkline data={[10, 15, 12, 18, 22, 20, 25]} />
 *
 * // With explicit data points
 * <Sparkline
 *   data={[{ value: 10 }, { value: 15 }, { value: 20 }]}
 *   color="blue"
 *   showEndpoint
 * />
 * ```
 */
export function Sparkline({
  data,
  width = 60,
  height = 24,
  color = 'auto',
  showEndpoint = true,
  strokeWidth = 1.5,
  curveType = 'monotone',
  className,
  ariaLabel,
}: SparklineProps): React.ReactElement {
  const normalizedData = normalizeData(data)
  const trend = detectTrend(normalizedData)

  const lineColor = color === 'auto' ? getTrendColor(trend) : COLOR_MAP[color]

  // Calculate Y domain with some padding
  const values = normalizedData.map((d) => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const padding = (maxVal - minVal) * 0.1 || 1

  if (normalizedData.length === 0) {
    return (
      <div
        className={cn('bg-muted/50 flex items-center justify-center rounded', className)}
        style={{ width, height }}
        role="img"
        aria-label="No data"
      >
        <span className="text-muted-foreground text-[10px]">--</span>
      </div>
    )
  }

  // Generate accessible label
  const accessibleLabel =
    ariaLabel || `Trend: ${trend}, from ${values[0]} to ${values[values.length - 1]}`

  return (
    <div
      className={cn('inline-block', className)}
      style={{ width, height }}
      role="img"
      aria-label={accessibleLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalizedData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[minVal - padding, maxVal + padding]} hide />
          <Line
            type={curveType}
            dataKey="value"
            stroke={lineColor}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive={false}
          />
          {showEndpoint && normalizedData.length > 0 && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="none"
              dot={(props) => {
                const { cx, cy, index } = props
                if (index !== normalizedData.length - 1) return <circle key={index} />
                return (
                  <circle
                    key={index}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={lineColor}
                    stroke="white"
                    strokeWidth={1}
                  />
                )
              }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================================
// Variants
// ============================================================================

export interface SparklineWithLabelProps extends SparklineProps {
  /** Label text shown below */
  label: string
}

/**
 * SparklineWithLabel - Sparkline with a text label below
 */
export function SparklineWithLabel({
  label,
  ...sparklineProps
}: SparklineWithLabelProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center">
      <Sparkline {...sparklineProps} />
      <span className="text-muted-foreground mt-0.5 text-[10px]">{label}</span>
    </div>
  )
}

export interface SparklineRangeProps {
  /** Data points */
  data: SparklineDataPoint[] | number[]
  /** Current value to highlight */
  currentValue?: number
  /** Min value in range */
  minValue?: number
  /** Max value in range */
  maxValue?: number
  /** Width */
  width?: number
  /** Height */
  height?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * SparklineRange - Sparkline with min/max range indicators
 */
export function SparklineRange({
  data,
  currentValue,
  width = 80,
  height = 32,
  className,
}: SparklineRangeProps): React.ReactElement {
  const normalizedData = normalizeData(data)
  const values = normalizedData.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const current = currentValue ?? values[values.length - 1] ?? 0

  return (
    <div className={cn('flex flex-col', className)} style={{ width }}>
      <Sparkline data={data} width={width} height={height - 12} showEndpoint />
      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{min.toFixed(0)}</span>
        <span className="text-foreground font-medium">{current.toFixed(0)}</span>
        <span>{max.toFixed(0)}</span>
      </div>
    </div>
  )
}

// ============================================================================
// Skeleton
// ============================================================================

export interface SparklineSkeletonProps {
  width?: number
  height?: number
  className?: string
}

/**
 * Loading skeleton for Sparkline
 */
export function SparklineSkeleton({
  width = 60,
  height = 24,
  className,
}: SparklineSkeletonProps): React.ReactElement {
  return (
    <div className={cn('bg-muted animate-pulse rounded', className)} style={{ width, height }} />
  )
}

export default Sparkline
