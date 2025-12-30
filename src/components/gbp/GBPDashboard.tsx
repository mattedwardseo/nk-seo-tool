'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Star, Settings, RefreshCw } from 'lucide-react'
import { GBPProfileSection } from './GBPProfileSection'
import { GBPReviewsSection } from './GBPReviewsSection'
import { GBPAttributesSection } from './GBPAttributesSection'
import { Button } from '@/components/ui/button'

interface DayHours {
  day: string
  open: string
  close: string
  isOpen: boolean
}

interface RatingDistribution {
  '1': number
  '2': number
  '3': number
  '4': number
  '5': number
}

interface AttributeCategory {
  category: string
  attributes: string[]
}

interface GBPSnapshotData {
  id: string
  businessName: string
  gmbPlaceId?: string | null
  gmbCid?: string | null
  rating: number | null
  reviewCount: number | null
  ratingDistribution?: RatingDistribution | null
  completenessScore: number | null
  address?: string | null
  phone?: string | null
  website?: string | null
  categories?: string[]
  attributes?: AttributeCategory[]
  workHours?: DayHours[]
  photoCount?: number
  photoUrls?: string[]
  createdAt: Date
}

interface GBPHistory {
  id: string
  rating: number | null
  reviewCount: number | null
  completenessScore: number | null
  createdAt: Date
}

interface GBPDashboardProps {
  snapshot: GBPSnapshotData | null
  history?: GBPHistory[]
  isLoading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function GBPDashboard({
  snapshot,
  history = [],
  isLoading = false,
  onRefresh,
  isRefreshing = false,
}: GBPDashboardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No GBP Data Available</p>
            <p className="text-sm mt-1">
              GBP data will be captured during the next scan
            </p>
            {onRefresh && (
              <Button variant="outline" className="mt-4" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert history to review history format
  const reviewHistory = history.map((h) => ({
    date: h.createdAt,
    rating: h.rating ?? 0,
    reviewCount: h.reviewCount ?? 0,
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Google Business Profile
          </CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(snapshot.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Attributes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <GBPProfileSection
              profile={{
                businessName: snapshot.businessName,
                address: snapshot.address,
                phone: snapshot.phone,
                website: snapshot.website,
                categories: snapshot.categories,
                workHours: snapshot.workHours,
                photoCount: snapshot.photoCount,
                completenessScore: snapshot.completenessScore,
              }}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <GBPReviewsSection
              reviews={{
                rating: snapshot.rating,
                reviewCount: snapshot.reviewCount,
                ratingDistribution: snapshot.ratingDistribution,
                history: reviewHistory,
              }}
            />
          </TabsContent>

          <TabsContent value="attributes">
            <GBPAttributesSection attributes={snapshot.attributes ?? []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
