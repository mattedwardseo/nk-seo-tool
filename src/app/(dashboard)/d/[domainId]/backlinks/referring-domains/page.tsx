'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  ChevronLeft,
  ExternalLink,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

interface ReferringDomain {
  id: string
  domain: string
  backlinks: number
  domainRank: number
  firstSeen: string | null
  dofollow: number
  nofollow: number
}

export default function ReferringDomainsPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [domains, setDomains] = useState<ReferringDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState<'rank' | 'backlinks'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const domainUrl = (path: string): string => `/d/${domainId}${path}`
  const pageSize = 20

  useEffect(() => {
    if (!domainId) {
      setLoading(false)
      return
    }
    fetchDomains()
  }, [domainId, page, sortBy, sortOrder])

  const fetchDomains = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/backlinks/referring-domains?domainId=${domainId}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      )
      const data = await response.json()

      if (data.success) {
        setDomains(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        setError(data.error || 'Failed to load referring domains')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const toggleSort = (field: 'rank' | 'backlinks') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  if (loading && domains.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/backlinks')}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Referring Domains
          </h1>
          <p className="text-muted-foreground">
            {total.toLocaleString()} domains linking to {selectedDomain?.domain || 'your site'}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Referring Domains</CardTitle>
            <CardDescription>
              Domains that link to your website, sorted by {sortBy === 'rank' ? 'authority' : 'link count'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as 'rank' | 'backlinks'); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Sort by Rank</SelectItem>
                <SelectItem value="backlinks">Sort by Links</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {domains.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('backlinks')}
                        className="h-8 px-2 -ml-2"
                      >
                        Backlinks
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('rank')}
                        className="h-8 px-2 -ml-2"
                      >
                        Domain Rank
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Dofollow</TableHead>
                    <TableHead>Nofollow</TableHead>
                    <TableHead>First Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((rd) => (
                    <TableRow key={rd.id}>
                      <TableCell>
                        <a
                          href={`https://${rd.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline text-blue-600"
                        >
                          {rd.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>{formatNumber(rd.backlinks)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rd.domainRank >= 50 ? 'default' : 'secondary'}
                          className={rd.domainRank >= 50 ? 'bg-green-600' : ''}
                        >
                          {rd.domainRank}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600">{formatNumber(rd.dofollow)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatNumber(rd.nofollow)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {rd.firstSeen ? new Date(rd.firstSeen).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, total)} of {total.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No referring domains data available. Refresh the backlink profile first.
              </p>
              <Link href={domainUrl('/backlinks')}>
                <Button variant="outline" className="mt-4">
                  Go to Backlinks Overview
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && domains.length > 0 && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
