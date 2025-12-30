'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Link2,
  RefreshCw,
  Loader2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDomain } from '@/contexts/DomainContext'
import { BacklinkQualityChart } from '@/components/backlinks/BacklinkQualityChart'
import { LinkVelocityChart } from '@/components/backlinks/LinkVelocityChart'
import { AnchorTextCloud } from '@/components/backlinks/AnchorTextCloud'
import { SpamScoreIndicator } from '@/components/backlinks/SpamScoreIndicator'
import { DomainRankBadge } from '@/components/backlinks/DomainRankBadge'

interface BacklinkProfile {
  id: string
  domainId: string
  totalBacklinks: number
  referringDomainsCount: number
  domainRank: number
  spamScore: number
  targetSpamScore: number | null
  dofollowRatio: number
  dofollowBacklinks: number
  nofollowBacklinks: number
  newBacklinks30d: number | null
  lostBacklinks30d: number | null
  newReferring30d: number | null
  lostReferring30d: number | null
  fetchedAt: string
  referringDomains?: Array<{
    id: string
    domain: string
    backlinks: number
    domainRank: number
    dofollow: number
    nofollow: number
  }>
  anchors?: Array<{
    id: string
    anchor: string
    backlinks: number
    referringDomains: number
  }>
}

export default function BacklinksPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [profile, setProfile] = useState<BacklinkProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchProfile()
  }, [domainId])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/backlinks/profile?domainId=${domainId}&includeDetails=true`
      )
      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
      } else {
        setError(data.error || 'Failed to load backlink profile')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const response = await fetch('/api/backlinks/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      })
      const data = await response.json()

      if (data.success) {
        // Refetch with details
        await fetchProfile()
      } else {
        setError(data.error || 'Failed to refresh data')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Link2 className="h-5 w-5 text-blue-500" />
            </div>
            Backlink Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze your backlink portfolio for{' '}
            <span className="font-medium text-foreground">
              {selectedDomain?.domain || 'your domain'}
            </span>
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing} 
          className="bg-[#FF6B35] hover:bg-[#E85A2A]"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {!profile ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">No Backlink Data</h3>
                <p className="text-muted-foreground mt-1">
                  Fetch your backlink profile to see detailed analysis
                </p>
              </div>
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="bg-[#FF6B35] hover:bg-[#E85A2A]"
                size="lg"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Fetch Backlinks
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Backlinks */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/5" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Backlinks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {formatNumber(profile.totalBacklinks)}
                </div>
                {profile.newBacklinks30d !== null && (
                  <div className="flex items-center gap-1.5 text-sm mt-2">
                    {(profile.newBacklinks30d || 0) > (profile.lostBacklinks30d || 0) ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{(profile.newBacklinks30d || 0) - (profile.lostBacklinks30d || 0)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {(profile.newBacklinks30d || 0) - (profile.lostBacklinks30d || 0)}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">last 30d</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referring Domains */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-500/5" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Referring Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {formatNumber(profile.referringDomainsCount)}
                </div>
                {profile.newReferring30d !== null && (
                  <div className="flex items-center gap-1.5 text-sm mt-2">
                    {(profile.newReferring30d || 0) > (profile.lostReferring30d || 0) ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{(profile.newReferring30d || 0) - (profile.lostReferring30d || 0)}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {(profile.newReferring30d || 0) - (profile.lostReferring30d || 0)}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">last 30d</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Domain Rank */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Domain Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <DomainRankBadge rank={profile.domainRank} size="sm" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">out of 1000</div>
                </div>
              </CardContent>
            </Card>

            {/* Spam Score */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Spam Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SpamScoreIndicator score={profile.spamScore} size="sm" />
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="velocity">Link Velocity</TabsTrigger>
              <TabsTrigger value="anchors">Anchor Texts</TabsTrigger>
              <TabsTrigger value="domains">Top Domains</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Quality Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Link Quality Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of backlinks by referring domain authority
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BacklinkQualityChart
                      domainRank={profile.domainRank}
                      referringDomainsCount={profile.referringDomainsCount}
                      dofollowRatio={profile.dofollowRatio}
                      spamScore={profile.spamScore}
                    />
                  </CardContent>
                </Card>

                {/* Link Type Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Link Type Breakdown</CardTitle>
                    <CardDescription>
                      Distribution of dofollow vs nofollow links
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dofollow */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium">Dofollow</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatNumber(profile.dofollowBacklinks)} ({Math.round(profile.dofollowRatio * 100)}%)
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${profile.dofollowRatio * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Nofollow */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-slate-400" />
                          <span className="text-sm font-medium">Nofollow</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatNumber(profile.nofollowBacklinks)} ({Math.round((1 - profile.dofollowRatio) * 100)}%)
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-slate-400 rounded-full transition-all duration-500"
                          style={{ width: `${(1 - profile.dofollowRatio) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {profile.dofollowRatio >= 0.7 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✓ Healthy dofollow ratio. Good link diversity.
                          </span>
                        ) : profile.dofollowRatio >= 0.5 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            ⚠ Consider building more dofollow backlinks.
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            ⚠ Low dofollow ratio. Focus on quality link building.
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="velocity">
              <Card>
                <CardHeader>
                  <CardTitle>Link Velocity (Last 30 Days)</CardTitle>
                  <CardDescription>
                    Track new and lost backlinks over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LinkVelocityChart
                    newBacklinks30d={profile.newBacklinks30d}
                    lostBacklinks30d={profile.lostBacklinks30d}
                    newReferring30d={profile.newReferring30d}
                    lostReferring30d={profile.lostReferring30d}
                  />
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xl font-bold tabular-nums">
                          +{profile.newBacklinks30d || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">New Backlinks</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xl font-bold tabular-nums">
                          -{profile.lostBacklinks30d || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Lost Backlinks</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xl font-bold tabular-nums">
                          +{profile.newReferring30d || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">New Domains</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xl font-bold tabular-nums">
                          -{profile.lostReferring30d || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Lost Domains</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anchors">
              <Card>
                <CardHeader>
                  <CardTitle>Anchor Text Distribution</CardTitle>
                  <CardDescription>
                    Visual representation of your most common anchor texts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnchorTextCloud anchors={profile.anchors || []} />
                  
                  {/* Anchor Table */}
                  {profile.anchors && profile.anchors.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-3">Top Anchor Texts</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Anchor Text</TableHead>
                            <TableHead className="text-right">Backlinks</TableHead>
                            <TableHead className="text-right">Domains</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profile.anchors.slice(0, 10).map((anchor) => (
                            <TableRow key={anchor.id}>
                              <TableCell className="font-medium">
                                {anchor.anchor || '(empty)'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatNumber(anchor.backlinks)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {anchor.referringDomains}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domains">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Top Referring Domains</CardTitle>
                    <CardDescription>
                      Highest authority domains linking to your site
                    </CardDescription>
                  </div>
                  <Link href={domainUrl('/backlinks/referring-domains')}>
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {profile.referringDomains && profile.referringDomains.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Domain</TableHead>
                          <TableHead className="text-right">Backlinks</TableHead>
                          <TableHead className="text-right">DR</TableHead>
                          <TableHead className="text-right">Dofollow</TableHead>
                          <TableHead className="text-right">Nofollow</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.referringDomains.slice(0, 15).map((rd) => (
                          <TableRow key={rd.id} className="group">
                            <TableCell>
                              <a
                                href={`https://${rd.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                              >
                                {rd.domain}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {formatNumber(rd.backlinks)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={rd.domainRank >= 50 ? 'default' : rd.domainRank >= 30 ? 'secondary' : 'outline'}
                                className={rd.domainRank >= 50 ? 'bg-emerald-600' : ''}
                              >
                                {rd.domainRank}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                              {rd.dofollow}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {rd.nofollow}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">
                      No referring domain data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Data Freshness */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Data provided by DataForSEO
            </span>
            <span>
              Last updated: {new Date(profile.fetchedAt).toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
