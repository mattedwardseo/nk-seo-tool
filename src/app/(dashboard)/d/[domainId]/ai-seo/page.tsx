'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bot,
  Plus,
  RefreshCw,
  TrendingUp,
  Sparkles,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { HealthScoreGauge } from '@/components/domains/HealthScoreGauge'
import { formatDistanceToNow } from 'date-fns'

interface AISeoPlatformScore {
  platform: string
  mentionRate: number
  citationRate: number
  visibilityScore: number
  sentimentScore: number
}

interface AISeoRun {
  id: string
  status: string
  businessName: string
  keywords: string[]
  llmPlatforms: string[]
  visibilityScore: number | null
  totalMentions: number
  totalCitations: number
  createdAt: string
  completedAt: string | null
}

export default function AISeoPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const [runs, setRuns] = useState<AISeoRun[]>([])
  const [platformScores, setPlatformScores] = useState<AISeoPlatformScore[]>([])
  const [loading, setLoading] = useState(true)

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchData()
  }, [domainId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai-seo?domainId=${domainId}`)
      const data = await response.json()
      
      if (data.success) {
        setRuns(data.data.runs || [])
        setPlatformScores(data.data.platformScores || [])
      } else {
        // If no data yet, that's okay - show empty state
        setRuns([])
        setPlatformScores([])
      }
    } catch {
      // If API doesn't exist yet, show empty state
      setRuns([])
      setPlatformScores([])
    } finally {
      setLoading(false)
    }
  }

  const latestRun = runs.length > 0 ? runs[0] : null
  const visibilityScore = latestRun?.visibilityScore || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="h-5 w-5 text-violet-500" />
            </div>
            AI SEO
            <Badge className="bg-[#FF6B35] text-white ml-2">NEW</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your visibility across AI platforms like ChatGPT, Gemini, and Perplexity
          </p>
        </div>
        <Button asChild className="bg-[#FF6B35] hover:bg-[#E85A2A]">
          <Link href={domainUrl('/ai-seo/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {runs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Sparkles className="h-10 w-10 text-violet-500" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Track Your AI Visibility</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                  Discover how often AI assistants like ChatGPT, Gemini, and Perplexity
                  recommend your business when users ask relevant questions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <Button asChild className="bg-[#FF6B35] hover:bg-[#E85A2A]" size="lg">
                  <Link href={domainUrl('/ai-seo/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Run Your First Analysis
                  </Link>
                </Button>
              </div>
              
              {/* Feature highlights */}
              <div className="grid gap-4 sm:grid-cols-3 mt-8 pt-8 border-t">
                <div className="text-center p-4">
                  <div className="flex justify-center mb-2">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h4 className="font-medium">LLM Responses</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    See what AI says when users ask about your services
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="flex justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                  <h4 className="font-medium">Visibility Score</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your AI visibility score over time
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="flex justify-center mb-2">
                    <ExternalLink className="h-8 w-8 text-violet-500" />
                  </div>
                  <h4 className="font-medium">Citation Tracking</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monitor when AI links to your website
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Visibility Score */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-violet-500/5 to-purple-500/10 border-violet-200/50 dark:border-violet-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">AI Visibility</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-0">
                <HealthScoreGauge score={visibilityScore} size="md" />
              </CardContent>
            </Card>

            {/* Platform Breakdown */}
            <div className="lg:col-span-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformScores.map((score) => {
                // Determine platform config based on score platform name
                const isChatGPT = score.platform === 'ChatGPT' || score.platform === 'chatgpt' || score.platform === 'chat_gpt'
                const isGoogle = score.platform === 'Google AI Overview' || score.platform === 'google'
                
                const config = isChatGPT
                  ? { label: 'ChatGPT', color: 'bg-emerald-500', icon: '🤖' }
                  : isGoogle
                  ? { label: 'Google AI Overview', color: 'bg-blue-500', icon: '✨' }
                  : { label: score.platform, color: 'bg-gray-500', icon: '🤖' }
                
                return (
                  <Card key={score.platform} className="relative overflow-hidden">
                    <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full ${config.color}/5`} />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums">
                        {score.visibilityScore}%
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress 
                          value={score.mentionRate * 100} 
                          className="h-1.5 flex-1" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(score.mentionRate * 100)}% mentions
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(score.citationRate * 100)}% citation rate
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {platformScores.length === 0 && latestRun?.status === 'COMPLETED' && (
                <div className="lg:col-span-4 text-center py-8 text-muted-foreground">
                  No platform data available for this analysis
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Mentions</p>
                    <p className="text-3xl font-bold tabular-nums">
                      {latestRun?.totalMentions || 0}
                    </p>
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
                    <p className="text-3xl font-bold tabular-nums">
                      {latestRun?.totalCitations || 0}
                    </p>
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
                    <p className="text-sm font-medium text-muted-foreground">Keywords Tracked</p>
                    <p className="text-3xl font-bold tabular-nums">
                      {latestRun?.keywords.length || 0}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                    <TrendingUp className="h-6 w-6 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Runs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Analysis</CardTitle>
                <CardDescription>Your AI visibility analysis history</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {runs.slice(0, 5).map((run) => (
                  <Link
                    key={run.id}
                    href={domainUrl(`/ai-seo/${run.id}`)}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                        <Bot className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{run.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          {run.keywords.length} keywords • {run.llmPlatforms.length} platforms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {run.visibilityScore !== null && (
                        <div className="text-right">
                          <span className="text-lg font-bold tabular-nums">
                            {run.visibilityScore}
                          </span>
                          <span className="text-muted-foreground text-sm">/100</span>
                        </div>
                      )}
                      <Badge 
                        variant={run.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className={run.status === 'COMPLETED' ? 'bg-emerald-600' : ''}
                      >
                        {run.status.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Tips to improve your AI visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Create authoritative content</p>
                    <p className="text-xs text-muted-foreground">
                      AI models are more likely to cite sources that provide comprehensive, factual information
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Use structured data</p>
                    <p className="text-xs text-muted-foreground">
                      Implement Schema.org markup to help AI models understand your content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Build mentions on authoritative sites</p>
                    <p className="text-xs text-muted-foreground">
                      Get featured in industry publications and review sites that AI frequently references
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

