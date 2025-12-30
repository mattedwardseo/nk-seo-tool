'use client'

import { cn } from '@/lib/utils'
import { RANK_COLOR_CLASSES } from '@/lib/local-seo/types'
import type { CompetitorRanking } from '@/lib/local-seo/types'

export interface GridCellData {
  row: number
  col: number
  lat: number
  lng: number
  rank: number | null
  keyword?: string
  keywords?: Array<{
    keyword: string
    rank: number | null
  }>
  avgRank?: number | null
  topRankings?: CompetitorRanking[]
}

interface GridCellProps {
  data: GridCellData
  isSelected?: boolean
  isCenter?: boolean
  showRank?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: (data: GridCellData) => void
  onHover?: (data: GridCellData | null) => void
}

function getRankColorClass(rank: number | null): string {
  if (rank === null) return RANK_COLOR_CLASSES.notRanking
  if (rank <= 3) return RANK_COLOR_CLASSES.top3
  if (rank <= 10) return RANK_COLOR_CLASSES.top10
  if (rank <= 20) return RANK_COLOR_CLASSES.top20
  return RANK_COLOR_CLASSES.notRanking
}

function getRankDisplay(rank: number | null): string {
  if (rank === null) return '20+'
  return rank.toString()
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
}

export function GridCell({
  data,
  isSelected = false,
  isCenter = false,
  showRank = true,
  size = 'md',
  onClick,
  onHover,
}: GridCellProps): React.ReactElement {
  const displayRank = data.avgRank !== undefined ? data.avgRank : data.rank
  const colorClass = getRankColorClass(displayRank)

  return (
    <button
      type="button"
      className={cn(
        sizeClasses[size],
        'rounded-md font-semibold transition-all duration-150',
        'hover:scale-110 hover:z-10 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        colorClass,
        isSelected && 'ring-2 ring-primary ring-offset-2 scale-110 z-10',
        isCenter && 'ring-2 ring-blue-500'
      )}
      onClick={() => onClick?.(data)}
      onMouseEnter={() => onHover?.(data)}
      onMouseLeave={() => onHover?.(null)}
      title={`Row ${data.row}, Col ${data.col}\nRank: ${getRankDisplay(displayRank)}`}
    >
      {showRank && getRankDisplay(displayRank)}
    </button>
  )
}
