'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Trash2, Building2, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  getUtilizationStatus,
  getUtilizationColor,
  getUtilizationBgColor,
} from '@/lib/calculators/capacity-calculator'

interface CapacityCalculation {
  id: string
  domainId: string
  name: string | null
  operatories: number
  daysOpenPerWeek: number
  hoursPerDay: number
  appointmentDuration: number
  currentPatientsMonthly: number | null
  currentRevenueMonthly: number | null
  avgShortTermValue: number
  avgLifetimeValue: number
  maxAppointmentsDaily: number | null
  maxAppointmentsWeekly: number | null
  maxAppointmentsMonthly: number | null
  maxRevenueMonthly: number | null
  capacityUtilization: number | null
  revenueGap: number | null
  potentialLtvGap: number | null
  notes: string | null
  createdAt: string
}

interface PageProps {
  params: Promise<{ domainId: string; id: string }>
}

export default function CapacityCalculationDetailPage({ params: promiseParams }: PageProps) {
  const { domainId, id } = use(promiseParams)
  const router = useRouter()
  const [calculation, setCalculation] = useState<CapacityCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    const fetchCalculation = async () => {
      try {
        const response = await fetch(`/api/calculators/capacity/${id}`)
        const data = await response.json()

        if (data.success) {
          setCalculation(data.data)
        } else {
          toast.error('Calculation not found')
          router.push(domainUrl('/calculators/capacity'))
        }
      } catch (error) {
        console.error('Error fetching calculation:', error)
        toast.error('Failed to load calculation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalculation()
  }, [id, router, domainId])

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/calculators/capacity/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Calculation deleted')
        router.push(domainUrl('/calculators/capacity'))
      } else {
        toast.error('Failed to delete calculation')
      }
    } catch (error) {
      console.error('Error deleting calculation:', error)
      toast.error('Failed to delete calculation')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!calculation) {
    return null
  }

  const utilizationStatus = calculation.capacityUtilization
    ? getUtilizationStatus(calculation.capacityUtilization)
    : null
  const utilizationColor = utilizationStatus
    ? getUtilizationColor(utilizationStatus)
    : 'text-muted-foreground'
  const utilizationBgColor = utilizationStatus
    ? getUtilizationBgColor(utilizationStatus)
    : 'bg-muted'

  const patientsNeeded =
    calculation.maxAppointmentsMonthly && calculation.currentPatientsMonthly
      ? Math.max(0, calculation.maxAppointmentsMonthly - calculation.currentPatientsMonthly)
      : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={domainUrl('/calculators/capacity')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Building2 className="h-6 w-6" />
              {calculation.name || 'Capacity Calculation'}
            </h1>
            <p className="text-muted-foreground">
              Created {new Date(calculation.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Calculation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this calculation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Practice Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Practice Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Operatories</div>
              <div className="text-2xl font-bold">{calculation.operatories}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Days/Week</div>
              <div className="text-2xl font-bold">{calculation.daysOpenPerWeek}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Hours/Day</div>
              <div className="text-2xl font-bold">{calculation.hoursPerDay}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Appt Duration</div>
              <div className="text-2xl font-bold">{calculation.appointmentDuration} min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Current State */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Maximum Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Daily</span>
                <span className="font-semibold text-lg">
                  {calculation.maxAppointmentsDaily
                    ? formatNumber(calculation.maxAppointmentsDaily)
                    : '-'}{' '}
                  appts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Weekly</span>
                <span className="font-semibold text-lg">
                  {calculation.maxAppointmentsWeekly
                    ? formatNumber(calculation.maxAppointmentsWeekly)
                    : '-'}{' '}
                  appts
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Monthly</span>
                <span className="font-bold text-xl text-blue-600">
                  {calculation.maxAppointmentsMonthly
                    ? formatNumber(calculation.maxAppointmentsMonthly)
                    : '-'}{' '}
                  appts
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Max Monthly Revenue</span>
                <span className="font-semibold text-green-600">
                  {calculation.maxRevenueMonthly
                    ? formatCurrency(calculation.maxRevenueMonthly)
                    : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Patients</span>
                <span className="font-semibold">
                  {calculation.currentPatientsMonthly ?? 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Revenue</span>
                <span className="font-semibold">
                  {calculation.currentRevenueMonthly
                    ? formatCurrency(calculation.currentRevenueMonthly)
                    : 'Not specified'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Short Term Value</span>
                <span className="font-semibold">
                  {formatCurrency(calculation.avgShortTermValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Lifetime Value</span>
                <span className="font-semibold">
                  {formatCurrency(calculation.avgLifetimeValue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization & Gap Analysis */}
      {calculation.capacityUtilization !== null && (
        <Card className="border-2 border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <AlertTriangle className="h-5 w-5" />
              Capacity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Utilization */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Capacity Utilization</span>
                <span className={`font-bold text-lg ${utilizationColor}`}>
                  {formatPercent(calculation.capacityUtilization)}
                </span>
              </div>
              <Progress value={calculation.capacityUtilization} className="h-4" />
              <div className={`p-3 rounded-lg ${utilizationBgColor}`}>
                <span className={`text-sm font-medium ${utilizationColor}`}>
                  {utilizationStatus === 'critical' &&
                    'Critical: Significant untapped capacity - major growth opportunity'}
                  {utilizationStatus === 'low' &&
                    'Low: Room for substantial growth - marketing investment recommended'}
                  {utilizationStatus === 'moderate' &&
                    'Moderate: Good growth potential - continue optimization efforts'}
                  {utilizationStatus === 'good' &&
                    'Good: Near optimal utilization - focus on efficiency'}
                  {utilizationStatus === 'optimal' &&
                    'Optimal: Operating at peak capacity - consider expansion'}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Gap Analysis */}
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <div className="text-sm text-muted-foreground">Patients Needed</div>
                <div className="text-2xl font-bold text-orange-600">
                  +{patientsNeeded !== null ? formatNumber(patientsNeeded) : '-'}
                </div>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <div className="text-sm text-muted-foreground">Monthly Revenue Gap</div>
                <div className="text-2xl font-bold text-red-600">
                  {calculation.revenueGap ? formatCurrency(calculation.revenueGap) : '-'}
                </div>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <div className="text-sm text-muted-foreground">Potential LTV Gap</div>
                <div className="text-2xl font-bold text-red-600">
                  {calculation.potentialLtvGap
                    ? formatCurrency(calculation.potentialLtvGap)
                    : '-'}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid md:grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Annual Revenue Gap</div>
                <div className="text-lg font-semibold text-red-600">
                  {calculation.revenueGap
                    ? formatCurrency(calculation.revenueGap * 12)
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Annual LTV Opportunity</div>
                <div className="text-lg font-semibold text-purple-600">
                  {calculation.potentialLtvGap
                    ? formatCurrency(calculation.potentialLtvGap * 12)
                    : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {calculation.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{calculation.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
