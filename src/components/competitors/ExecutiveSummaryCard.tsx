'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, TrendingUp, TrendingDown, DollarSign, Target, Award } from 'lucide-react'

interface ExecutiveSummaryCardProps {
  clientDomain: string
  clientRank?: number | null
  clientTraffic?: number | null
  clientEtv?: number | null
  totalCompetitors: number
  competitors: Array<{
    domain: string
    rank?: number | null
    etv?: number | null
    organicTraffic?: number | null
  }>
  serpSummary?: {
    wins?: number
    losses?: number
    ties?: number
  }
  isLoading?: boolean
}

export function ExecutiveSummaryCard({
  clientDomain,
  clientRank: _clientRank,
  clientTraffic: _clientTraffic,
  clientEtv,
  totalCompetitors,
  competitors,
  serpSummary,
  isLoading = false,
}: ExecutiveSummaryCardProps) {
  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate competitive position (rank among competitors based on ETV)
  const sortedByEtv = [...competitors].sort((a, b) => (b.etv ?? 0) - (a.etv ?? 0))
  const clientEtvValue = clientEtv ?? 0
  let competitivePosition = 1
  for (const comp of sortedByEtv) {
    if ((comp.etv ?? 0) > clientEtvValue) {
      competitivePosition++
    }
  }

  // Find leader stats
  const leader = sortedByEtv[0]
  const leaderEtv = leader?.etv ?? 0
  const trafficGapPercent =
    leaderEtv > 0 && clientEtvValue < leaderEtv
      ? Math.round(((leaderEtv - clientEtvValue) / leaderEtv) * 100)
      : 0

  // Win/Loss from SERP data
  const wins = serpSummary?.wins ?? 0
  const losses = serpSummary?.losses ?? 0
  const totalKeywords = wins + losses + (serpSummary?.ties ?? 0)
  const winRate = totalKeywords > 0 ? Math.round((wins / totalKeywords) * 100) : 0

  // Determine overall status
  const isWinning = wins > losses
  const isLeader = competitivePosition === 1

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Competitive Position
            </CardTitle>
            <CardDescription className="mt-1">
              How {clientDomain} compares to local competitors
            </CardDescription>
          </div>
          {isLeader ? (
            <Badge className="bg-yellow-500 text-yellow-950">
              <Award className="mr-1 h-3 w-3" />
              Market Leader
            </Badge>
          ) : isWinning ? (
            <Badge className="bg-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              Gaining Ground
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Target className="mr-1 h-3 w-3" />
              Opportunity Ahead
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Position */}
          <div className="rounded-lg bg-white/50 p-3 text-center dark:bg-black/20">
            <div className="text-3xl font-bold text-blue-600">
              #{competitivePosition}
            </div>
            <div className="text-sm text-muted-foreground">
              of {totalCompetitors + 1} competitors
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {isLeader ? 'You are the leader!' : `${competitivePosition - 1} ahead of you`}
            </div>
          </div>

          {/* Traffic Gap */}
          <div className="rounded-lg bg-white/50 p-3 text-center dark:bg-black/20">
            {trafficGapPercent > 0 ? (
              <>
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-orange-600">
                  <TrendingDown className="h-6 w-6" />
                  {trafficGapPercent}%
                </div>
                <div className="text-sm text-muted-foreground">Behind leader</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {leader?.domain ? `vs ${leader.domain.slice(0, 15)}...` : ''}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-green-600">
                  <TrendingUp className="h-6 w-6" />
                  Leading
                </div>
                <div className="text-sm text-muted-foreground">Top Traffic</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  ${(clientEtvValue).toLocaleString()}/mo value
                </div>
              </>
            )}
          </div>

          {/* Keywords Won/Lost */}
          <div className="rounded-lg bg-white/50 p-3 text-center dark:bg-black/20">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-green-600">{wins}</span>
              <span className="text-lg text-muted-foreground">/</span>
              <span className="text-2xl font-bold text-red-500">{losses}</span>
            </div>
            <div className="text-sm text-muted-foreground">Won / Lost</div>
            <div className="mt-1">
              <Badge variant={isWinning ? 'default' : 'secondary'} className={isWinning ? 'bg-green-600' : ''}>
                {winRate}% win rate
              </Badge>
            </div>
          </div>

          {/* Monthly Opportunity */}
          <div className="rounded-lg bg-white/50 p-3 text-center dark:bg-black/20">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
              <DollarSign className="h-6 w-6" />
              {trafficGapPercent > 0
                ? `${Math.round((leaderEtv - clientEtvValue) * 0.3).toLocaleString()}`
                : '0'}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Potential</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Closing the gap
            </div>
          </div>
        </div>

        {/* Quick Insight */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-white/70 p-3 dark:border-blue-800 dark:bg-black/30">
          <p className="text-sm">
            {isLeader ? (
              <span className="text-green-700 dark:text-green-300">
                <strong>Great job!</strong> You&apos;re leading the local market. Focus on defending your position
                and expanding into new keyword opportunities.
              </span>
            ) : wins > losses ? (
              <span className="text-blue-700 dark:text-blue-300">
                <strong>You&apos;re making progress!</strong> Winning {wins} keywords against competitors.
                Continue building backlinks and content to close the gap with {leader?.domain || 'the leader'}.
              </span>
            ) : (
              <span className="text-orange-700 dark:text-orange-300">
                <strong>Opportunity identified!</strong> Focus on improving rankings for your {losses} losing keywords.
                With the right SEO strategy, you could capture an additional ${Math.round((leaderEtv - clientEtvValue) * 0.3).toLocaleString()}/month in traffic value.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
