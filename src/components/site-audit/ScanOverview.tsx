'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  Link2,
  Image,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface ScanSummary {
  totalPages: number;
  crawledPages: number;
  crawlStopReason: string | null;
  errorsCount: number;
  warningsCount: number;
  noticesCount: number;
  onpageScore: number | null;
  avgLcp: number | null;
  avgCls: number | null;
  totalImages: number;
  brokenResources: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  nonIndexable: number;
  duplicateTitle: number;
  duplicateDescription: number;
  domainInfo?: Record<string, unknown>;
  sslInfo?: Record<string, unknown>;
}

interface ScanOverviewProps {
  summary: ScanSummary;
  domain: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}): React.ReactElement {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getScoreVariant(score: number | null): 'default' | 'success' | 'warning' | 'error' {
  if (score === null) return 'default';
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

function formatLcp(ms: number | null): string {
  if (ms === null) return 'N/A';
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatCls(cls: number | null): string {
  if (cls === null) return 'N/A';
  return cls.toFixed(3);
}

export function ScanOverview({ summary, domain }: ScanOverviewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6" />
        <div>
          <h2 className="text-xl font-bold">{domain}</h2>
          <p className="text-sm text-muted-foreground">
            Crawled {summary.crawledPages} of {summary.totalPages} pages
            {summary.crawlStopReason && ` (${summary.crawlStopReason})`}
          </p>
        </div>
      </div>

      {/* Score & Issues Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="OnPage Score"
          value={summary.onpageScore?.toFixed(0) ?? 'N/A'}
          icon={ShieldCheck}
          variant={getScoreVariant(summary.onpageScore)}
        />
        <MetricCard
          title="Errors"
          value={summary.errorsCount}
          icon={AlertCircle}
          variant={summary.errorsCount > 0 ? 'error' : 'success'}
        />
        <MetricCard
          title="Warnings"
          value={summary.warningsCount}
          icon={AlertTriangle}
          variant={summary.warningsCount > 10 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Notices"
          value={summary.noticesCount}
          icon={Info}
        />
      </div>

      {/* Core Web Vitals Row */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Core Web Vitals (Averages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Largest Contentful Paint (LCP)
              </p>
              <p
                className={`text-2xl font-bold ${
                  summary.avgLcp === null
                    ? 'text-muted-foreground'
                    : summary.avgLcp <= 2500
                      ? 'text-green-600'
                      : summary.avgLcp <= 4000
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {formatLcp(summary.avgLcp)}
              </p>
              <p className="text-xs text-muted-foreground">Target: &lt; 2.5s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Cumulative Layout Shift (CLS)
              </p>
              <p
                className={`text-2xl font-bold ${
                  summary.avgCls === null
                    ? 'text-muted-foreground'
                    : summary.avgCls <= 0.1
                      ? 'text-green-600'
                      : summary.avgCls <= 0.25
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {formatCls(summary.avgCls)}
              </p>
              <p className="text-xs text-muted-foreground">Target: &lt; 0.1</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links & Resources Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pages"
          value={summary.crawledPages}
          icon={FileText}
        />
        <MetricCard
          title="Internal Links"
          value={summary.internalLinks}
          icon={Link2}
        />
        <MetricCard
          title="External Links"
          value={summary.externalLinks}
          icon={Link2}
        />
        <MetricCard
          title="Broken Links"
          value={summary.brokenLinks}
          icon={Link2}
          variant={summary.brokenLinks > 0 ? 'error' : 'success'}
        />
      </div>

      {/* Content Issues Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Images"
          value={summary.totalImages}
          icon={Image}
        />
        <MetricCard
          title="Broken Resources"
          value={summary.brokenResources}
          icon={AlertCircle}
          variant={summary.brokenResources > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Duplicate Titles"
          value={summary.duplicateTitle}
          icon={FileText}
          variant={summary.duplicateTitle > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Non-Indexable"
          value={summary.nonIndexable}
          icon={AlertTriangle}
          variant={summary.nonIndexable > 5 ? 'warning' : 'default'}
        />
      </div>
    </div>
  );
}
