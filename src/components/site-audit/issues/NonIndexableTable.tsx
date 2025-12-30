'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, EyeOff, Bot, FileX, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface NonIndexablePage {
  id: string;
  url: string;
  title: string | null;
  statusCode: number;
  onpageScore: number | null;
  reason: string;
}

interface NonIndexableData {
  pages: NonIndexablePage[];
  total: number;
  byReason: Record<string, number>;
}

interface NonIndexableTableProps {
  scanId: string;
}

function getReasonIcon(reason: string) {
  if (reason.includes('noindex')) return <EyeOff className="h-4 w-4" />;
  if (reason.includes('robots')) return <Bot className="h-4 w-4" />;
  if (reason.includes('canonical')) return <Link2Off className="h-4 w-4" />;
  if (reason.includes('HTTP')) return <FileX className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
}

function getReasonColor(reason: string): string {
  if (reason.includes('noindex')) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  if (reason.includes('robots')) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
  if (reason.includes('canonical')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
  if (reason.includes('HTTP 4')) return 'bg-red-500/10 text-red-700 dark:text-red-400';
  if (reason.includes('HTTP 5')) return 'bg-red-500/10 text-red-700 dark:text-red-400';
  return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
}

export function NonIndexableTable({ scanId }: NonIndexableTableProps) {
  const [data, setData] = useState<NonIndexableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNonIndexable() {
      try {
        setLoading(true);
        const response = await fetch(`/api/site-audit/scans/${scanId}/non-indexable`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to fetch non-indexable pages');
          return;
        }

        setData(result.data);
      } catch (err) {
        setError('Failed to fetch non-indexable data');
      } finally {
        setLoading(false);
      }
    }

    fetchNonIndexable();
  }, [scanId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No non-indexable pages found.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5" />
          Non-Indexable Pages
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-3">
          <span>Total: {data.total} pages</span>
          <span className="text-muted-foreground">|</span>
          {Object.entries(data.byReason).map(([reason, count]) => (
            <Badge key={reason} variant="outline" className="gap-1">
              {reason}: {count}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead className="w-[160px]">Reason</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[80px]">Score</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-mono text-xs max-w-[400px]">
                    <div className="space-y-1">
                      <span className="truncate block" title={page.url}>
                        {page.url}
                      </span>
                      {page.title && (
                        <span className="text-muted-foreground truncate block text-xs" title={page.title}>
                          {page.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`gap-1 ${getReasonColor(page.reason)}`}>
                      {getReasonIcon(page.reason)}
                      {page.reason}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={page.statusCode >= 400 ? 'destructive' : 'secondary'}
                    >
                      {page.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {page.onpageScore !== null ? (
                      <span
                        className={
                          page.onpageScore >= 80
                            ? 'text-green-600'
                            : page.onpageScore >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {Math.round(page.onpageScore)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={page.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
