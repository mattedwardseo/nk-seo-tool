'use client'

import { cn } from '@/lib/utils'

interface KeywordStats {
  keyword: string
  avgRank: number | null
  timesInTop3: number
  totalPoints: number
}

interface KeywordGridSelectorProps {
  keywords: string[]
  keywordStats?: KeywordStats[]
  selectedKeyword: string | null
  onSelectKeyword: (keyword: string | null) => void
  showStats?: boolean
}

function getRankColor(avgRank: number | null): string {
  if (avgRank === null) return 'text-muted-foreground'
  if (avgRank <= 3) return 'text-green-600'
  if (avgRank <= 10) return 'text-yellow-600'
  if (avgRank <= 20) return 'text-orange-600'
  return 'text-red-600'
}

export function KeywordGridSelector({
  keywords,
  keywordStats = [],
  selectedKeyword,
  onSelectKeyword,
  showStats = true,
}: KeywordGridSelectorProps): React.ReactElement {
  const statsMap = new Map(keywordStats.map((s) => [s.keyword, s]))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Select Keyword</p>
        {selectedKeyword && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onSelectKeyword(null)}
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* All Keywords Option */}
        <button
          onClick={() => onSelectKeyword(null)}
          className={cn(
            'inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors',
            selectedKeyword === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted'
          )}
        >
          All Keywords
        </button>

        {/* Individual Keywords */}
        {keywords.map((keyword) => {
          const stats = statsMap.get(keyword)
          const isSelected = selectedKeyword === keyword

          return (
            <button
              key={keyword}
              onClick={() => onSelectKeyword(keyword)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted'
              )}
            >
              <span>{keyword}</span>
              {showStats && stats && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    isSelected ? 'text-primary-foreground/80' : getRankColor(stats.avgRank)
                  )}
                >
                  #{stats.avgRank?.toFixed(1) ?? 'N/A'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Stats Summary */}
      {showStats && keywordStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
          {keywordStats.map((stat) => (
            <div
              key={stat.keyword}
              className={cn(
                'p-2 rounded-lg border text-sm',
                selectedKeyword === stat.keyword && 'bg-primary/5 border-primary'
              )}
            >
              <p className="font-medium truncate" title={stat.keyword}>
                {stat.keyword}
              </p>
              <div className="flex justify-between mt-1 text-xs">
                <span className={getRankColor(stat.avgRank)}>
                  Avg: #{stat.avgRank?.toFixed(1) ?? 'N/A'}
                </span>
                <span className="text-muted-foreground">
                  Top 3: {stat.timesInTop3}/{stat.totalPoints}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
