'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  GridMap,
  KeywordGridSelector,
  CompetitorShareChart,
  ScanProgressIndicator,
} from '@/components/local-seo'
import {
  MapPin,
  ArrowLeft,
  Play,
  History,
  Building2,
  Users,
  LayoutGrid,
  Scale,
} from 'lucide-react'

interface CampaignData {
  id: string
  businessName: string
  status: string
  keywords: string[]
  gridSize: number
  gridRadiusMiles: number
  centerLat: number
  centerLng: number
  scanFrequency: string
  lastScanAt: Date | null
  nextScanAt: Date | null
}

interface ScanData {
  id: string
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED'
  progress: number
  avgRank: number | null
  shareOfVoice: number | null
  topCompetitor: string | null
  startedAt: Date | null
  completedAt: Date | null
}

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

interface CompetitorData {
  businessName: string
  gmbCid?: string | null
  rating?: number | null
  reviewCount?: number | null
  avgRank: number
  timesInTop3: number
  timesInTop10: number
  timesInTop20: number
  shareOfVoice: number
  rankChange?: number | null
}

export default function CampaignDashboardPage({
  params: promiseParams,
}: {
  params: Promise<{ domainId: string; campaignId: string }>
}): React.ReactElement {
  const { domainId, campaignId } = use(promiseParams)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [latestScan, setLatestScan] = useState<ScanData | null>(null)
  const [gridPoints, setGridPoints] = useState<GridPointData[]>([])
  const [targetStats, setTargetStats] = useState<CompetitorData | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (): Promise<void> => {
    try {
      // Fetch campaign details
      const campaignRes = await fetch(`/api/local-seo/campaigns/${campaignId}`)
      const campaignResult = await campaignRes.json()

      if (!campaignResult.success) {
        setError(campaignResult.error || 'Failed to load campaign')
        return
      }

      const campaignData = campaignResult.data
      setCampaign(campaignData)

      if (campaignData.latestScan) {
        setLatestScan(campaignData.latestScan)

        // Fetch grid data if scan is completed
        if (campaignData.latestScan.status === 'COMPLETED') {
          const [gridRes, competitorsRes] = await Promise.all([
            fetch(`/api/local-seo/campaigns/${campaignId}/scans/${campaignData.latestScan.id}/grid${selectedKeyword ? `?keyword=${encodeURIComponent(selectedKeyword)}` : ''}`),
            fetch(`/api/local-seo/campaigns/${campaignId}/competitors`),
          ])

          const gridResult = await gridRes.json()
          if (gridResult.success) {
            setGridPoints(gridResult.data.points)
          }

          const competitorsResult = await competitorsRes.json()
          if (competitorsResult.success) {
            setTargetStats(competitorsResult.data.targetBusiness)
            setCompetitors(competitorsResult.data.competitors)
          }
        }
      }
    } catch (err) {
      setError('Failed to load campaign data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Poll for updates if scan is in progress
    const interval = setInterval(() => {
      if (latestScan?.status === 'SCANNING') {
        fetchData()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [campaignId, selectedKeyword])

  const handleTriggerScan = async (): Promise<void> => {
    try {
      await fetch(`/api/local-seo/campaigns/${campaignId}/scan`, { method: 'POST' })
      fetchData()
    } catch (err) {
      console.error('Failed to trigger scan:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || 'Campaign not found'}</p>
        <Link href={domainUrl('/local-seo')}>
          <Button variant="outline" className="mt-4 cursor-pointer">
            Back to Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  const aggregates = latestScan?.status === 'COMPLETED'
    ? {
        avgRank: latestScan.avgRank,
        shareOfVoice: latestScan.shareOfVoice ?? 0,
        timesInTop3: targetStats?.timesInTop3 ?? 0,
        timesNotRanking: gridPoints.filter((p) => p.rank === null).length,
        totalPoints: gridPoints.length,
      }
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/local-seo')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              {campaign.businessName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{campaign.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {campaign.gridSize}×{campaign.gridSize} grid • {campaign.gridRadiusMiles}mi radius
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={domainUrl(`/local-seo/${campaignId}/gbp`)}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Building2 className="h-4 w-4 mr-2" />
              GBP
            </Button>
          </Link>
          <Link href={domainUrl(`/local-seo/${campaignId}/gbp-comparison`)}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Scale className="h-4 w-4 mr-2" />
              GBP Compare
            </Button>
          </Link>
          <Link href={domainUrl(`/local-seo/${campaignId}/competitors`)}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Users className="h-4 w-4 mr-2" />
              Competitors
            </Button>
          </Link>
          <Link href={domainUrl(`/local-seo/${campaignId}/history`)}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </Link>
          <Button onClick={handleTriggerScan} disabled={latestScan?.status === 'SCANNING'} className="cursor-pointer">
            <Play className="h-4 w-4 mr-2" />
            Run Scan
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {latestScan?.status === 'SCANNING' && (
        <ScanProgressIndicator
          status={latestScan.status}
          progress={latestScan.progress}
          startedAt={latestScan.startedAt}
        />
      )}

      {/* Keyword Selector */}
      {campaign.keywords.length > 0 && latestScan?.status === 'COMPLETED' && (
        <Card>
          <CardContent className="pt-6">
            <KeywordGridSelector
              keywords={campaign.keywords}
              selectedKeyword={selectedKeyword}
              onSelectKeyword={setSelectedKeyword}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {latestScan?.status === 'COMPLETED' ? (
        <div className="space-y-6">
          {/* Grid Map with Details - 2 Column Layout */}
          <GridMap
            points={gridPoints}
            gridSize={campaign.gridSize}
            centerLat={campaign.centerLat}
            centerLng={campaign.centerLng}
            targetBusinessName={campaign.businessName}
            keyword={selectedKeyword ?? undefined}
            radiusMiles={campaign.gridRadiusMiles}
            aggregates={aggregates}
            showDetails
          />

          {/* Bottom Row - Share of Voice and Top Competitors */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Share of Voice Chart */}
            {competitors.length > 0 && (
              <CompetitorShareChart
                competitors={[
                  ...(targetStats
                    ? [{ ...targetStats, isTarget: true }]
                    : []),
                  ...competitors.slice(0, 7),
                ]}
              />
            )}

            {/* Top Competitors Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Top Competitors</CardTitle>
                  <Link href={domainUrl(`/local-seo/${campaignId}/competitors`)}>
                    <Button variant="ghost" size="sm" className="cursor-pointer">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {competitors.slice(0, 5).map((c) => (
                    <div
                      key={c.businessName}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate flex-1 mr-2">{c.businessName}</span>
                      <Badge variant="outline">#{c.avgRank.toFixed(1)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No scan data yet</h3>
            <p className="text-muted-foreground mb-4">
              Run your first scan to see local ranking data
            </p>
            <Button onClick={handleTriggerScan} className="cursor-pointer">
              <Play className="h-4 w-4 mr-2" />
              Run First Scan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
