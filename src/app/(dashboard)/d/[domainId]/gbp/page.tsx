'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  RefreshCw,
  Loader2,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  MessageSquare,
  Image,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDomain } from '@/contexts/DomainContext'

interface GBPProfile {
  id: string
  businessName: string
  gmbCid: string | null
  rating: number | null
  reviewCount: number | null
  primaryCategory: string | null
  additionalCategories: string[]
  phone: string | null
  website: string | null
  address: string | null
  description: string | null
  workHours: Record<string, string[]> | null
  attributes: Record<string, string[]> | null
  isClaimed: boolean
  photoCount: number | null
  completenessScore: number | null
  // Reviews
  reviewsFetchedAt: string | null
  reviewsCountByRating: Record<string, number> | null
  ownerResponseRate: number | null
  // Posts
  postsFetchedAt: string | null
  postsCount: number | null
  lastPostDate: string | null
  postsPerMonthAvg: number | null
  // Q&A
  qaFetchedAt: string | null
  questionsCount: number | null
  answeredCount: number | null
  unansweredCount: number | null
  // Services & Products
  servicesCount: number | null
  productsCount: number | null
  menuUrl: string | null
  bookingUrl: string | null
  // Metadata
  fetchedAt: string
}

export default function GBPProfilePage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [profile, setProfile] = useState<GBPProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchingDetailed, setFetchingDetailed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchProfile()
  }, [domainId])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gbp/profile?domainId=${domainId}`)
      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
      } else {
        setError(data.error || 'Failed to load GBP profile')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/gbp/fetch?domainId=${domainId}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        await fetchProfile()
      } else {
        setError(data.error || 'Failed to refresh GBP data')
      }
    } catch {
      setError('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFetchDetailed = async () => {
    setFetchingDetailed(true)
    try {
      const response = await fetch(`/api/gbp/fetch?domainId=${domainId}&fetchDetailed=true`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        await fetchProfile()
      } else {
        setError(data.error || 'Failed to fetch detailed data')
      }
    } catch {
      setError('Failed to fetch detailed data')
    } finally {
      setFetchingDetailed(false)
    }
  }

  const hasDetailedData = Boolean(
    profile?.postsFetchedAt || profile?.qaFetchedAt || profile?.reviewsFetchedAt
  )

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-success-foreground bg-success-bg'
    if (score >= 60) return 'text-warning-foreground bg-warning-bg'
    return 'text-error-foreground bg-error-bg'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            GBP Profile
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Google Business Profile Management
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No GBP Profile Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {error || 'Create a Local SEO campaign first, or search for your business to add a GBP profile.'}
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href={domainUrl('/local-seo/new')}>
                <Button variant="outline" className="cursor-pointer">
                  Create Local Campaign
                </Button>
              </Link>
              <Button className="cursor-pointer" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Search for Business
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            GBP Profile
          </h1>
          <p className="text-muted-foreground">
            {profile?.businessName || selectedDomain?.name} - Google Business Profile
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={handleRefresh} disabled={refreshing || fetchingDetailed}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Data
          </Button>
          <Button
            variant={hasDetailedData ? 'outline' : 'default'}
            className="cursor-pointer"
            onClick={handleFetchDetailed}
            disabled={fetchingDetailed || refreshing}
          >
            {fetchingDetailed ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            {hasDetailedData ? 'Refresh Posts/Q&A' : 'Fetch Posts & Q&A'}
          </Button>
          <Link href={domainUrl('/gbp/analysis')}>
            <Button className="cursor-pointer" variant={hasDetailedData ? 'default' : 'outline'}>
              Run Analysis
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {profile?.rating?.toFixed(1) || 'N/A'}
                  {profile?.rating && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Reviews</p>
                <p className="text-lg font-semibold">{profile?.reviewCount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                <p className={`text-2xl font-bold rounded px-2 py-0.5 inline-block ${getScoreColor(profile?.completenessScore ?? null)}`}>
                  {profile?.completenessScore ?? 'N/A'}%
                </p>
              </div>
              <Badge variant={profile?.isClaimed ? 'default' : 'secondary'}>
                {profile?.isClaimed ? 'Claimed' : 'Unclaimed'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Photos</p>
            <p className="text-2xl font-bold">{profile?.photoCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(profile?.photoCount ?? 0) >= 50 ? 'Good coverage' : 'Add more photos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Posting Activity</p>
            <p className="text-2xl font-bold">{profile?.postsPerMonthAvg?.toFixed(1) ?? 0}/mo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last post: {formatDate(profile?.lastPostDate ?? null)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{profile?.address || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{profile?.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Website</p>
                {profile?.website ? (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {profile.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Hours</p>
                {profile?.workHours && Object.keys(profile.workHours).length > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(profile.workHours).slice(0, 3).map(([day, hours]) => (
                      <p key={day} className="capitalize">{day}: {hours.join(', ') || 'Closed'}</p>
                    ))}
                    {Object.keys(profile.workHours).length > 3 && (
                      <p className="text-xs">+{Object.keys(profile.workHours).length - 3} more days</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Categories & Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Primary Category</p>
              <Badge variant="default" className="text-sm">
                {profile?.primaryCategory || 'Not set'}
              </Badge>
            </div>

            {profile?.additionalCategories && profile.additionalCategories.length > 0 && (
              <div>
                <p className="font-medium mb-2">Additional Categories</p>
                <div className="flex flex-wrap gap-2">
                  {profile.additionalCategories.map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Description</p>
              {profile?.description ? (
                <p className="text-sm text-muted-foreground line-clamp-4">{profile.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description set</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews Summary
            </CardTitle>
            <CardDescription>
              Last updated: {formatDate(profile?.reviewsFetchedAt ?? null)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.reviewsCountByRating ? (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = profile.reviewsCountByRating?.[rating.toString()] ?? 0
                  const total = profile.reviewCount ?? 1
                  const percentage = (count / total) * 100
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-12">{rating} star</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No review data available</p>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Response Rate</span>
                <span className="font-medium">
                  {profile?.ownerResponseRate?.toFixed(0) ?? 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts & Q&A */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Posts & Q&A
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-xl font-bold">{profile?.postsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.postsPerMonthAvg?.toFixed(1) ?? 0} per month avg
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Q&A</p>
                <p className="text-xl font-bold">
                  {profile?.answeredCount ?? 0}/{profile?.questionsCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">answered</p>
              </div>
            </div>

            {(profile?.unansweredCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning-bg text-warning-foreground">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{profile?.unansweredCount} unanswered questions</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Services Listed</p>
                <p className="font-medium">{profile?.servicesCount ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products Listed</p>
                <p className="font-medium">{profile?.productsCount ?? 0}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {profile?.menuUrl && (
                <a href={profile.menuUrl} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Menu
                  </Badge>
                </a>
              )}
              {profile?.bookingUrl && (
                <a href={profile.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Booking
                  </Badge>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attributes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Attributes
            </CardTitle>
            <CardDescription>
              Business attributes and amenities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.attributes && Object.keys(profile.attributes).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(profile.attributes).map(([category, values]) => (
                  <div key={category}>
                    <p className="font-medium text-sm capitalize mb-2">{category.replace(/_/g, ' ')}</p>
                    <div className="flex flex-wrap gap-1">
                      {(values as string[]).map((value, i) => (
                        <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attributes set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="flex gap-4">
        <Link href={domainUrl('/gbp/competitors')}>
          <Button variant="outline" className="cursor-pointer">
            View Competitors
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href={domainUrl('/gbp/analysis')}>
          <Button variant="outline" className="cursor-pointer">
            GBP Analysis
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-muted-foreground">
        Profile data last fetched: {formatDate(profile?.fetchedAt ?? null)}
      </p>
    </div>
  )
}
