'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface PageDetail {
  id: string;
  url: string;
  statusCode: number;
  onpageScore: number | null;
  title: string | null;
  description: string | null;
  h1Tags: string[];
  wordCount: number | null;
  pageTiming: Record<string, unknown> | null;
  checks: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  issueTypes: string[];
  issueCount: number;
  redirectLocation?: string | null;
  isRedirect?: boolean;
}

interface PageDetailDrawerProps {
  page: PageDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function formatMs(ms: number | null): string {
  if (ms === null) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Checks where TRUE means there's a problem (inverted logic)
// Most DataForSEO checks starting with "no_", "is_" (negative), or issue-related are negative
const NEGATIVE_CHECKS = new Set([
  // Missing content
  'no_content_encoding',
  'no_description',
  'no_title',
  'no_h1_tag',
  'no_image_alt',
  'no_image_title',
  'no_favicon',
  // Status issues
  'is_http',
  'is_broken',
  'is_4xx_code',
  'is_5xx_code',
  // Redirect issues
  'is_redirect',
  'has_redirect_chain',
  'has_redirect_loop',
  'too_many_redirects',
  'has_meta_refresh_redirect',
  // Performance issues
  'high_loading_time',
  'high_waiting_time',
  'large_page_size',
  // Structure issues
  'is_orphan_page',
  // URL issues (these fail when TRUE in DataForSEO)
  'seo_friendly_url_characters_check',
  'seo_friendly_url_dynamic_check',
  'seo_friendly_url_keywords_check',
  'seo_friendly_url_relative_length_check',
  // Length issues
  'title_too_long',
  'title_too_short',
  'description_too_long',
  'description_too_short',
  // Content quality issues
  'low_character_count',
  'low_content_rate',
  'low_readability_rate',
  'irrelevant_description',
  'irrelevant_title',
  'irrelevant_meta_keywords',
  // Duplicate issues
  'duplicate_title',
  'duplicate_description',
  'duplicate_content',
  // Technical issues
  'has_render_blocking_resources',
  'has_deprecated_html_tags',
  'has_duplicate_meta_tags',
]);

// Human-readable labels for checks
const CHECK_LABELS: Record<string, string> = {
  no_title: 'Missing Title',
  no_description: 'Missing Description',
  no_h1_tag: 'Missing H1 Tag',
  no_content_encoding: 'No Content Encoding',
  no_image_alt: 'Images Missing Alt',
  no_image_title: 'Images Missing Title',
  no_favicon: 'Missing Favicon',
  is_http: 'Using HTTP (not HTTPS)',
  is_broken: 'Broken Page',
  is_redirect: 'Is a Redirect',
  is_4xx_code: 'Client Error (4xx)',
  is_5xx_code: 'Server Error (5xx)',
  has_redirect_chain: 'Redirect Chain',
  has_redirect_loop: 'Redirect Loop',
  too_many_redirects: 'Too Many Redirects',
  has_meta_refresh_redirect: 'Meta Refresh Redirect',
  high_loading_time: 'Slow Loading Time',
  high_waiting_time: 'High Server Wait',
  large_page_size: 'Large Page Size',
  is_orphan_page: 'Orphan Page',
  canonical: 'Has Canonical Tag',
  title_too_long: 'Title Too Long',
  title_too_short: 'Title Too Short',
  description_too_long: 'Description Too Long',
  description_too_short: 'Description Too Short',
  low_character_count: 'Low Character Count',
  low_content_rate: 'Low Content Rate',
  low_readability_rate: 'Low Readability',
  duplicate_title: 'Duplicate Title',
  duplicate_description: 'Duplicate Description',
  duplicate_content: 'Duplicate Content',
  has_render_blocking_resources: 'Render Blocking Resources',
  has_deprecated_html_tags: 'Deprecated HTML Tags',
  has_duplicate_meta_tags: 'Duplicate Meta Tags',
  has_html_doctype: 'Has HTML Doctype',
};

function getCheckLabel(check: string): string {
  if (CHECK_LABELS[check]) return CHECK_LABELS[check];
  // Fallback: format the check name
  return check
    .replace(/^(is_|has_|no_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Determine if a check is passing (good) based on its value and type
 * For negative checks (no_title, is_broken, etc.), true = problem
 * For positive checks (canonical, etc.), true = good
 */
function isCheckPassing(checkName: string, value: boolean): boolean {
  if (NEGATIVE_CHECKS.has(checkName)) {
    return !value; // For negative checks, false = passing
  }
  return value; // For positive checks, true = passing
}

function CheckItem({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      {passed ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
}

export function PageDetailDrawer({
  page,
  isOpen,
  onClose,
}: PageDetailDrawerProps): React.ReactElement {
  if (!page) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Page Details
            </SheetTitle>
            <Skeleton className="h-4 w-3/4" />
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Categorize checks using proper semantics
  const checks = page.checks as Record<string, boolean> | null;
  const passedChecks: Array<[string, boolean]> = [];
  const failedChecks: Array<[string, boolean]> = [];

  if (checks) {
    for (const [key, value] of Object.entries(checks)) {
      const isPassing = isCheckPassing(key, value);
      if (isPassing) {
        passedChecks.push([key, value]);
      } else {
        failedChecks.push([key, value]);
      }
    }
  }

  // Extract timing metrics
  const timing = page.pageTiming as {
    largest_contentful_paint?: number;
    cumulative_layout_shift?: number;
    time_to_interactive?: number;
    first_contentful_paint?: number;
    dom_complete?: number;
  } | null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page Details
          </SheetTitle>
          <SheetDescription className="truncate" title={page.url}>
            {page.url}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant={page.statusCode >= 400 ? 'destructive' : 'outline'}
                  className="mt-1"
                >
                  {page.statusCode}
                </Badge>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className={`text-xl font-bold ${getScoreColor(page.onpageScore)}`}>
                  {page.onpageScore?.toFixed(0) ?? 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Issues</p>
                <p
                  className={`text-xl font-bold ${
                    page.issueCount > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}
                >
                  {page.issueCount}
                </p>
              </div>
            </div>

            <Separator />

            {/* Meta Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Meta Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">{page.title || 'No title'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="text-xs">{page.description || 'No description'}</p>
                </div>
                {page.h1Tags.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">H1 Tags</p>
                    <ul className="list-disc list-inside">
                      {page.h1Tags.map((h1, i) => (
                        <li key={i} className="text-xs truncate">
                          {h1}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {page.wordCount && (
                  <div>
                    <p className="text-muted-foreground">Word Count</p>
                    <p>{page.wordCount} words</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Redirect Info */}
            {page.isRedirect && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                    <RefreshCw className="h-4 w-4" />
                    Redirect
                  </h4>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                      {page.statusCode}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {page.redirectLocation ? (
                      <a
                        href={page.redirectLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate flex-1"
                        title={page.redirectLocation}
                      >
                        {page.redirectLocation}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">(unknown destination)</span>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Page Timing */}
            {timing && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Page Timing
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">LCP</p>
                      <p className="font-medium">
                        {formatMs(timing.largest_contentful_paint ?? null)}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">CLS</p>
                      <p className="font-medium">
                        {timing.cumulative_layout_shift?.toFixed(3) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">TTI</p>
                      <p className="font-medium">
                        {formatMs(timing.time_to_interactive ?? null)}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <p className="text-xs text-muted-foreground">FCP</p>
                      <p className="font-medium">
                        {formatMs(timing.first_contentful_paint ?? null)}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Issues Found */}
            {failedChecks.length > 0 && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Issues Found ({failedChecks.length})
                  </h4>
                  <div className="space-y-1">
                    {failedChecks.map(([key]) => (
                      <CheckItem key={key} label={getCheckLabel(key)} passed={false} />
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Passed Checks */}
            {passedChecks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Passed Checks ({passedChecks.length})
                </h4>
                <div className="space-y-1">
                  {passedChecks.slice(0, 10).map(([key]) => (
                    <CheckItem key={key} label={getCheckLabel(key)} passed={true} />
                  ))}
                  {passedChecks.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{passedChecks.length - 10} more passed checks
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* External Link */}
            <div className="pt-4">
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open page in new tab
              </a>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
