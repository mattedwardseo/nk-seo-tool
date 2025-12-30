'use client';

/**
 * Landing Page - Domain Grid
 * Shows all user's domains when no domain is selected
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDomain, type Domain } from '@/contexts/DomainContext';
import { DomainListCard } from '@/components/domains/DomainListCard';
import { EmptyToolState } from '@/components/domains/EmptyToolState';

interface ToolCounts {
  audits: number;
  siteScans: number;
  localCampaigns: number;
  seoCalculations: number;
  trackedKeywords: number;
  keywordTrackingRuns: number;
}

interface DomainWithCounts extends Domain {
  toolCounts?: ToolCounts | null;
}

export default function LandingPage(): React.ReactElement {
  const { status: sessionStatus } = useSession();
  const { domains, isLoading: domainsLoading, refreshDomains } = useDomain();

  const [domainsWithCounts, setDomainsWithCounts] = useState<DomainWithCounts[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Fetch tool counts for each domain
  useEffect(() => {
    async function fetchAllToolCounts(): Promise<void> {
      if (!domains.length) {
        setDomainsWithCounts([]);
        return;
      }

      setLoadingCounts(true);

      try {
        const countsPromises = domains.map(async (domain) => {
          try {
            const response = await fetch(`/api/domains/${domain.id}/tool-counts`);
            const data = await response.json();
            return {
              ...domain,
              toolCounts: data.success ? data.data : null,
            };
          } catch {
            return { ...domain, toolCounts: null };
          }
        });

        const results = await Promise.all(countsPromises);
        setDomainsWithCounts(results);
      } finally {
        setLoadingCounts(false);
      }
    }

    fetchAllToolCounts();
  }, [domains]);

  // Handle archive
  const handleArchive = async (domainId: string): Promise<void> => {
    if (!confirm('Are you sure you want to archive this domain?')) {
      return;
    }

    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshDomains();
      }
    } catch (error) {
      console.error('Error archiving domain:', error);
    }
  };

  // Loading state
  if (sessionStatus === 'loading' || domainsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no domains
  if (!domains.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground text-sm">
            Create your first SEO project to get started
          </p>
        </div>
        <EmptyToolState
          title="No Projects Yet"
          description="Create a new SEO project to start tracking your website's performance across all tools."
          icon={Globe}
          actionLabel="Create First Project"
          actionHref="/domains/new"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground text-sm">
            {domains.length} project{domains.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild>
          <a href="/domains/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </a>
        </Button>
      </div>

      {/* Domain Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingCounts ? (
          // Show domains without counts while loading
          domains.map((domain) => (
            <DomainListCard
              key={domain.id}
              id={domain.id}
              name={domain.name}
              domain={domain.domain}
              businessName={domain.businessName}
              city={domain.city}
              state={domain.state}
              status={domain.status}
              updatedAt={domain.updatedAt}
              toolCounts={null}
              onArchive={handleArchive}
            />
          ))
        ) : (
          domainsWithCounts.map((domain) => (
            <DomainListCard
              key={domain.id}
              id={domain.id}
              name={domain.name}
              domain={domain.domain}
              businessName={domain.businessName}
              city={domain.city}
              state={domain.state}
              status={domain.status}
              updatedAt={domain.updatedAt}
              toolCounts={domain.toolCounts}
              onArchive={handleArchive}
            />
          ))
        )}
      </div>
    </div>
  );
}
