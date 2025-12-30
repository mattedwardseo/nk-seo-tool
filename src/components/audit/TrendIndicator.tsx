'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral'

export interface TrendIndicatorProps {
  /** The change value (positive = up, negative = down, 0 = neutral) */
  value: number | null
  /** Format the value as percentage */
  isPercentage?: boolean
  /** Show the numeric value alongside the indicator */
  showValue?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Invert colors (red for up, green for down) - useful for metrics where lower is better */
  invertColors?: boolean
  /** Force a specific direction regardless of value */
  direction?: TrendDirection
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    iconSize: 14,
    fontSize: 'text-xs',
    gap: 'gap-0.5',
  },
  md: {
    iconSize: 16,
    fontSize: 'text-sm',
    gap: 'gap-1',
  },
} as const

// ============================================================================
// Helper Functions
// ============================================================================

function getDirection(value: number | null, forcedDirection?: TrendDirection): TrendDirection {
  if (forcedDirection) return forcedDirection
  if (value === null || value === 0) return 'neutral'
  return value > 0 ? 'up' : 'down'
}

function formatValue(value: number, isPercentage: boolean): string {
  const absValue = Math.abs(value)
  const formatted = isPercentage ? `${absValue.toFixed(1)}%` : absValue.toFixed(0)
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted
}

// ============================================================================
// Component
// ============================================================================

/**
 * TrendIndicator - Visual indicator for metric changes
 *
 * Shows directional arrows (▲▼—) with optional numeric values.
 * Color-coded: green for improvements, red for drops, gray for neutral.
 * Includes accessibility text alternatives.
 *
 * @example
 * ```tsx
 * <TrendIndicator value={5} showValue />        // +5 with green up arrow
 * <TrendIndicator value={-3} isPercentage />    // -3.0% with red down arrow
 * <TrendIndicator value={0} />                  // Gray dash
 * ```
 */
export function TrendIndicator({
  value,
  isPercentage = false,
  showValue = true,
  size = 'sm',
  invertColors = false,
  direction: forcedDirection,
  className,
}: TrendIndicatorProps): React.ReactElement {
  const config = SIZE_CONFIG[size]
  const direction = getDirection(value, forcedDirection)

  // Determine colors based on direction and inversion
  const isPositive = direction === 'up'
  const isNegative = direction === 'down'
  const isNeutral = direction === 'neutral'

  // Color classes - can be inverted for metrics where lower is better
  const colorClasses = cn(
    isNeutral && 'text-muted-foreground',
    !invertColors && isPositive && 'text-green-600 dark:text-green-400',
    !invertColors && isNegative && 'text-red-600 dark:text-red-400',
    invertColors && isPositive && 'text-red-600 dark:text-red-400',
    invertColors && isNegative && 'text-green-600 dark:text-green-400'
  )

  // Accessibility label
  const trendLabel = isPositive ? 'increased' : isNegative ? 'decreased' : 'unchanged'
  const ariaLabel =
    value !== null
      ? `${trendLabel} by ${Math.abs(value)}${isPercentage ? ' percent' : ''}`
      : 'No change data'

  return (
    <span
      className={cn('inline-flex items-center', config.gap, colorClasses, className)}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Directional Icon */}
      {isPositive && <TrendingUp size={config.iconSize} aria-hidden="true" />}
      {isNegative && <TrendingDown size={config.iconSize} aria-hidden="true" />}
      {isNeutral && <Minus size={config.iconSize} aria-hidden="true" />}

      {/* Numeric Value */}
      {showValue && value !== null && (
        <span className={cn('font-medium tabular-nums', config.fontSize)}>
          {formatValue(value, isPercentage)}
        </span>
      )}
    </span>
  )
}

// ============================================================================
// Compact Variant
// ============================================================================

export interface TrendArrowProps {
  /** Direction of the trend */
  direction: TrendDirection
  /** Size of the arrow */
  size?: 'sm' | 'md'
  /** Invert colors */
  invertColors?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * TrendArrow - Minimal arrow-only trend indicator
 *
 * Use when space is limited and only direction matters.
 */
export function TrendArrow({
  direction,
  size = 'sm',
  invertColors = false,
  className,
}: TrendArrowProps): React.ReactElement {
  const config = SIZE_CONFIG[size]

  const isPositive = direction === 'up'
  const isNegative = direction === 'down'
  const isNeutral = direction === 'neutral'

  const colorClasses = cn(
    isNeutral && 'text-muted-foreground',
    !invertColors && isPositive && 'text-green-600 dark:text-green-400',
    !invertColors && isNegative && 'text-red-600 dark:text-red-400',
    invertColors && isPositive && 'text-red-600 dark:text-red-400',
    invertColors && isNegative && 'text-green-600 dark:text-green-400'
  )

  const ariaLabel = isPositive ? 'trending up' : isNegative ? 'trending down' : 'no change'

  return (
    <span className={cn('inline-flex', colorClasses, className)} role="img" aria-label={ariaLabel}>
      {isPositive && <TrendingUp size={config.iconSize} aria-hidden="true" />}
      {isNegative && <TrendingDown size={config.iconSize} aria-hidden="true" />}
      {isNeutral && <Minus size={config.iconSize} aria-hidden="true" />}
    </span>
  )
}

// ============================================================================
// Badge Variant
// ============================================================================

export interface TrendBadgeProps {
  /** The change value */
  value: number | null
  /** Format as percentage */
  isPercentage?: boolean
  /** Invert colors */
  invertColors?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * TrendBadge - Pill-shaped trend indicator with background
 *
 * More prominent variant for dashboard cards.
 */
export function TrendBadge({
  value,
  isPercentage = false,
  invertColors = false,
  className,
}: TrendBadgeProps): React.ReactElement {
  const direction = getDirection(value, undefined)

  const isPositive = direction === 'up'
  const isNegative = direction === 'down'
  const isNeutral = direction === 'neutral'

  const bgClasses = cn(
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
    isNeutral && 'bg-muted text-muted-foreground',
    !invertColors &&
      isPositive &&
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    !invertColors && isNegative && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    invertColors && isPositive && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    invertColors &&
      isNegative &&
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  )

  const ariaLabel =
    value !== null
      ? `${isPositive ? 'increased' : isNegative ? 'decreased' : 'unchanged'} by ${Math.abs(value)}${isPercentage ? ' percent' : ''}`
      : 'No change data'

  return (
    <span className={cn(bgClasses, className)} role="img" aria-label={ariaLabel}>
      {isPositive && <TrendingUp size={12} aria-hidden="true" />}
      {isNegative && <TrendingDown size={12} aria-hidden="true" />}
      {isNeutral && <Minus size={12} aria-hidden="true" />}
      {value !== null && <span className="tabular-nums">{formatValue(value, isPercentage)}</span>}
    </span>
  )
}

export default TrendIndicator
