'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AuditStatusBadge,
  AuditProgress,
  KeywordTable,
  KeywordTrendChart,
  GBPCompleteness,
  ReviewSentiment,
  EmptyState,
  CompetitorComparison,
  ActionPlanTab,
  type CompetitorMetrics,
} from '@/components/audit';
import { OnPageTabsContainer } from '@/components/audit/onpage';
import {
  type AuditStatusType,
  type OnPageStepResult,
  type SerpStepResult,
  type BacklinksStepResult,
  type CompetitorStepResult,
  type SEOCompetitorMetrics,
  type BusinessStepResult,
  AuditStatus,
} from '@/types/audit';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import {
  transformKeywords,
  generateGBPFields,
  calculateGBPCompleteness,
  generateSentimentStats,
  transformCompetitors,
  formatReferringDomains,
  formatAnchorDistribution,
  formatBusinessAttributes,
  formatWorkHours,
} from '@/lib/utils/audit-transforms';
import {
  ArrowLeft,
  RefreshCw,
  Globe,
  Clock,
  Calendar,
  Search,
  MapPin,
  Link2,
  Users,
  Star,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditDetailsResponse {
  success: boolean;
  data: {
    id: string;
    domain: string;
    status: AuditStatusType;
    progress: number;
    stepResults: {
      onPage: OnPageStepResult | null;
      serp: SerpStepResult | null;
      backlinks: BacklinksStepResult | null;
      competitors: CompetitorStepResult | null;
      business: BusinessStepResult | null;
    };
    error: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  };
  error?: string;
}

export default function AuditDetailPage(): React.ReactElement {
  const params = useParams();
  const auditId = params.id as string;
  const domainId = params.domainId as string;

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

  const [audit, setAudit] = React.useState<AuditDetailsResponse['data'] | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAudit = React.useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/audits/${auditId}`);
      const data: AuditDetailsResponse = await response.json();

      if (data.success) {
        setAudit(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load audit');
      }
    } catch {
      setError('Failed to load audit');
    } finally {
      setIsLoading(false);
    }
  }, [auditId]);

  React.useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleRetry = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/audits/${auditId}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Audit retry started');
        fetchAudit();
      } else {
        toast.error('Failed to retry audit');
      }
    } catch {
      toast.error('Failed to retry audit');
    }
  };

  const handleAuditComplete = (): void => {
    fetchAudit();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-center">
          Loading audit details...
        </div>
      </div>
    );
  }

  // Error state
  if (error || !audit) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-accent cursor-pointer transition-colors duration-150"
        >
          <Link href={domainUrl('/audits')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audits
          </Link>
        </Button>
        <Card>
          <CardContent className="text-destructive flex items-center justify-center py-12">
            {error || 'Audit not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInProgress =
    audit.status !== AuditStatus.COMPLETED && audit.status !== AuditStatus.FAILED;
  const canRetry = audit.status === AuditStatus.FAILED;
  const isCompleted = audit.status === AuditStatus.COMPLETED;

  // Transform data for components
  const gbpFields = generateGBPFields(audit.stepResults.business);
  const gbpCompleteness = calculateGBPCompleteness(audit.stepResults.business);
  const sentimentStats = generateSentimentStats(audit.stepResults.business);
  const referringDomains = formatReferringDomains(
    audit.stepResults.backlinks?.topReferringDomains
  );
  const anchorDistribution = formatAnchorDistribution(
    audit.stepResults.backlinks?.anchorDistribution
  );
  const businessAttributes = formatBusinessAttributes(
    audit.stepResults.business?.attributes
  );
  const workHours = formatWorkHours(audit.stepResults.business?.workHours);
  const competitors = transformCompetitors(audit.stepResults.business?.competitors);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-accent mt-1 cursor-pointer transition-colors duration-150"
          >
            <Link href={domainUrl('/audits')}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to audits</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {audit.domain}
              </h1>
              <AuditStatusBadge status={audit.status} />
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {audit.domain}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(audit.createdAt)}
              </span>
              {audit.completedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Completed {formatRelativeTime(audit.completedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {canRetry && (
          <Button
            variant="outline"
            onClick={handleRetry}
            className="cursor-pointer transition-colors duration-150"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Audit
          </Button>
        )}
      </div>

      {/* In Progress */}
      {isInProgress && (
        <AuditProgress auditId={auditId} onComplete={handleAuditComplete} />
      )}

      {/* Failed State */}
      {audit.status === AuditStatus.FAILED && audit.error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-destructive text-lg font-medium">Audit Failed</p>
              <p className="text-muted-foreground mt-2 text-sm">{audit.error}</p>
              <Button
                variant="outline"
                onClick={handleRetry}
                className="mt-4 cursor-pointer transition-colors duration-150"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content - Only for completed audits */}
      {isCompleted && (
        <Tabs defaultValue="action-plan" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="action-plan">Action Plan</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="local">Local SEO</TabsTrigger>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          {/* Tab 0: Action Plan - Local SEO Recommendations */}
          <TabsContent value="action-plan" className="mt-6">
            <ActionPlanTab auditData={audit} />
          </TabsContent>

          {/* Tab 1: Overview - Placeholder for future content */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-muted-foreground text-center">
                  <p>Overview content coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Technical SEO - Now with 3 sub-tabs (Content, Issues, Performance) */}
          <TabsContent value="technical" className="mt-6">
            {audit.stepResults.onPage ? (
              <OnPageTabsContainer data={audit.stepResults.onPage} />
            ) : (
              <EmptyState
                icon={Settings}
                title="No Technical Data"
                description="Technical SEO analysis data was not collected for this audit."
              />
            )}
          </TabsContent>

          {/* Tab 3: Keywords */}
          <TabsContent value="keywords" className="mt-6 space-y-6">
            <KeywordTrendChart data={audit.stepResults.serp?.keywordTrend} />

            {audit.stepResults.serp?.trackedKeywords &&
            audit.stepResults.serp.trackedKeywords.length > 0 ? (
              <KeywordTable
                keywords={transformKeywords(audit.stepResults.serp.trackedKeywords)}
                title="Tracked Keywords"
                description="Keywords you're monitoring for this domain"
                showCpc
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No Tracked Keywords"
                description="Keywords will be automatically tracked when you create a new project."
              />
            )}
          </TabsContent>

          {/* Tab 4: Local SEO */}
          <TabsContent value="local" className="mt-6 space-y-6">
            {audit.stepResults.business?.hasGmbListing ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard
                    label="GMB Listing"
                    value={
                      audit.stepResults.business.hasGmbListing ? 'Found' : 'Not Found'
                    }
                  />
                  <MetricCard
                    label="Rating"
                    value={audit.stepResults.business.gmbRating?.toFixed(1)}
                    suffix=" stars"
                  />
                  <MetricCard
                    label="Reviews"
                    value={audit.stepResults.business.reviewCount}
                  />
                  <MetricCard
                    label="Photos"
                    value={audit.stepResults.business.photosCount}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 text-sm md:grid-cols-2">
                      <ProfileField
                        label="Business Name"
                        value={audit.stepResults.business.businessName}
                      />
                      <ProfileField
                        label="Address"
                        value={audit.stepResults.business.address}
                      />
                      <ProfileField
                        label="Phone"
                        value={audit.stepResults.business.phone}
                      />
                      <ProfileField
                        label="Website"
                        value={audit.stepResults.business.website}
                      />
                      <ProfileField
                        label="Primary Category"
                        value={audit.stepResults.business.primaryCategory}
                      />
                      <ProfileField
                        label="Additional Categories"
                        value={audit.stepResults.business.additionalCategories?.join(
                          ', '
                        )}
                      />
                      <ProfileField
                        label="Description"
                        value={audit.stepResults.business.description}
                        className="md:col-span-2"
                      />
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Completeness</CardTitle>
                    <CardDescription>{gbpCompleteness}% complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GBPCompleteness
                      data={{
                        fields: gbpFields,
                        completeness: gbpCompleteness,
                        isVerified: audit.stepResults.business?.isClaimed ?? false,
                        businessName: audit.stepResults.business?.businessName,
                      }}
                    />
                  </CardContent>
                </Card>

                {sentimentStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reviews & Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReviewSentiment stats={sentimentStats} />
                    </CardContent>
                  </Card>
                )}

                {businessAttributes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Attributes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {businessAttributes.map((attr) => (
                          <div key={attr.category}>
                            <h4 className="mb-2 text-sm font-medium">
                              {attr.category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {attr.items.map((item) => (
                                <span
                                  key={item}
                                  className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {workHours.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-7">
                        {workHours.map((day) => (
                          <div key={day.day}>
                            <dt className="text-muted-foreground font-medium">
                              {day.day}
                            </dt>
                            <dd>{day.hours}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState
                icon={MapPin}
                title="No Google Business Profile Found"
                description="No GMB listing was found for this domain. A Google Business Profile is essential for local SEO."
              />
            )}
          </TabsContent>

          {/* Tab 5: Backlinks */}
          <TabsContent value="backlinks" className="mt-6 space-y-6">
            {audit.stepResults.backlinks ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Total Backlinks"
                    value={audit.stepResults.backlinks.totalBacklinks.toLocaleString()}
                  />
                  <MetricCard
                    label="Referring Domains"
                    value={audit.stepResults.backlinks.referringDomains.toLocaleString()}
                  />
                  <MetricCard
                    label="Domain Rank"
                    value={audit.stepResults.backlinks.domainRank}
                    suffix="/1000"
                  />
                  <MetricCard
                    label="Spam Score"
                    value={audit.stepResults.backlinks.spamScore}
                    suffix="%"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Link Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <MetricItem
                        label="DoFollow Ratio"
                        value={`${Math.round(audit.stepResults.backlinks.dofollowRatio * 100)}%`}
                      />
                      <MetricItem
                        label="NoFollow Ratio"
                        value={`${Math.round((1 - audit.stepResults.backlinks.dofollowRatio) * 100)}%`}
                      />
                      <MetricItem
                        label="Domains/Backlinks Ratio"
                        value={
                          audit.stepResults.backlinks.totalBacklinks > 0
                            ? (
                                audit.stepResults.backlinks.referringDomains /
                                audit.stepResults.backlinks.totalBacklinks
                              ).toFixed(3)
                            : 'N/A'
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {referringDomains.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Referring Domains</CardTitle>
                      <CardDescription>
                        Top {referringDomains.length} domains linking to you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 text-left font-medium">Domain</th>
                              <th className="py-2 text-right font-medium">
                                Backlinks
                              </th>
                              <th className="py-2 text-right font-medium">
                                Domain Rank
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {referringDomains.map((domain) => (
                              <tr key={domain.domain} className="border-b">
                                <td className="py-2">{domain.domain}</td>
                                <td className="py-2 text-right">{domain.backlinks}</td>
                                <td className="py-2 text-right">{domain.domainRank}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {anchorDistribution.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Anchor Text Distribution
                      </CardTitle>
                      <CardDescription>
                        Top anchor texts used in backlinks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {anchorDistribution.map((anchor) => (
                          <div key={anchor.anchor} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="max-w-[200px] truncate">
                                {anchor.anchor || '(no anchor text)'}
                              </span>
                              <span className="text-muted-foreground">
                                {anchor.count} ({anchor.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={anchor.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState
                icon={Link2}
                title="No Backlink Data"
                description="Backlink analysis data was not collected for this audit."
              />
            )}
          </TabsContent>

          {/* Tab 6: Competitors */}
          <TabsContent value="competitors" className="mt-6 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-semibold">Enhanced Competitor Dashboard</h3>
                  <p className="text-muted-foreground text-sm">
                    View detailed ROI projections, backlink gaps, and AI visibility
                    analysis
                  </p>
                </div>
                <Button asChild>
                  <Link href={domainUrl(`/audits/${auditId}/competitors`)}>
                    <Users className="mr-2 h-4 w-4" />
                    Open Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {audit.stepResults.competitors ? (
              <>
                <CompetitorComparison
                  targetDomain={audit.domain}
                  targetMetrics={transformSEOCompetitorMetrics(
                    audit.stepResults.competitors.targetMetrics
                  )}
                  competitors={[
                    ...audit.stepResults.competitors.competitors.map(
                      transformSEOCompetitorMetrics
                    ),
                    ...(audit.stepResults.competitors.discoveredCompetitors?.map(
                      transformSEOCompetitorMetrics
                    ) ?? []),
                  ]}
                  title="SEO Competitor Analysis"
                  description="Compare your domain's SEO performance against competitors"
                />

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Your Rank"
                    value={audit.stepResults.competitors.targetMetrics.rank || 'N/A'}
                  />
                  <MetricCard
                    label="Your Keywords"
                    value={audit.stepResults.competitors.targetMetrics.rankingKeywords}
                  />
                  <MetricCard
                    label="Your Traffic (ETV)"
                    value={
                      audit.stepResults.competitors.targetMetrics.organicTraffic
                        ? `$${audit.stepResults.competitors.targetMetrics.organicTraffic.toLocaleString()}`
                        : 'N/A'
                    }
                  />
                  <MetricCard
                    label="Competitors Analyzed"
                    value={
                      audit.stepResults.competitors.competitors.length +
                      (audit.stepResults.competitors.discoveredCompetitors?.length ?? 0)
                    }
                  />
                </div>
              </>
            ) : null}

            {competitors.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Local Competitors</CardTitle>
                    <CardDescription>
                      Businesses that appear in &quot;People Also Search For&quot;
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 text-left font-medium">Business</th>
                            <th className="py-2 text-right font-medium">Rating</th>
                            <th className="py-2 text-right font-medium">Reviews</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audit.stepResults.business?.competitors?.map((comp) => (
                            <tr key={comp.cid} className="border-b">
                              <td className="py-2">{comp.name}</td>
                              <td className="py-2 text-right">
                                {comp.rating ? (
                                  <span className="flex items-center justify-end gap-1">
                                    {comp.rating.toFixed(1)}
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  </span>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="py-2 text-right">{comp.reviewCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Local Position</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <MetricItem
                        label="Your Rating"
                        value={
                          audit.stepResults.business?.gmbRating
                            ? `${audit.stepResults.business.gmbRating.toFixed(1)} stars`
                            : 'N/A'
                        }
                      />
                      <MetricItem
                        label="Your Reviews"
                        value={audit.stepResults.business?.reviewCount ?? 'N/A'}
                      />
                      <MetricItem label="Local Competitors" value={competitors.length} />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}

            {!audit.stepResults.competitors && competitors.length === 0 && (
              <EmptyState
                icon={Users}
                title="No Competitor Data"
                description="Competitor analysis data was not collected for this audit. Add competitor domains in the audit form to enable comparison."
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ============================================================
// TYPE TRANSFORMERS
// ============================================================

function transformSEOCompetitorMetrics(
  metrics: SEOCompetitorMetrics
): CompetitorMetrics {
  return {
    domain: metrics.domain,
    rank: metrics.rank,
    organicTraffic: metrics.organicTraffic,
    backlinks: metrics.backlinks,
    referringDomains: metrics.referringDomains,
    rankingKeywords: metrics.rankingKeywords,
    top10Keywords: metrics.top10Keywords,
    trafficValue: metrics.trafficValue,
  };
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

interface MetricCardProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}

function MetricCard({ label, value, suffix }: MetricCardProps): React.ReactElement {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-xl font-bold">
          {value ?? '-'}
          {value !== null && value !== undefined && suffix}
        </p>
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  isBoolean?: boolean;
  booleanValue?: boolean;
}

function MetricItem({
  label,
  value,
  suffix,
  isBoolean,
  booleanValue,
}: MetricItemProps): React.ReactElement {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">
        {isBoolean ? (
          <span className={booleanValue ? 'text-green-600' : 'text-red-600'}>
            {value}
          </span>
        ) : (
          <>
            {value ?? '-'}
            {value !== null && value !== undefined && suffix}
          </>
        )}
      </dd>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  value: string | null | undefined;
  className?: string;
}

function ProfileField({
  label,
  value,
  className,
}: ProfileFieldProps): React.ReactElement {
  return (
    <div className={className}>
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className={value ? '' : 'text-muted-foreground italic'}>
        {value || 'Not provided'}
      </dd>
    </div>
  );
}
