'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { OnPageStepResult } from '@/types/audit'
import { categorizeIssues, getIssueCounts } from '../issue-classification'
import { calculateAllThematicReports } from '../thematic-reports'
import { ThematicReportGrid } from './ThematicReportGrid'
import { IssuesSummary } from './IssuesSummary'
import { IssueRow } from './IssueRow'

interface TechnicalIssuesTabProps {
  data: OnPageStepResult
}

export function TechnicalIssuesTab({ data }: TechnicalIssuesTabProps): React.ReactElement {
  const [issueFilter, setIssueFilter] = useState<'all' | 'errors' | 'warnings' | 'notices' | 'passed'>('all')

  // Calculate thematic reports
  const thematicReports = calculateAllThematicReports(data)

  // Categorize issues
  const categorizedIssues = categorizeIssues(data.checks)
  const issueCounts = getIssueCounts(categorizedIssues)

  // Filter issues based on selection
  const getFilteredIssues = () => {
    switch (issueFilter) {
      case 'errors':
        return categorizedIssues.errors
      case 'warnings':
        return categorizedIssues.warnings
      case 'notices':
        return categorizedIssues.notices
      case 'passed':
        return categorizedIssues.passed
      default:
        return [...categorizedIssues.errors, ...categorizedIssues.warnings, ...categorizedIssues.notices]
    }
  }

  const filteredIssues = getFilteredIssues()

  return (
    <div className="space-y-6">
      {/* Thematic Report Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Technical Health Overview</h3>
        <ThematicReportGrid reports={thematicReports} />
      </div>

      {/* Issues Summary */}
      <IssuesSummary counts={issueCounts} />

      {/* Issues List with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Technical Issues</CardTitle>
            <Badge variant="outline">{issueCounts.total} total issues</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter tabs */}
          <Tabs value={issueFilter} onValueChange={(v) => setIssueFilter(v as typeof issueFilter)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="gap-1">
                All
                <Badge variant="secondary" className="ml-1">
                  {issueCounts.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-1">
                <AlertCircle className="h-3 w-3 text-red-500" />
                Errors
                <Badge variant="secondary" className="ml-1">
                  {issueCounts.errors}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="warnings" className="gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Warnings
                <Badge variant="secondary" className="ml-1">
                  {issueCounts.warnings}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="notices" className="gap-1">
                <Info className="h-3 w-3 text-blue-500" />
                Notices
                <Badge variant="secondary" className="ml-1">
                  {issueCounts.notices}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="passed" className="gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Passed
                <Badge variant="secondary" className="ml-1">
                  {issueCounts.passed}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={issueFilter} className="mt-0">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {issueFilter === 'all' ? (
                    <p>No issues detected. Great job!</p>
                  ) : issueFilter === 'passed' ? (
                    <p>No checks have passed yet.</p>
                  ) : (
                    <p>No {issueFilter} found.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredIssues.map((issue) => (
                    <IssueRow
                      key={issue.check}
                      issue={issue}
                      isFailing={issueFilter !== 'passed'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Context */}
      {data.checks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">HTTPS</div>
                <div className="text-muted-foreground">
                  {data.checks.isHttps ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Not enabled</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Schema Markup</div>
                <div className="text-muted-foreground">
                  {data.checks.hasMicromarkup ? (
                    <span className="text-green-600">Present</span>
                  ) : (
                    <span className="text-yellow-600">Not found</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Canonical</div>
                <div className="text-muted-foreground">
                  {data.checks.canonical ? (
                    <span className="text-green-600">Set</span>
                  ) : (
                    <span className="text-yellow-600">Not set</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">WWW</div>
                <div className="text-muted-foreground">
                  {data.checks.isWww ? 'Uses WWW' : 'Non-WWW'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TechnicalIssuesTab
