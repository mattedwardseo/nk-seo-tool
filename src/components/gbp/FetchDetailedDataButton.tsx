'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Star,
} from 'lucide-react'

interface DataStatus {
  hasPosts: boolean
  hasQA: boolean
  hasReviews: boolean
  lastPostsFetch: string | null
  lastQAFetch: string | null
  lastReviewsFetch: string | null
}

interface FetchDetailedDataButtonProps {
  campaignId: string
  onDataFetched?: () => void
}

export function FetchDetailedDataButton({
  campaignId,
  onDataFetched,
}: FetchDetailedDataButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    target: DataStatus & { businessName: string; gmbCid: string | null }
    competitors: Array<DataStatus & { businessName: string; gmbCid: string }>
  } | null>(null)
  const [fetchResult, setFetchResult] = useState<{
    message: string
    summary: { totalBusinesses: number; postsSuccess: number; qaSuccess: number; reviewsSuccess: number }
  } | null>(null)

  // Fetch current status on mount
  useEffect(() => {
    fetchStatus()
  }, [campaignId])

  const fetchStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(
        `/api/local-seo/campaigns/${campaignId}/gbp-comparison/fetch-detailed`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch status')
      }

      setStatus(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchData = async () => {
    try {
      setIsFetching(true)
      setError(null)
      setFetchResult(null)

      const response = await fetch(
        `/api/local-seo/campaigns/${campaignId}/gbp-comparison/fetch-detailed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataTypes: ['posts', 'qa', 'reviews'],
            includeTarget: true,
            includeCompetitors: true,
            competitorCount: 3,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch detailed data')
      }

      setFetchResult(result.data)

      // Refresh status after fetch
      await fetchStatus()

      // Notify parent
      onDataFetched?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsFetching(false)
    }
  }

  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
    return `${Math.round(seconds / 86400)}d ago`
  }

  const DataStatusBadge = ({ hasData, lastFetch }: { hasData: boolean; lastFetch: string | null }) => {
    if (hasData) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {formatTimeAgo(lastFetch)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <XCircle className="w-3 h-3 mr-1" />
        Not fetched
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading status...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              Detailed GBP Data
            </CardTitle>
            <CardDescription className="mt-1">
              Fetch Posts, Q&A, and Reviews from Google Business Profiles
            </CardDescription>
          </div>
          <Button
            onClick={handleFetchData}
            disabled={isFetching}
            size="sm"
          >
            {isFetching ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Fetch Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fetchResult && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Data Fetched</AlertTitle>
            <AlertDescription>
              {fetchResult.message}
              <div className="mt-2 flex gap-4 text-sm">
                <span>Posts: {fetchResult.summary.postsSuccess}/{fetchResult.summary.totalBusinesses}</span>
                <span>Q&A: {fetchResult.summary.qaSuccess}/{fetchResult.summary.totalBusinesses}</span>
                <span>Reviews: {fetchResult.summary.reviewsSuccess}/{fetchResult.summary.totalBusinesses}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status && (
          <div className="space-y-3">
            {/* Target Status */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{status.target.businessName}</span>
                <Badge variant="secondary" className="text-xs">Your Business</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <FileText className="w-3 h-3" />
                  Posts:
                  <DataStatusBadge
                    hasData={status.target.hasPosts}
                    lastFetch={status.target.lastPostsFetch}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <MessageSquare className="w-3 h-3" />
                  Q&A:
                  <DataStatusBadge
                    hasData={status.target.hasQA}
                    lastFetch={status.target.lastQAFetch}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3" />
                  Reviews:
                  <DataStatusBadge
                    hasData={status.target.hasReviews}
                    lastFetch={status.target.lastReviewsFetch}
                  />
                </div>
              </div>
            </div>

            {/* Competitors Status */}
            {status.competitors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Competitors</span>
                {status.competitors.map((comp) => (
                  <div key={comp.gmbCid} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-2 truncate">{comp.businessName}</div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <FileText className="w-3 h-3" />
                        <DataStatusBadge
                          hasData={comp.hasPosts}
                          lastFetch={comp.lastPostsFetch}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MessageSquare className="w-3 h-3" />
                        <DataStatusBadge
                          hasData={comp.hasQA}
                          lastFetch={comp.lastQAFetch}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3" />
                        <DataStatusBadge
                          hasData={comp.hasReviews}
                          lastFetch={comp.lastReviewsFetch}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Data is cached for 4 hours. Click Fetch Data to get fresh data.
        </div>
      </CardContent>
    </Card>
  )
}
