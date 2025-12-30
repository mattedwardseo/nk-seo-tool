'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanCard, type ScanCardData } from '@/components/site-audit';
import { Plus, Globe, Loader2 } from 'lucide-react';
import { useDomain } from '@/contexts/DomainContext';

export default function SiteAuditPage(): React.ReactElement {
  const params = useParams();
  const domainId = params.domainId as string;
  const { selectedDomain } = useDomain();
  const [scans, setScans] = useState<ScanCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

  const fetchScans = useCallback(async (): Promise<void> => {
    if (!domainId) {
      setIsLoading(false);
      return;
    }

    try {
      const urlParams = new URLSearchParams({
        domainId: domainId,
      });
      const response = await fetch(`/api/site-audit?${urlParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load scans');
      }

      setScans(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleDelete = async (scanId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this scan?')) return;

    try {
      const response = await fetch(`/api/site-audit/scans/${scanId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      // Refresh list
      fetchScans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete scan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Site Audit
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Full website crawl and technical SEO analysis
          </p>
        </div>
        <Link href={domainUrl('/site-audit/new')}>
          <Button className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && scans.length === 0 && !error && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No site audits yet</h3>
          <p className="mt-2 text-muted-foreground">
            Start your first site audit to analyze technical SEO issues across your website.
          </p>
          <Link href={domainUrl('/site-audit/new')}>
            <Button className="mt-4 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Start Your First Scan
            </Button>
          </Link>
        </div>
      )}

      {/* Scans Grid */}
      {!isLoading && scans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onDelete={handleDelete}
              basePath={domainUrl('/site-audit')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
