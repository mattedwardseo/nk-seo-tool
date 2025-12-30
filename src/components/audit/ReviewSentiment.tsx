'use client'

import * as React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type SentimentType = 'positive' | 'neutral' | 'negative'

export interface ReviewData {
  /** Unique review ID */
  id: string
  /** Review text (truncated) */
  text: string
  /** Star rating (1-5) */
  rating: number
  /** Detected sentiment */
  sentiment: SentimentType
  /** Review date */
  date: string
  /** Reviewer name */
  reviewerName?: string
  /** Key topics mentioned */
  topics?: string[]
}

export interface SentimentStats {
  /** Total review count */
  total: number
  /** Average rating (1-5) */
  averageRating: number
  /** Sentiment breakdown */
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  /** Rating distribution */
  ratings: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  /** Trend vs previous period */
  trend?: {
    ratingChange: number
    reviewCountChange: number
  }
  /** Common topics */
  topTopics?: Array<{
    topic: string
    count: number
    sentiment: SentimentType
  }>
}

export interface ReviewSentimentProps {
  /** Sentiment statistics */
  stats: SentimentStats
  /** Sample reviews to display */
  reviews?: ReviewData[]
  /** Title for the card */
  title?: string
  /** Description for the card */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Maximum reviews to show */
  maxReviews?: number
}

// ============================================================================
// Constants
// ============================================================================

const SENTIMENT_CONFIG: Record<
  SentimentType,
  { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  positive: { color: '#22c55e', bgColor: 'bg-green-500', icon: ThumbsUp },
  neutral: { color: '#eab308', bgColor: 'bg-yellow-500', icon: Minus },
  negative: { color: '#ef4444', bgColor: 'bg-red-500', icon: ThumbsDown },
}

const RATING_COLORS: Record<number, string> = {
  5: '#22c55e',
  4: '#84cc16',
  3: '#eab308',
  2: '#f97316',
  1: '#ef4444',
}

// ============================================================================
// Sub-components
// ============================================================================

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}

function RatingStars({ rating, size = 'md' }: RatingStarsProps): React.ReactElement {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

interface SentimentPieChartProps {
  data: SentimentStats['sentiment']
  size?: number
}

function SentimentPieChart({ data, size = 120 }: SentimentPieChartProps): React.ReactElement {
  const chartData = [
    { name: 'Positive', value: data.positive, color: SENTIMENT_CONFIG.positive.color },
    { name: 'Neutral', value: data.neutral, color: SENTIMENT_CONFIG.neutral.color },
    { name: 'Negative', value: data.negative, color: SENTIMENT_CONFIG.negative.color },
  ].filter((d) => d.value > 0)

  const total = data.positive + data.neutral + data.negative

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const data = payload[0]
              const percentage = ((data.value as number) / total) * 100
              return (
                <div className="bg-background rounded border p-2 shadow">
                  <p className="text-sm font-medium">{data.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {data.value} ({percentage.toFixed(1)}%)
                  </p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-muted-foreground text-xs">Reviews</span>
      </div>
    </div>
  )
}

interface RatingDistributionProps {
  ratings: SentimentStats['ratings']
  total: number
}

function RatingDistribution({ ratings, total }: RatingDistributionProps): React.ReactElement {
  return (
    <div className="space-y-2">
      {([5, 4, 3, 2, 1] as const).map((rating) => {
        const count = ratings[rating]
        const percentage = total > 0 ? (count / total) * 100 : 0

        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-3 text-sm font-medium">{rating}</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: RATING_COLORS[rating],
                }}
              />
            </div>
            <span className="text-muted-foreground w-8 text-right text-xs">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

interface ReviewCardProps {
  review: ReviewData
}

function ReviewCard({ review }: ReviewCardProps): React.ReactElement {
  const sentimentConfig = SENTIMENT_CONFIG[review.sentiment]
  const SentimentIcon = sentimentConfig.icon

  return (
    <div className="hover:bg-muted/50 rounded-lg border p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} size="sm" />
          <span className="text-muted-foreground text-xs">{review.date}</span>
        </div>
        <span style={{ color: sentimentConfig.color }}>
          <SentimentIcon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm">{review.text}</p>
      {review.topics && review.topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ReviewSentiment - Review analysis dashboard
 *
 * Displays review statistics, sentiment analysis, and sample reviews.
 *
 * @example
 * ```tsx
 * <ReviewSentiment
 *   stats={{
 *     total: 150,
 *     averageRating: 4.2,
 *     sentiment: { positive: 100, neutral: 30, negative: 20 },
 *     ratings: { 5: 80, 4: 40, 3: 15, 2: 10, 1: 5 }
 *   }}
 *   reviews={[...]}
 * />
 * ```
 */
export function ReviewSentiment({
  stats,
  reviews = [],
  title = 'Review Analysis',
  description = 'Customer review sentiment and ratings',
  className,
  maxReviews = 3,
}: ReviewSentimentProps): React.ReactElement {
  const displayedReviews = reviews.slice(0, maxReviews)

  // Calculate sentiment totals for percentage calculations
  const sentimentTotal =
    stats.sentiment.positive + stats.sentiment.neutral + stats.sentiment.negative

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {stats.trend && (
            <div className="flex items-center gap-1 text-sm">
              {stats.trend.ratingChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : stats.trend.ratingChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="text-muted-foreground h-4 w-4" />
              )}
              <span
                className={cn(
                  stats.trend.ratingChange > 0
                    ? 'text-green-600'
                    : stats.trend.ratingChange < 0
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                )}
              >
                {stats.trend.ratingChange > 0 ? '+' : ''}
                {stats.trend.ratingChange.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <RatingStars rating={Math.round(stats.averageRating)} size="md" />
            <p className="text-muted-foreground mt-1 text-xs">{stats.total} reviews</p>
          </div>

          {/* Sentiment Pie */}
          <SentimentPieChart data={stats.sentiment} />

          {/* Sentiment Legend */}
          <div className="space-y-2">
            {(['positive', 'neutral', 'negative'] as const).map((sentiment) => {
              const config = SENTIMENT_CONFIG[sentiment]
              const Icon = config.icon
              const count = stats.sentiment[sentiment]
              const percentage =
                sentimentTotal > 0 ? ((count / sentimentTotal) * 100).toFixed(0) : '0'

              return (
                <div key={sentiment} className="flex items-center gap-2 text-sm">
                  <span style={{ color: config.color }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="capitalize">{sentiment}</span>
                  <span className="text-muted-foreground">({percentage}%)</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rating Distribution */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Rating Distribution</h4>
          <RatingDistribution ratings={stats.ratings} total={stats.total} />
        </div>

        {/* Top Topics */}
        {stats.topTopics && stats.topTopics.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium">Common Topics</h4>
            <div className="flex flex-wrap gap-2">
              {stats.topTopics.map((topic) => (
                <Badge
                  key={topic.topic}
                  variant="outline"
                  className="gap-1"
                  style={{
                    borderColor: SENTIMENT_CONFIG[topic.sentiment].color,
                    color: SENTIMENT_CONFIG[topic.sentiment].color,
                  }}
                >
                  {topic.topic}
                  <span className="text-muted-foreground">({topic.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample Reviews */}
        {displayedReviews.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium">Recent Reviews</h4>
            <div className="space-y-2">
              {displayedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* No Reviews State */}
        {stats.total === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="text-muted-foreground h-8 w-8" />
            <p className="mt-4 font-medium">No Reviews Found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              This business doesn&apos;t have any reviews yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Compact Summary
// ============================================================================

export interface ReviewSummaryProps {
  averageRating: number
  totalReviews: number
  positivePercentage: number
  className?: string
}

/**
 * Compact review summary for overview displays
 */
export function ReviewSummary({
  averageRating,
  totalReviews,
  positivePercentage,
  className,
}: ReviewSummaryProps): React.ReactElement {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Reviews</span>
        <Badge variant={positivePercentage >= 70 ? 'default' : 'secondary'}>
          {positivePercentage}% positive
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
        <RatingStars rating={Math.round(averageRating)} size="sm" />
        <span className="text-muted-foreground text-sm">({totalReviews})</span>
      </div>
    </div>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export interface ReviewSentimentSkeletonProps {
  className?: string
}

export function ReviewSentimentSkeleton({
  className,
}: ReviewSentimentSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="bg-muted h-6 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-56 animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="bg-muted h-12 w-16 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-20 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-[120px] w-[120px] animate-pulse rounded-full" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ReviewSentiment
