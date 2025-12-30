'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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
import { ArrowLeft, Trash2, DollarSign, Users, TrendingUp, MousePointer } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatCurrency,
  formatPercent,
  formatRoas,
  formatNumber,
} from '@/lib/calculators/google-ads-calculator'

interface GoogleAdsCalculation {
  id: string
  domainId: string
  name: string | null
  totalBudget: number
  mgmtFeeType: 'percentage' | 'fixed'
  mgmtFeeValue: number
  avgCpc: number
  websiteConvRate: number
  receptionRate: number
  attendanceRate: number
  referralRate: number
  avgShortTermValue: number
  avgLifetimeValue: number
  adSpendBudget: number | null
  monthlyClicks: number | null
  prospects: number | null
  npBookings: number | null
  actualNps: number | null
  npReferrals: number | null
  adjustedNps: number | null
  costPerAcquisition: number | null
  shortTermReturn: number | null
  shortTermRoas: number | null
  lifetimeReturn: number | null
  lifetimeRoas: number | null
  notes: string | null
  createdAt: string
}

interface PageProps {
  params: Promise<{ domainId: string; id: string }>
}

export default function GoogleAdsCalculationDetailPage({ params: promiseParams }: PageProps) {
  const { domainId, id } = use(promiseParams)
  const router = useRouter()
  const [calculation, setCalculation] = useState<GoogleAdsCalculation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    const fetchCalculation = async () => {
      try {
        const response = await fetch(`/api/calculators/google-ads/${id}`)
        const data = await response.json()

        if (data.success) {
          setCalculation(data.data)
        } else {
          toast.error('Calculation not found')
          router.push(domainUrl('/calculators/google-ads'))
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
      const response = await fetch(`/api/calculators/google-ads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Calculation deleted')
        router.push(domainUrl('/calculators/google-ads'))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={domainUrl('/calculators/google-ads')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <DollarSign className="h-6 w-6" />
              {calculation.name || 'Google Ads Calculation'}
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

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="text-2xl font-bold">{formatCurrency(calculation.totalBudget)}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Mgmt Fee</div>
              <div className="text-2xl font-bold text-red-600">
                {calculation.mgmtFeeType === 'percentage'
                  ? formatPercent(calculation.mgmtFeeValue)
                  : formatCurrency(calculation.mgmtFeeValue)}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Ad Spend</div>
              <div className="text-2xl font-bold text-green-600">
                {calculation.adSpendBudget ? formatCurrency(calculation.adSpendBudget) : '-'}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Avg CPC</div>
              <div className="text-2xl font-bold">{formatCurrency(calculation.avgCpc)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic & Conversion */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Traffic Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Clicks</span>
                <span className="font-semibold text-lg">
                  {calculation.monthlyClicks ? formatNumber(calculation.monthlyClicks) : '-'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prospects (Leads)</span>
                <span className="font-semibold">
                  {calculation.prospects?.toFixed(1) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bookings</span>
                <span className="font-semibold">
                  {calculation.npBookings?.toFixed(1) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Actual New Patients</span>
                <span className="font-semibold">
                  {calculation.actualNps?.toFixed(1) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">+ Referrals</span>
                <span className="font-semibold">
                  {calculation.npReferrals?.toFixed(1) ?? '-'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Adjusted New Patients</span>
                <span className="font-bold text-lg text-green-600">
                  {calculation.adjustedNps?.toFixed(1) ?? '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Website Conversion</span>
                <Badge variant="outline">{formatPercent(calculation.websiteConvRate)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Reception Rate</span>
                <Badge variant="outline">{formatPercent(calculation.receptionRate)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attendance Rate</span>
                <Badge variant="outline">{formatPercent(calculation.attendanceRate)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Referral Rate</span>
                <Badge variant="outline">{formatPercent(calculation.referralRate)}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Short Term Value</span>
                <span className="font-semibold">{formatCurrency(calculation.avgShortTermValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Lifetime Value</span>
                <span className="font-semibold">{formatCurrency(calculation.avgLifetimeValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Results */}
      <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-5 w-5" />
            ROI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Cost Per Patient</div>
              <div className="text-2xl font-bold">
                {calculation.costPerAcquisition
                  ? formatCurrency(calculation.costPerAcquisition)
                  : '-'}
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Short Term Return</div>
              <div className="text-2xl font-bold">
                {calculation.shortTermReturn
                  ? formatCurrency(calculation.shortTermReturn)
                  : '-'}
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Lifetime Return</div>
              <div className="text-2xl font-bold text-green-600">
                {calculation.lifetimeReturn
                  ? formatCurrency(calculation.lifetimeReturn)
                  : '-'}
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">ROAS</div>
              <div className="text-2xl font-bold text-green-600">
                {calculation.shortTermRoas ? formatRoas(calculation.shortTermRoas) : '-'}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid md:grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Investment</div>
              <div className="text-lg font-semibold">{formatCurrency(calculation.totalBudget)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Lifetime ROAS</div>
              <div className="text-lg font-semibold text-green-600">
                {calculation.lifetimeRoas ? formatRoas(calculation.lifetimeRoas) : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
