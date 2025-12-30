'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  BarChart3,
} from 'lucide-react'
import type { KeywordOptimizationReport } from '@/lib/seo/report-generator'

interface KeywordAuditResultsProps {
  url: string
  targetKeyword: string
  report: KeywordOptimizationReport
  metrics: {
    currentPosition: number | null
    searchVolume: number | null
    keywordDifficulty: number | null
    domainRank: number | null
    referringDomains: number | null
  }
  apiCost: number | null
}

export function KeywordAuditResults({
  url,
  targetKeyword,
  report,
  metrics,
  apiCost,
}: KeywordAuditResultsProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (
    score: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 70) return 'default'
    if (score >= 50) return 'secondary'
    return 'destructive'
  }

  const getPriorityColor = (priority: 1 | 2 | 3): string => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 2:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 3:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Keyword Optimization Report</h2>
          <p className="text-muted-foreground">
            Analysis for &quot;{targetKeyword}&quot; on{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {new URL(url).hostname}
              <ExternalLink className="ml-1 inline h-3 w-3" />
            </a>
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(report.scores.overall)}`}>
            {report.scores.overall}
          </div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {metrics.currentPosition ? `#${metrics.currentPosition}` : '---'}
            </div>
            <div className="text-sm text-muted-foreground">SERP Position</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {metrics.searchVolume?.toLocaleString() ?? '---'}
            </div>
            <div className="text-sm text-muted-foreground">Search Volume</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{metrics.keywordDifficulty ?? '---'}/100</div>
            <div className="text-sm text-muted-foreground">Difficulty</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{metrics.domainRank ?? '---'}</div>
            <div className="text-sm text-muted-foreground">Domain Rank</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {metrics.referringDomains?.toLocaleString() ?? '---'}
            </div>
            <div className="text-sm text-muted-foreground">Referring Domains</div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="font-medium">Primary Opportunity</div>
              <p className="text-sm text-muted-foreground">
                {report.executiveSummary.primaryOpportunity}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="font-medium">Competitive Gap</div>
              <p className="text-sm text-muted-foreground">
                {report.executiveSummary.competitiveGap}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="font-medium">Estimated Impact</div>
              <p className="text-sm text-muted-foreground">
                {report.executiveSummary.estimatedImpact}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="actions">Action Plan</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Scores</CardTitle>
              <CardDescription>How well is this page optimized for the target keyword?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Title Tag', score: report.scores.title },
                { label: 'Meta Description', score: report.scores.meta },
                { label: 'Heading Structure', score: report.scores.headings },
                { label: 'Content Relevance', score: report.scores.content },
                { label: 'Internal Linking', score: report.scores.internalLinks },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className={getScoreColor(item.score * 10)}>{item.score}/10</span>
                  </div>
                  <Progress value={item.score * 10} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.onPageAnalysis.strengths.length > 0 ? (
                    report.onPageAnalysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No strengths identified</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.onPageAnalysis.weaknesses.length > 0 ? (
                    report.onPageAnalysis.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No weaknesses identified</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {report.onPageAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Keyword Gap Analysis
              </CardTitle>
              <CardDescription>Keywords you should consider targeting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.keywordGaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{gap.keyword}</span>
                        <Badge variant={getScoreBadgeVariant(100 - (gap.difficulty ?? 50))}>
                          {gap.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{gap.recommendation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {gap.searchVolume?.toLocaleString() ?? '---'} vol
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {gap.difficulty ?? '---'} difficulty
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Insights</CardTitle>
              <CardDescription>
                Top competitor: {report.competitorInsights.topCompetitor}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Position Gap</span>
                  <Badge variant="secondary">
                    {report.competitorInsights.positionGap} positions behind
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3 font-medium">Key Differentiators</h4>
                <ul className="space-y-2">
                  {report.competitorInsights.keyDifferentiators.map((diff, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                      <span className="text-sm">{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prioritized Action Plan</CardTitle>
              <CardDescription>Follow these steps to improve your rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.actionItems.map((action, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getPriorityColor(action.priority)}`}
                    >
                      P{action.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{action.category}</Badge>
                      </div>
                      <p className="mt-1 font-medium">{action.action}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        {action.expectedImpact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Cost */}
      {apiCost !== null && (
        <div className="text-right text-xs text-muted-foreground">
          API Cost: ${apiCost.toFixed(4)}
        </div>
      )}
    </div>
  )
}
