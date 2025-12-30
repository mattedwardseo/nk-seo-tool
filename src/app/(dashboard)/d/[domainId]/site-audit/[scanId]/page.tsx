'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ScanProgress,
  ScanOverview,
  IssueExplorerTabs,
  PagesTable,
  PageFilters,
  PageDetailDrawer,
  type PageFilterState,
} from '@/components/site-audit';
import { ArrowLeft, Globe, Loader2, FileText, AlertTriangle, Download } from 'lucide-react';
import { useDomain } from '@/contexts/DomainContext';

interface ScanData {
  id: string;
  domain: string;
  status: 'PENDING' | 'SUBMITTING' | 'CRAWLING' | 'FETCHING_RESULTS' | 'COMPLETED' | 'FAILED';
  progress: number;
  taskId: string | null;
  maxCrawlPages: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  summary?: {
    totalPages: number;
    crawledPages: number;
    crawlStopReason: string | null;
    errorsCount: number;
    warningsCount: number;
    noticesCount: number;
    onpageScore: number | null;
    avgLcp: number | null;
    avgCls: number | null;
    totalImages: number;
    brokenResources: number;
    internalLinks: number;
    externalLinks: number;
    brokenLinks: number;
    nonIndexable: number;
    duplicateTitle: number;
    duplicateDescription: number;
  } | null;
}

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

interface PagesResponse {
  pages: PageItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface PageDetail {
  id: string;
  url: string;
  statusCode: number;
  onpageScore: number | null;
  title: string | null;
  description: string | null;
  h1Tags: string[];
  wordCount: number | null;
  pageTiming: Record<string, unknown> | null;
  checks: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  issueTypes: string[];
  issueCount: number;
}

export default function ScanDetailPage(): React.ReactElement {
  const params = useParams();
  const domainId = params.domainId as string;
  const scanId = params.scanId as string;
  const { selectedDomain } = useDomain();

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

  const [scan, setScan] = useState<ScanData | null>(null);
  const [pages, setPages] = useState<PagesResponse | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PageFilterState>({
    filter: 'all',
    sortBy: 'issueCount',
    sortOrder: 'desc',
  });
  const [offset, setOffset] = useState(0);

  const isComplete = scan?.status === 'COMPLETED';
  const isInProgress = scan && !['COMPLETED', 'FAILED'].includes(scan.status);

  const fetchScan = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/site-audit/scans/${scanId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load scan');
      }

      setScan(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scan');
    } finally {
      setIsLoading(false);
    }
  }, [scanId]);

  const fetchPages = useCallback(async (): Promise<void> => {
    setIsPagesLoading(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset.toString(),
        limit: '50',
        filter: filters.filter,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/site-audit/scans/${scanId}/pages?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load pages');
      }

      setPages(data.data);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setIsPagesLoading(false);
    }
  }, [scanId, filters, offset]);

  useEffect(() => {
    fetchScan();
  }, [fetchScan]);

  useEffect(() => {
    if (isComplete) {
      fetchPages();
    }
  }, [isComplete, fetchPages]);

  const handleComplete = (): void => {
    fetchScan();
  };

  const handleFilterChange = (newFilters: PageFilterState): void => {
    setFilters(newFilters);
    setOffset(0); // Reset to first page
  };

  const handlePageChange = (newOffset: number): void => {
    setOffset(newOffset);
  };

  const handleRowClick = async (pageId: string): Promise<void> => {
    setIsDrawerOpen(true);
    setSelectedPage(null); // Clear previous, show loading

    try {
      const response = await fetch(`/api/site-audit/scans/${scanId}/pages/${pageId}`);
      const result = await response.json();

      if (!result.success) {
        console.error('Failed to fetch page details:', result.error);
        return;
      }

      setSelectedPage(result.data);
    } catch (err) {
      console.error('Failed to fetch page details:', err);
    }
  };

  const handleExport = async (): Promise<void> => {
    try {
      window.location.href = `/api/site-audit/scans/${scanId}/export`;
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/site-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Site Audit</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={domainUrl('/site-audit')}>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Scan not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/site-audit')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            {scan.domain}
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Site Audit Results
          </p>
        </div>
      </div>

      {/* Progress (when in progress) */}
      {isInProgress && (
        <ScanProgress scanId={scanId} onComplete={handleComplete} />
      )}

      {/* Completed State */}
      {isComplete && scan.summary && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages ({scan.summary.crawledPages})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ScanOverview summary={scan.summary} domain={scan.domain} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <IssueExplorerTabs
              scanId={scanId}
              summary={{
                errorsCount: scan.summary.errorsCount,
                warningsCount: scan.summary.warningsCount,
                noticesCount: scan.summary.noticesCount,
                duplicateTitle: scan.summary.duplicateTitle,
                duplicateDescription: scan.summary.duplicateDescription,
                duplicateContent: 0,
                nonIndexable: scan.summary.nonIndexable,
              }}
            />
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            {pages && (
              <>
                <div className="flex items-center justify-between">
                  <PageFilters
                    filters={filters}
                    onChange={handleFilterChange}
                    totalPages={pages.pagination.total}
                  />
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <PagesTable
                  pages={pages.pages}
                  total={pages.pagination.total}
                  limit={pages.pagination.limit}
                  offset={pages.pagination.offset}
                  hasMore={pages.pagination.hasMore}
                  onPageChange={handlePageChange}
                  onRowClick={handleRowClick}
                  isLoading={isPagesLoading}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Page Detail Drawer */}
      <PageDetailDrawer
        page={selectedPage}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
