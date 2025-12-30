'use client'

import { cn } from '@/lib/utils'

interface PositionBadgeProps {
  position: number | null
  className?: string
}

/**
 * Badge showing SERP position with color coding
 * - Top 3: Green
 * - Top 10: Blue
 * - Top 20: Yellow
 * - Top 100: Orange
 * - Not ranking: Gray
 */
export function PositionBadge({ position, className }: PositionBadgeProps) {
  if (position === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        —
      </span>
    )
  }

  const getColorClass = () => {
    if (position <= 3) return 'bg-success-bg text-success-foreground border border-success-border'
    if (position <= 10) return 'bg-info-bg text-info-foreground border border-info-border'
    if (position <= 20) return 'bg-warning-bg text-warning-foreground border border-warning-border'
    if (position <= 100) return 'bg-error-bg text-error-foreground border border-error-border'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        getColorClass(),
        className
      )}
    >
      #{position}
    </span>
  )
}
