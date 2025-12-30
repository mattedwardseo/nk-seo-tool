/**
 * SEO Thresholds Configuration
 *
 * Adjustable thresholds for SEO audits. Modify these values
 * when Google algorithm shifts require updated standards.
 *
 * Last updated: 2025-12-06
 */

export const SEO_THRESHOLDS = {
  // Title tag thresholds
  title: {
    minLength: 30, // Characters - below is "too short"
    maxLength: 60, // Characters - above is "too long" (gets truncated in SERPs)
  },

  // Meta description thresholds
  description: {
    minLength: 120, // Characters - below is "too short"
    maxLength: 160, // Characters - above is "too long" (gets truncated in SERPs)
  },

  // Core Web Vitals thresholds (Google's official thresholds)
  coreWebVitals: {
    lcp: { good: 2500, moderate: 4000 }, // ms - Largest Contentful Paint
    fid: { good: 100, moderate: 300 }, // ms - First Input Delay
    cls: { good: 0.1, moderate: 0.25 }, // decimal - Cumulative Layout Shift
    ttfb: { good: 800, moderate: 1800 }, // ms - Time to First Byte
    inp: { good: 200, moderate: 500 }, // ms - Interaction to Next Paint (replacing FID)
  },

  // Content thresholds
  content: {
    minWordCount: 300, // Minimum words for a page to be considered substantive
    maxWordCount: 5000, // Maximum before flagging as potentially too long
    minTextToHtmlRatio: 0.1, // 10% - minimum text content ratio
    maxTextToHtmlRatio: 0.9, // 90% - above this might indicate rendering issues
  },

  // Internal linking thresholds
  links: {
    minInternalLinks: 3, // Minimum internal links per page
    maxExternalRatio: 0.8, // Maximum external-to-total link ratio
  },

  // Page size thresholds
  pageSize: {
    small: 5 * 1024, // 5KB - might indicate thin content
    large: 2 * 1024 * 1024, // 2MB - getting heavy
    max: 3 * 1024 * 1024, // 3MB - too large
  },

  // Performance thresholds
  performance: {
    maxLoadTime: 4000, // ms - above is "slow"
    maxTTFB: 600, // ms - above is "slow server response"
    maxDomComplete: 5000, // ms - DOM should complete within this
    maxTTI: 7000, // ms - Time to Interactive threshold
  },

  // Readability thresholds (Flesch-Kincaid Grade Level)
  readability: {
    easy: 6, // Grade level 6 or below is easy
    moderate: 10, // Grade level 7-10 is moderate
    difficult: 14, // Grade level 11-14 is difficult, above is very difficult
  },
} as const

/**
 * Thematic Score Weights
 *
 * Weights for calculating thematic report card percentages.
 * Each theme's total weights should sum to 100 for easy percentage calculation.
 */
export const THEMATIC_SCORE_WEIGHTS = {
  crawlability: {
    notBroken: 25,
    no4xxCode: 20,
    no5xxCode: 20,
    notRedirect: 10,
    hasCanonical: 15,
    noMetaRefresh: 10,
  },

  https: {
    isHttps: 50,
    noMixedContent: 30,
    httpsVerified: 20,
  },

  coreWebVitals: {
    lcp: 40,
    fid: 30,
    cls: 30,
  },

  performance: {
    noHighLoadTime: 30,
    noHighWaitTime: 20,
    noRenderBlocking: 20,
    hasCompression: 15,
    underSizeLimit: 15,
  },

  internalLinking: {
    noBrokenLinks: 40,
    hasInternalLinks: 30,
    goodExternalRatio: 30,
  },

  markup: {
    hasDoctype: 15,
    noDeprecatedTags: 15,
    noFrames: 10,
    noFlash: 10,
    hasSchema: 25,
    noSchemaErrors: 15,
  },
} as const

/**
 * Issue Severity Levels
 * Defines which checks belong to which severity category.
 * Adjust these arrays to reclassify issues based on changing SEO priorities.
 */
export const ISSUE_SEVERITY_CONFIG = {
  // Errors: Critical issues that block indexing or significantly harm rankings
  errors: [
    'noTitle',
    'noDescription',
    'noH1Tag',
    'isBroken',
    'is4xxCode',
    'is5xxCode',
    'brokenLinks',
    'brokenResources',
    'httpsToHttpLinks',
  ],

  // Warnings: Important issues that affect rankings but don't block indexing
  warnings: [
    'titleTooLong',
    'titleTooShort',
    'duplicateTitle',
    'duplicateDescription',
    'noImageAlt',
    'lowContentRate',
    'highLoadingTime',
    'hasRenderBlockingResources',
    'noFavicon',
    'lowReadabilityRate',
    'isHttp',
    'highWaitingTime',
    'largePageSize',
    'sizeGreaterThan3mb',
    'duplicateContent',
  ],

  // Notices: Minor issues that are nice to fix but have minimal ranking impact
  notices: [
    'noEncodingMetaTag',
    'deprecatedHtmlTags',
    'noImageTitle',
    'irrelevantTitle',
    'irrelevantDescription',
    'hasMisspelling',
    'loremIpsum',
    'frame',
    'flash',
    'noDoctype',
    'smallPageSize',
    'irrelevantMetaKeywords',
    'metaCharsetConsistency',
    'duplicateMetaTags',
    'duplicateTitleTag',
  ],
} as const

/**
 * Type exports for type-safe access
 */
export type SeoThresholds = typeof SEO_THRESHOLDS
export type ThematicScoreWeights = typeof THEMATIC_SCORE_WEIGHTS
export type IssueSeverityConfig = typeof ISSUE_SEVERITY_CONFIG
export type IssueSeverity = 'error' | 'warning' | 'notice'
