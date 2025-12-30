'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HistoryTimeline, RankTrendChart, GridMap } from '@/components/local-seo'
import { ArrowLeft, History, RefreshCw } from 'lucide-react'

interface ScanHistoryItem {
  id: string
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED'
  avgRank: number | null
  shareOfVoice: number | null
  topCompetitor: string | null
  apiCallsUsed?: number
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

interface CampaignInfo {
  businessName: string
  gridSize: number
  centerLat: number
  centerLng: number
}

interface GridPointData {
  row: number
  col: number
  lat: number
  lng: number
  rank: number | null
}

export default function HistoryPage({
  params: promiseParams,
}: {
  params: Promise<{ domainId: string; campaignId: string }>
}): React.ReactElement {
  const { domainId, campaignId } = use(promiseParams)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const [scans, setScans] = useState<ScanHistoryItem[]>([])
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)
  const [selectedScanGrid, setSelectedScanGrid] = useState<GridPointData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (): Promise<void> => {
    try {
      const [campaignRes, scansRes] = await Promise.all([
        fetch(`/api/local-seo/campaigns/${campaignId}`),
        fetch(`/api/local-seo/campaigns/${campaignId}/scans?limit=50`),
      ])

      const campaignResult = await campaignRes.json()
      const scansResult = await scansRes.json()

      if (campaignResult.success) {
        setCampaign(campaignResult.data)
      }

      if (scansResult.success) {
        setScans(scansResult.data.scans)
        if (scansResult.data.scans.length > 0) {
          setSelectedScanId(scansResult.data.scans[0].id)
        }
      } else {
        setError(scansResult.error || 'Failed to load history')
      }
    } catch (err) {
      setError('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchScanGrid = async (scanId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/local-seo/campaigns/${campaignId}/scans/${scanId}/grid`)
      const result = await response.json()

      if (result.success) {
        setSelectedScanGrid(result.data.points)
      }
    } catch (err) {
      console.error('Failed to fetch scan grid:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [campaignId])

  useEffect(() => {
    if (selectedScanId) {
      fetchScanGrid(selectedScanId)
    }
  }, [selectedScanId])

  // Prepare trend data
  const trendData = scans
    .filter((s) => s.status === 'COMPLETED')
    .map((s) => ({
      date: new Date(s.completedAt ?? s.createdAt),
      avgRank: s.avgRank,
      shareOfVoice: s.shareOfVoice,
    }))
    .reverse()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
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

  const selectedScan = scans.find((s) => s.id === selectedScanId)

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
              <History className="h-6 w-6" />
              Scan History
            </h1>
            <p className="text-muted-foreground mt-1">
              {scans.length} scan{scans.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData} className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <RankTrendChart data={trendData} />
      )}

      {/* History Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <HistoryTimeline
            scans={scans}
            gridSize={campaign?.gridSize ?? 7}
            selectedScanId={selectedScanId ?? undefined}
            onSelectScan={setSelectedScanId}
          />
        </div>

        {/* Selected Scan Grid */}
        <div className="lg:col-span-2">
          {selectedScan && selectedScanGrid.length > 0 && campaign ? (
            <GridMap
              points={selectedScanGrid}
              gridSize={campaign.gridSize}
              centerLat={campaign.centerLat}
              centerLng={campaign.centerLng}
              targetBusinessName={campaign.businessName}
              aggregates={{
                avgRank: selectedScan.avgRank,
                shareOfVoice: selectedScan.shareOfVoice ?? 0,
                timesInTop3: 0,
                timesNotRanking: 0,
              }}
              showDetails={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Select a scan to view its grid data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
