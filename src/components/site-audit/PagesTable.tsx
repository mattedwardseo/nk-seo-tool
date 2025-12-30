'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';

interface PageItem {
  id: string;
  url: string;
  statusCode: number;
  onpageScore: number | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  issueTypes: string[];
  issueCount: number;
}

interface PagesTableProps {
  pages: PageItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  onPageChange: (offset: number) => void;
  onRowClick?: (pageId: string) => void;
  isLoading?: boolean;
}

function getStatusCodeVariant(
  code: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 200 && code < 300) return 'outline';
  if (code >= 300 && code < 400) return 'secondary';
  if (code >= 400 && code < 500) return 'destructive';
  if (code >= 500) return 'destructive';
  return 'secondary';
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function truncateUrl(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength - 20);
  const end = url.substring(url.length - 15);
  return `${start}...${end}`;
}

function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function PagesTable({
  pages,
  total,
  limit,
  offset,
  hasMore,
  onPageChange,
  onRowClick,
  isLoading = false,
}: PagesTableProps): React.ReactElement {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handlePrevPage = (): void => {
    if (offset > 0) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = (): void => {
    if (hasMore) {
      onPageChange(offset + limit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">URL</TableHead>
              <TableHead className="w-[15%]">Meta Description</TableHead>
              <TableHead className="w-[15%]">H1</TableHead>
              <TableHead className="w-[60px] text-center">Status</TableHead>
              <TableHead className="w-[60px] text-center">Score</TableHead>
              <TableHead className="w-[60px] text-center">Issues</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    Loading pages...
                  </div>
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No pages found
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow
                  key={page.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(page.id)}
                >
                  <TableCell className="font-mono text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="truncate" title={page.url}>
                        {truncateUrl(page.url)}
                      </span>
                      {page.title && (
                        <span className="text-muted-foreground truncate" title={page.title}>
                          {page.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className="text-muted-foreground truncate block max-w-[200px]"
                      title={page.metaDescription || undefined}
                    >
                      {truncateText(page.metaDescription, 60)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className="text-muted-foreground truncate block max-w-[200px]"
                      title={page.h1 || undefined}
                    >
                      {truncateText(page.h1, 40)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusCodeVariant(page.statusCode)}>
                      {page.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${getScoreColor(page.onpageScore)}`}>
                      {page.onpageScore?.toFixed(0) ?? 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {page.issueCount > 0 ? (
                      <div className="flex items-center justify-center gap-1 text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        {page.issueCount}
                      </div>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} pages
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={offset === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
