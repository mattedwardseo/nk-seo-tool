'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CompetitorTable, CompetitorShareChart, type CompetitorData } from '@/components/local-seo'
import { ArrowLeft, Users, RefreshCw } from 'lucide-react'

interface CompetitorPageData {
  scanId: string | null
  scanDate: Date | null
  targetBusiness: CompetitorData | null
  competitors: CompetitorData[]
  hasCompletedScan: boolean
}

export default function CompetitorsPage({
  params: promiseParams,
}: {
  params: Promise<{ domainId: string; campaignId: string }>
}): React.ReactElement {
  const { domainId, campaignId } = use(promiseParams)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const [data, setData] = useState<CompetitorPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/local-seo/campaigns/${campaignId}/competitors?limit=100`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load competitors')
      }
    } catch (err) {
      setError('Failed to load competitors')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [campaignId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Link href={domainUrl(`/local-seo/${campaignId}`)}>
          <Button variant="outline" className="mt-4 cursor-pointer">
            Back to Campaign
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={domainUrl(`/local-seo/${campaignId}`)}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Competitor Analysis
            </h1>
            {data?.scanDate && (
              <p className="text-muted-foreground mt-1">
                Data from scan on {new Date(data.scanDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={fetchData} className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {data?.hasCompletedScan ? (
        <div className="space-y-6">
          {/* Share of Voice Chart */}
          {data.competitors.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <CompetitorShareChart
                competitors={[
                  ...(data.targetBusiness
                    ? [{ ...data.targetBusiness, isTarget: true }]
                    : []),
                  ...data.competitors.slice(0, 7),
                ]}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Competitors</p>
                    <p className="text-2xl font-bold">{data.competitors.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Your Position</p>
                    <p className="text-2xl font-bold">
                      #{data.targetBusiness ?
                        (data.competitors.filter(c => c.avgRank < data.targetBusiness!.avgRank).length + 1)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Competitor Table */}
          <CompetitorTable
            competitors={data.competitors}
            targetBusiness={data.targetBusiness}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No competitor data available. Run a scan first.</p>
          <Link href={domainUrl(`/local-seo/${campaignId}`)}>
            <Button variant="outline" className="mt-4 cursor-pointer">
              Back to Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
