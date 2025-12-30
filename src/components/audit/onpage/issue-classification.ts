/**
 * Issue Classification System
 *
 * Categorizes OnPage SEO checks into Errors, Warnings, and Notices.
 * Uses configurable severity from seo-thresholds.ts.
 */

import type { OnPageChecks } from '@/types/audit'
import { ISSUE_SEVERITY_CONFIG } from '@/lib/constants/seo-thresholds'
import type { IssueDefinition, CategorizedIssues, IssueCounts } from './types'

/**
 * Issue definitions with human-readable titles and failure logic.
 * The `failsWhenTrue` property indicates whether the check is a "negative" check
 * (e.g., `noTitle` fails when true, meaning title is missing).
 */
export const ISSUE_DEFINITIONS: Record<keyof OnPageChecks, Omit<IssueDefinition, 'severity'>> = {
  // URL & Protocol checks
  isWww: { check: 'isWww', title: 'Uses WWW Subdomain', failsWhenTrue: false },
  isHttps: { check: 'isHttps', title: 'HTTPS Enabled', failsWhenTrue: false },
  isHttp: { check: 'isHttp', title: 'Using HTTP (Insecure)', failsWhenTrue: true },
  isBroken: { check: 'isBroken', title: 'Page is Broken', failsWhenTrue: true },
  isRedirect: { check: 'isRedirect', title: 'Page is a Redirect', failsWhenTrue: true },
  is4xxCode: { check: 'is4xxCode', title: '4xx Error Code', failsWhenTrue: true },
  is5xxCode: { check: 'is5xxCode', title: '5xx Server Error', failsWhenTrue: true },
  seoFriendlyUrl: { check: 'seoFriendlyUrl', title: 'SEO-Friendly URL', failsWhenTrue: false },
  seoFriendlyUrlCharactersCheck: {
    check: 'seoFriendlyUrlCharactersCheck',
    title: 'URL Characters Valid',
    failsWhenTrue: false,
  },
  seoFriendlyUrlDynamicCheck: {
    check: 'seoFriendlyUrlDynamicCheck',
    title: 'No Dynamic URL Parameters',
    failsWhenTrue: false,
  },
  seoFriendlyUrlKeywordsCheck: {
    check: 'seoFriendlyUrlKeywordsCheck',
    title: 'URL Contains Keywords',
    failsWhenTrue: false,
  },
  seoFriendlyUrlRelativeLengthCheck: {
    check: 'seoFriendlyUrlRelativeLengthCheck',
    title: 'URL Length Acceptable',
    failsWhenTrue: false,
  },

  // HTML Structure checks
  hasHtmlDoctype: { check: 'hasHtmlDoctype', title: 'Has HTML Doctype', failsWhenTrue: false },
  noDoctype: { check: 'noDoctype', title: 'Missing Doctype', failsWhenTrue: true },
  frame: { check: 'frame', title: 'Uses Frames (Deprecated)', failsWhenTrue: true },
  flash: { check: 'flash', title: 'Uses Flash (Deprecated)', failsWhenTrue: true },
  deprecatedHtmlTags: {
    check: 'deprecatedHtmlTags',
    title: 'Uses Deprecated HTML Tags',
    failsWhenTrue: true,
  },
  hasRenderBlockingResources: {
    check: 'hasRenderBlockingResources',
    title: 'Has Render-Blocking Resources',
    failsWhenTrue: true,
  },
  hasMetaRefreshRedirect: {
    check: 'hasMetaRefreshRedirect',
    title: 'Uses Meta Refresh Redirect',
    failsWhenTrue: true,
  },
  duplicateMetaTags: { check: 'duplicateMetaTags', title: 'Duplicate Meta Tags', failsWhenTrue: true },
  duplicateTitleTag: { check: 'duplicateTitleTag', title: 'Duplicate Title Tag', failsWhenTrue: true },

  // Meta checks
  canonical: { check: 'canonical', title: 'Has Canonical Tag', failsWhenTrue: false },
  noEncodingMetaTag: {
    check: 'noEncodingMetaTag',
    title: 'Missing Charset Declaration',
    failsWhenTrue: true,
  },
  metaCharsetConsistency: {
    check: 'metaCharsetConsistency',
    title: 'Charset Consistency',
    failsWhenTrue: false,
  },
  hasMicromarkup: { check: 'hasMicromarkup', title: 'Has Schema Markup', failsWhenTrue: false },
  hasMicromarkupErrors: {
    check: 'hasMicromarkupErrors',
    title: 'Schema Markup Errors',
    failsWhenTrue: true,
  },

  // Title checks
  titleTooShort: { check: 'titleTooShort', title: 'Title Too Short', failsWhenTrue: true },
  titleTooLong: { check: 'titleTooLong', title: 'Title Too Long', failsWhenTrue: true },
  noTitle: { check: 'noTitle', title: 'Missing Page Title', failsWhenTrue: true },
  hasMetaTitle: { check: 'hasMetaTitle', title: 'Has Meta Title', failsWhenTrue: false },
  duplicateTitle: { check: 'duplicateTitle', title: 'Duplicate Title', failsWhenTrue: true },
  irrelevantTitle: { check: 'irrelevantTitle', title: 'Potentially Irrelevant Title', failsWhenTrue: true },

  // Description checks
  noDescription: { check: 'noDescription', title: 'Missing Meta Description', failsWhenTrue: true },
  irrelevantDescription: {
    check: 'irrelevantDescription',
    title: 'Potentially Irrelevant Description',
    failsWhenTrue: true,
  },
  duplicateDescription: {
    check: 'duplicateDescription',
    title: 'Duplicate Description',
    failsWhenTrue: true,
  },

  // Content checks
  lowContentRate: { check: 'lowContentRate', title: 'Low Content Ratio', failsWhenTrue: true },
  highContentRate: { check: 'highContentRate', title: 'Unusually High Content Ratio', failsWhenTrue: true },
  lowCharacterCount: { check: 'lowCharacterCount', title: 'Low Character Count', failsWhenTrue: true },
  highCharacterCount: { check: 'highCharacterCount', title: 'Very High Character Count', failsWhenTrue: true },
  lowReadabilityRate: { check: 'lowReadabilityRate', title: 'Poor Readability', failsWhenTrue: true },
  duplicateContent: { check: 'duplicateContent', title: 'Duplicate Content', failsWhenTrue: true },
  loremIpsum: { check: 'loremIpsum', title: 'Placeholder Text Detected', failsWhenTrue: true },
  hasMisspelling: { check: 'hasMisspelling', title: 'Spelling Errors', failsWhenTrue: true },
  noH1Tag: { check: 'noH1Tag', title: 'Missing H1 Heading', failsWhenTrue: true },
  irrelevantMetaKeywords: {
    check: 'irrelevantMetaKeywords',
    title: 'Irrelevant Meta Keywords',
    failsWhenTrue: true,
  },

  // Image checks
  noImageAlt: { check: 'noImageAlt', title: 'Images Missing Alt Text', failsWhenTrue: true },
  noImageTitle: { check: 'noImageTitle', title: 'Images Missing Title', failsWhenTrue: true },

  // Performance checks
  highLoadingTime: { check: 'highLoadingTime', title: 'Slow Page Load', failsWhenTrue: true },
  highWaitingTime: { check: 'highWaitingTime', title: 'Slow Server Response', failsWhenTrue: true },
  noContentEncoding: { check: 'noContentEncoding', title: 'No Compression', failsWhenTrue: true },

  // Size checks
  smallPageSize: { check: 'smallPageSize', title: 'Very Small Page Size', failsWhenTrue: true },
  largePageSize: { check: 'largePageSize', title: 'Large Page Size', failsWhenTrue: true },
  sizeGreaterThan3mb: { check: 'sizeGreaterThan3mb', title: 'Page Size Exceeds 3MB', failsWhenTrue: true },

  // Security checks
  httpsToHttpLinks: { check: 'httpsToHttpLinks', title: 'Mixed Content (HTTPS/HTTP)', failsWhenTrue: true },

  // Resource checks
  brokenResources: { check: 'brokenResources', title: 'Broken Resources', failsWhenTrue: true },
  brokenLinks: { check: 'brokenLinks', title: 'Broken Links', failsWhenTrue: true },
  noFavicon: { check: 'noFavicon', title: 'Missing Favicon', failsWhenTrue: true },
}

/**
 * Get the severity level for a check from config
 */
function getSeverityForCheck(check: keyof OnPageChecks): 'error' | 'warning' | 'notice' | null {
  const checkStr = check as string
  if ((ISSUE_SEVERITY_CONFIG.errors as readonly string[]).includes(checkStr)) return 'error'
  if ((ISSUE_SEVERITY_CONFIG.warnings as readonly string[]).includes(checkStr)) return 'warning'
  if ((ISSUE_SEVERITY_CONFIG.notices as readonly string[]).includes(checkStr)) return 'notice'
  return null // Not configured - will be treated as passed or ignored
}

/**
 * Determine if a check is failing based on its value and failure logic
 */
function isCheckFailing(definition: Omit<IssueDefinition, 'severity'>, value: boolean): boolean {
  return definition.failsWhenTrue ? value === true : value === false
}

/**
 * Categorize all checks into errors, warnings, notices, and passed
 */
export function categorizeIssues(checks: OnPageChecks | undefined): CategorizedIssues {
  const result: CategorizedIssues = {
    errors: [],
    warnings: [],
    notices: [],
    passed: [],
  }

  if (!checks) return result

  for (const [key, value] of Object.entries(checks)) {
    const checkKey = key as keyof OnPageChecks
    const definition = ISSUE_DEFINITIONS[checkKey]

    if (!definition) continue

    const severity = getSeverityForCheck(checkKey)
    const isFailing = isCheckFailing(definition, value)

    const fullDefinition: IssueDefinition = {
      ...definition,
      severity: severity || 'notice',
    }

    if (isFailing && severity) {
      switch (severity) {
        case 'error':
          result.errors.push(fullDefinition)
          break
        case 'warning':
          result.warnings.push(fullDefinition)
          break
        case 'notice':
          result.notices.push(fullDefinition)
          break
      }
    } else if (!isFailing) {
      result.passed.push(fullDefinition)
    }
  }

  return result
}

/**
 * Get issue counts from categorized issues
 */
export function getIssueCounts(categorized: CategorizedIssues): IssueCounts {
  return {
    errors: categorized.errors.length,
    warnings: categorized.warnings.length,
    notices: categorized.notices.length,
    passed: categorized.passed.length,
    total: categorized.errors.length + categorized.warnings.length + categorized.notices.length,
  }
}

/**
 * Get all issues as a flat list sorted by severity
 */
export function getAllIssues(categorized: CategorizedIssues): IssueDefinition[] {
  return [...categorized.errors, ...categorized.warnings, ...categorized.notices]
}
