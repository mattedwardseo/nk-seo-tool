'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Bot, Sparkles, Lightbulb, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LLMMentionData {
  domain: string
  mentions: number
  aiSearchVolume: number
  impressions: number
  topKeywords: string[]
  isClient?: boolean
  isCompetitor?: boolean
  isIndustryLeader?: boolean
}

interface LLMMentionsCardProps {
  clientDomain: string
  mentionData: LLMMentionData[]
  locationKeywords?: string[]
  summary?: {
    clientMentions: number
    avgCompetitorMentions?: number
    avgIndustryMentions?: number
    mentionGap: number
    visibility: 'high' | 'medium' | 'low' | 'none'
    opportunityScore?: number
  }
  insight?: {
    title: string
    headline?: string
    subheadline?: string
    description: string
    recommendations: string[]
    potentialReach?: string
  }
  isLoading?: boolean
}

export function LLMMentionsCard({
  clientDomain,
  mentionData,
  locationKeywords = [],
  summary,
  insight,
  isLoading,
}: LLMMentionsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-500" />
            AI/LLM Visibility
          </CardTitle>
          <CardDescription>Checking AI citation data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const visibilityColor = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    low: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    none: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  }

  const clientData = mentionData.find((d) => d.isClient || d.domain === clientDomain)
  const industryLeaders = mentionData.filter((d) => d.isIndustryLeader)
  const localCompetitors = mentionData.filter((d) => d.isCompetitor && !d.isIndustryLeader)

  const maxMentions = Math.max(1, ...mentionData.map((d) => d.mentions))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              AI/LLM Visibility
            </CardTitle>
            <CardDescription>
              How often you&apos;re cited in ChatGPT, Perplexity & AI search
            </CardDescription>
          </div>
          {summary && (
            <Badge className={visibilityColor[summary.visibility]}>
              {summary.visibility === 'none'
                ? 'Not cited'
                : `${summary.visibility.charAt(0).toUpperCase() + summary.visibility.slice(1)} visibility`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headline insight if available */}
        {insight?.headline && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950">
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {insight.headline}
            </p>
            {insight.subheadline && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {insight.subheadline}
              </p>
            )}
            {insight.potentialReach && (
              <p className="mt-2 text-xs text-muted-foreground">
                {insight.potentialReach}
              </p>
            )}
          </div>
        )}

        {/* Your Practice */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Your Practice</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">{truncateDomain(clientDomain)}</span>
              </div>
              <span className="font-semibold text-red-500">
                {clientData?.mentions ?? 0} AI mentions
              </span>
            </div>
            <Progress
              value={maxMentions > 0 ? ((clientData?.mentions ?? 0) / maxMentions) * 100 : 0}
              className="h-3 [&>div]:bg-red-300"
            />
          </div>

          {/* Local competitors (also 0) */}
          {localCompetitors.slice(0, 2).map((comp) => (
            <div key={comp.domain} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">{truncateDomain(comp.domain)}</span>
                </div>
                <span className="text-muted-foreground">{comp.mentions} mentions</span>
              </div>
            </div>
          ))}
        </div>

        {/* Industry Leaders - Who IS getting mentioned */}
        {industryLeaders.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Who ChatGPT Actually Cites for Dental Queries
            </h4>
            {industryLeaders.slice(0, 5).map((leader, idx) => (
              <div key={leader.domain} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-amber-500' : 'bg-purple-500'
                      )}
                    />
                    <span>{truncateDomain(leader.domain)}</span>
                  </div>
                  <span className="font-semibold text-green-600">{leader.mentions} mentions</span>
                </div>
                <Progress
                  value={maxMentions > 0 ? (leader.mentions / maxMentions) * 100 : 0}
                  className={cn(
                    'h-3',
                    idx === 0
                      ? '[&>div]:bg-green-500'
                      : idx === 1
                        ? '[&>div]:bg-blue-500'
                        : idx === 2
                          ? '[&>div]:bg-amber-500'
                          : '[&>div]:bg-purple-500'
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {/* Insight panel */}
        {insight && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-purple-900 dark:text-purple-100">
                {insight.title}
              </h4>
            </div>
            <p className="mb-3 text-sm text-purple-800 dark:text-purple-200">
              {insight.description}
            </p>
            <div className="space-y-1">
              {insight.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm text-purple-700 dark:text-purple-300"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location keywords to track */}
        {locationKeywords.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Keywords to track in AI:</h4>
            <div className="flex flex-wrap gap-2">
              {locationKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Zero-state message - only show if no data at all */}
        {(!mentionData || mentionData.length === 0) && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Bot className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 font-medium">No AI citations detected</p>
            <p className="text-sm text-muted-foreground">
              This is common for local businesses. AI systems primarily cite Wikipedia,
              Reddit, and major health sites. This represents an opportunity to build
              authority content.
            </p>
          </div>
        )}

        {/* Link to learn more */}
        <a
          href="https://dataforseo.com/apis/ai-optimization"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Powered by DataForSEO AI Optimization API
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}

function truncateDomain(domain: string): string {
  const cleaned = domain.replace(/^www\./, '')
  return cleaned.length > 20 ? cleaned.substring(0, 20) + '...' : cleaned
}
