'use client'

import { ArrowUp, ArrowDown, Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PositionChangeBadgeProps {
  position: number | null
  previousPosition: number | null
  positionChange: number | null
  className?: string
}

/**
 * Badge showing position change vs previous run
 * - Positive change (moved up): Green with up arrow
 * - Negative change (moved down): Red with down arrow
 * - No change: Gray with dash
 * - New ranking: Green with "NEW"
 * - Lost ranking: Red with "LOST"
 */
export function PositionChangeBadge({
  position,
  previousPosition,
  positionChange,
  className,
}: PositionChangeBadgeProps) {
  // New ranking (wasn't ranking before, now is)
  if (position !== null && previousPosition === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-success-bg text-success-foreground border border-success-border',
          className
        )}
      >
        <Plus className="h-3 w-3" />
        NEW
      </span>
    )
  }

  // Lost ranking (was ranking before, now isn't)
  if (position === null && previousPosition !== null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-error-bg text-error-foreground border border-error-border',
          className
        )}
      >
        <X className="h-3 w-3" />
        LOST
      </span>
    )
  }

  // No change data (both null or first run)
  if (positionChange === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        <Minus className="h-3 w-3" />
      </span>
    )
  }

  // No change (same position)
  if (positionChange === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        <Minus className="h-3 w-3" />
        0
      </span>
    )
  }

  // Improved (positive change means moved up in rankings)
  if (positionChange > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-success-bg text-success-foreground border border-success-border',
          className
        )}
      >
        <ArrowUp className="h-3 w-3" />
        {positionChange}
      </span>
    )
  }

  // Declined (negative change means moved down in rankings)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        'bg-error-bg text-error-foreground border border-error-border',
        className
      )}
    >
      <ArrowDown className="h-3 w-3" />
      {Math.abs(positionChange)}
    </span>
  )
}
