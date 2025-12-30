'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScanForm } from '@/components/site-audit';
import { ArrowLeft, Globe } from 'lucide-react';
import { useDomain } from '@/contexts/DomainContext';

export default function NewSiteAuditPage(): React.ReactElement {
  const params = useParams();
  const domainId = params.domainId as string;
  const { selectedDomain } = useDomain();

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

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
            New Site Audit
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Configure and start a full website crawl
          </p>
        </div>
      </div>

      {/* Form */}
      <ScanForm />
    </div>
  );
}
