'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link2, ExternalLink, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompetitorBacklinks {
  domain: string
  backlinks: number | null
  referringDomains: number | null
  rank: number | null
}

interface BacklinkGapCardProps {
  clientDomain: string
  clientBacklinks: number
  clientReferringDomains: number
  competitors: CompetitorBacklinks[]
  gapDomains?: Array<{
    domain: string
    rank: number
    backlinks: number
    linksToCompetitors: string[]
  }>
  summary?: {
    totalGapDomains: number
    avgCompetitorBacklinks: number
    avgCompetitorReferringDomains: number
    backlinkGap: number
    referringDomainGap: number
  }
  isLoading?: boolean
}

export function BacklinkGapCard({
  clientDomain,
  clientBacklinks,
  clientReferringDomains,
  competitors,
  gapDomains = [],
  summary,
  isLoading,
}: BacklinkGapCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" />
            Backlink Gap
          </CardTitle>
          <CardDescription>Analyzing backlink profiles...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const maxBacklinks = Math.max(
    clientBacklinks,
    ...competitors.map((c) => c.backlinks ?? 0)
  )

  // Determine if client is behind or ahead
  const backlinkGap = summary?.backlinkGap ?? 0
  const referringGap = summary?.referringDomainGap ?? 0
  const isBehind = backlinkGap > 0 || referringGap > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              Backlink Gap
            </CardTitle>
            <CardDescription>Compare backlink profiles with competitors</CardDescription>
          </div>
          {summary && (
            <Badge
              variant={isBehind ? 'destructive' : 'secondary'}
              className={cn(!isBehind && 'bg-green-100 text-green-800')}
            >
              {isBehind ? `${Math.abs(backlinkGap)} behind` : 'Ahead'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client vs Competitors Comparison */}
        <div className="space-y-4">
          {/* Client row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium">You ({truncateDomain(clientDomain)})</span>
              </div>
              <span className="font-semibold">{clientBacklinks.toLocaleString()} backlinks</span>
            </div>
            <Progress
              value={maxBacklinks > 0 ? (clientBacklinks / maxBacklinks) * 100 : 0}
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {clientReferringDomains.toLocaleString()} referring domains
            </p>
          </div>

          {/* Competitor rows */}
          {competitors.slice(0, 4).map((comp, idx) => (
            <div key={comp.domain} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      idx === 0
                        ? 'bg-red-500'
                        : idx === 1
                          ? 'bg-amber-500'
                          : idx === 2
                            ? 'bg-purple-500'
                            : 'bg-gray-400'
                    )}
                  />
                  <span>{truncateDomain(comp.domain)}</span>
                  {comp.rank && (
                    <Badge variant="outline" className="text-xs">
                      Rank {comp.rank}
                    </Badge>
                  )}
                </div>
                <span>
                  {comp.backlinks !== null
                    ? `${comp.backlinks.toLocaleString()} backlinks`
                    : 'N/A'}
                </span>
              </div>
              <Progress
                value={
                  maxBacklinks > 0 && comp.backlinks
                    ? (comp.backlinks / maxBacklinks) * 100
                    : 0
                }
                className={cn(
                  'h-3',
                  idx === 0
                    ? '[&>div]:bg-red-500'
                    : idx === 1
                      ? '[&>div]:bg-amber-500'
                      : idx === 2
                        ? '[&>div]:bg-purple-500'
                        : '[&>div]:bg-gray-400'
                )}
              />
              <p className="text-xs text-muted-foreground">
                {comp.referringDomains !== null
                  ? `${comp.referringDomains.toLocaleString()} referring domains`
                  : 'No data'}
              </p>
            </div>
          ))}
        </div>

        {/* Gap opportunities */}
        {gapDomains.length > 0 && (
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium">Link Opportunities</h4>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {gapDomains.length} domains link to your competitors but not to you:
            </p>
            <div className="space-y-2">
              {gapDomains.slice(0, 5).map((gap) => (
                <div
                  key={gap.domain}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{gap.domain}</span>
                    <Badge variant="outline" className="text-xs">
                      DR {gap.rank}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Links to {gap.linksToCompetitors.length} competitors</span>
                    <ArrowRight className="h-3 w-3" />
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
            {gapDomains.length > 5 && (
              <p className="mt-2 text-xs text-muted-foreground">
                +{gapDomains.length - 5} more opportunities
              </p>
            )}
          </div>
        )}

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg Competitor Backlinks</p>
              <p className="text-xl font-semibold">
                {summary.avgCompetitorBacklinks.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Referring Domains</p>
              <p className="text-xl font-semibold">
                {summary.avgCompetitorReferringDomains.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Empty state for gap domains */}
        {gapDomains.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Link2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Run the backlink gap analysis to find link-building opportunities.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function truncateDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, '')
  return cleaned.length > 20 ? cleaned.substring(0, 20) + '...' : cleaned
}
