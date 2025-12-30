/**
 * OnPage Component Types
 *
 * Local type definitions for the OnPage SEO display components.
 */

import type { OnPageChecks } from '@/types/audit'
import type { IssueSeverity } from '@/lib/constants/seo-thresholds'

/**
 * Issue definition with metadata for display
 */
export interface IssueDefinition {
  /** The check key from OnPageChecks */
  check: keyof OnPageChecks
  /** Severity level: error, warning, or notice */
  severity: IssueSeverity
  /** Human-readable title for the issue */
  title: string
  /** Whether this check fails when true (negative) or false (positive) */
  failsWhenTrue: boolean
  // Future guidance fields (placeholder for now)
  description?: string
  guidance?: string
  dentalContext?: string
}

/**
 * Categorized issues result
 */
export interface CategorizedIssues {
  errors: IssueDefinition[]
  warnings: IssueDefinition[]
  notices: IssueDefinition[]
  passed: IssueDefinition[]
}

/**
 * Issue counts for summary display
 */
export interface IssueCounts {
  errors: number
  warnings: number
  notices: number
  passed: number
  total: number
}

/**
 * Thematic report card data
 */
export interface ThematicReport {
  id: string
  title: string
  score: number // 0-100
  status: 'good' | 'moderate' | 'poor'
  details?: string
}

/**
 * All thematic reports for the grid
 */
export interface ThematicReports {
  crawlability: ThematicReport
  https: ThematicReport
  coreWebVitals: ThematicReport
  performance: ThematicReport
  internalLinking: ThematicReport
  markup: ThematicReport
}

/**
 * Core Web Vital status
 */
export type CwvStatus = 'good' | 'needs-improvement' | 'poor'

/**
 * Individual Core Web Vital metric display data
 */
export interface CwvMetric {
  label: string
  shortLabel: string
  value: number | null
  unit: string
  status: CwvStatus
  threshold: {
    good: number
    moderate: number
  }
}

/**
 * Heading structure for tree display
 */
export interface HeadingNode {
  level: number // 1-6
  text: string
  children?: HeadingNode[]
}

/**
 * Social media tag for display
 */
export interface SocialTag {
  key: string
  value: string
  type: 'og' | 'twitter' | 'other'
}

/**
 * Meta tag display data
 */
export interface MetaTagDisplay {
  title: {
    value: string | null
    length: number
    status: 'good' | 'too-short' | 'too-long' | 'missing'
  }
  description: {
    value: string | null
    length: number
    status: 'good' | 'too-short' | 'too-long' | 'missing'
  }
  canonical: string | null
  favicon: string | null
  generator: string | null
  metaKeywords: string | null
}

/**
 * Lighthouse audit display data
 */
export interface LighthouseAuditDisplay {
  id: string
  title: string
  description: string
  score: number | null // 0-1
  displayValue?: string
  status: 'pass' | 'fail' | 'warning' | 'manual' | 'informative'
}

/**
 * Lighthouse category score
 */
export interface LighthouseCategoryScore {
  id: string
  title: string
  score: number | null // 0-100 after conversion
  status: 'good' | 'moderate' | 'poor'
}

/**
 * Resource size display data
 */
export interface ResourceSizeDisplay {
  label: string
  bytes: number
  formatted: string
  status?: 'good' | 'warning' | 'error'
}

/**
 * Page timing metric display
 */
export interface TimingMetric {
  label: string
  value: number | null
  unit: 'ms' | 's'
  formatted: string
  status: 'good' | 'moderate' | 'poor' | 'unknown'
}
