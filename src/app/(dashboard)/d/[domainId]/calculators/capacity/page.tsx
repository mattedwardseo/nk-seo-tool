'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useDomain } from '@/contexts/DomainContext'
import { Building2, Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  formatCurrency,
  formatPercent,
  getUtilizationStatus,
  getUtilizationColor,
} from '@/lib/calculators/capacity-calculator'

interface CapacityCalculation {
  id: string
  name: string | null
  operatories: number
  maxAppointmentsMonthly: number | null
  capacityUtilization: number | null
  revenueGap: number | null
  createdAt: string
}

export default function CapacityCalculatorListPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [calculations, setCalculations] = useState<CapacityCalculation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const response = await fetch(`/api/calculators/capacity?domainId=${domainId}`)
        const data = await response.json()

        if (data.success) {
          setCalculations(data.data)
        }
      } catch (error) {
        console.error('Error fetching calculations:', error)
        toast.error('Failed to load calculations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalculations()
  }, [domainId])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/calculators/capacity/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCalculations((prev) => prev.filter((c) => c.id !== id))
        toast.success('Calculation deleted')
      } else {
        toast.error('Failed to delete calculation')
      }
    } catch (error) {
      console.error('Error deleting calculation:', error)
      toast.error('Failed to delete calculation')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" />
            Capacity Calculator
          </h1>
          <p className="text-muted-foreground">
            Capacity analysis for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
        <Button asChild>
          <Link href={domainUrl('/calculators/capacity/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Calculation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : calculations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No Calculations Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first capacity calculation to analyze your practice&apos;s potential.
            </p>
            <Button asChild>
              <Link href={domainUrl('/calculators/capacity/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Calculation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {calculations.map((calc) => {
            const utilizationStatus = calc.capacityUtilization
              ? getUtilizationStatus(calc.capacityUtilization)
              : null
            const utilizationColor = utilizationStatus
              ? getUtilizationColor(utilizationStatus)
              : 'text-muted-foreground'

            return (
              <Card key={calc.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {calc.name || 'Untitled Calculation'}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(calc.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={domainUrl(`/calculators/capacity/${calc.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Calculation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this
                              calculation.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(calc.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Operatories</div>
                      <div className="font-semibold">{calc.operatories}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Monthly Capacity</div>
                      <div className="font-semibold">
                        {calc.maxAppointmentsMonthly ?? '-'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Utilization</div>
                      {calc.capacityUtilization !== null ? (
                        <div className="space-y-1">
                          <span className={`font-semibold ${utilizationColor}`}>
                            {formatPercent(calc.capacityUtilization)}
                          </span>
                          <Progress value={calc.capacityUtilization} className="h-1.5" />
                        </div>
                      ) : (
                        <div className="font-semibold text-muted-foreground">-</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Revenue Gap</div>
                      <div className="font-semibold text-red-600">
                        {calc.revenueGap ? formatCurrency(calc.revenueGap) : '-'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
