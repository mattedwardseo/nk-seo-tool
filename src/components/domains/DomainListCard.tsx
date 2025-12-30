'use client';

/**
 * DomainListCard Component
 * Displays a domain project card for the landing page grid
 */

import Link from 'next/link';
import { MoreHorizontal, Globe, Settings, Archive, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ToolCounts {
  audits: number;
  siteScans: number;
  localCampaigns: number;
  seoCalculations: number;
  trackedKeywords: number;
  keywordTrackingRuns: number;
}

interface DomainListCardProps {
  id: string;
  name: string;
  domain: string;
  businessName?: string | null;
  city?: string | null;
  state?: string | null;
  status: string;
  updatedAt: Date;
  toolCounts?: ToolCounts | null;
  onArchive?: (id: string) => void;
}

export function DomainListCard({
  id,
  name,
  domain,
  businessName,
  city,
  state,
  status,
  updatedAt,
  toolCounts,
  onArchive,
}: DomainListCardProps): React.ReactElement {
  const location = [city, state].filter(Boolean).join(', ');

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-lg">{name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 truncate text-sm">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              {domain}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/d/${id}/settings`} className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onArchive?.(id)}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Business info */}
        {(businessName || location) && (
          <div className="text-muted-foreground mt-1 text-xs">
            {businessName && <span>{businessName}</span>}
            {businessName && location && <span> • </span>}
            {location && <span>{location}</span>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tool counts */}
        {toolCounts && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/50 px-2 py-1.5">
              <p className="text-lg font-semibold">
                {(toolCounts.audits || 0) + (toolCounts.keywordTrackingRuns || 0)}
              </p>
              <p className="text-muted-foreground text-xs">Audits</p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1.5">
              <p className="text-lg font-semibold">{toolCounts.siteScans || 0}</p>
              <p className="text-muted-foreground text-xs">Site Scans</p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1.5">
              <p className="text-lg font-semibold">
                {toolCounts.localCampaigns || 0}
              </p>
              <p className="text-muted-foreground text-xs">Campaigns</p>
            </div>
          </div>
        )}

        {/* Last activity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last activity</span>
          <span>{formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
            {status.toLowerCase()}
          </Badge>
          <Button asChild size="sm">
            <Link href={`/d/${id}`}>
              Enter
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
