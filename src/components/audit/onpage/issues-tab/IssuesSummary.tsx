'use client'

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { IssueCounts } from '../types'

interface IssuesSummaryProps {
  counts: IssueCounts
}

interface SummaryCardProps {
  label: string
  count: number
  icon: React.ReactNode
  colorClass: string
  borderClass: string
}

function SummaryCard({ label, count, icon, colorClass, borderClass }: SummaryCardProps): React.ReactElement {
  return (
    <Card className={cn('border-l-4', borderClass)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={colorClass}>{icon}</span>
              <span className={cn('text-3xl font-bold', colorClass)}>{count}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function IssuesSummary({ counts }: IssuesSummaryProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        label="Errors"
        count={counts.errors}
        icon={<AlertCircle className="h-5 w-5" />}
        colorClass="text-red-600 dark:text-red-400"
        borderClass="border-l-red-500"
      />
      <SummaryCard
        label="Warnings"
        count={counts.warnings}
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass="text-yellow-600 dark:text-yellow-400"
        borderClass="border-l-yellow-500"
      />
      <SummaryCard
        label="Notices"
        count={counts.notices}
        icon={<Info className="h-5 w-5" />}
        colorClass="text-blue-600 dark:text-blue-400"
        borderClass="border-l-blue-500"
      />
      <SummaryCard
        label="Passed"
        count={counts.passed}
        icon={<CheckCircle className="h-5 w-5" />}
        colorClass="text-green-600 dark:text-green-400"
        borderClass="border-l-green-500"
      />
    </div>
  )
}

export default IssuesSummary
