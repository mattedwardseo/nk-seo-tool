'use client'

import { cn } from '@/lib/utils'

interface Anchor {
  id: string
  anchor: string
  backlinks: number
  referringDomains: number
}

interface AnchorTextCloudProps {
  anchors: Anchor[]
  maxItems?: number
}

export function AnchorTextCloud({ anchors, maxItems = 20 }: AnchorTextCloudProps) {
  if (!anchors || anchors.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No anchor text data available
      </div>
    )
  }

  // Sort by backlinks and take top items
  const sortedAnchors = [...anchors]
    .sort((a, b) => b.backlinks - a.backlinks)
    .slice(0, maxItems)

  // Calculate size based on backlinks count
  const maxBacklinks = Math.max(...sortedAnchors.map(a => a.backlinks))
  const minBacklinks = Math.min(...sortedAnchors.map(a => a.backlinks))
  const range = maxBacklinks - minBacklinks || 1

  const getSize = (backlinks: number): string => {
    const normalized = (backlinks - minBacklinks) / range
    if (normalized > 0.8) return 'text-xl font-bold'
    if (normalized > 0.6) return 'text-lg font-semibold'
    if (normalized > 0.4) return 'text-base font-medium'
    if (normalized > 0.2) return 'text-sm'
    return 'text-xs'
  }

  const getColor = (index: number): string => {
    const colors: readonly string[] = [
      'text-blue-600 dark:text-blue-400',
      'text-emerald-600 dark:text-emerald-400',
      'text-violet-600 dark:text-violet-400',
      'text-orange-600 dark:text-orange-400',
      'text-pink-600 dark:text-pink-400',
      'text-cyan-600 dark:text-cyan-400',
      'text-amber-600 dark:text-amber-400',
      'text-indigo-600 dark:text-indigo-400',
    ] as const
    return colors[index % colors.length]!
  }

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center py-4">
      {sortedAnchors.map((anchor, index) => (
        <div
          key={anchor.id}
          className={cn(
            'px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-default',
            getSize(anchor.backlinks),
            getColor(index)
          )}
          title={`${anchor.backlinks} backlinks from ${anchor.referringDomains} domains`}
        >
          {anchor.anchor || '(empty)'}
        </div>
      ))}
    </div>
  )
}

