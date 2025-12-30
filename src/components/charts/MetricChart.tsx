'use client'

import * as React from 'react'
import { AreaChart, BarChart, DonutChart, type Color } from '@tremor/react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ChartType = 'area' | 'bar' | 'donut'

export interface ChartDataPoint {
  [key: string]: string | number
}

export interface MetricChartProps {
  /** Chart type */
  type: ChartType
  /** Chart data */
  data: ChartDataPoint[]
  /** Data categories to display (keys from data objects) */
  categories: string[]
  /** Index key for x-axis (area/bar) or name key (donut) */
  index: string
  /** Tremor color palette */
  colors?: Color[]
  /** Chart height in pixels */
  height?: number
  /** Show legend */
  showLegend?: boolean
  /** Show grid lines (area/bar only) */
  showGridLines?: boolean
  /** Show x-axis (area/bar only) */
  showXAxis?: boolean
  /** Show y-axis (area/bar only) */
  showYAxis?: boolean
  /** Value formatter function */
  valueFormatter?: (value: number) => string
  /** Show animation */
  showAnimation?: boolean
  /** Additional CSS classes */
  className?: string
  /** Variant style for donut chart */
  variant?: 'donut' | 'pie'
  /** Label for donut center */
  label?: string
}

// ============================================================================
// Default Formatters
// ============================================================================

const defaultValueFormatter = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

const percentageFormatter = (value: number): string => `${value.toFixed(1)}%`

// ============================================================================
// Default Colors
// ============================================================================

const DEFAULT_COLORS: Color[] = ['blue', 'cyan', 'indigo', 'violet', 'fuchsia']

const SCORE_COLORS: Color[] = ['emerald', 'lime', 'yellow', 'orange', 'red']

// ============================================================================
// Component
// ============================================================================

/**
 * MetricChart - Unified chart component using Tremor
 *
 * Supports area charts, bar charts, and donut charts with consistent styling.
 *
 * @example
 * ```tsx
 * // Area chart for trends
 * <MetricChart
 *   type="area"
 *   data={[{ date: '2024-01', traffic: 1200 }]}
 *   categories={['traffic']}
 *   index="date"
 * />
 *
 * // Donut chart for distribution
 * <MetricChart
 *   type="donut"
 *   data={[{ name: 'Technical', value: 25 }]}
 *   categories={['value']}
 *   index="name"
 * />
 * ```
 */
export function MetricChart({
  type,
  data,
  categories,
  index,
  colors = DEFAULT_COLORS,
  height = 200,
  showLegend = true,
  showGridLines = true,
  showXAxis = true,
  showYAxis = true,
  valueFormatter = defaultValueFormatter,
  showAnimation = true,
  className,
  variant = 'donut',
  label,
}: MetricChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'bg-muted/30 flex items-center justify-center rounded-lg border border-dashed',
          className
        )}
        style={{ height }}
      >
        <span className="text-muted-foreground text-sm">No data available</span>
      </div>
    )
  }

  const commonProps = {
    data,
    className: cn('w-full', className),
    showAnimation,
  }

  switch (type) {
    case 'area':
      return (
        <AreaChart
          {...commonProps}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={showLegend}
          showGridLines={showGridLines}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          style={{ height }}
        />
      )

    case 'bar':
      return (
        <BarChart
          {...commonProps}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={showLegend}
          showGridLines={showGridLines}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          style={{ height }}
        />
      )

    case 'donut':
      return (
        <div style={{ height }}>
          <DonutChart
            {...commonProps}
            index={index}
            category={categories[0] || 'value'}
            colors={colors}
            valueFormatter={valueFormatter}
            showLabel={!!label}
            label={label}
            variant={variant}
          />
        </div>
      )

    default:
      return <div className={cn('text-muted-foreground', className)}>Unsupported chart type</div>
  }
}

// ============================================================================
// Preset Chart Components
// ============================================================================

export interface TrendChartProps {
  data: { date: string; value: number }[]
  height?: number
  color?: Color
  showXAxis?: boolean
  showYAxis?: boolean
  className?: string
}

/**
 * TrendChart - Simple area chart for showing trends over time
 */
export function TrendChart({
  data,
  height = 120,
  color = 'blue',
  showXAxis = true,
  showYAxis = false,
  className,
}: TrendChartProps): React.ReactElement {
  return (
    <MetricChart
      type="area"
      data={data}
      categories={['value']}
      index="date"
      colors={[color]}
      height={height}
      showLegend={false}
      showGridLines={false}
      showXAxis={showXAxis}
      showYAxis={showYAxis}
      className={className}
    />
  )
}

export interface ScoreDistributionChartProps {
  technical: number
  content: number
  local: number
  backlinks: number
  height?: number
  className?: string
}

/**
 * ScoreDistributionChart - Donut chart showing category score distribution
 */
export function ScoreDistributionChart({
  technical,
  content,
  local,
  backlinks,
  height = 200,
  className,
}: ScoreDistributionChartProps): React.ReactElement {
  const data = [
    { name: 'Technical', value: technical },
    { name: 'Content', value: content },
    { name: 'Local', value: local },
    { name: 'Backlinks', value: backlinks },
  ]

  return (
    <MetricChart
      type="donut"
      data={data}
      categories={['value']}
      index="name"
      colors={['blue', 'violet', 'amber', 'emerald']}
      height={height}
      showLegend={true}
      className={className}
    />
  )
}

export interface PositionBucketChartProps {
  data: {
    bucket: string
    count: number
  }[]
  height?: number
  className?: string
}

/**
 * PositionBucketChart - Bar chart for keyword position distribution
 */
export function PositionBucketChart({
  data,
  height = 160,
  className,
}: PositionBucketChartProps): React.ReactElement {
  return (
    <MetricChart
      type="bar"
      data={data}
      categories={['count']}
      index="bucket"
      colors={SCORE_COLORS}
      height={height}
      showLegend={false}
      showYAxis={false}
      className={className}
    />
  )
}

// ============================================================================
// Skeleton
// ============================================================================

export interface MetricChartSkeletonProps {
  height?: number
  className?: string
}

/**
 * Loading skeleton for MetricChart
 */
export function MetricChartSkeleton({
  height = 200,
  className,
}: MetricChartSkeletonProps): React.ReactElement {
  return <div className={cn('bg-muted animate-pulse rounded-lg', className)} style={{ height }} />
}

// ============================================================================
// Exports
// ============================================================================

export { DEFAULT_COLORS, SCORE_COLORS, defaultValueFormatter, percentageFormatter }

export default MetricChart
