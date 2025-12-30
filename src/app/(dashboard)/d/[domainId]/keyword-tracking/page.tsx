'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { RunCard, ScheduleCard } from '@/components/keyword-tracking'

interface RunSummary {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  keywordsTracked: number
  avgPosition: number | null
  keywordsInTop3: number
  keywordsInTop10: number
  keywordsNotRanking: number
  improvedCount: number
  declinedCount: number
  createdAt: string
  completedAt: string | null
  triggeredBy: string | null
}

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

export default function KeywordTrackingPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [runsResponse, scheduleResponse] = await Promise.all([
          fetch(`/api/keyword-tracking?domainId=${domainId}`),
          fetch(`/api/keyword-tracking/schedule?domainId=${domainId}`),
        ])

        const runsData = await runsResponse.json()
        const scheduleData = await scheduleResponse.json()

        if (runsData.success) {
          setRuns(runsData.data.runs)
        } else {
          setError(runsData.error || 'Failed to load runs')
        }

        if (scheduleData.success) {
          setSchedule(scheduleData.data)
        }
      } catch {
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [domainId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Keyword Tracking
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Track SERP positions
          </p>
        </div>
        <Link href={domainUrl('/keyword-tracking/new')}>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Run Tracking
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Runs</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4 cursor-pointer"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Target className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tracking runs yet</h3>
              <p className="text-muted-foreground mt-2">
                Start tracking keyword positions to see your SERP rankings.
              </p>
              <Link href={domainUrl('/keyword-tracking/new')}>
                <Button className="mt-4 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Run Tracking
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} basePath={domainUrl('/keyword-tracking')} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Automation</h2>
          <ScheduleCard schedule={schedule} basePath={domainUrl('/keyword-tracking')} />
        </div>
      </div>
    </div>
  )
}
