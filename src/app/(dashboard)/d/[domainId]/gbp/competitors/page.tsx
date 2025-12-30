'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Plus,
  RefreshCw,
  Loader2,
  Star,
  MapPin,
  ArrowUpDown,
  Download,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDomain } from '@/contexts/DomainContext'

interface GBPCompetitor {
  id: string
  businessName: string
  gmbCid: string
  rating: number | null
  reviewCount: number | null
  primaryCategory: string | null
  phone: string | null
  website: string | null
  address: string | null
  completenessScore: number | null
  avgRank: number | null
  shareOfVoice: number | null
  fetchedAt: string
}

export default function GBPCompetitorsPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [competitors, setCompetitors] = useState<GBPCompetitor[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'rank' | 'rating' | 'reviews'>('rank')

  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchCompetitors()
  }, [domainId, sortBy])

  const fetchCompetitors = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gbp/competitors?domainId=${domainId}&sortBy=${sortBy}&limit=15`)
      const data = await response.json()

      if (data.success) {
        setCompetitors(data.data)
      } else {
        setError(data.error || 'Failed to load competitors')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromGrid = async () => {
    setImporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/gbp/import-from-grid?domainId=${domainId}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        await fetchCompetitors()
      } else {
        setError(data.error || 'Failed to import competitors')
      }
    } catch {
      setError('Failed to import competitors')
    } finally {
      setImporting(false)
    }
  }

  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-success-foreground bg-success-bg'
    if (score >= 60) return 'text-warning-foreground bg-warning-bg'
    return 'text-error-foreground bg-error-bg'
  }

  const getRankColor = (rank: number | null): string => {
    if (rank === null) return 'text-muted-foreground'
    if (rank <= 3) return 'text-success-foreground bg-success-bg'
    if (rank <= 10) return 'text-warning-foreground bg-warning-bg'
    return 'text-error-foreground bg-error-bg'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={domainUrl('/gbp')} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" />
              GBP Competitors
            </h1>
          </div>
          <p className="text-muted-foreground">
            {selectedDomain?.name} - Compare with local competitors
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleImportFromGrid}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Import from Grid
          </Button>
          <Button className="cursor-pointer" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Competitors</p>
            <p className="text-2xl font-bold">{competitors.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              {competitors.length > 0
                ? (competitors.reduce((sum, c) => sum + (c.rating ?? 0), 0) / competitors.length).toFixed(1)
                : 'N/A'}
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Avg Reviews</p>
            <p className="text-2xl font-bold">
              {competitors.length > 0
                ? Math.round(competitors.reduce((sum, c) => sum + (c.reviewCount ?? 0), 0) / competitors.length)
                : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Avg Rank</p>
            <p className="text-2xl font-bold">
              {competitors.length > 0 && competitors.some(c => c.avgRank !== null)
                ? (competitors.filter(c => c.avgRank !== null).reduce((sum, c) => sum + (c.avgRank ?? 0), 0) / competitors.filter(c => c.avgRank !== null).length).toFixed(1)
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'rank' | 'rating' | 'reviews')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Avg Rank</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="reviews">Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Competitors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Profiles</CardTitle>
          <CardDescription>
            GBP profiles from your local market based on geo-grid rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4 cursor-pointer"
                onClick={fetchCompetitors}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : competitors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No competitors found</h3>
              <p className="text-muted-foreground mt-2">
                Run a geo-grid scan to discover local competitors, then import them here.
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Link href={domainUrl('/local-seo')}>
                  <Button variant="outline" className="cursor-pointer">
                    Go to Local SEO
                  </Button>
                </Link>
                <Button className="cursor-pointer" onClick={handleImportFromGrid} disabled={importing}>
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Import from Grid
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Business</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Reviews</TableHead>
                  <TableHead className="text-center">Avg Rank</TableHead>
                  <TableHead className="text-center">SOV</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{competitor.businessName}</p>
                        {competitor.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {competitor.address.split(',').slice(0, 2).join(',')}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {competitor.rating !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{competitor.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {competitor.reviewCount?.toLocaleString() ?? '—'}
                    </TableCell>

                    <TableCell className="text-center">
                      {competitor.avgRank !== null ? (
                        <Badge className={getRankColor(competitor.avgRank)}>
                          #{competitor.avgRank.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {competitor.shareOfVoice !== null ? (
                        <span className="font-medium">{competitor.shareOfVoice.toFixed(0)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {competitor.completenessScore !== null ? (
                        <Badge className={getScoreColor(competitor.completenessScore)}>
                          {competitor.completenessScore}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">{competitor.primaryCategory ?? '—'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Back link */}
      <Link href={domainUrl('/gbp')}>
        <Button variant="ghost" className="cursor-pointer">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to GBP Profile
        </Button>
      </Link>
    </div>
  )
}
