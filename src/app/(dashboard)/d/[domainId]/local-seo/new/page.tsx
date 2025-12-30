'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CampaignForm } from '@/components/local-seo'
import { MapPin, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDomain } from '@/contexts/DomainContext'

export default function NewCampaignPage(): React.ReactElement {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const handleSubmit = async (data: {
    businessName: string
    gmbPlaceId?: string
    gmbCid?: string
    centerLat: number
    centerLng: number
    gridSize: number
    gridRadiusMiles: number
    keywords: string[]
    scanFrequency: string
  }): Promise<void> => {
    setError(null)

    try {
      const response = await fetch('/api/local-seo/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          domainId: domainId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(domainUrl(`/local-seo/${result.data.id}`))
      } else {
        setError(result.error || 'Failed to create campaign')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/local-seo')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Create Campaign
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedDomain?.name || 'Loading...'} - Set up a new local SEO tracking campaign
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <CampaignForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </div>
  )
}
