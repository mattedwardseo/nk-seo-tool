'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Building2, Clock, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  calculateCapacityMetrics,
  formatCurrency,
  formatPercent,
  formatNumber,
  getUtilizationStatus,
  getUtilizationColor,
  getUtilizationBgColor,
  DEFAULT_CAPACITY_INPUTS,
  type CapacityInputs,
} from '@/lib/calculators/capacity-calculator'

interface CapacityCalculatorFormProps {
  domainId: string
  onSubmit: (data: CapacityFormData) => Promise<void>
  initialData?: Partial<CapacityFormData>
  isLoading?: boolean
}

export interface CapacityFormData {
  name?: string
  operatories: number
  daysOpenPerWeek: number
  hoursPerDay: number
  appointmentDuration: number
  currentPatientsMonthly?: number
  currentRevenueMonthly?: number
  avgShortTermValue: number
  avgLifetimeValue: number
  notes?: string
}

export function CapacityCalculatorForm({
  domainId: _domainId,
  onSubmit,
  initialData,
  isLoading = false,
}: CapacityCalculatorFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name ?? '')
  const [operatories, setOperatories] = useState(
    initialData?.operatories ?? DEFAULT_CAPACITY_INPUTS.operatories
  )
  const [daysOpenPerWeek, setDaysOpenPerWeek] = useState(
    initialData?.daysOpenPerWeek ?? DEFAULT_CAPACITY_INPUTS.daysOpenPerWeek
  )
  const [hoursPerDay, setHoursPerDay] = useState(
    initialData?.hoursPerDay ?? DEFAULT_CAPACITY_INPUTS.hoursPerDay
  )
  const [appointmentDuration, setAppointmentDuration] = useState(
    initialData?.appointmentDuration ?? DEFAULT_CAPACITY_INPUTS.appointmentDuration
  )
  const [currentPatientsMonthly, setCurrentPatientsMonthly] = useState<number | undefined>(
    initialData?.currentPatientsMonthly
  )
  const [currentRevenueMonthly, setCurrentRevenueMonthly] = useState<number | undefined>(
    initialData?.currentRevenueMonthly
  )
  const [avgShortTermValue, setAvgShortTermValue] = useState(
    initialData?.avgShortTermValue ?? DEFAULT_CAPACITY_INPUTS.avgShortTermValue
  )
  const [avgLifetimeValue, setAvgLifetimeValue] = useState(
    initialData?.avgLifetimeValue ?? DEFAULT_CAPACITY_INPUTS.avgLifetimeValue
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  // Live calculation
  const results = useMemo(() => {
    const inputs: CapacityInputs = {
      operatories,
      daysOpenPerWeek,
      hoursPerDay,
      appointmentDuration,
      currentPatientsMonthly,
      currentRevenueMonthly,
      avgShortTermValue,
      avgLifetimeValue,
    }
    return calculateCapacityMetrics(inputs)
  }, [
    operatories,
    daysOpenPerWeek,
    hoursPerDay,
    appointmentDuration,
    currentPatientsMonthly,
    currentRevenueMonthly,
    avgShortTermValue,
    avgLifetimeValue,
  ])

  const utilizationStatus = getUtilizationStatus(results.capacityUtilization)
  const utilizationColor = getUtilizationColor(utilizationStatus)
  const utilizationBgColor = getUtilizationBgColor(utilizationStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name: name || undefined,
      operatories,
      daysOpenPerWeek,
      hoursPerDay,
      appointmentDuration,
      currentPatientsMonthly,
      currentRevenueMonthly,
      avgShortTermValue,
      avgLifetimeValue,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Calculation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="name">Calculation Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g., Current Capacity Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Practice Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Practice Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operatories">Number of Operatories</Label>
              <Input
                id="operatories"
                type="number"
                value={operatories}
                onChange={(e) => setOperatories(parseInt(e.target.value) || 1)}
                disabled={isLoading}
                min="1"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="daysOpenPerWeek">Days Open Per Week</Label>
              <Input
                id="daysOpenPerWeek"
                type="number"
                value={daysOpenPerWeek}
                onChange={(e) => setDaysOpenPerWeek(parseInt(e.target.value) || 1)}
                disabled={isLoading}
                min="1"
                max="7"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hoursPerDay">Hours Per Day</Label>
              <Input
                id="hoursPerDay"
                type="number"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 1)}
                disabled={isLoading}
                min="1"
                max="24"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="appointmentDuration">Avg Appointment Duration (minutes)</Label>
              <Input
                id="appointmentDuration"
                type="number"
                value={appointmentDuration}
                onChange={(e) => setAppointmentDuration(parseInt(e.target.value) || 30)}
                disabled={isLoading}
                min="15"
                max="480"
                step="15"
              />
            </div>
          </div>

          <Separator />

          {/* Capacity Breakdown Display */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Daily Capacity</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatNumber(results.maxAppointmentsDaily)} appts
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Weekly Capacity</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatNumber(results.maxAppointmentsWeekly)} appts
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Monthly Capacity</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatNumber(results.maxAppointmentsMonthly)} appts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Performance (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentPatientsMonthly">Current Monthly Patients</Label>
              <Input
                id="currentPatientsMonthly"
                type="number"
                value={currentPatientsMonthly ?? ''}
                onChange={(e) =>
                  setCurrentPatientsMonthly(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                disabled={isLoading}
                min="0"
                placeholder="Enter current patient count"
              />
            </div>
            <div>
              <Label htmlFor="currentRevenueMonthly">Current Monthly Revenue ($)</Label>
              <Input
                id="currentRevenueMonthly"
                type="number"
                value={currentRevenueMonthly ?? ''}
                onChange={(e) =>
                  setCurrentRevenueMonthly(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                disabled={isLoading}
                min="0"
                step="1000"
                placeholder="Enter current revenue"
              />
            </div>
          </div>

          {/* Utilization Gauge */}
          {currentPatientsMonthly !== undefined && currentPatientsMonthly > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Capacity Utilization</span>
                  <span className={`font-semibold ${utilizationColor}`}>
                    {formatPercent(results.capacityUtilization)}
                  </span>
                </div>
                <Progress value={results.capacityUtilization} className="h-3" />
                <div className={`p-3 rounded-lg ${utilizationBgColor}`}>
                  <div className="flex items-center gap-2">
                    {utilizationStatus === 'critical' || utilizationStatus === 'low' ? (
                      <AlertTriangle className={`h-4 w-4 ${utilizationColor}`} />
                    ) : null}
                    <span className={`text-sm font-medium ${utilizationColor}`}>
                      {utilizationStatus === 'critical' && 'Critical: Significant untapped capacity'}
                      {utilizationStatus === 'low' && 'Low: Room for substantial growth'}
                      {utilizationStatus === 'moderate' && 'Moderate: Good growth potential'}
                      {utilizationStatus === 'good' && 'Good: Near optimal utilization'}
                      {utilizationStatus === 'optimal' && 'Optimal: Operating at peak capacity'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Business Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avgShortTermValue">Avg Short Term Value ($)</Label>
              <Input
                id="avgShortTermValue"
                type="number"
                value={avgShortTermValue}
                onChange={(e) => setAvgShortTermValue(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="100"
              />
            </div>
            <div>
              <Label htmlFor="avgLifetimeValue">Avg Lifetime Value ($)</Label>
              <Input
                id="avgLifetimeValue"
                type="number"
                value={avgLifetimeValue}
                onChange={(e) => setAvgLifetimeValue(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-2 border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <TrendingUp className="h-5 w-5" />
            Capacity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Max Monthly Patients</div>
              <div className="text-2xl font-bold">
                {formatNumber(results.maxAppointmentsMonthly)}
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Max Monthly Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(results.maxRevenueMonthly)}
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Max Lifetime Value</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(results.maxLifetimeValueMonthly)}
              </div>
            </div>
          </div>

          {/* Gap Analysis (only if current patients provided) */}
          {currentPatientsMonthly !== undefined && currentPatientsMonthly > 0 && (
            <>
              <Separator className="my-4" />

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-sm text-muted-foreground">Patients Needed</div>
                  <div className="text-2xl font-bold text-orange-600">
                    +{formatNumber(results.patientsNeeded)}
                  </div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-sm text-muted-foreground">Monthly Revenue Gap</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(results.revenueGap)}
                  </div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-sm text-muted-foreground">Potential LTV Gap</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(results.potentialLtvGap)}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="grid md:grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Annual Max Revenue</div>
              <div className="text-lg font-semibold">
                {formatCurrency(results.annualMaxRevenue)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Annual Revenue Gap</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(results.annualRevenueGap)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this capacity analysis..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Calculation'}
      </Button>
    </form>
  )
}
