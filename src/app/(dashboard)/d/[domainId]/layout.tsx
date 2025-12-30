'use client';

/**
 * Domain-scoped layout
 * Validates domain ownership and provides domain context to all child routes
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDomain } from '@/contexts/DomainContext';
import { Skeleton } from '@/components/ui/skeleton';

interface DomainLayoutProps {
  children: React.ReactNode;
}

export default function DomainLayout({
  children,
}: DomainLayoutProps): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { domains, isLoading, selectDomain, selectedDomain } = useDomain();
  const domainId = params.domainId as string;

  // Select domain based on URL when domains are loaded
  React.useEffect(() => {
    if (isLoading || !domainId) return;

    // Find the domain in the user's domains list
    const domain = domains.find((d) => d.id === domainId);

    if (!domain) {
      // Domain not found or user doesn't have access - redirect to home
      router.push('/');
      return;
    }

    // Select this domain if not already selected
    if (!selectedDomain || selectedDomain.id !== domainId) {
      selectDomain(domainId);
    }
  }, [domainId, domains, isLoading, selectDomain, selectedDomain, router]);

  // Show loading state while checking domain access
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Check if domain exists in user's domains
  const domain = domains.find((d) => d.id === domainId);
  if (!domain) {
    // Will redirect in useEffect, show loading in meantime
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
}
