'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Copy, RefreshCw, EyeOff } from 'lucide-react';
import { DuplicatesTable } from './DuplicatesTable';
import { RedirectsTable } from './RedirectsTable';
import { NonIndexableTable } from './NonIndexableTable';
import { IssuesSummaryCard } from '../IssuesSummaryCard';

interface IssueExplorerTabsProps {
  scanId: string;
  summary: {
    errorsCount: number;
    warningsCount: number;
    noticesCount: number;
    duplicateTitle: number;
    duplicateDescription: number;
    duplicateContent: number;
    nonIndexable: number;
  };
}

export function IssueExplorerTabs({ scanId, summary }: IssueExplorerTabsProps) {
  const totalDuplicates = summary.duplicateTitle + summary.duplicateDescription;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="hidden sm:inline">All Issues</span>
          <Badge variant="secondary" className="ml-1">
            {summary.errorsCount + summary.warningsCount + summary.noticesCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="duplicates" className="gap-2">
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Duplicates</span>
          {totalDuplicates > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalDuplicates}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="redirects" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Redirects</span>
        </TabsTrigger>
        <TabsTrigger value="non-indexable" className="gap-2">
          <EyeOff className="h-4 w-4" />
          <span className="hidden sm:inline">Non-Indexable</span>
          {summary.nonIndexable > 0 && (
            <Badge variant="secondary" className="ml-1">
              {summary.nonIndexable}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <IssuesSummaryCard
          errorsCount={summary.errorsCount}
          warningsCount={summary.warningsCount}
          noticesCount={summary.noticesCount}
        />
      </TabsContent>

      <TabsContent value="duplicates">
        <DuplicatesTable scanId={scanId} />
      </TabsContent>

      <TabsContent value="redirects">
        <RedirectsTable scanId={scanId} />
      </TabsContent>

      <TabsContent value="non-indexable">
        <NonIndexableTable scanId={scanId} />
      </TabsContent>
    </Tabs>
  );
}
