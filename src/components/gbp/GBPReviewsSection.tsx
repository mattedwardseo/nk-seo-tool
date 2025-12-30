'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RatingDistribution {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
}

interface ReviewHistory {
  date: Date
  rating: number
  reviewCount: number
}

interface GBPReviewsData {
  rating: number | null
  reviewCount: number | null
  ratingDistribution?: RatingDistribution | null
  history?: ReviewHistory[]
}

interface GBPReviewsSectionProps {
  reviews: GBPReviewsData
}

function StarRating({ rating }: { rating: number }): React.ReactElement {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-5 w-5 text-yellow-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      ))}
    </div>
  )
}

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number
  count: number
  total: number
}): React.ReactElement {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right">{stars}</span>
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <div className="flex-1">
        <Progress value={percentage} className="h-2" />
      </div>
      <span className="w-8 text-right text-muted-foreground">{count}</span>
    </div>
  )
}

export function GBPReviewsSection({ reviews }: GBPReviewsSectionProps): React.ReactElement {
  const distribution = reviews.ratingDistribution
  const totalReviews = reviews.reviewCount ?? 0

  // Calculate changes from history if available
  let ratingChange: number | null = null
  let reviewCountChange: number | null = null

  if (reviews.history && reviews.history.length >= 2) {
    const current = reviews.history[0]!
    const previous = reviews.history[1]!
    ratingChange = current.rating - previous.rating
    reviewCountChange = current.reviewCount - previous.reviewCount
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rating Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Main Rating */}
            <div className="text-center">
              <p className="text-5xl font-bold">
                {reviews.rating?.toFixed(1) ?? 'N/A'}
              </p>
              {reviews.rating && <StarRating rating={reviews.rating} />}
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews.toLocaleString()} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            {distribution && (
              <div className="flex-1 space-y-1.5">
                <RatingBar stars={5} count={distribution['5']} total={totalReviews} />
                <RatingBar stars={4} count={distribution['4']} total={totalReviews} />
                <RatingBar stars={3} count={distribution['3']} total={totalReviews} />
                <RatingBar stars={2} count={distribution['2']} total={totalReviews} />
                <RatingBar stars={1} count={distribution['1']} total={totalReviews} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Review Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Rating Trend */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Rating Trend
              </p>
              {ratingChange !== null ? (
                <div className="flex items-center gap-1">
                  {ratingChange > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        +{ratingChange.toFixed(2)}
                      </span>
                    </>
                  ) : ratingChange < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-600">
                        {ratingChange.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">No change</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">No data</span>
              )}
            </div>

            {/* New Reviews */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                New Reviews
              </p>
              {reviewCountChange !== null ? (
                <div className="flex items-center gap-1">
                  {reviewCountChange > 0 ? (
                    <span className="font-semibold text-green-600">
                      +{reviewCountChange}
                    </span>
                  ) : (
                    <span className="font-semibold">{reviewCountChange}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    since last scan
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">No data</span>
              )}
            </div>
          </div>

          {/* Additional Metrics */}
          {distribution && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {distribution['5'] + distribution['4']}
                  </p>
                  <p className="text-xs text-muted-foreground">Positive (4-5★)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {distribution['3']}
                  </p>
                  <p className="text-xs text-muted-foreground">Neutral (3★)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {distribution['2'] + distribution['1']}
                  </p>
                  <p className="text-xs text-muted-foreground">Negative (1-2★)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
