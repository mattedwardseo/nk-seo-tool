'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
} from 'lucide-react'
import { ComparisonTable } from './ComparisonTable'
import { GapsCard } from './GapsCard'
import { ManualChecksCard } from './ManualChecksCard'
import { KeywordComparisonSelector } from './KeywordComparisonSelector'
import { FetchDetailedDataButton } from './FetchDetailedDataButton'
import { PostsComparisonCard } from './PostsComparisonCard'
import { QAComparisonCard } from './QAComparisonCard'
import type {
  GBPComparisonProfile,
  GBPGap,
  ComparisonField,
  ManualCheckItem,
} from '@/lib/local-seo/types'

interface DetailedPostsData {
  businessName: string
  gmbCid: string
  postsCount: number | null
  lastPostDate: string | null
  postsPerMonthAvg: number | null
  recentPosts: unknown[] | null
  postsFetchedAt: string | null
}

interface DetailedQAData {
  businessName: string
  gmbCid: string
  questionsCount: number | null
  answeredCount: number | null
  unansweredCount: number | null
  recentQA: unknown[] | null
  qaFetchedAt: string | null
}

interface GBPComparisonData {
  target: GBPComparisonProfile
  competitors: GBPComparisonProfile[]
  comparison: ComparisonField[]
  gaps: GBPGap[]
  manualChecks: ManualCheckItem[]
  recommendations: string[]
  cacheAge: number
  hasCompetitorData: boolean
  detailedData?: {
    target: DetailedPostsData & DetailedQAData
    competitors: Array<DetailedPostsData & DetailedQAData>
  }
}

interface GBPComparisonDashboardProps {
  campaignId: string
  keywords: string[]
  businessName: string
}

export function GBPComparisonDashboard({
  campaignId,
  keywords,
  businessName,
}: GBPComparisonDashboardProps): React.ReactElement {
  const [data, setData] = useState<GBPComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchComparison = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const url = `/api/local-seo/campaigns/${campaignId}/gbp-comparison${refresh ? '?refresh=true' : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch comparison data')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchComparison()
  }, [fetchComparison])

  const handleRefresh = () => {
    fetchComparison(true)
  }

  // Format cache age for display
  const formatCacheAge = (seconds: number): string => {
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hr ago`
    return `${Math.round(seconds / 86400)} days ago`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            GBP Competitive Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            GBP Competitive Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => fetchComparison()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data?.hasCompetitorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            GBP Competitive Analysis
          </CardTitle>
          <CardDescription>Compare your GBP profile against local competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Target className="h-4 w-4" />
            <AlertTitle>No Competitor Data Yet</AlertTitle>
            <AlertDescription>
              Run a geo-grid scan first to discover local competitors. Once complete, return here
              to see how your GBP profile compares.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { target, competitors, comparison, gaps, manualChecks, recommendations, cacheAge } = data

  // Count wins and losses
  const wins = comparison.filter((c) => c.targetWinning).length
  const losses = comparison.filter((c) => !c.targetWinning).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              GBP Competitive Analysis
            </CardTitle>
            <CardDescription className="mt-1">
              Comparing {businessName} against top {competitors.length} competitors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatCacheAge(cacheAge)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{wins} Wins</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">{losses} Gaps</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{target.completenessScore}% Complete</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="gaps">
              Gaps ({gaps.length})
            </TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
            <TabsTrigger value="keyword">By Keyword</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Fetch Detailed Data */}
            <FetchDetailedDataButton
              campaignId={campaignId}
              onDataFetched={() => fetchComparison(true)}
            />

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recommendations</h3>
                <ul className="space-y-2">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Gaps */}
            <GapsCard gaps={gaps.slice(0, 3)} showAll={false} />

            {/* Manual Checks (items not available via API) */}
            <ManualChecksCard items={manualChecks} />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-4">
            <ComparisonTable
              target={target}
              competitors={competitors}
              comparison={comparison}
            />
          </TabsContent>

          {/* Gaps Tab */}
          <TabsContent value="gaps" className="mt-4">
            <GapsCard gaps={gaps} showAll={true} />
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            <PostsComparisonCard
              target={data.detailedData?.target ? {
                businessName: data.detailedData.target.businessName,
                gmbCid: data.detailedData.target.gmbCid,
                postsCount: data.detailedData.target.postsCount,
                lastPostDate: data.detailedData.target.lastPostDate,
                postsPerMonthAvg: data.detailedData.target.postsPerMonthAvg,
                recentPosts: data.detailedData.target.recentPosts as Array<{
                  type: string
                  snippet?: string | null
                  post_text?: string | null
                  post_date?: string | null
                  timestamp?: string | null
                  url?: string | null
                  images_url?: string | null
                }> | null,
                postsFetchedAt: data.detailedData.target.postsFetchedAt,
              } : {
                businessName: target.businessName,
                gmbCid: target.gmbCid ?? '',
                postsCount: null,
                lastPostDate: null,
                postsPerMonthAvg: null,
                recentPosts: null,
                postsFetchedAt: null,
              }}
              competitors={data.detailedData?.competitors ? data.detailedData.competitors.map((c) => ({
                businessName: c.businessName,
                gmbCid: c.gmbCid,
                postsCount: c.postsCount,
                lastPostDate: c.lastPostDate,
                postsPerMonthAvg: c.postsPerMonthAvg,
                recentPosts: c.recentPosts as Array<{
                  type: string
                  snippet?: string | null
                  post_text?: string | null
                  post_date?: string | null
                  timestamp?: string | null
                  url?: string | null
                  images_url?: string | null
                }> | null,
                postsFetchedAt: c.postsFetchedAt,
              })) : competitors.map((c) => ({
                businessName: c.businessName,
                gmbCid: c.gmbCid ?? '',
                postsCount: null,
                lastPostDate: null,
                postsPerMonthAvg: null,
                recentPosts: null,
                postsFetchedAt: null,
              }))}
            />
          </TabsContent>

          {/* Q&A Tab */}
          <TabsContent value="qa" className="mt-4">
            <QAComparisonCard
              target={data.detailedData?.target ? {
                businessName: data.detailedData.target.businessName,
                gmbCid: data.detailedData.target.gmbCid,
                questionsCount: data.detailedData.target.questionsCount,
                answeredCount: data.detailedData.target.answeredCount,
                unansweredCount: data.detailedData.target.unansweredCount,
                recentQA: data.detailedData.target.recentQA as Array<{
                  question_text?: string | null
                  original_question_text?: string | null
                  time_ago?: string | null
                  timestamp?: string | null
                  items?: Array<{
                    answer_text?: string | null
                    profile_name?: string | null
                  }> | null
                }> | null,
                qaFetchedAt: data.detailedData.target.qaFetchedAt,
              } : {
                businessName: target.businessName,
                gmbCid: target.gmbCid ?? '',
                questionsCount: null,
                answeredCount: null,
                unansweredCount: null,
                recentQA: null,
                qaFetchedAt: null,
              }}
              competitors={data.detailedData?.competitors ? data.detailedData.competitors.map((c) => ({
                businessName: c.businessName,
                gmbCid: c.gmbCid,
                questionsCount: c.questionsCount,
                answeredCount: c.answeredCount,
                unansweredCount: c.unansweredCount,
                recentQA: c.recentQA as Array<{
                  question_text?: string | null
                  original_question_text?: string | null
                  time_ago?: string | null
                  timestamp?: string | null
                  items?: Array<{
                    answer_text?: string | null
                    profile_name?: string | null
                  }> | null
                }> | null,
                qaFetchedAt: c.qaFetchedAt,
              })) : competitors.map((c) => ({
                businessName: c.businessName,
                gmbCid: c.gmbCid ?? '',
                questionsCount: null,
                answeredCount: null,
                unansweredCount: null,
                recentQA: null,
                qaFetchedAt: null,
              }))}
            />
          </TabsContent>

          {/* By Keyword Tab */}
          <TabsContent value="keyword" className="mt-4">
            <KeywordComparisonSelector
              campaignId={campaignId}
              keywords={keywords}
              businessName={businessName}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
