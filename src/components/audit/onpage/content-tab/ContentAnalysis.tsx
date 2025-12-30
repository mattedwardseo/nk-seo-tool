'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { OnPageContent, OnPageMeta } from '@/types/audit'

interface ContentAnalysisProps {
  content: OnPageContent | undefined
  meta: OnPageMeta | undefined
}

interface MetricCardProps {
  label: string
  value: number | null | undefined
  unit?: string
  description?: string
  status?: 'good' | 'moderate' | 'poor'
}

function MetricCard({ label, value, unit, description, status }: MetricCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        status === 'good' && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        status === 'moderate' && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
        status === 'poor' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        !status && 'bg-muted/50'
      )}
    >
      <div className="text-2xl font-bold">
        {value !== null && value !== undefined ? (
          <>
            {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </div>
  )
}

interface ReadabilityScoreProps {
  label: string
  value: number | null | undefined
  description: string
}

function ReadabilityScore({ label, value, description }: ReadabilityScoreProps): React.ReactElement {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <span className="text-muted-foreground">N/A</span>
      </div>
    )
  }

  // Most readability indices are grade levels (lower = easier to read)
  const thresholds = SEO_THRESHOLDS.readability
  let status: 'good' | 'moderate' | 'poor' = 'good'
  let statusLabel = 'Easy'

  if (value <= thresholds.easy) {
    status = 'good'
    statusLabel = 'Easy'
  } else if (value <= thresholds.moderate) {
    status = 'moderate'
    statusLabel = 'Moderate'
  } else if (value <= thresholds.difficult) {
    status = 'moderate'
    statusLabel = 'Difficult'
  } else {
    status = 'poor'
    statusLabel = 'Very Difficult'
  }

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{value.toFixed(1)}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            status === 'good' && 'border-green-500 text-green-600',
            status === 'moderate' && 'border-yellow-500 text-yellow-600',
            status === 'poor' && 'border-red-500 text-red-600'
          )}
        >
          {statusLabel}
        </Badge>
      </div>
    </div>
  )
}

interface ConsistencyScoreProps {
  label: string
  value: number | null | undefined
}

function ConsistencyScore({ label, value }: ConsistencyScoreProps): React.ReactElement {
  if (value === null || value === undefined) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">N/A</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    )
  }

  const percentage = Math.round(value * 100)
  const status = percentage >= 70 ? 'good' : percentage >= 40 ? 'moderate' : 'poor'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span
          className={cn(
            'font-medium',
            status === 'good' && 'text-green-600',
            status === 'moderate' && 'text-yellow-600',
            status === 'poor' && 'text-red-600'
          )}
        >
          {percentage}%
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          'h-2',
          status === 'good' && '[&>div]:bg-green-500',
          status === 'moderate' && '[&>div]:bg-yellow-500',
          status === 'poor' && '[&>div]:bg-red-500'
        )}
      />
    </div>
  )
}

export function ContentAnalysis({ content, meta }: ContentAnalysisProps): React.ReactElement {
  if (!content) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Content Analysis</CardTitle>
              <CardDescription>Word count, readability, and content metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No content analysis data available</p>
        </CardContent>
      </Card>
    )
  }

  const thresholds = SEO_THRESHOLDS.content
  const wordCountStatus =
    content.plainTextWordCount >= thresholds.minWordCount
      ? content.plainTextWordCount <= thresholds.maxWordCount
        ? 'good'
        : 'moderate'
      : 'poor'
  const textRatioStatus =
    content.plainTextRate >= thresholds.minTextToHtmlRatio
      ? content.plainTextRate <= thresholds.maxTextToHtmlRatio
        ? 'good'
        : 'moderate'
      : 'poor'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Content Analysis</CardTitle>
            <CardDescription>Word count, readability, and content metrics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Word Count"
            value={content.plainTextWordCount}
            description={`Min: ${thresholds.minWordCount}`}
            status={wordCountStatus}
          />
          <MetricCard
            label="Text Size"
            value={Math.round(content.plainTextSize / 1024)}
            unit="KB"
            description="Plain text content"
          />
          <MetricCard
            label="Text Ratio"
            value={Math.round(content.plainTextRate * 100)}
            unit="%"
            description={`Min: ${thresholds.minTextToHtmlRatio * 100}%`}
            status={textRatioStatus}
          />
          <MetricCard
            label="Images"
            value={meta?.imagesCount || 0}
            description="Total images"
          />
        </div>

        {/* Readability Indices */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Readability Indices</h4>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 space-y-0">
            <ReadabilityScore
              label="Flesch-Kincaid"
              value={content.fleschKincaidReadabilityIndex}
              description="Grade level (lower is easier)"
            />
            <ReadabilityScore
              label="Coleman-Liau"
              value={content.colemanLiauReadabilityIndex}
              description="Grade level estimate"
            />
            <ReadabilityScore
              label="Dale-Chall"
              value={content.daleChallReadabilityIndex}
              description="Vocabulary difficulty"
            />
            <ReadabilityScore
              label="SMOG"
              value={content.smogReadabilityIndex}
              description="Years of education needed"
            />
            <ReadabilityScore
              label="Automated Readability"
              value={content.automatedReadabilityIndex}
              description="Character-based grade level"
            />
          </div>
        </div>

        {/* Consistency Scores */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Content Consistency</h4>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <ConsistencyScore label="Title to Content" value={content.titleToContentConsistency} />
            <ConsistencyScore label="Description to Content" value={content.descriptionToContentConsistency} />
            {content.metaKeywordsToContentConsistency !== null && (
              <ConsistencyScore
                label="Keywords to Content"
                value={content.metaKeywordsToContentConsistency}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ContentAnalysis
