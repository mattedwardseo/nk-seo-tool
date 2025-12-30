'use client'

import { useState, useEffect, useCallback } from 'react'
import { RankingComparison } from './RankingComparison'
import { BacklinkGapCard } from './BacklinkGapCard'
import { LLMMentionsCard } from './LLMMentionsCard'
import { MarketShareChart } from './MarketShareChart'
import { CompetitorSelector } from './CompetitorSelector'
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download, AlertCircle, Zap, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CompetitorDashboardProps {
  auditId: string
}

interface CompetitorData {
  domain: string
  rank?: number | null
  backlinks?: number | null
  referringDomains?: number | null
  traffic?: number | null
  etv?: number | null
  organicTraffic?: number | null
  intersections?: number | null
  isAutoDetected?: boolean
}

interface AuditInfo {
  id: string
  domain: string
  status: string
  city?: string
  state?: string
}

interface HistoricalTrendItem {
  date: string
  organicTraffic: number
  etv: number
  keywordsRanking: number
}

export function CompetitorDashboard({ auditId }: CompetitorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isLiveLoading, setIsLiveLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useLiveData, setUseLiveData] = useState(false)

  // Data states
  const [audit, setAudit] = useState<AuditInfo | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [historicalTrend, setHistoricalTrend] = useState<HistoricalTrendItem[]>([])
  // Keyword rankings data (used for future features)
  const [, setClientKeywordRankings] = useState<
    Array<{ keyword: string; position: number | null; searchVolume: number; cpc: number }>
  >([])

  // SERP comparison data
  const [serpData, setSerpData] = useState<{
    comparisons: unknown[]
    competitorDomains: string[]
    summary?: {
      wins?: number
      losses?: number
      ties?: number
    }
    isLiveData?: boolean
  } | null>(null)

  // Backlink gap data
  const [backlinkData, setBacklinkData] = useState<{
    clientBacklinks: number
    clientReferringDomains: number
    competitors: unknown[]
    gapDomains?: unknown[]
    summary?: unknown
    recommendations?: string[]
    isLiveData?: boolean
  } | null>(null)

  // LLM mentions data
  const [llmData, setLlmData] = useState<{
    mentionData: unknown[]
    locationKeywords?: string[]
    summary?: unknown
    insight?: unknown
  } | null>(null)

  // Fetch all data
  const fetchData = useCallback(async (live: boolean = false) => {
    if (live) {
      setIsLiveLoading(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    const liveParam = live ? '?live=true' : ''

    try {
      // Fetch main competitor data (with discovery + historical if live)
      const mainRes = await fetch(`/api/audits/${auditId}/competitors${liveParam}`)
      if (!mainRes.ok) throw new Error('Failed to fetch competitor data')
      const mainData = await mainRes.json()

      if (mainData.success) {
        setAudit(mainData.data.audit)
        setCompetitors(mainData.data.competitors || [])
        setClientKeywordRankings(mainData.data.clientKeywordRankings || [])
        if (mainData.data.historicalTrend) {
          setHistoricalTrend(mainData.data.historicalTrend)
        }
      }

      // Fetch SERP comparison (live gets real-time rankings!)
      const serpRes = await fetch(`/api/audits/${auditId}/competitors/serp-comparison${liveParam}`)
      if (serpRes.ok) {
        const serpJson = await serpRes.json()
        if (serpJson.success) {
          setSerpData(serpJson.data)
        }
      }

      // Fetch backlink gap (live gets gap domains!)
      const blRes = await fetch(`/api/audits/${auditId}/competitors/backlink-gap${liveParam}`)
      if (blRes.ok) {
        const blJson = await blRes.json()
        if (blJson.success) {
          setBacklinkData(blJson.data)
        }
      }

      // Fetch LLM mentions
      const llmRes = await fetch(`/api/audits/${auditId}/competitors/llm-mentions`)
      if (llmRes.ok) {
        const llmJson = await llmRes.json()
        if (llmJson.success) {
          setLlmData(llmJson.data)
        }
      }
    } catch (err) {
      console.error('Error fetching competitor data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
      setIsLiveLoading(false)
    }
  }, [auditId])

  // Initial fetch
  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Handle live data toggle
  const handleLiveDataToggle = (enabled: boolean) => {
    setUseLiveData(enabled)
    if (enabled) {
      fetchData(true)
    }
  }

  const handleRefresh = () => {
    fetchData(useLiveData)
  }

  const handleExport = () => {
    // TODO: Implement PDF/CSV export
    console.log('Export clicked')
  }

  // Color palette for market share chart
  const colorPalette = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899']

  // Calculate market share data from ETV
  const totalEtv = competitors.reduce((sum, c) => sum + (c.etv ?? 0), 0) +
    (competitors[0]?.etv ? competitors[0].etv * 0.5 : 1000) // Estimate client ETV

  const marketShareData = audit
    ? [
        {
          domain: audit.domain,
          share: Math.round((1000 / (totalEtv + 1000)) * 100), // Client share
          traffic: 1000,
          color: '#3b82f6',
        },
        ...competitors.slice(0, 5).map((c, idx) => ({
          domain: c.domain,
          share: totalEtv > 0 ? Math.round(((c.etv ?? 0) / totalEtv) * 100) : 15,
          traffic: c.organicTraffic ?? c.traffic ?? 500,
          color: colorPalette[idx % colorPalette.length] ?? '#6b7280',
        })),
      ]
    : []

  const anyLoading = isLoading || isLiveLoading

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitor Comparison</h1>
          {audit && (
            <p className="text-muted-foreground">
              {audit.domain}
              {audit.city && audit.state && ` • ${audit.city}, ${audit.state}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Data Toggle */}
          <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
            <Zap className={`h-4 w-4 ${useLiveData ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <Label htmlFor="live-data" className="text-sm font-medium">
              Live Data
            </Label>
            <Switch
              id="live-data"
              checked={useLiveData}
              onCheckedChange={handleLiveDataToggle}
              disabled={anyLoading}
            />
            {isLiveLoading && (
              <Badge variant="secondary" className="animate-pulse">
                Fetching...
              </Badge>
            )}
          </div>

          <Button variant="outline" onClick={handleRefresh} disabled={anyLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${anyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Live Data Info Banner */}
      {useLiveData && (serpData?.isLiveData || backlinkData?.isLiveData) && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Live Data Active</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Fetching real-time rankings and backlink data from DataForSEO. This uses API credits.
          </AlertDescription>
        </Alert>
      )}

      {/* Historical Trend Summary (when live data is on) */}
      {useLiveData && historicalTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Historical Trend
            </CardTitle>
            <CardDescription>Last {historicalTrend.length} months of organic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {historicalTrend.slice(0, 4).map((item, idx) => (
                <div key={item.date} className="text-center">
                  <div className="text-xs text-muted-foreground">{item.date}</div>
                  <div className="text-lg font-semibold">{item.organicTraffic.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    ${item.etv.toLocaleString()} ETV
                  </div>
                  {idx > 0 && historicalTrend[idx - 1] && (
                    <Badge
                      variant={item.etv >= (historicalTrend[idx - 1]?.etv ?? 0) ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {item.etv >= (historicalTrend[idx - 1]?.etv ?? 0) ? '↑' : '↓'}
                      {Math.abs(item.etv - (historicalTrend[idx - 1]?.etv ?? 0)).toLocaleString()}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor selector */}
      <CompetitorSelector
        clientDomain={audit?.domain ?? ''}
        competitors={competitors.map((c) => ({
          domain: c.domain,
          rank: c.rank ?? undefined,
          isAutoDetected: c.isAutoDetected ?? true,
        }))}
        suggestedCompetitors={[]}
        isLoading={anyLoading}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">
            Rankings
            {serpData?.isLiveData && <Zap className="ml-1 h-3 w-3 text-yellow-500" />}
          </TabsTrigger>
          <TabsTrigger value="backlinks">
            Backlinks
            {backlinkData?.isLiveData && <Zap className="ml-1 h-3 w-3 text-yellow-500" />}
          </TabsTrigger>
          <TabsTrigger value="ai">AI Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Executive Summary - At-a-glance competitive position */}
          <ExecutiveSummaryCard
            clientDomain={audit?.domain ?? ''}
            clientRank={competitors.length > 0 ? Math.min(...competitors.map(c => c.rank ?? 1000)) : undefined}
            clientTraffic={competitors[0]?.organicTraffic}
            clientEtv={competitors[0]?.etv}
            totalCompetitors={competitors.length}
            competitors={competitors}
            serpSummary={serpData?.summary}
            isLoading={anyLoading}
          />

          {/* Two-column layout for gap analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BacklinkGapCard
              clientDomain={audit?.domain ?? ''}
              clientBacklinks={backlinkData?.clientBacklinks ?? 0}
              clientReferringDomains={backlinkData?.clientReferringDomains ?? 0}
              competitors={(backlinkData?.competitors as never[]) ?? []}
              summary={backlinkData?.summary as never}
              isLoading={anyLoading}
            />
            <LLMMentionsCard
              clientDomain={audit?.domain ?? ''}
              mentionData={(llmData?.mentionData as never[]) ?? []}
              locationKeywords={llmData?.locationKeywords}
              summary={llmData?.summary as never}
              insight={llmData?.insight as never}
              isLoading={anyLoading}
            />
          </div>

          {/* Market share */}
          <MarketShareChart
            clientDomain={audit?.domain ?? ''}
            data={marketShareData}
            totalMarketTraffic={totalEtv}
            isLoading={anyLoading}
          />
        </TabsContent>

        <TabsContent value="rankings" className="mt-6 space-y-4">
          {/* Win/Loss Summary when live */}
          {serpData?.summary && (serpData.summary.wins ?? 0) + (serpData.summary.losses ?? 0) > 0 && (
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-600">
                {serpData.summary.wins ?? 0} Wins
              </Badge>
              <Badge variant="destructive">
                {serpData.summary.losses ?? 0} Losses
              </Badge>
              <Badge variant="secondary">
                {serpData.summary.ties ?? 0} Ties
              </Badge>
            </div>
          )}
          <RankingComparison
            clientDomain={audit?.domain ?? ''}
            competitorDomains={serpData?.competitorDomains ?? competitors.map((c) => c.domain)}
            comparisons={(serpData?.comparisons as never[]) ?? []}
            isLoading={anyLoading}
          />
        </TabsContent>

        <TabsContent value="backlinks" className="mt-6 space-y-4">
          {/* Recommendations when live */}
          {backlinkData?.recommendations && backlinkData.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {backlinkData.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <BacklinkGapCard
            clientDomain={audit?.domain ?? ''}
            clientBacklinks={backlinkData?.clientBacklinks ?? 0}
            clientReferringDomains={backlinkData?.clientReferringDomains ?? 0}
            competitors={(backlinkData?.competitors as never[]) ?? []}
            summary={backlinkData?.summary as never}
            isLoading={anyLoading}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <LLMMentionsCard
            clientDomain={audit?.domain ?? ''}
            mentionData={(llmData?.mentionData as never[]) ?? []}
            locationKeywords={llmData?.locationKeywords}
            summary={llmData?.summary as never}
            insight={llmData?.insight as never}
            isLoading={anyLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
