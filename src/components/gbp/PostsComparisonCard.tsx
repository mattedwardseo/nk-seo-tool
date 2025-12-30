'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

interface PostData {
  type: string
  snippet?: string | null
  post_text?: string | null
  post_date?: string | null
  timestamp?: string | null
  url?: string | null
  images_url?: string | null
}

interface BusinessPostsData {
  businessName: string
  gmbCid: string
  postsCount: number | null
  lastPostDate: string | null
  postsPerMonthAvg: number | null
  recentPosts: PostData[] | null
  postsFetchedAt: string | null
}

interface PostsComparisonCardProps {
  target: BusinessPostsData | null
  competitors: BusinessPostsData[]
}

export function PostsComparisonCard({
  target,
  competitors,
}: PostsComparisonCardProps): React.ReactElement {
  // Calculate stats
  const hasData = target?.postsFetchedAt || competitors.some((c) => c.postsFetchedAt)
  const avgCompetitorPosts = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + (c.postsCount ?? 0), 0) / competitors.length
    : 0
  const maxPosts = Math.max(
    target?.postsCount ?? 0,
    ...competitors.map((c) => c.postsCount ?? 0),
    1
  )

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return date.toLocaleDateString()
  }

  const getPostsActivityLevel = (posts: number | null, avgPosts: number): 'high' | 'medium' | 'low' | 'none' => {
    if (!posts || posts === 0) return 'none'
    if (posts >= avgPosts * 1.5) return 'high'
    if (posts >= avgPosts * 0.5) return 'medium'
    return 'low'
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Google Posts Comparison
          </CardTitle>
          <CardDescription>
            Click &quot;Fetch Data&quot; above to load Posts data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No posts data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const targetActivity = getPostsActivityLevel(target?.postsCount ?? 0, avgCompetitorPosts)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Google Posts Comparison
        </CardTitle>
        <CardDescription>
          Compare posting activity across GBP profiles
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{target?.postsCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Your Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(avgCompetitorPosts)}</div>
            <div className="text-xs text-muted-foreground">Avg Competitor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(target?.postsPerMonthAvg ?? 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Posts/Month</div>
          </div>
        </div>

        {/* Activity Status */}
        {targetActivity !== 'none' ? (
          <div className={`p-3 rounded-lg ${
            targetActivity === 'high' ? 'bg-green-50 dark:bg-green-950' :
            targetActivity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950' :
            'bg-red-50 dark:bg-red-950'
          }`}>
            <div className="flex items-center gap-2">
              {targetActivity === 'high' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : targetActivity === 'medium' ? (
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {targetActivity === 'high' ? 'Above average posting activity' :
                 targetActivity === 'medium' ? 'Average posting activity' :
                 'Below average posting activity'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last post: {formatDate(target?.lastPostDate)}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">No Google Posts found</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Start posting to improve your GBP engagement
            </p>
          </div>
        )}

        {/* Posts Bar Chart */}
        <div className="space-y-3">
          {/* Target */}
          {target && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[60%]">
                  {target.businessName}
                </span>
                <Badge variant="secondary" className="text-xs">You</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={((target.postsCount ?? 0) / maxPosts) * 100}
                  className="flex-1"
                />
                <span className="text-sm w-8 text-right">{target.postsCount ?? 0}</span>
              </div>
            </div>
          )}

          {/* Competitors */}
          {competitors.map((comp) => (
            <div key={comp.gmbCid}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[80%]">{comp.businessName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={((comp.postsCount ?? 0) / maxPosts) * 100}
                  className="flex-1 [&>div]:bg-muted-foreground"
                />
                <span className="text-sm w-8 text-right text-muted-foreground">
                  {comp.postsCount ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Posts Preview */}
        {target?.recentPosts && target.recentPosts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Your Recent Posts
            </h4>
            <div className="space-y-2">
              {target.recentPosts.slice(0, 3).map((post, index) => (
                <div
                  key={index}
                  className="p-2 border rounded text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-muted-foreground line-clamp-2">
                      {post.snippet || post.post_text || 'No content'}
                    </p>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(post.post_date || post.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {targetActivity !== 'high' && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Aim to post 2-4 times per month. Include photos,
            special offers, events, or updates to engage potential patients.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
