'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { SEOCalculatorForm } from '@/components/calculators/seo'
import { TrendingUp, ArrowLeft, Loader2 } from 'lucide-react'

interface CalculationData {
  id: string
  domainId: string
  name: string | null
  keywordsSnapshot: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    position?: number
  }> | null
  combinedSearchVolume: number
  localSearchVolume: number | null
  localCtr: number | null
  localConvRate: number | null
  ctrScenario: string
  ctrPercentage: number
  websiteConvRate: number
  receptionRate: number
  attendanceRate: number
  referralRate: number
  marketingInvestment: number
  avgShortTermValue: number
  avgLifetimeValue: number
  operatories: number | null
  daysOpen: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface PageProps {
  params: Promise<{ domainId: string; id: string }>
}

export default function SEOCalculationDetailPage({ params: promiseParams }: PageProps) {
  const { domainId, id } = use(promiseParams)
  const { selectedDomain } = useDomain()
  const [calculation, setCalculation] = useState<CalculationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    async function fetchCalculation() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/calculators/seo/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch calculation')
        }

        setCalculation(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch calculation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalculation()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !calculation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={domainUrl('/calculators/seo')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Calculation Not Found</h1>
        </div>
        <p className="text-destructive">{error || 'The calculation could not be found.'}</p>
        <Button asChild>
          <Link href={domainUrl('/calculators/seo')}>Back to Calculations</Link>
        </Button>
      </div>
    )
  }

  // Verify the calculation belongs to the selected domain
  if (calculation.domainId !== domainId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={domainUrl('/calculators/seo')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Wrong Domain</h1>
        </div>
        <p className="text-muted-foreground">
          This calculation belongs to a different domain. Please select the correct domain.
        </p>
        <Button asChild>
          <Link href={domainUrl('/calculators/seo')}>Back to Calculations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={domainUrl('/calculators/seo')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6" />
            {calculation.name || 'SEO Calculation'}
          </h1>
          <p className="text-muted-foreground">
            Editing for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
      </div>

      <SEOCalculatorForm
        domainId={domainId}
        domainName={selectedDomain?.name || ''}
        calculationId={id}
        initialData={calculation}
        mode="edit"
      />
    </div>
  )
}
