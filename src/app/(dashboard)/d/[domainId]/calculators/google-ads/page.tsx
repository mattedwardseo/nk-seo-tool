'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDomain } from '@/contexts/DomainContext'
import { DollarSign, Plus, Eye, Trash2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/calculators/google-ads-calculator'

interface GoogleAdsCalculation {
  id: string
  name: string | null
  totalBudget: number
  adSpendBudget: number | null
  monthlyClicks: number | null
  adjustedNps: number | null
  shortTermRoas: number | null
  createdAt: string
}

export default function GoogleAdsCalculatorListPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [calculations, setCalculations] = useState<GoogleAdsCalculation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const response = await fetch(`/api/calculators/google-ads?domainId=${domainId}`)
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
      const response = await fetch(`/api/calculators/google-ads/${id}`, {
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
            <DollarSign className="h-6 w-6" />
            Google Ads Calculator
          </h1>
          <p className="text-muted-foreground">
            ROI projections for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
        <Button asChild>
          <Link href={domainUrl('/calculators/google-ads/new')}>
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
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No Calculations Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first Google Ads ROI calculation to see projected returns on your ad spend.
            </p>
            <Button asChild>
              <Link href={domainUrl('/calculators/google-ads/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Calculation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {calculations.map((calc) => (
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
                      <Link href={domainUrl(`/calculators/google-ads/${calc.id}`)}>
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
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                    <div className="font-semibold">{formatCurrency(calc.totalBudget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ad Spend</div>
                    <div className="font-semibold">
                      {calc.adSpendBudget ? formatCurrency(calc.adSpendBudget) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Est. Clicks</div>
                    <div className="font-semibold">{calc.monthlyClicks ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">ROAS</div>
                    <div className="font-semibold text-green-600">
                      {calc.shortTermRoas ? `${calc.shortTermRoas.toFixed(2)}x` : '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
