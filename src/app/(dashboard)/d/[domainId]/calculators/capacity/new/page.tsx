'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import {
  CapacityCalculatorForm,
  type CapacityFormData,
} from '@/components/calculators/capacity/CapacityCalculatorForm'
import { Building2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function NewCapacityCalculationPage() {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [isLoading, setIsLoading] = useState(false)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const handleSubmit = async (data: CapacityFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/calculators/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domainId,
          ...data,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Calculation saved successfully')
        router.push(domainUrl(`/calculators/capacity/${result.data.id}`))
      } else {
        toast.error(result.error || 'Failed to save calculation')
      }
    } catch (error) {
      console.error('Error saving calculation:', error)
      toast.error('Failed to save calculation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={domainUrl('/calculators/capacity')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" />
            New Capacity Calculation
          </h1>
          <p className="text-muted-foreground">
            Analyze capacity for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
      </div>

      <CapacityCalculatorForm
        domainId={domainId}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
