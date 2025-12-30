'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GridMap, KeywordGridSelector } from '@/components/local-seo'
import { ArrowLeft, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react'

interface GridPointData {
  row: number
  col: number
  lat: number
  lng: number
  rank: number | null
  keyword?: string
  keywords?: Array<{ keyword: string; rank: number | null }>
  avgRank?: number | null
  topRankings?: Array<{
    name: string
    rank: number
    cid?: string
    rating?: number
    reviewCount?: number
    category?: string
  }>
}

interface CampaignInfo {
  businessName: string
  gridSize: number
  centerLat: number
  centerLng: number
  keywords: string[]
}

interface ScanInfo {
  id: string
  avgRank: number | null
  shareOfVoice: number | null
}

export default function GridPage({
  params: promiseParams,
}: {
  params: Promise<{ domainId: string; campaignId: string }>
}): React.ReactElement {
  const { domainId, campaignId } = use(promiseParams)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [latestScan, setLatestScan] = useState<ScanInfo | null>(null)
  const [gridPoints, setGridPoints] = useState<GridPointData[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (): Promise<void> => {
    try {
      const campaignRes = await fetch(`/api/local-seo/campaigns/${campaignId}`)
      const campaignResult = await campaignRes.json()

      if (!campaignResult.success) {
        setError(campaignResult.error || 'Failed to load campaign')
        return
      }

      const campaignData = campaignResult.data
      setCampaign(campaignData)

      if (campaignData.latestScan?.status === 'COMPLETED') {
        setLatestScan(campaignData.latestScan)

        const gridRes = await fetch(
          `/api/local-seo/campaigns/${campaignId}/scans/${campaignData.latestScan.id}/grid${selectedKeyword ? `?keyword=${encodeURIComponent(selectedKeyword)}` : ''}`
        )
        const gridResult = await gridRes.json()

        if (gridResult.success) {
          setGridPoints(gridResult.data.points)
        }
      }
    } catch (err) {
      setError('Failed to load grid data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [campaignId, selectedKeyword])

  // Toggle fullscreen
  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || 'Campaign not found'}</p>
        <Link href={domainUrl(`/local-seo/${campaignId}`)}>
          <Button variant="outline" className="mt-4 cursor-pointer">
            Back to Campaign
          </Button>
        </Link>
      </div>
    )
  }

  const aggregates = latestScan
    ? {
        avgRank: latestScan.avgRank,
        shareOfVoice: latestScan.shareOfVoice ?? 0,
        timesInTop3: gridPoints.filter((p) => p.rank !== null && p.rank <= 3).length,
        timesNotRanking: gridPoints.filter((p) => p.rank === null).length,
        totalPoints: gridPoints.length,
      }
    : undefined

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-6 bg-background' : ''}`}>
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
              <LayoutGrid className="h-6 w-6" />
              Grid View
            </h1>
            <p className="text-muted-foreground mt-1">
              {campaign.businessName} • {campaign.gridSize}×{campaign.gridSize} grid
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={toggleFullscreen} className="cursor-pointer">
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </>
          )}
        </Button>
      </div>

      {/* Keyword Selector */}
      {campaign.keywords.length > 0 && (
        <KeywordGridSelector
          keywords={campaign.keywords}
          selectedKeyword={selectedKeyword}
          onSelectKeyword={setSelectedKeyword}
        />
      )}

      {/* Grid Map */}
      {gridPoints.length > 0 ? (
        <GridMap
          points={gridPoints}
          gridSize={campaign.gridSize}
          centerLat={campaign.centerLat}
          centerLng={campaign.centerLng}
          targetBusinessName={campaign.businessName}
          keyword={selectedKeyword ?? undefined}
          aggregates={aggregates}
          showDetails
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No grid data available. Run a scan first.</p>
        </div>
      )}
    </div>
  )
}
