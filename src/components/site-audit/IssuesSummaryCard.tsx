'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface IssuesSummaryCardProps {
  errorsCount: number;
  warningsCount: number;
  noticesCount: number;
  issueTypes?: Record<string, number>;
}

export function IssuesSummaryCard({
  errorsCount,
  warningsCount,
  noticesCount,
  issueTypes,
}: IssuesSummaryCardProps): React.ReactElement {
  // Sort issue types by count
  const sortedIssues = issueTypes
    ? Object.entries(issueTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Issue Counts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-red-500/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Errors</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{errorsCount}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-500/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-600 font-medium">Warnings</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{warningsCount}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-500/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Notices</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{noticesCount}</p>
          </div>
        </div>

        {/* Top Issues */}
        {sortedIssues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top Issues by Count
            </h4>
            <div className="space-y-2">
              {sortedIssues.map(([issue, count]) => (
                <div
                  key={issue}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm truncate max-w-[200px]" title={issue}>
                    {formatIssueLabel(issue)}
                  </span>
                  <Badge variant="secondary">{count} pages</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Format snake_case issue labels to readable text
 */
function formatIssueLabel(issue: string): string {
  return issue
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
