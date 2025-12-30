'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Trash2 } from 'lucide-react'

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

interface ScheduleFormProps {
  domainId: string
  schedule: Schedule | null
  onSave: () => void
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

export function ScheduleForm({ domainId, schedule, onSave }: ScheduleFormProps) {
  const [isEnabled, setIsEnabled] = useState(schedule?.isEnabled ?? true)
  const [frequency, setFrequency] = useState(schedule?.frequency ?? 'weekly')
  const [dayOfWeek, setDayOfWeek] = useState(
    schedule?.dayOfWeek?.toString() ?? '1'
  )
  const [dayOfMonth, setDayOfMonth] = useState(
    schedule?.dayOfMonth?.toString() ?? '1'
  )
  const [timeOfDay, setTimeOfDay] = useState(schedule?.timeOfDay ?? '06:00')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const method = schedule ? 'PATCH' : 'POST'
      const body = {
        domainId,
        isEnabled,
        frequency,
        dayOfWeek:
          frequency === 'weekly' || frequency === 'biweekly'
            ? parseInt(dayOfWeek)
            : undefined,
        dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
        timeOfDay,
      }

      const response = await fetch('/api/keyword-tracking/schedule', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to save schedule')
        return
      }

      onSave()
    } catch {
      setError('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule) return
    if (!confirm('Are you sure you want to delete this schedule?')) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/keyword-tracking/schedule?domainId=${domainId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to delete schedule')
        return
      }

      onSave()
    } catch {
      setError('Failed to delete schedule')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {schedule ? 'Edit Schedule' : 'Create Schedule'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enable Scheduled Tracking</Label>
          <Switch
            id="enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(frequency === 'weekly' || frequency === 'biweekly') && (
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {frequency === 'monthly' && (
          <div className="space-y-2">
            <Label>Day of Month</Label>
            <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Time (UTC)</Label>
          <Input
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {schedule && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || deleting} className="ml-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {schedule ? 'Update Schedule' : 'Create Schedule'}
        </Button>
      </CardFooter>
    </Card>
  )
}
