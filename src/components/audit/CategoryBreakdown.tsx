'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type OnPageStepResult,
  type SerpStepResult,
  type BacklinksStepResult,
  type BusinessStepResult,
} from '@/types/audit'
import { formatNumber, formatPercent } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricRowProps {
  label: string
  value: string | number | boolean | null
  type?: 'text' | 'number' | 'boolean' | 'percent'
  good?: boolean | null
}

function MetricRow({ label, value, type = 'text', good }: MetricRowProps): React.ReactElement {
  const displayValue = React.useMemo(() => {
    if (value === null || value === undefined) return '--'
    if (type === 'boolean') {
      return value ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      )
    }
    if (type === 'number' && typeof value === 'number') return formatNumber(value)
    if (type === 'percent' && typeof value === 'number') return formatPercent(value)
    return String(value)
  }, [value, type])

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={cn(
          'font-medium',
          good === true && 'text-green-600 dark:text-green-400',
          good === false && 'text-red-600 dark:text-red-400'
        )}
      >
        {displayValue}
      </span>
    </div>
  )
}

interface CategoryBreakdownProps {
  onPage: OnPageStepResult | null
  serp: SerpStepResult | null
  backlinks: BacklinksStepResult | null
  business: BusinessStepResult | null
}

export function CategoryBreakdown({
  onPage,
  serp,
  backlinks,
  business,
}: CategoryBreakdownProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Breakdown</CardTitle>
        <CardDescription>Metrics from each analysis step</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="technical" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="technical" className="cursor-pointer">
              Technical
            </TabsTrigger>
            <TabsTrigger value="content" className="cursor-pointer">
              Content
            </TabsTrigger>
            <TabsTrigger value="local" className="cursor-pointer">
              Local
            </TabsTrigger>
            <TabsTrigger value="backlinks" className="cursor-pointer">
              Backlinks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technical" className="mt-4">
            {onPage ? (
              <div className="divide-y">
                <MetricRow label="Pages Analyzed" value={onPage.pagesAnalyzed} type="number" />
                <MetricRow
                  label="Issues Found"
                  value={onPage.issuesFound}
                  type="number"
                  good={onPage.issuesFound < 5}
                />
                <MetricRow
                  label="Page Speed Score"
                  value={onPage.pageSpeed}
                  type="number"
                  good={onPage.pageSpeed >= 80}
                />
                <MetricRow
                  label="Mobile Score"
                  value={onPage.mobileScore}
                  type="number"
                  good={onPage.mobileScore >= 80}
                />
                <MetricRow label="HTTPS Enabled" value={onPage.httpsEnabled} type="boolean" />
                <MetricRow label="Schema Markup" value={onPage.hasSchema} type="boolean" />
                <MetricRow
                  label="Broken Links"
                  value={onPage.brokenLinks}
                  type="number"
                  good={onPage.brokenLinks === 0}
                />
                <MetricRow
                  label="Missing Alt Tags"
                  value={onPage.missingAltTags}
                  type="number"
                  good={onPage.missingAltTags === 0}
                />
                <MetricRow
                  label="Missing Meta Descriptions"
                  value={onPage.missingMetaDescriptions}
                  type="number"
                  good={onPage.missingMetaDescriptions === 0}
                />
              </div>
            ) : (
              <NoData />
            )}
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            {serp ? (
              <div className="divide-y">
                <MetricRow label="Featured Snippets" value={serp.featuredSnippets} type="number" />
                <MetricRow
                  label="Local Pack Presence"
                  value={serp.localPackPresence}
                  type="boolean"
                />
                <MetricRow
                  label="Total ETV"
                  value={serp.totalEtv ? `$${serp.totalEtv.toLocaleString()}` : null}
                  type="text"
                />
                <MetricRow
                  label="Traffic Cost"
                  value={serp.totalTrafficCost ? `$${serp.totalTrafficCost.toLocaleString()}` : null}
                  type="text"
                />
              </div>
            ) : (
              <NoData />
            )}
          </TabsContent>

          <TabsContent value="local" className="mt-4">
            {business ? (
              <div className="divide-y">
                <MetricRow
                  label="Google Business Profile"
                  value={business.hasGmbListing}
                  type="boolean"
                />
                <MetricRow
                  label="GMB Rating"
                  value={business.gmbRating !== null ? `${business.gmbRating}/5` : null}
                  good={business.gmbRating !== null && business.gmbRating >= 4}
                />
                <MetricRow
                  label="Review Count"
                  value={business.reviewCount}
                  type="number"
                  good={business.reviewCount >= 10}
                />
                <MetricRow label="NAP Consistent" value={business.napConsistent} type="boolean" />
                <MetricRow label="Categories Set" value={business.categoriesSet} type="boolean" />
                <MetricRow
                  label="Photos Count"
                  value={business.photosCount}
                  type="number"
                  good={business.photosCount >= 5}
                />
                <MetricRow label="Recent Posts" value={business.postsRecent} type="boolean" />
              </div>
            ) : (
              <NoData />
            )}
          </TabsContent>

          <TabsContent value="backlinks" className="mt-4">
            {backlinks ? (
              <div className="divide-y">
                <MetricRow label="Total Backlinks" value={backlinks.totalBacklinks} type="number" />
                <MetricRow
                  label="Referring Domains"
                  value={backlinks.referringDomains}
                  type="number"
                  good={backlinks.referringDomains >= 50}
                />
                <MetricRow
                  label="Domain Rank"
                  value={`${backlinks.domainRank}/1000`}
                  good={backlinks.domainRank >= 300}
                />
                <MetricRow
                  label="Spam Score"
                  value={backlinks.spamScore}
                  type="number"
                  good={backlinks.spamScore < 30}
                />
                <MetricRow
                  label="Dofollow Ratio"
                  value={backlinks.dofollowRatio * 100}
                  type="percent"
                  good={backlinks.dofollowRatio >= 0.5}
                />
              </div>
            ) : (
              <NoData />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function NoData(): React.ReactElement {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
      <AlertCircle className="h-4 w-4" />
      <span>No data available for this category</span>
    </div>
  )
}
