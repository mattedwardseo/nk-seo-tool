'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Check,
  X,
  AlertCircle,
  Building2,
  Phone,
  Globe,
  MapPin,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Star,
  Tag,
  FileText,
  Calendar,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type GBPFieldStatus = 'complete' | 'incomplete' | 'partial' | 'missing'

export interface GBPField {
  /** Field identifier */
  id: string
  /** Display name */
  name: string
  /** Field status */
  status: GBPFieldStatus
  /** Current value (if any) */
  value?: string | number
  /** Recommendation if incomplete */
  recommendation?: string
  /** Importance level */
  importance: 'critical' | 'important' | 'optional'
}

export interface GBPCompletenessData {
  /** Business name */
  businessName?: string
  /** Overall completeness percentage */
  completeness: number
  /** Individual field statuses */
  fields: GBPField[]
  /** GMB verification status */
  isVerified: boolean
  /** Profile URL */
  profileUrl?: string
}

export interface GBPCompletenessProps {
  /** GBP completeness data */
  data: GBPCompletenessData
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Show all fields or just incomplete */
  showAllFields?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const FIELD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  name: Building2,
  phone: Phone,
  website: Globe,
  address: MapPin,
  hours: Clock,
  photos: ImageIcon,
  description: FileText,
  categories: Tag,
  reviews: Star,
  posts: Calendar,
  attributes: MessageSquare,
}

const STATUS_CONFIG: Record<
  GBPFieldStatus,
  { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  complete: { color: 'text-green-600', bgColor: 'bg-green-500', icon: Check },
  partial: { color: 'text-yellow-600', bgColor: 'bg-yellow-500', icon: AlertCircle },
  incomplete: { color: 'text-orange-600', bgColor: 'bg-orange-500', icon: AlertCircle },
  missing: { color: 'text-red-600', bgColor: 'bg-red-500', icon: X },
}

const IMPORTANCE_CONFIG: Record<
  GBPField['importance'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  critical: { label: 'Critical', variant: 'default' },
  important: { label: 'Important', variant: 'secondary' },
  optional: { label: 'Optional', variant: 'outline' },
}

// ============================================================================
// Sub-components
// ============================================================================

interface FieldStatusIconProps {
  status: GBPFieldStatus
  className?: string
}

function FieldStatusIcon({ status, className }: FieldStatusIconProps): React.ReactElement {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return <Icon className={cn('h-4 w-4', config.color, className)} />
}

interface GBPFieldItemProps {
  field: GBPField
}

function GBPFieldItem({ field }: GBPFieldItemProps): React.ReactElement {
  const FieldIcon = FIELD_ICONS[field.id] || FileText
  const importanceConfig = IMPORTANCE_CONFIG[field.importance]

  return (
    <div className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors">
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          field.status === 'complete' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
        )}
      >
        <FieldIcon
          className={cn(
            'h-4 w-4',
            field.status === 'complete'
              ? 'text-green-600 dark:text-green-400'
              : 'text-muted-foreground'
          )}
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{field.name}</span>
            <FieldStatusIcon status={field.status} />
          </div>
          <Badge variant={importanceConfig.variant} className="text-xs">
            {importanceConfig.label}
          </Badge>
        </div>

        {field.value && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">{String(field.value)}</p>
        )}

        {field.status !== 'complete' && field.recommendation && (
          <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
            {field.recommendation}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GBPCompleteness - Google Business Profile completeness meter
 *
 * Shows how complete a business's GBP listing is with field-by-field breakdown.
 *
 * @example
 * ```tsx
 * <GBPCompleteness
 *   data={{
 *     completeness: 75,
 *     isVerified: true,
 *     fields: [
 *       { id: 'name', name: 'Business Name', status: 'complete', importance: 'critical' },
 *       ...
 *     ]
 *   }}
 * />
 * ```
 */
export function GBPCompleteness({
  data,
  title = 'Google Business Profile',
  description = 'Profile completeness and optimization status',
  className,
  showAllFields = false,
}: GBPCompletenessProps): React.ReactElement {
  // Filter fields to show
  const displayFields = showAllFields
    ? data.fields
    : data.fields.filter((f) => f.status !== 'complete')

  // Calculate stats
  const completeCount = data.fields.filter((f) => f.status === 'complete').length
  const criticalMissing = data.fields.filter(
    (f) => f.importance === 'critical' && f.status !== 'complete'
  ).length

  // Determine overall status
  let statusColor = 'text-green-600'
  let statusLabel = 'Excellent'
  if (data.completeness < 50) {
    statusColor = 'text-red-600'
    statusLabel = 'Needs Work'
  } else if (data.completeness < 75) {
    statusColor = 'text-orange-600'
    statusLabel = 'Fair'
  } else if (data.completeness < 90) {
    statusColor = 'text-yellow-600'
    statusLabel = 'Good'
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data.isVerified ? (
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="h-3 w-3" />
                Not Verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Completeness Meter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Profile Completeness</span>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold', statusColor)}>
                {Math.round(data.completeness)}%
              </span>
              <span className={cn('text-sm', statusColor)}>{statusLabel}</span>
            </div>
          </div>
          <Progress value={data.completeness} className="h-3" />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              {completeCount} of {data.fields.length} fields complete
            </span>
            {criticalMissing > 0 && (
              <span className="text-red-600">
                {criticalMissing} critical {criticalMissing === 1 ? 'field' : 'fields'} missing
              </span>
            )}
          </div>
        </div>

        {/* Business Name */}
        {data.businessName && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-sm">Business Name</p>
            <p className="font-medium">{data.businessName}</p>
          </div>
        )}

        {/* Fields List */}
        {displayFields.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {showAllFields ? 'All Fields' : 'Fields Needing Attention'}
              </h4>
              <Badge variant="outline" className="text-xs">
                {displayFields.length} items
              </Badge>
            </div>
            <div className="space-y-2">
              {displayFields.map((field) => (
                <GBPFieldItem key={field.id} field={field} />
              ))}
            </div>
          </div>
        )}

        {/* All Complete Message */}
        {displayFields.length === 0 && !showAllFields && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-3 font-medium text-green-600 dark:text-green-400">
              All Fields Complete!
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your Google Business Profile is fully optimized.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Compact Summary
// ============================================================================

export interface GBPSummaryProps {
  completeness: number
  isVerified: boolean
  criticalMissing: number
  className?: string
}

/**
 * Compact GBP summary for overview displays
 */
export function GBPSummary({
  completeness,
  isVerified,
  criticalMissing,
  className,
}: GBPSummaryProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Google Business Profile</span>
        {isVerified ? (
          <Badge variant="default" className="h-5 gap-1 text-xs">
            <Check className="h-3 w-3" />
            Verified
          </Badge>
        ) : (
          <Badge variant="destructive" className="h-5 text-xs">
            Not Verified
          </Badge>
        )}
      </div>
      <Progress value={completeness} className="h-2" />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{Math.round(completeness)}% complete</span>
        {criticalMissing > 0 && (
          <span className="text-red-600">{criticalMissing} critical missing</span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface GBPCompletenessSkeletonProps {
  className?: string
}

export function GBPCompletenessSkeleton({
  className,
}: GBPCompletenessSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-6 w-20 animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-8 w-16 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-3 w-full animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted h-16 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default GBPCompleteness
