'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignCard, type CampaignCardData } from '@/components/local-seo'
import { MapPin, Plus, RefreshCw } from 'lucide-react'
import { useDomain } from '@/contexts/DomainContext'

interface CampaignWithScan extends CampaignCardData {
  id: string
}

export default function LocalSeoPage(): React.ReactElement {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [campaigns, setCampaigns] = useState<CampaignWithScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const fetchCampaigns = useCallback(async (): Promise<void> => {
    if (!domainId) {
      setIsLoading(false)
      return
    }

    try {
      const urlParams = new URLSearchParams({
        domainId: domainId,
      })
      const response = await fetch(`/api/local-seo/campaigns?${urlParams.toString()}`)
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.data.campaigns)
      } else {
        setError(result.error || 'Failed to load campaigns')
      }
    } catch (err) {
      setError('Failed to load campaigns')
    } finally {
      setIsLoading(false)
    }
  }, [domainId])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleTriggerScan = async (id: string): Promise<void> => {
    try {
      await fetch(`/api/local-seo/campaigns/${id}/scan`, { method: 'POST' })
      fetchCampaigns() // Refresh list
    } catch (err) {
      console.error('Failed to trigger scan:', err)
    }
  }

  const handlePause = async (id: string): Promise<void> => {
    try {
      await fetch(`/api/local-seo/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' }),
      })
      fetchCampaigns()
    } catch (err) {
      console.error('Failed to pause campaign:', err)
    }
  }

  const handleResume = async (id: string): Promise<void> => {
    try {
      await fetch(`/api/local-seo/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      fetchCampaigns()
    } catch (err) {
      console.error('Failed to resume campaign:', err)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      await fetch(`/api/local-seo/campaigns/${id}`, { method: 'DELETE' })
      fetchCampaigns()
    } catch (err) {
      console.error('Failed to delete campaign:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Local SEO Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedDomain?.name || 'Loading...'} - Track local search rankings with map grid analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchCampaigns} className="cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={domainUrl('/local-seo/new')}>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center text-destructive">
            <p>{error}</p>
            <Button variant="outline" className="mt-4 cursor-pointer" onClick={fetchCampaigns}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign Grid */}
      {!isLoading && !error && (
        <>
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first local SEO campaign to start tracking map rankings
                </p>
                <Link href={domainUrl('/local-seo/new')}>
                  <Button className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onTriggerScan={handleTriggerScan}
                  onPause={handlePause}
                  onResume={handleResume}
                  onDelete={handleDelete}
                  basePath={domainUrl('/local-seo')}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
