'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  Calendar,
  Eye,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ScanCardData {
  id: string;
  domain: string;
  status: 'PENDING' | 'SUBMITTING' | 'CRAWLING' | 'FETCHING_RESULTS' | 'COMPLETED' | 'FAILED';
  progress: number;
  maxCrawlPages: number;
  createdAt: Date | string;
  completedAt: Date | string | null;
  summary?: {
    crawledPages: number;
    onpageScore: number | null;
    errorsCount: number;
  } | null;
}

interface ScanCardProps {
  scan: ScanCardData;
  onDelete?: (id: string) => void;
  basePath?: string; // Base path for scan links (e.g., "/d/abc123/site-audit")
}

function getStatusConfig(status: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'PENDING':
      return {
        variant: 'secondary',
        label: 'Pending',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      };
    case 'SUBMITTING':
      return {
        variant: 'secondary',
        label: 'Starting',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      };
    case 'CRAWLING':
      return {
        variant: 'default',
        label: 'Crawling',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      };
    case 'FETCHING_RESULTS':
      return {
        variant: 'default',
        label: 'Fetching Results',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      };
    case 'COMPLETED':
      return {
        variant: 'outline',
        label: 'Completed',
        icon: <CheckCircle className="h-3 w-3 text-green-500" />,
      };
    case 'FAILED':
      return {
        variant: 'destructive',
        label: 'Failed',
        icon: <AlertCircle className="h-3 w-3" />,
      };
    default:
      return {
        variant: 'secondary',
        label: status,
        icon: null,
      };
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function ScanCard({ scan, onDelete, basePath = '/site-audit' }: ScanCardProps): React.ReactElement {
  const statusConfig = getStatusConfig(scan.status);
  const isInProgress = ['PENDING', 'SUBMITTING', 'CRAWLING', 'FETCHING_RESULTS'].includes(
    scan.status
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {scan.domain}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Max {scan.maxCrawlPages} pages
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
                <Link href={`${basePath}/${scan.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(scan.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Scan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar (when in progress) */}
        {isInProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{scan.progress}%</span>
            </div>
            <Progress value={scan.progress} className="h-2" />
          </div>
        )}

        {/* Summary Metrics (when completed) */}
        {scan.status === 'COMPLETED' && scan.summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Pages</p>
              <p className="text-xl font-bold">{scan.summary.crawledPages}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Score</p>
              <p className={`text-xl font-bold ${getScoreColor(scan.summary.onpageScore)}`}>
                {scan.summary.onpageScore?.toFixed(0) ?? 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Errors</p>
              <p className="text-xl font-bold text-red-600 flex items-center justify-center gap-1">
                {scan.summary.errorsCount > 0 && (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {scan.summary.errorsCount}
              </p>
            </div>
          </div>
        )}

        {/* Failed State */}
        {scan.status === 'FAILED' && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive opacity-50" />
            <p className="text-sm">Scan failed</p>
          </div>
        )}

        {/* Date Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Started: {formatDate(scan.createdAt)}</span>
          </div>
          {scan.completedAt && (
            <span>Completed: {formatDate(scan.completedAt)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
