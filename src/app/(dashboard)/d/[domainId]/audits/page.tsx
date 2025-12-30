'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditTable, AuditFilters, type AuditRow } from '@/components/audit';
import { type AuditStatusType } from '@/types/audit';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useDomain } from '@/contexts/DomainContext';

interface AuditListResponse {
  success: boolean;
  data: AuditRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditsPage(): React.ReactElement {
  const { data: session } = useSession();
  const params = useParams();
  const domainId = params.domainId as string;
  const { selectedDomain } = useDomain();

  const [audits, setAudits] = React.useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<AuditStatusType | 'ALL'>(
    'ALL'
  );

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

  const fetchAudits = React.useCallback(async (): Promise<void> => {
    if (!session?.user?.id || !domainId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const urlParams = new URLSearchParams({
        userId: session.user.id,
        domainId: domainId,
        limit: '100',
      });

      if (statusFilter !== 'ALL') {
        urlParams.set('status', statusFilter);
      }

      const response = await fetch(`/api/audits?${urlParams.toString()}`);
      const data: AuditListResponse = await response.json();

      if (data.success) {
        setAudits(data.data);
      } else {
        toast.error('Failed to load projects');
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, session?.user?.id, domainId]);

  React.useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/audits/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project deleted');
        fetchAudits();
      } else {
        toast.error('Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleRetry = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/audits/${id}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Project retry started');
        fetchAudits();
      } else {
        toast.error('Failed to retry project');
      }
    } catch {
      toast.error('Failed to retry project');
    }
  };

  // Filter audits by search term (client-side)
  const filteredAudits = React.useMemo(() => {
    if (!search) return audits;
    const searchLower = search.toLowerCase();
    return audits.filter((audit) =>
      audit.domain.toLowerCase().includes(searchLower)
    );
  }, [audits, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SEO Audits</h1>
          <p className="text-muted-foreground text-sm">
            {selectedDomain?.name || 'Loading...'} - View and manage SEO audits
          </p>
        </div>
        <Button asChild className="cursor-pointer">
          <Link href={domainUrl('/audits/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Audit
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardContent className="pt-6">
          <AuditTable
            data={filteredAudits}
            onDelete={handleDelete}
            onRetry={handleRetry}
            isLoading={isLoading}
            basePath={domainUrl('/audits')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
