'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, Clock, Play, Pause, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Schedule {
  isEnabled: boolean
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  timeOfDay: string
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunId: string | null
}

interface ScheduleCardProps {
  schedule: Schedule | null
  basePath?: string // Base path for schedule links (e.g., "/d/abc123/keyword-tracking")
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function ScheduleCard({ schedule, basePath = '/keyword-tracking' }: ScheduleCardProps) {
  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            No Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set up automated tracking to monitor keyword positions regularly.
          </p>
          <Link
            href={`${basePath}/schedule`}
            className="text-sm text-primary hover:underline mt-2 block"
          >
            Configure schedule
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getFrequencyText = () => {
    switch (schedule.frequency) {
      case 'weekly':
        return `Every ${DAYS_OF_WEEK[schedule.dayOfWeek ?? 0]}`
      case 'biweekly':
        return `Every other ${DAYS_OF_WEEK[schedule.dayOfWeek ?? 0]}`
      case 'monthly':
        return `Monthly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth ?? 1)}`
      default:
        return schedule.frequency
    }
  }

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }

  const nextRunAt = schedule.nextRunAt ? new Date(schedule.nextRunAt) : null
  const lastRunAt = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Scheduled Tracking
          </CardTitle>
          <Badge
            variant={schedule.isEnabled ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {schedule.isEnabled ? (
              <>
                <Play className="h-3 w-3" />
                Active
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" />
                Paused
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{getFrequencyText()}</span>
          <span className="text-muted-foreground">at {schedule.timeOfDay} UTC</span>
        </div>

        {schedule.isEnabled && nextRunAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Next run:</span>
            <span className="font-medium">
              {formatDistanceToNow(nextRunAt, { addSuffix: true })}
            </span>
          </div>
        )}

        {lastRunAt && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Last run: {format(lastRunAt, 'MMM d, yyyy')}
            </span>
            {schedule.lastRunId && (
              <Link
                href={`${basePath}/${schedule.lastRunId}`}
                className="text-primary hover:underline"
              >
                View
              </Link>
            )}
          </div>
        )}

        <Link
          href={`${basePath}/schedule`}
          className="text-sm text-primary hover:underline block"
        >
          Edit schedule
        </Link>
      </CardContent>
    </Card>
  )
}
