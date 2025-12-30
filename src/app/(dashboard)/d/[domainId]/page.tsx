'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileSearch,
  AlertCircle,
  Globe,
  MapPin,
  Bot,
  ArrowRight,
  Activity,
  Target,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { AuditStatusBadge } from '@/components/audit/AuditStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import type { AuditStatus } from '@prisma/client';
import { useDomain } from '@/contexts/DomainContext';
import { HealthScoreGauge } from '@/components/domains/HealthScoreGauge';
import { QuickStatCard } from '@/components/domains/QuickStatCard';
import { ActionItemCard } from '@/components/domains/ActionItemCard';

interface DashboardStats {
  totalAudits: number;
  completedAudits: number;
  thisMonthAudits: number;
  scheduledAudits: number;
  recentAudits: Array<{
    id: string;
    domain: string;
    status: AuditStatus;
    progress: number;
    createdAt: string;
    completedAt: string | null;
  }>;
}

interface SiteScan {
  id: string;
  domain: string;
  status: string;
  totalPages: number | null;
  createdAt: string;
}

interface LocalCampaign {
  id: string;
  businessName: string;
  targetKeyword: string;
  status: string;
  createdAt: string;
}

interface ToolCounts {
  audits: number;
  siteScans: number;
  localCampaigns: number;
  seoCalculations: number;
  trackedKeywords: number;
  keywordTrackingRuns: number;
}

export default function DomainDashboardPage(): React.ReactElement {
  const { data: session } = useSession();
  const params = useParams();
  const domainId = params.domainId as string;
  const { selectedDomain } = useDomain();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [siteScans, setSiteScans] = useState<SiteScan[]>([]);
  const [localCampaigns, setLocalCampaigns] = useState<LocalCampaign[]>([]);
  const [toolCounts, setToolCounts] = useState<ToolCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`;

  useEffect(() => {
    async function fetchAllData(): Promise<void> {
      if (!session?.user?.id || !domainId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel, using domain-scoped API routes
        const [statsRes, scansRes, campaignsRes, countsRes] = await Promise.all([
          fetch(
            `/api/dashboard/stats?userId=${encodeURIComponent(session.user.id)}&domainId=${domainId}`
          ),
          fetch(`/api/site-audit?domainId=${domainId}`),
          fetch(`/api/local-seo/campaigns?domainId=${domainId}`),
          fetch(`/api/domains/${domainId}/tool-counts`),
        ]);

        const statsData = await statsRes.json();
        const scansData = await scansRes.json();
        const campaignsData = await campaignsRes.json();
        const countsData = await countsRes.json();

        if (statsRes.ok && statsData.success) {
          setStats(statsData.data);
        }

        if (scansRes.ok && scansData.success) {
          setSiteScans(scansData.data?.slice(0, 5) || []);
        }

        if (campaignsRes.ok && campaignsData.success) {
          setLocalCampaigns(campaignsData.data?.campaigns?.slice(0, 5) || []);
        }

        if (countsRes.ok && countsData.success) {
          setToolCounts(countsData.data);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id, domainId]);

  // Calculate a mock health score based on available data
  const calculateHealthScore = (): number => {
    if (!toolCounts || !stats) return 0;
    let score = 50; // Base score
    if (toolCounts.audits > 0) score += 10;
    if (toolCounts.siteScans > 0) score += 15;
    if (toolCounts.localCampaigns > 0) score += 10;
    if (toolCounts.keywordTrackingRuns > 0) score += 15;
    if (stats.completedAudits > 0) score += Math.min(stats.completedAudits * 2, 10);
    return Math.min(score, 100);
  };

  // Generate action items based on data
  const getActionItems = () => {
    const items = [];
    
    if (!toolCounts?.siteScans) {
      items.push({
        id: 'site-scan',
        title: 'Run your first site audit',
        description: 'Crawl your website to find technical SEO issues',
        severity: 'warning' as const,
        href: domainUrl('/site-audit/new'),
      });
    }
    
    if (!toolCounts?.localCampaigns) {
      items.push({
        id: 'geo-grid',
        title: 'Set up local SEO tracking',
        description: 'Track your Google Maps rankings across locations',
        severity: 'info' as const,
        href: domainUrl('/local-seo/new'),
      });
    }

    if (!toolCounts?.keywordTrackingRuns) {
      items.push({
        id: 'keyword-tracking',
        title: 'Start tracking keywords',
        description: 'Monitor your search rankings over time',
        severity: 'info' as const,
        href: domainUrl('/keyword-tracking/new'),
      });
    }

    return items;
  };

  const getScanStatusColor = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview of{' '}
            <span className="font-medium text-foreground">
              {selectedDomain?.name || 'your project'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a 
              href={`https://${selectedDomain?.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Site
            </a>
          </Button>
          <Button asChild className="bg-[#FF6B35] hover:bg-[#E85A2A]">
            <Link href={domainUrl('/audits/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="text-destructive flex items-center gap-2 py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Health Score & Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Health Score Card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-center">Domain Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            {loading ? (
              <Skeleton className="h-24 w-24 rounded-full" />
            ) : (
              <HealthScoreGauge score={calculateHealthScore()} size="md" />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <QuickStatCard
                title="Keywords Tracked"
                value={toolCounts?.trackedKeywords || 0}
                icon={Target}
                iconColor="text-blue-500"
              />
              <QuickStatCard
                title="Site Health"
                value={siteScans.length > 0 ? `${siteScans[0]?.totalPages || 0}` : '--'}
                subtitle={siteScans.length > 0 ? 'pages crawled' : 'No scans'}
                icon={Globe}
                iconColor="text-emerald-500"
              />
              <QuickStatCard
                title="GBP Rankings"
                value={localCampaigns.length}
                subtitle="campaigns"
                icon={MapPin}
                iconColor="text-orange-500"
              />
              <QuickStatCard
                title="Audits Run"
                value={stats?.completedAudits || 0}
                icon={BarChart3}
                iconColor="text-purple-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout: Activity & Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest audits and scans</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={domainUrl('/audits')}>
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : stats?.recentAudits && stats.recentAudits.length > 0 ? (
              <div className="space-y-2">
                {stats.recentAudits.slice(0, 5).map((audit) => (
                  <Link
                    key={audit.id}
                    href={domainUrl(`/audits/${audit.id}`)}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                        <FileSearch className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          SEO Audit - {audit.domain}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(audit.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <AuditStatusBadge status={audit.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <FileSearch className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <p className="font-medium">No audits yet</p>
                <p className="text-sm mt-1">Run your first audit to get started</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={domainUrl('/audits/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Run Audit
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Action Items
            </CardTitle>
            <CardDescription>Things that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ActionItemCard items={getActionItems()} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Access Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={domainUrl('/audits/new')}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-blue-500/10 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 mb-4">
                <FileSearch className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">SEO Audit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Full domain analysis
              </p>
            </div>
          </Link>

          <Link
            href={domainUrl('/site-audit/new')}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-emerald-500/10 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mb-4">
                <Globe className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Site Audit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crawl all pages
              </p>
            </div>
          </Link>

          <Link
            href={domainUrl('/local-seo/new')}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-orange-500/10 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 mb-4">
                <MapPin className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold">Geo Grid</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track map rankings
              </p>
            </div>
          </Link>

          <Link
            href={domainUrl('/ai-seo')}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-violet-500/10 group-hover:scale-110 transition-transform" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 mb-4">
                <Bot className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">AI SEO</h3>
                <Badge className="bg-[#FF6B35] text-white text-[10px] px-1.5 py-0 h-4">NEW</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                LLM visibility tracking
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Scans & Campaigns Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Site Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-emerald-500" />
              Recent Site Scans
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={domainUrl('/site-audit')}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : siteScans.length > 0 ? (
              <div className="space-y-2">
                {siteScans.slice(0, 4).map((scan) => (
                  <Link
                    key={scan.id}
                    href={domainUrl(`/site-audit/${scan.id}`)}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {scan.domain}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {scan.totalPages
                          ? `${scan.totalPages} pages`
                          : 'Scanning...'}
                      </p>
                    </div>
                    <Badge
                      variant={getScanStatusColor(scan.status)}
                      className="capitalize"
                    >
                      {scan.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                No site scans yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Local SEO Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-orange-500" />
              Geo Grid Campaigns
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={domainUrl('/local-seo')}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : localCampaigns.length > 0 ? (
              <div className="space-y-2">
                {localCampaigns.slice(0, 4).map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={domainUrl(`/local-seo/${campaign.id}`)}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {campaign.businessName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {campaign.targetKeyword}
                      </p>
                    </div>
                    <Badge
                      variant={
                        campaign.status === 'active' ? 'default' : 'secondary'
                      }
                      className="capitalize"
                    >
                      {campaign.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                No campaigns yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
