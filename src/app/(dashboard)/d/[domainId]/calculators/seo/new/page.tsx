'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { SEOCalculatorForm } from '@/components/calculators/seo'
import { TrendingUp, ArrowLeft } from 'lucide-react'

export default function NewSEOCalculationPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

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
            New SEO Calculation
          </h1>
          <p className="text-muted-foreground">
            Create ROI projection for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
      </div>

      <SEOCalculatorForm
        domainId={domainId}
        domainName={selectedDomain?.name || ''}
        mode="create"
      />
    </div>
  )
}
