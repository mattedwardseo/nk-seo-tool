'use client'

import * as React from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface RadarMetrics {
  /** Technical SEO score (0-100) */
  technical: number
  /** Content/rankings score (0-100) */
  content: number
  /** Local SEO score (0-100) */
  local: number
  /** Backlinks score (0-100) */
  backlinks: number
  /** Authority/rank score (0-100) - normalized */
  authority?: number
  /** User experience score (0-100) */
  ux?: number
}

export interface CompetitorRadarData {
  /** Domain name */
  domain: string
  /** Metrics for radar chart */
  metrics: RadarMetrics
  /** Color for this domain's radar line */
  color?: string
}

export interface CompetitorRadarProps {
  /** Target domain name */
  targetDomain: string
  /** Target domain metrics */
  targetMetrics: RadarMetrics
  /** Optional competitor data for comparison */
  competitors?: CompetitorRadarData[]
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Height of the chart */
  height?: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COLORS = {
  target: '#3b82f6', // blue-500 - primary color for target
  competitor1: '#ef4444', // red-500
  competitor2: '#22c55e', // green-500
  competitor3: '#f59e0b', // amber-500
  competitor4: '#8b5cf6', // violet-500
}

const METRIC_LABELS: Record<keyof RadarMetrics, string> = {
  technical: 'Technical',
  content: 'Content',
  local: 'Local SEO',
  backlinks: 'Backlinks',
  authority: 'Authority',
  ux: 'User Experience',
}

// ============================================================================
// Helper Functions
// ============================================================================

function transformToChartData(
  targetDomain: string,
  targetMetrics: RadarMetrics,
  competitors: CompetitorRadarData[]
): Array<{
  metric: string
  fullMark: number
  [key: string]: string | number
}> {
  // Get all metric keys that have data
  const metricKeys = Object.keys(targetMetrics).filter(
    (key) => targetMetrics[key as keyof RadarMetrics] !== undefined
  ) as (keyof RadarMetrics)[]

  return metricKeys.map((key) => {
    const dataPoint: { metric: string; fullMark: number; [domain: string]: string | number } = {
      metric: METRIC_LABELS[key],
      fullMark: 100,
      [targetDomain]: targetMetrics[key] ?? 0,
    }

    competitors.forEach((comp) => {
      dataPoint[comp.domain] = comp.metrics[key] ?? 0
    })

    return dataPoint
  })
}

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background rounded-lg border p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium tabular-nums">{Math.round(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CompetitorRadar - Spider/radar chart for multi-dimensional comparison
 *
 * Displays a radar chart comparing the target domain's SEO metrics
 * against competitors across multiple dimensions.
 *
 * @example
 * ```tsx
 * <CompetitorRadar
 *   targetDomain="example.com"
 *   targetMetrics={{ technical: 85, content: 70, local: 90, backlinks: 65 }}
 *   competitors={[
 *     { domain: "competitor.com", metrics: { technical: 75, ... } }
 *   ]}
 * />
 * ```
 */
export function CompetitorRadar({
  targetDomain,
  targetMetrics,
  competitors = [],
  title = 'SEO Performance Radar',
  description = 'Compare performance across key SEO dimensions',
  className,
  height = 400,
}: CompetitorRadarProps): React.ReactElement {
  const chartData = transformToChartData(targetDomain, targetMetrics, competitors)

  // Build domain list with colors
  const domains = [
    { domain: targetDomain, color: DEFAULT_COLORS.target },
    ...competitors.slice(0, 4).map((c, i) => ({
      domain: c.domain,
      color: c.color || Object.values(DEFAULT_COLORS)[i + 1],
    })),
  ]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
                axisLine={false}
              />

              {/* Render radar for each domain */}
              {domains.map((d, index) => (
                <Radar
                  key={d.domain}
                  name={d.domain}
                  dataKey={d.domain}
                  stroke={d.color}
                  fill={d.color}
                  fillOpacity={index === 0 ? 0.3 : 0.1}
                  strokeWidth={index === 0 ? 2 : 1.5}
                  dot={index === 0}
                  activeDot={{ r: 4 }}
                />
              ))}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Single Domain Radar (No Competitors)
// ============================================================================

export interface SingleRadarProps {
  /** Domain metrics */
  metrics: RadarMetrics
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Height of the chart */
  height?: number
  /** Color for the radar fill */
  color?: string
}

/**
 * SingleRadar - Radar chart for a single domain
 *
 * Displays a radar chart showing one domain's SEO metrics
 * without competitor comparison.
 */
export function SingleRadar({
  metrics,
  title = 'SEO Performance Overview',
  description = 'Performance across key SEO dimensions',
  className,
  height = 300,
  color = DEFAULT_COLORS.target,
}: SingleRadarProps): React.ReactElement {
  // Transform metrics to chart format
  const chartData = (Object.keys(metrics) as (keyof RadarMetrics)[])
    .filter((key) => metrics[key] !== undefined)
    .map((key) => ({
      metric: METRIC_LABELS[key],
      value: metrics[key] ?? 0,
      fullMark: 100,
    }))

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
                axisLine={false}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.4}
                strokeWidth={2}
                dot
                activeDot={{ r: 5 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0]
                  return (
                    <div className="bg-background rounded-lg border p-2 shadow-lg">
                      <p className="text-sm font-medium">{data.payload.metric}</p>
                      <p className="text-muted-foreground text-sm">
                        Score:{' '}
                        <span className="font-medium">{Math.round(data.value as number)}</span>
                      </p>
                    </div>
                  )
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface CompetitorRadarSkeletonProps {
  className?: string
  height?: number
}

/**
 * Loading skeleton for CompetitorRadar
 */
export function CompetitorRadarSkeleton({
  className,
  height = 400,
}: CompetitorRadarSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="bg-muted h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="relative">
            {/* Simulated radar grid */}
            <div className="border-muted h-64 w-64 animate-pulse rounded-full border-2 border-dashed" />
            <div className="border-muted absolute inset-8 animate-pulse rounded-full border-2 border-dashed" />
            <div className="border-muted absolute inset-16 animate-pulse rounded-full border-2 border-dashed" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompetitorRadar
