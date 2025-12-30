'use client'

import { CheckCircle, XCircle, AlertTriangle, Link as LinkIcon, ImageIcon, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SEO_THRESHOLDS } from '@/lib/constants/seo-thresholds'
import type { OnPageMeta } from '@/types/audit'

interface MetaTagsSectionProps {
  meta: OnPageMeta | undefined
}

interface MetaFieldProps {
  label: string
  value: string | null | undefined
  length?: number
  thresholds?: { min: number; max: number }
  icon?: React.ReactNode
}

function MetaField({ label, value, length, thresholds, icon }: MetaFieldProps): React.ReactElement {
  let status: 'good' | 'warning' | 'missing' = 'good'
  let statusText = ''

  if (!value) {
    status = 'missing'
    statusText = 'Missing'
  } else if (length !== undefined && thresholds) {
    if (length < thresholds.min) {
      status = 'warning'
      statusText = `Too short (${length}/${thresholds.min})`
    } else if (length > thresholds.max) {
      status = 'warning'
      statusText = `Too long (${length}/${thresholds.max})`
    } else {
      statusText = `${length} chars`
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {status === 'missing' && <XCircle className="h-4 w-4 text-red-500" />}
          {statusText && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                status === 'good' && 'border-green-500 text-green-600',
                status === 'warning' && 'border-yellow-500 text-yellow-600',
                status === 'missing' && 'border-red-500 text-red-600'
              )}
            >
              {statusText}
            </Badge>
          )}
        </div>
      </div>
      <div
        className={cn(
          'p-3 rounded-md text-sm',
          status === 'missing' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 italic' : 'bg-muted'
        )}
      >
        {value || 'Not defined'}
      </div>
    </div>
  )
}

function SimpleField({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null | undefined
  icon?: React.ReactNode
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium">
        {value || <span className="text-muted-foreground italic">Not set</span>}
      </span>
    </div>
  )
}

export function MetaTagsSection({ meta }: MetaTagsSectionProps): React.ReactElement {
  if (!meta) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meta Tags</CardTitle>
          <CardDescription>No meta tag data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const titleThresholds = SEO_THRESHOLDS.title
  const descThresholds = SEO_THRESHOLDS.description

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meta Tags</CardTitle>
        <CardDescription>Page title, description, and other meta information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <MetaField
          label="Page Title"
          value={meta.title || meta.metaTitle}
          length={meta.titleLength}
          thresholds={{ min: titleThresholds.minLength, max: titleThresholds.maxLength }}
        />

        {/* Description */}
        <MetaField
          label="Meta Description"
          value={meta.description}
          length={meta.descriptionLength}
          thresholds={{ min: descThresholds.minLength, max: descThresholds.maxLength }}
        />

        {/* Other Meta Fields */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Additional Meta</h4>
          <div className="space-y-0">
            <SimpleField
              label="Canonical URL"
              value={meta.canonical}
              icon={<LinkIcon className="h-4 w-4 text-muted-foreground" />}
            />
            <SimpleField
              label="Favicon"
              value={meta.favicon ? 'Present' : null}
              icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
            />
            <SimpleField
              label="Generator"
              value={meta.generator}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            />
            {meta.metaKeywords && (
              <SimpleField label="Meta Keywords" value={meta.metaKeywords} />
            )}
          </div>
        </div>

        {/* Resource Counts */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Resource Counts</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{meta.internalLinksCount}</div>
              <div className="text-xs text-muted-foreground">Internal Links</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{meta.externalLinksCount}</div>
              <div className="text-xs text-muted-foreground">External Links</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{meta.imagesCount}</div>
              <div className="text-xs text-muted-foreground">Images</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{meta.scriptsCount}</div>
              <div className="text-xs text-muted-foreground">Scripts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MetaTagsSection
