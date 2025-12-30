'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Eye,
  Play,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface CampaignCardData {
  id: string
  businessName: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  keywords: string[]
  gridSize: number
  gridRadiusMiles: number
  lastScanAt: Date | null
  nextScanAt: Date | null
  scanFrequency: string
  latestScan?: {
    avgRank: number | null
    shareOfVoice: number | null
    rankChange?: number | null
  }
}

interface CampaignCardProps {
  campaign: CampaignCardData
  onTriggerScan?: (id: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onDelete?: (id: string) => void
  basePath?: string // Base path for campaign links (e.g., "/d/abc123/local-seo")
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'PAUSED':
      return 'secondary'
    case 'ARCHIVED':
      return 'outline'
    default:
      return 'secondary'
  }
}

function formatDate(date: Date | null): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function RankChangeBadge({ change }: { change: number | null | undefined }): React.ReactElement {
  if (change === null || change === undefined) {
    return (
      <span className="flex items-center text-sm text-muted-foreground">
        <Minus className="h-3 w-3 mr-1" />
        No change data
      </span>
    )
  }

  if (change > 0) {
    return (
      <span className="flex items-center text-sm text-green-600">
        <TrendingUp className="h-3 w-3 mr-1" />+{change.toFixed(1)} positions
      </span>
    )
  }

  if (change < 0) {
    return (
      <span className="flex items-center text-sm text-red-600">
        <TrendingDown className="h-3 w-3 mr-1" />
        {change.toFixed(1)} positions
      </span>
    )
  }

  return (
    <span className="flex items-center text-sm text-muted-foreground">
      <Minus className="h-3 w-3 mr-1" />
      No change
    </span>
  )
}

export function CampaignCard({
  campaign,
  onTriggerScan,
  onPause,
  onResume,
  onDelete,
  basePath = '/local-seo',
}: CampaignCardProps): React.ReactElement {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.businessName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(campaign.status)}>
                {campaign.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {campaign.gridSize}×{campaign.gridSize} grid • {campaign.gridRadiusMiles}mi
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/${campaign.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Campaign
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerScan?.(campaign.id)}>
                <Play className="h-4 w-4 mr-2" />
                Run Scan Now
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {campaign.status === 'ACTIVE' ? (
                <DropdownMenuItem onClick={() => onPause?.(campaign.id)}>
                  Pause Campaign
                </DropdownMenuItem>
              ) : campaign.status === 'PAUSED' ? (
                <DropdownMenuItem onClick={() => onResume?.(campaign.id)}>
                  Resume Campaign
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(campaign.id)}
              >
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Keywords */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Keywords</p>
          <div className="flex flex-wrap gap-1">
            {(campaign.keywords ?? []).slice(0, 3).map((kw) => (
              <Badge key={kw} variant="outline" className="text-xs">
                {kw}
              </Badge>
            ))}
            {(campaign.keywords?.length ?? 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{campaign.keywords!.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Latest Scan Metrics */}
        {campaign.latestScan && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Rank</p>
              <p className="text-2xl font-bold">
                {campaign.latestScan.avgRank?.toFixed(1) ?? 'N/A'}
              </p>
              <RankChangeBadge change={campaign.latestScan.rankChange} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Share of Voice</p>
              <p className="text-2xl font-bold">
                {campaign.latestScan.shareOfVoice?.toFixed(1) ?? '0'}%
              </p>
              <p className="text-xs text-muted-foreground">Top 3 visibility</p>
            </div>
          </div>
        )}

        {!campaign.latestScan && (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scans yet</p>
          </div>
        )}

        {/* Schedule Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Last: {formatDate(campaign.lastScanAt)}</span>
          </div>
          <div>
            <span>Next: {formatDate(campaign.nextScanAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
