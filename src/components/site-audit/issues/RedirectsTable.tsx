'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
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

interface RedirectPage {
  id: string;
  url: string;
  redirectLocation: string | null;
  statusCode: number;
  title: string | null;
}

interface RedirectsData {
  redirects: RedirectPage[];
  total: number;
  byStatusCode: Record<number, number>;
}

interface RedirectsTableProps {
  scanId: string;
}

function getStatusCodeColor(code: number): string {
  if (code === 301) return 'bg-green-500/10 text-green-700 dark:text-green-400';
  if (code === 302) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  if (code === 307) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  if (code === 308) return 'bg-green-500/10 text-green-700 dark:text-green-400';
  return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
}

function getStatusCodeLabel(code: number): string {
  switch (code) {
    case 301:
      return '301 Permanent';
    case 302:
      return '302 Temporary';
    case 307:
      return '307 Temporary';
    case 308:
      return '308 Permanent';
    default:
      return `${code}`;
  }
}

export function RedirectsTable({ scanId }: RedirectsTableProps) {
  const [data, setData] = useState<RedirectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRedirects() {
      try {
        setLoading(true);
        const response = await fetch(`/api/site-audit/scans/${scanId}/redirects`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to fetch redirects');
          return;
        }

        setData(result.data);
      } catch (err) {
        setError('Failed to fetch redirect data');
      } finally {
        setLoading(false);
      }
    }

    fetchRedirects();
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
            No redirect pages found.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Redirect Pages
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>Total: {data.total} redirects</span>
          <span className="text-muted-foreground">|</span>
          {Object.entries(data.byStatusCode).map(([code, count]) => (
            <Badge key={code} variant="outline" className="gap-1">
              {code}: {count}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Source URL</TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.redirects.map((redirect) => (
                <TableRow key={redirect.id}>
                  <TableCell>
                    <Badge className={getStatusCodeColor(redirect.statusCode)}>
                      {getStatusCodeLabel(redirect.statusCode)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[300px]">
                    <span className="truncate block" title={redirect.url}>
                      {redirect.url}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[300px]">
                    {redirect.redirectLocation ? (
                      <span className="truncate block" title={redirect.redirectLocation}>
                        {redirect.redirectLocation}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">(unknown)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={redirect.url} target="_blank" rel="noopener noreferrer">
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
