'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  BookOpen,
  Globe,
  Zap,
  Info,
  Share2,
} from 'lucide-react'
import type { OnPageStepResult, LighthouseAudit } from '@/types/audit'
import { cn } from '@/lib/utils'

interface OnPageFullReportProps {
  data: OnPageStepResult
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{icon}</span>
                <CardTitle className="text-base">{title}</CardTitle>
                {badge}
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Data Table Component - core display pattern
function DataTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null)

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No data available</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left font-medium text-muted-foreground py-2 w-1/3">Field</th>
          <th className="text-left font-medium text-muted-foreground py-2">Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b last:border-0">
            <td className="py-2 font-mono text-xs text-muted-foreground align-top">
              {formatFieldName(key)}
            </td>
            <td className="py-2">{formatValue(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Check Status Badge
function CheckBadge({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
        passed
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  )
}

// Format field name from camelCase to readable
function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Format value for display
function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">N/A</span>
  }

  if (typeof value === 'boolean') {
    return value ? (
      <Badge variant="default" className="bg-green-600">
        Yes
      </Badge>
    ) : (
      <Badge variant="secondary">No</Badge>
    )
  }

  if (typeof value === 'number') {
    // Format large numbers
    if (value > 1000000) {
      return `${(value / 1000000).toFixed(2)}MB`
    }
    if (value > 1000) {
      return value.toLocaleString()
    }
    // Format decimals
    if (!Number.isInteger(value)) {
      return value.toFixed(4)
    }
    return value.toString()
  }

  if (typeof value === 'string') {
    if (value.length > 200) {
      return <span className="break-all text-xs">{value}</span>
    }
    return <span className="break-all">{value}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">Empty</span>
    }
    return (
      <ul className="list-disc list-inside text-xs space-y-0.5">
        {value.slice(0, 10).map((item, i) => (
          <li key={i} className="truncate">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
        {value.length > 10 && (
          <li className="text-muted-foreground italic">+{value.length - 10} more</li>
        )}
      </ul>
    )
  }

  if (typeof value === 'object') {
    return (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return String(value)
}

// Format bytes helper
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Format milliseconds helper
function formatMs(ms: number | null): string {
  if (ms === null) return 'N/A'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Page Overview Section
function PageOverviewSection({ data }: { data: OnPageStepResult }) {
  const pageInfo = data.pageInfo

  const overviewData = {
    onpageScore: data.onpageScore,
    resourceType: pageInfo?.resourceType,
    statusCode: pageInfo?.statusCode,
    url: pageInfo?.url,
    location: pageInfo?.location,
    acceptType: pageInfo?.acceptType,
    clickDepth: pageInfo?.clickDepth,
    isResource: pageInfo?.isResource,
    httpsEnabled: data.httpsEnabled,
    httpsVerified: data.httpsVerified,
    httpsVerificationMismatch: data.httpsVerificationMismatch,
    lastModifiedHeader: pageInfo?.lastModified?.header,
    lastModifiedSitemap: pageInfo?.lastModified?.sitemap,
    lastModifiedMetaTag: pageInfo?.lastModified?.metaTag,
  }

  return <DataTable data={overviewData} />
}

// Lighthouse Section
function LighthouseSection({ data }: { data: OnPageStepResult }) {
  const lighthouse = data.lighthouse

  if (!lighthouse) {
    return <p className="text-muted-foreground text-sm italic">No Lighthouse data available</p>
  }

  return (
    <div className="space-y-6">
      {/* Lighthouse Meta */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Lighthouse Info</h4>
        <DataTable
          data={{
            version: lighthouse.version,
            fetchTime: lighthouse.fetchTime,
            userAgent: lighthouse.userAgent,
            networkUserAgent: lighthouse.environment?.networkUserAgent,
            hostUserAgent: lighthouse.environment?.hostUserAgent,
            benchmarkIndex: lighthouse.environment?.benchmarkIndex,
          }}
        />
      </div>

      {/* Category Scores */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Category Scores</h4>
        <div className="grid grid-cols-3 gap-4">
          {lighthouse.categories.performance && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {lighthouse.categories.performance.score !== null
                  ? Math.round(lighthouse.categories.performance.score * 100)
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lighthouse.categories.performance.title}
              </p>
            </div>
          )}
          {lighthouse.categories.seo && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {lighthouse.categories.seo.score !== null
                  ? Math.round(lighthouse.categories.seo.score * 100)
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lighthouse.categories.seo.title}
              </p>
            </div>
          )}
          {lighthouse.categories.accessibility && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {lighthouse.categories.accessibility.score !== null
                  ? Math.round(lighthouse.categories.accessibility.score * 100)
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lighthouse.categories.accessibility.title}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Individual Audits */}
      {lighthouse.audits.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-sm">
            Individual Audits ({lighthouse.audits.length})
          </h4>
          <div className="max-h-96 overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Audit</th>
                  <th className="text-left p-2 w-20">Score</th>
                  <th className="text-left p-2 w-24">Value</th>
                </tr>
              </thead>
              <tbody>
                {lighthouse.audits.map((audit: LighthouseAudit) => (
                  <tr key={audit.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{audit.title}</p>
                      <p className="text-muted-foreground truncate max-w-md">
                        {audit.description?.replace(/\[.*?\]\(.*?\)/g, '').slice(0, 100)}
                      </p>
                    </td>
                    <td className="p-2">
                      {audit.score !== null ? (
                        <Badge
                          variant={
                            audit.score >= 0.9
                              ? 'default'
                              : audit.score >= 0.5
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={cn(
                            audit.score >= 0.9 && 'bg-green-600',
                            audit.score >= 0.5 && audit.score < 0.9 && 'bg-yellow-600'
                          )}
                        >
                          {Math.round(audit.score * 100)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {audit.displayValue || (audit.numericValue !== undefined ? `${audit.numericValue}${audit.numericUnit || ''}` : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Meta Section
function MetaSection({ data }: { data: OnPageStepResult }) {
  const meta = data.meta

  if (!meta) {
    return <p className="text-muted-foreground text-sm italic">No meta data available</p>
  }

  return (
    <div className="space-y-6">
      {/* Basic Meta */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Basic Meta Tags</h4>
        <DataTable
          data={{
            title: meta.title,
            titleLength: meta.titleLength,
            metaTitle: meta.metaTitle,
            description: meta.description,
            descriptionLength: meta.descriptionLength,
            canonical: meta.canonical,
            metaKeywords: meta.metaKeywords,
            generator: meta.generator,
            charset: meta.charset,
            favicon: meta.favicon,
            follow: meta.follow,
          }}
        />
      </div>

      {/* Heading Structure */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Heading Structure</h4>
        <DataTable
          data={{
            h1Tags: meta.htags.h1,
            h2Tags: meta.htags.h2,
            h3Tags: meta.htags.h3,
            h4Tags: meta.htags.h4,
            h5Tags: meta.htags.h5,
            h6Tags: meta.htags.h6,
          }}
        />
      </div>

      {/* Links & Resources */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Links & Resources</h4>
        <DataTable
          data={{
            internalLinksCount: meta.internalLinksCount,
            externalLinksCount: meta.externalLinksCount,
            inboundLinksCount: meta.inboundLinksCount,
            imagesCount: meta.imagesCount,
            imagesSize: meta.imagesSize ? formatBytes(meta.imagesSize) : null,
            scriptsCount: meta.scriptsCount,
            scriptsSize: meta.scriptsSize ? formatBytes(meta.scriptsSize) : null,
            stylesheetsCount: meta.stylesheetsCount,
            stylesheetsSize: meta.stylesheetsSize ? formatBytes(meta.stylesheetsSize) : null,
            renderBlockingScriptsCount: meta.renderBlockingScriptsCount,
            renderBlockingStylesheetsCount: meta.renderBlockingStylesheetsCount,
          }}
        />
      </div>

      {/* Social Media Tags */}
      {meta.socialMediaTags && Object.keys(meta.socialMediaTags).length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-sm">Social Media Tags (Open Graph, Twitter, etc.)</h4>
          <DataTable data={meta.socialMediaTags as Record<string, unknown>} />
        </div>
      )}

      {/* Deprecated/Duplicate Tags */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Tag Issues</h4>
        <DataTable
          data={{
            deprecatedTags: meta.deprecatedTags,
            duplicateMetaTags: meta.duplicateMetaTags,
            cumulativeLayoutShift: meta.cumulativeLayoutShift,
          }}
        />
      </div>

      {/* Spell Check */}
      {meta.spell && (
        <div>
          <h4 className="font-medium mb-2 text-sm">Spell Check</h4>
          <DataTable
            data={{
              hunspellLanguage: meta.spell.hunspellLanguage,
              misspelledWords: meta.spell.misspelledWords,
            }}
          />
        </div>
      )}
    </div>
  )
}

// Content Section
function ContentSection({ data }: { data: OnPageStepResult }) {
  const content = data.content

  if (!content) {
    return <p className="text-muted-foreground text-sm italic">No content data available</p>
  }

  return (
    <div className="space-y-6">
      {/* Text Stats */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Text Statistics</h4>
        <DataTable
          data={{
            plainTextWordCount: content.plainTextWordCount,
            plainTextSize: formatBytes(content.plainTextSize),
            plainTextRate: content.plainTextRate
              ? `${(content.plainTextRate * 100).toFixed(2)}%`
              : null,
          }}
        />
      </div>

      {/* Readability Indices */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Readability Indices</h4>
        <DataTable
          data={{
            fleschKincaidReadabilityIndex: content.fleschKincaidReadabilityIndex,
            colemanLiauReadabilityIndex: content.colemanLiauReadabilityIndex,
            daleChallReadabilityIndex: content.daleChallReadabilityIndex,
            smogReadabilityIndex: content.smogReadabilityIndex,
            automatedReadabilityIndex: content.automatedReadabilityIndex,
          }}
        />
      </div>

      {/* Consistency Scores */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Content Consistency</h4>
        <DataTable
          data={{
            titleToContentConsistency: content.titleToContentConsistency
              ? `${(content.titleToContentConsistency * 100).toFixed(1)}%`
              : null,
            descriptionToContentConsistency: content.descriptionToContentConsistency
              ? `${(content.descriptionToContentConsistency * 100).toFixed(1)}%`
              : null,
            metaKeywordsToContentConsistency: content.metaKeywordsToContentConsistency
              ? `${(content.metaKeywordsToContentConsistency * 100).toFixed(1)}%`
              : null,
          }}
        />
      </div>
    </div>
  )
}

// Timing Section
function TimingSection({ data }: { data: OnPageStepResult }) {
  const timing = data.timing

  if (!timing) {
    return <p className="text-muted-foreground text-sm italic">No timing data available</p>
  }

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Core Web Vitals</h4>
        <DataTable
          data={{
            largestContentfulPaint: formatMs(timing.largestContentfulPaint),
            firstInputDelay: formatMs(timing.firstInputDelay),
            timeToInteractive: formatMs(timing.timeToInteractive),
            domComplete: formatMs(timing.domComplete),
          }}
        />
      </div>

      {/* Connection Timing */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Connection Timing</h4>
        <DataTable
          data={{
            connectionTime: formatMs(timing.connectionTime),
            timeToSecureConnection: formatMs(timing.timeToSecureConnection),
            requestSentTime: formatMs(timing.requestSentTime),
            waitingTime: formatMs(timing.waitingTime),
          }}
        />
      </div>

      {/* Download Timing */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Download Timing</h4>
        <DataTable
          data={{
            downloadTime: formatMs(timing.downloadTime),
            durationTime: formatMs(timing.durationTime),
            fetchStart: formatMs(timing.fetchStart),
            fetchEnd: formatMs(timing.fetchEnd),
          }}
        />
      </div>
    </div>
  )
}

// Checks Section
function ChecksSection({ data }: { data: OnPageStepResult }) {
  const checks = data.checks

  if (!checks) {
    return <p className="text-muted-foreground text-sm italic">No checks data available</p>
  }

  // Group checks by category
  const checkGroups = {
    'URL & Protocol': {
      isHttps: checks.isHttps,
      isHttp: checks.isHttp,
      isWww: checks.isWww,
      isBroken: checks.isBroken,
      isRedirect: checks.isRedirect,
      is4xxCode: checks.is4xxCode,
      is5xxCode: checks.is5xxCode,
      seoFriendlyUrl: checks.seoFriendlyUrl,
      seoFriendlyUrlCharactersCheck: checks.seoFriendlyUrlCharactersCheck,
      seoFriendlyUrlDynamicCheck: checks.seoFriendlyUrlDynamicCheck,
      seoFriendlyUrlKeywordsCheck: checks.seoFriendlyUrlKeywordsCheck,
      seoFriendlyUrlRelativeLengthCheck: checks.seoFriendlyUrlRelativeLengthCheck,
    },
    'HTML Structure': {
      hasHtmlDoctype: checks.hasHtmlDoctype,
      noDoctype: checks.noDoctype,
      frame: checks.frame,
      flash: checks.flash,
      deprecatedHtmlTags: checks.deprecatedHtmlTags,
      hasRenderBlockingResources: checks.hasRenderBlockingResources,
      hasMetaRefreshRedirect: checks.hasMetaRefreshRedirect,
      duplicateMetaTags: checks.duplicateMetaTags,
      duplicateTitleTag: checks.duplicateTitleTag,
    },
    'Meta & Canonical': {
      canonical: checks.canonical,
      noEncodingMetaTag: checks.noEncodingMetaTag,
      metaCharsetConsistency: checks.metaCharsetConsistency,
      hasMicromarkup: checks.hasMicromarkup,
      hasMicromarkupErrors: checks.hasMicromarkupErrors,
    },
    'Title': {
      titleTooShort: checks.titleTooShort,
      titleTooLong: checks.titleTooLong,
      noTitle: checks.noTitle,
      hasMetaTitle: checks.hasMetaTitle,
      duplicateTitle: checks.duplicateTitle,
      irrelevantTitle: checks.irrelevantTitle,
    },
    'Description': {
      noDescription: checks.noDescription,
      irrelevantDescription: checks.irrelevantDescription,
      duplicateDescription: checks.duplicateDescription,
    },
    'Content': {
      lowContentRate: checks.lowContentRate,
      highContentRate: checks.highContentRate,
      lowCharacterCount: checks.lowCharacterCount,
      highCharacterCount: checks.highCharacterCount,
      lowReadabilityRate: checks.lowReadabilityRate,
      duplicateContent: checks.duplicateContent,
      loremIpsum: checks.loremIpsum,
      hasMisspelling: checks.hasMisspelling,
      noH1Tag: checks.noH1Tag,
      irrelevantMetaKeywords: checks.irrelevantMetaKeywords,
    },
    'Images': {
      noImageAlt: checks.noImageAlt,
      noImageTitle: checks.noImageTitle,
    },
    'Performance': {
      highLoadingTime: checks.highLoadingTime,
      highWaitingTime: checks.highWaitingTime,
      noContentEncoding: checks.noContentEncoding,
    },
    'Page Size': {
      smallPageSize: checks.smallPageSize,
      largePageSize: checks.largePageSize,
      sizeGreaterThan3mb: checks.sizeGreaterThan3mb,
    },
    'Security & Resources': {
      httpsToHttpLinks: checks.httpsToHttpLinks,
      brokenResources: checks.brokenResources,
      brokenLinks: checks.brokenLinks,
      noFavicon: checks.noFavicon,
    },
  }

  return (
    <div className="space-y-6">
      {Object.entries(checkGroups).map(([groupName, groupChecks]) => (
        <div key={groupName}>
          <h4 className="font-medium mb-2 text-sm">{groupName}</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(groupChecks).map(([checkName, value]) => {
              // Determine if this check passing is good or bad
              const isNegativeCheck = checkName.startsWith('no') ||
                checkName.startsWith('is4') ||
                checkName.startsWith('is5') ||
                checkName.includes('TooShort') ||
                checkName.includes('TooLong') ||
                checkName.includes('broken') ||
                checkName.includes('Broken') ||
                checkName.includes('duplicate') ||
                checkName.includes('Duplicate') ||
                checkName.includes('irrelevant') ||
                checkName.includes('Irrelevant') ||
                checkName.includes('high') ||
                checkName.includes('High') ||
                checkName.includes('low') ||
                checkName.includes('Low') ||
                checkName.includes('lorem') ||
                checkName.includes('Error') ||
                checkName === 'frame' ||
                checkName === 'flash' ||
                checkName === 'isBroken' ||
                checkName === 'isHttp' ||
                checkName === 'isRedirect'

              const passed = isNegativeCheck ? !value : value

              return (
                <CheckBadge
                  key={checkName}
                  passed={passed}
                  label={formatFieldName(checkName)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Resources Section
function ResourcesSection({ data }: { data: OnPageStepResult }) {
  const resources = data.resources

  if (!resources) {
    return <p className="text-muted-foreground text-sm italic">No resources data available</p>
  }

  return (
    <div className="space-y-6">
      {/* Size Stats */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Size Statistics</h4>
        <DataTable
          data={{
            totalDomSize: formatBytes(resources.totalDomSize),
            size: formatBytes(resources.size),
            encodedSize: formatBytes(resources.encodedSize),
            totalTransferSize: formatBytes(resources.totalTransferSize),
            compressionRatio:
              resources.size > 0
                ? `${((1 - resources.encodedSize / resources.size) * 100).toFixed(1)}%`
                : null,
          }}
        />
      </div>

      {/* Server Info */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Server & URL Info</h4>
        <DataTable
          data={{
            server: resources.server,
            contentEncoding: resources.contentEncoding,
            mediaType: resources.mediaType,
            urlLength: resources.urlLength,
            relativeUrlLength: resources.relativeUrlLength,
            fetchTime: resources.fetchTime,
          }}
        />
      </div>

      {/* Cache Control */}
      {resources.cacheControl && (
        <div>
          <h4 className="font-medium mb-2 text-sm">Cache Control</h4>
          <DataTable
            data={{
              cachable: resources.cacheControl.cachable,
              ttl: resources.cacheControl.ttl
                ? `${resources.cacheControl.ttl}s`
                : null,
            }}
          />
        </div>
      )}

      {/* Warnings */}
      {resources.warnings.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Warnings ({resources.warnings.length})
          </h4>
          <div className="space-y-2">
            {resources.warnings.map((warning, i) => (
              <div
                key={i}
                className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md text-sm"
              >
                <p>{warning.message}</p>
                <p className="text-xs text-muted-foreground">
                  Line {warning.line}, Column {warning.column} (Code: {warning.statusCode})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Main Component
export function OnPageFullReport({ data }: OnPageFullReportProps) {
  const warningsCount = data.resources?.warnings.length ?? 0
  const auditsCount = data.lighthouse?.audits.length ?? 0

  return (
    <div className="space-y-3">
      {/* Page Overview */}
      <CollapsibleSection
        title="Page Overview"
        icon={<Globe className="h-4 w-4" />}
        defaultOpen={true}
        badge={
          data.onpageScore !== undefined ? (
            <Badge variant="outline" className="ml-2">
              Score: {data.onpageScore.toFixed(1)}
            </Badge>
          ) : undefined
        }
      >
        <PageOverviewSection data={data} />
      </CollapsibleSection>

      {/* Lighthouse */}
      <CollapsibleSection
        title="Lighthouse Results"
        icon={<Zap className="h-4 w-4" />}
        defaultOpen={true}
        badge={
          auditsCount > 0 ? (
            <Badge variant="outline" className="ml-2">
              {auditsCount} audits
            </Badge>
          ) : undefined
        }
      >
        <LighthouseSection data={data} />
      </CollapsibleSection>

      {/* Meta & Structure */}
      <CollapsibleSection
        title="Meta & Structure"
        icon={<FileText className="h-4 w-4" />}
        badge={
          data.meta?.title ? (
            <Badge variant="outline" className="ml-2">
              {data.meta.titleLength} chars
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-2">
              Missing Title
            </Badge>
          )
        }
      >
        <MetaSection data={data} />
      </CollapsibleSection>

      {/* Social Media Tags - separate section if exists */}
      {data.meta?.socialMediaTags && Object.keys(data.meta.socialMediaTags).length > 0 && (
        <CollapsibleSection
          title="Social Media Tags"
          icon={<Share2 className="h-4 w-4" />}
          badge={
            <Badge variant="outline" className="ml-2">
              {Object.keys(data.meta.socialMediaTags).length} tags
            </Badge>
          }
        >
          <DataTable data={data.meta.socialMediaTags as Record<string, unknown>} />
        </CollapsibleSection>
      )}

      {/* Content Analysis */}
      <CollapsibleSection
        title="Content Analysis"
        icon={<BookOpen className="h-4 w-4" />}
        badge={
          data.content?.plainTextWordCount ? (
            <Badge variant="outline" className="ml-2">
              {data.content.plainTextWordCount.toLocaleString()} words
            </Badge>
          ) : undefined
        }
      >
        <ContentSection data={data} />
      </CollapsibleSection>

      {/* Page Timing */}
      <CollapsibleSection
        title="Page Timing"
        icon={<Clock className="h-4 w-4" />}
        badge={
          data.timing?.domComplete ? (
            <Badge
              variant={data.timing.domComplete < 2500 ? 'default' : 'secondary'}
              className="ml-2"
            >
              {formatMs(data.timing.domComplete)}
            </Badge>
          ) : undefined
        }
      >
        <TimingSection data={data} />
      </CollapsibleSection>

      {/* SEO Checks */}
      <CollapsibleSection
        title="SEO Checks"
        icon={<CheckCircle className="h-4 w-4" />}
        badge={<Badge variant="outline" className="ml-2">All Checks</Badge>}
      >
        <ChecksSection data={data} />
      </CollapsibleSection>

      {/* Resources */}
      <CollapsibleSection
        title="Resources & Warnings"
        icon={<Server className="h-4 w-4" />}
        badge={
          warningsCount > 0 ? (
            <Badge variant="secondary" className="ml-2">
              {warningsCount} warnings
            </Badge>
          ) : undefined
        }
      >
        <ResourcesSection data={data} />
      </CollapsibleSection>

      {/* Raw Data Debug - for development */}
      <CollapsibleSection
        title="Raw Data (Debug)"
        icon={<Info className="h-4 w-4" />}
      >
        <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleSection>
    </div>
  )
}

export default OnPageFullReport
