'use client'

import {
  Bug,
  Shield,
  Gauge,
  Zap,
  Link2,
  Code,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ThematicReport } from '../types'

interface ThematicReportCardProps {
  report: ThematicReport
}

// Map of report IDs to icons
const iconMap: Record<string, LucideIcon> = {
  crawlability: Bug,
  https: Shield,
  coreWebVitals: Gauge,
  performance: Zap,
  internalLinking: Link2,
  markup: Code,
}

// Circular progress component
function CircularProgress({ value, size = 48 }: { value: number; size?: number }): React.ReactElement {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        className="text-muted/20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn(
          'transition-all duration-500',
          value >= 80 && 'text-green-500',
          value >= 50 && value < 80 && 'text-yellow-500',
          value < 50 && 'text-red-500'
        )}
      />
    </svg>
  )
}

export function ThematicReportCard({ report }: ThematicReportCardProps): React.ReactElement {
  const Icon = iconMap[report.id] || Code

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{report.title}</span>
            </div>
            <div
              className={cn(
                'text-3xl font-bold',
                report.status === 'good' && 'text-green-600 dark:text-green-400',
                report.status === 'moderate' && 'text-yellow-600 dark:text-yellow-400',
                report.status === 'poor' && 'text-red-600 dark:text-red-400'
              )}
            >
              {report.score}%
            </div>
          </div>
          <CircularProgress value={report.score} size={48} />
        </div>

        {/* Progress bar */}
        <Progress
          value={report.score}
          className={cn(
            'mt-3 h-1.5',
            '[&>div]:transition-all',
            report.status === 'good' && '[&>div]:bg-green-500',
            report.status === 'moderate' && '[&>div]:bg-yellow-500',
            report.status === 'poor' && '[&>div]:bg-red-500'
          )}
        />

        {/* Status indicator */}
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full',
              report.status === 'good' && 'bg-green-500',
              report.status === 'moderate' && 'bg-yellow-500',
              report.status === 'poor' && 'bg-red-500'
            )}
          />
          <span className="text-xs text-muted-foreground capitalize">{report.status}</span>
        </div>

        {report.details && (
          <p className="text-xs text-muted-foreground mt-2">{report.details}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default ThematicReportCard
