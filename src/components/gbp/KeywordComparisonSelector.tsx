'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, MapPin, Star, Trophy, TrendingDown } from 'lucide-react'
import type { MapPackCompetitor } from '@/lib/local-seo/types'

interface KeywordComparisonData {
  keyword: string
  location: string
  targetRank: number | null
  targetInTop3: boolean
  targetInTop10: boolean
  mapPackResults: MapPackCompetitor[]
  allResults: MapPackCompetitor[]
  totalResults: number
}

interface KeywordComparisonSelectorProps {
  campaignId: string
  keywords: string[]
  businessName: string
}

export function KeywordComparisonSelector({
  campaignId,
  keywords,
  businessName,
}: KeywordComparisonSelectorProps): React.ReactElement {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('')
  const [data, setData] = useState<KeywordComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeywordComparison = async (keyword: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const url = `/api/local-seo/campaigns/${campaignId}/gbp-comparison/by-keyword?keyword=${encodeURIComponent(keyword)}`
      const response = await fetch(url)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch keyword comparison')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeywordChange = (keyword: string) => {
    setSelectedKeyword(keyword)
    if (keyword) {
      fetchKeywordComparison(keyword)
    } else {
      setData(null)
    }
  }

  const getRankBadge = (rank: number | null) => {
    if (rank === null) {
      return <Badge variant="destructive">Not Ranking</Badge>
    }
    if (rank <= 3) {
      return <Badge className="bg-green-600">#{rank}</Badge>
    }
    if (rank <= 10) {
      return <Badge className="bg-yellow-500">#{rank}</Badge>
    }
    return <Badge variant="secondary">#{rank}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Keyword Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Compare by Keyword
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Select a tracked keyword
              </label>
              <Select value={selectedKeyword} onValueChange={handleKeywordChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a keyword..." />
                </SelectTrigger>
                <SelectContent>
                  {keywords.map((keyword) => (
                    <SelectItem key={keyword} value={keyword}>
                      {keyword}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedKeyword && (
              <Button
                variant="outline"
                onClick={() => fetchKeywordComparison(selectedKeyword)}
                disabled={isLoading}
              >
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {data && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Map Pack Results for &quot;{data.keyword}&quot;
            </CardTitle>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {data.totalResults} businesses found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Your rank:</span>
                {getRankBadge(data.targetRank)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Target Status */}
            {data.targetRank !== null && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  data.targetInTop3
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900'
                    : data.targetInTop10
                      ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900'
                      : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {data.targetInTop3 ? (
                    <>
                      <Trophy className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">
                        Great! {businessName} is in the top 3 for this keyword
                      </span>
                    </>
                  ) : data.targetInTop10 ? (
                    <>
                      <Star className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-600">
                        {businessName} is in top 10 but could improve
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">
                        {businessName} needs optimization for this keyword
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {data.targetRank === null && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">
                    {businessName} is not ranking in the top 20 for this keyword
                  </span>
                </div>
              </div>
            )}

            {/* Top 3 Competitors */}
            <h4 className="text-sm font-semibold mb-2">Top 3 Map Pack Competitors</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mapPackResults.map((competitor) => (
                    <TableRow key={competitor.cid || competitor.name}>
                      <TableCell>
                        <Badge variant="outline">#{competitor.rank}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {competitor.name}
                        {competitor.address && (
                          <span className="text-xs text-muted-foreground block">
                            {competitor.address}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {competitor.rating ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {competitor.rating.toFixed(1)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {competitor.reviewCount?.toLocaleString() ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* All Results (Top 10) */}
            {data.allResults.length > 3 && (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View top 10 results
                </summary>
                <div className="border rounded-lg overflow-hidden mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Rank</TableHead>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Reviews</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.allResults.map((competitor) => {
                        const isTarget = competitor.name
                          .toLowerCase()
                          .includes(businessName.toLowerCase())
                        return (
                          <TableRow
                            key={competitor.cid || competitor.name}
                            className={isTarget ? 'bg-blue-50 dark:bg-blue-950' : ''}
                          >
                            <TableCell>
                              <Badge
                                variant={
                                  competitor.rank <= 3
                                    ? 'default'
                                    : competitor.rank <= 10
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className={competitor.rank <= 3 ? 'bg-green-600' : ''}
                              >
                                #{competitor.rank}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {competitor.name}
                              {isTarget && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  You
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {competitor.rating ? (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  {competitor.rating.toFixed(1)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {competitor.reviewCount?.toLocaleString() ?? '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedKeyword && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a keyword above to see map pack rankings</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
