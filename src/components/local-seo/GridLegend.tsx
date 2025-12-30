'use client'

import { RANK_COLOR_CLASSES } from '@/lib/local-seo/types'

interface LegendItem {
  label: string
  colorClass: string
  description: string
}

const legendItems: LegendItem[] = [
  {
    label: '1-3',
    colorClass: RANK_COLOR_CLASSES.top3,
    description: 'Top 3 positions - Excellent visibility',
  },
  {
    label: '4-10',
    colorClass: RANK_COLOR_CLASSES.top10,
    description: 'Positions 4-10 - Good visibility',
  },
  {
    label: '11-20',
    colorClass: RANK_COLOR_CLASSES.top20,
    description: 'Positions 11-20 - Low visibility',
  },
  {
    label: '20+',
    colorClass: RANK_COLOR_CLASSES.notRanking,
    description: 'Not in top 20 - Not visible',
  },
]

interface GridLegendProps {
  orientation?: 'horizontal' | 'vertical'
  showDescriptions?: boolean
  compact?: boolean
}

export function GridLegend({
  orientation = 'horizontal',
  showDescriptions = false,
  compact = false,
}: GridLegendProps): React.ReactElement {
  return (
    <div
      className={`flex ${orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-4'}`}
    >
      {legendItems.map((item) => (
        <div
          key={item.label}
          className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}
        >
          <div
            className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} rounded ${item.colorClass}`}
          />
          <div className="flex flex-col">
            <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
              {item.label}
            </span>
            {showDescriptions && (
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
