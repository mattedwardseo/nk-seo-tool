'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bot,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { HealthScoreGauge } from '@/components/domains/HealthScoreGauge'
import { formatDistanceToNow } from 'date-fns'

interface PlatformScore {
  llmPlatform: string
  mentionRate: number
  citationRate: number
  visibilityScore: number
  sentimentScore: number
  averagePosition: number | null
}

interface Result {
  id: string
  keyword: string
  llmPlatform: string
  isMentioned: boolean
  mentionContext: string | null
  mentionRank: number | null
  isCited: boolean
  citationUrl: string | null
  sentiment: string
  competitorMentions: string[] | null
}

interface RunDetail {
  id: string
  domainId: string
  status: string
  businessName: string
  keywords: string[]
  llmPlatforms: string[]
  visibilityScore: number | null
  totalMentions: number
  totalCitations: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  recommendations?: string | null
}

interface ResearchInsight {
  keyword: string
  platform: string
  aiAnswer?: string
  citations?: Array<{ url: string; title: string; domain: string }>
  relatedQuestions?: string[]
  competitorMentions?: Array<{ name: string; url?: string }>
}

interface Recommendation {
  priority: string
  category: string
  suggestion: string
}

const platformLabels: Record<string, string> = {
  'Google AI Overview': 'Google AI Overview',
  'ChatGPT': 'ChatGPT',
  'chatgpt': 'ChatGPT',
  'chat_gpt': 'ChatGPT',
  'google': 'Google AI Overview',
}

export default function AISeoRunDetailPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const runId = params.runId as string
  
  const [run, setRun] = useState<RunDetail | null>(null)
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [researchInsights, setResearchInsights] = useState<ResearchInsight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!runId) {
      setLoading(false)
      return
    }
    fetchRunData()
  }, [runId])

  const fetchRunData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/ai-seo/${runId}`)
      const data = await response.json()
      
      if (data.success) {
        setRun(data.data.run)
        setPlatformScores(data.data.platformScores || [])
        setResults(data.data.results || [])
        setResearchInsights(data.data.researchInsights || [])
        
        // Parse recommendations
        if (data.data.recommendations && Array.isArray(data.data.recommendations)) {
          setRecommendations(data.data.recommendations)
        }
      } else {
        setError(data.error || 'Failed to load run details')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error('Error fetching run:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={domainUrl('/ai-seo')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Error loading analysis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || 'Analysis not found'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const keywordResults = results.filter(r => r.keyword)
  const _platformResults = results.filter(r => !r.keyword)
  const mentionedKeywords = keywordResults.filter(r => r.isMentioned)
  const _citedKeywords = keywordResults.filter(r => r.isCited)
  // Suppress unused variable warnings
  void _platformResults
  void _citedKeywords

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={domainUrl('/ai-seo')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Bot className="h-5 w-5 text-violet-500" />
              </div>
              AI SEO Analysis
            </h1>
            <p className="text-muted-foreground mt-1">{run.businessName}</p>
          </div>
        </div>
        <Badge 
          variant={run.status === 'COMPLETED' ? 'default' : 'secondary'}
          className={run.status === 'COMPLETED' ? 'bg-emerald-600' : ''}
        >
          {run.status.toLowerCase()}
        </Badge>
      </div>

      {/* Status Message */}
      {run.status === 'RUNNING' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium">Analysis in progress</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This analysis is currently running. Results will appear here when complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {run.status === 'FAILED' && run.errorMessage && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Analysis failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {run.errorMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      {run.status === 'COMPLETED' && (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Visibility Score */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-violet-500/5 to-purple-500/10 border-violet-200/50 dark:border-violet-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">AI Visibility</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-0">
                <HealthScoreGauge score={run.visibilityScore || 0} size="md" />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="lg:col-span-4 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Mentions</p>
                      <p className="text-3xl font-bold tabular-nums">{run.totalMentions}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <MessageSquare className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Citations</p>
                      <p className="text-3xl font-bold tabular-nums">{run.totalCitations}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                      <ExternalLink className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Keywords</p>
                      <p className="text-3xl font-bold tabular-nums">{run.keywords.length}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                      <TrendingUp className="h-6 w-6 text-violet-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Platform Breakdown */}
          {platformScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Visibility metrics by AI platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformScores.map((score) => (
                    <div key={score.llmPlatform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {platformLabels[score.llmPlatform] || score.llmPlatform}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {score.visibilityScore}% visibility
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Mention Rate</span>
                          <span>{Math.round(score.mentionRate * 100)}%</span>
                        </div>
                        <Progress value={score.mentionRate * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Citation Rate</span>
                          <span>{Math.round(score.citationRate * 100)}%</span>
                        </div>
                        <Progress value={score.citationRate * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keyword Results */}
          {keywordResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Keyword Results</CardTitle>
                <CardDescription>
                  {mentionedKeywords.length} of {keywordResults.length} keywords mentioned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {run.keywords.map((keyword) => {
                    const keywordResult = keywordResults.filter(r => r.keyword === keyword)
                    const platforms = [...new Set(keywordResult.map(r => r.llmPlatform))]
                    const mentioned = keywordResult.some(r => r.isMentioned)
                    const cited = keywordResult.some(r => r.isCited)
                    
                    return (
                      <div
                        key={keyword}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {mentioned ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{keyword}</p>
                            <p className="text-xs text-muted-foreground">
                              {platforms.map(p => platformLabels[p] || p).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cited && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Cited
                            </Badge>
                          )}
                          {mentioned ? (
                            <Badge variant="default" className="bg-emerald-600">
                              Mentioned
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Mentioned</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Research Insights - What AI Actually Says */}
          {researchInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Research Insights</CardTitle>
                <CardDescription>
                  What AI says when people search for your keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {run.keywords.slice(0, 5).map((keyword) => {
                    const insights = researchInsights.filter(r => r.keyword === keyword)
                    if (insights.length === 0) return null
                    
                    const mainInsight = insights.find(r => r.aiAnswer) ?? insights[0]
                    if (!mainInsight) return null

                    const allCitations = insights.flatMap(r => r.citations || [])
                      .filter((c, index, arr) => arr.findIndex(other => other.url === c.url) === index)
                    const allQuestions = insights.flatMap(r => r.relatedQuestions || [])
                      .filter((q, index, arr) => arr.indexOf(q) === index)
                    const allCompetitors = insights.flatMap(r => r.competitorMentions || [])
                      .filter((c, index, arr) => arr.findIndex(other => other.name === c.name) === index)

                    return (
                      <div key={keyword} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{keyword}</h4>
                          {mainInsight.aiAnswer && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {mainInsight.aiAnswer.substring(0, 300)}...
                            </p>
                          )}
                        </div>
                        
                        {allCitations.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Sources AI Cites:</p>
                            <div className="flex flex-wrap gap-2">
                              {allCitations.slice(0, 3).map((citation, idx) => (
                                <a
                                  key={idx}
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  {citation.domain}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {allQuestions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Related Questions:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {allQuestions.slice(0, 3).map((q, idx) => (
                                <li key={idx}>• {q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {allCompetitors.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Competitors Mentioned:</p>
                            <div className="flex flex-wrap gap-2">
                              {allCompetitors.slice(0, 3).map((comp, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {comp.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actionable Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle>Actionable Recommendations</CardTitle>
                <CardDescription>
                  Insights-based recommendations for improving AI visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        className="mt-0.5"
                      >
                        {rec.priority}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rec.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                  </dd>
                </div>
                {run.completedAt && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Completed</dt>
                    <dd className="mt-1 text-sm">
                      {formatDistanceToNow(new Date(run.completedAt), { addSuffix: true })}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Platforms Analyzed</dt>
                  <dd className="mt-1 text-sm">
                    {run.llmPlatforms.map(p => platformLabels[p] || p).join(', ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Keywords Tracked</dt>
                  <dd className="mt-1 text-sm">{run.keywords.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

