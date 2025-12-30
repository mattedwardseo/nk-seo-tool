'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, TrendingUp } from 'lucide-react'
import type { GBPGap } from '@/lib/local-seo/types'

interface GapsCardProps {
  gaps: GBPGap[]
  showAll?: boolean
}

export function GapsCard({ gaps, showAll = false }: GapsCardProps): React.ReactElement {
  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-green-600 mb-2" />
          <p className="text-lg font-medium text-green-600">Looking Good!</p>
          <p className="text-sm text-muted-foreground">
            No significant gaps found compared to your competitors
          </p>
        </CardContent>
      </Card>
    )
  }

  const displayGaps = showAll ? gaps : gaps.slice(0, 3)

  const getSeverityIcon = (severity: GBPGap['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'important':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'nice-to-have':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: GBPGap['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'important':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">Important</Badge>
        )
      case 'nice-to-have':
        return <Badge variant="secondary">Nice to Have</Badge>
    }
  }

  const formatValue = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return String(value)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Gaps to Address ({gaps.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayGaps.map((gap, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getSeverityIcon(gap.severity)}
                <span className="font-medium">{gap.label}</span>
              </div>
              {getSeverityBadge(gap.severity)}
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Your Value</span>
                <span className="font-medium text-red-600">
                  {formatValue(gap.yourValue)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Best Competitor</span>
                <span className="font-medium text-green-600">
                  {formatValue(gap.competitorBest.value)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {gap.competitorBest.name.length > 25
                    ? gap.competitorBest.name.slice(0, 25) + '...'
                    : gap.competitorBest.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Competitor Avg</span>
                <span className="font-medium">
                  {formatValue(gap.competitorAvg)}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-muted/50 rounded p-3">
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                Recommendation
              </span>
              <p className="text-sm">{gap.recommendation}</p>
            </div>
          </div>
        ))}

        {!showAll && gaps.length > 3 && (
          <p className="text-sm text-muted-foreground text-center">
            +{gaps.length - 3} more gaps. Switch to &quot;Gaps&quot; tab to see all.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
