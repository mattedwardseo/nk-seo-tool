'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { ScheduleForm } from '@/components/keyword-tracking'

interface Schedule {
  id: string
  domainId: string
  isEnabled: boolean
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  timeOfDay: string
  locationName: string
  nextRunAt: string | null
  lastRunAt: string | null
}

export default function KeywordTrackingSchedulePage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const fetchSchedule = async () => {
    if (!domainId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/keyword-tracking/schedule?domainId=${domainId}`
      )
      const data = await response.json()

      if (data.success) {
        setSchedule(data.data)
      } else {
        setError(data.error || 'Failed to load schedule')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [domainId])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/keyword-tracking')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Tracking Schedule
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Configure automated keyword tracking
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4 cursor-pointer" onClick={fetchSchedule}>
            Retry
          </Button>
        </div>
      ) : (
        <ScheduleForm
          domainId={domainId}
          schedule={schedule}
          onSave={fetchSchedule}
        />
      )}
    </div>
  )
}
