'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDomain } from '@/contexts/DomainContext'
import { CalculatorCard } from '@/components/calculators'
import { TrendingUp, Plus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SEOCalculation {
  id: string
  name: string | null
  ctrScenario: string
  combinedSearchVolume: number
  totalTraffic: number
  adjustedNps: number | null
  shortTermReturn: number | null
  lifetimeReturn: number | null
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SEOCalculatorListPage() {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [calculations, setCalculations] = useState<SEOCalculation[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const fetchCalculations = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/calculators/seo?domainId=${domainId}&page=${page}&limit=12`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calculations')
      }

      setCalculations(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calculations')
    } finally {
      setIsLoading(false)
    }
  }, [domainId])

  useEffect(() => {
    fetchCalculations()
  }, [fetchCalculations])

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/calculators/seo/${id}/duplicate`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate calculation')
      }

      // Refresh the list
      fetchCalculations(pagination?.page || 1)
    } catch (err) {
      console.error('Duplicate error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/calculators/seo/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete calculation')
      }

      // Refresh the list
      fetchCalculations(pagination?.page || 1)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6" />
            SEO Calculator
          </h1>
          <p className="text-muted-foreground">
            ROI projections for <span className="font-medium">{selectedDomain?.name || 'Loading...'}</span>
          </p>
        </div>
        <Button asChild>
          <Link href={domainUrl('/calculators/seo/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Calculation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => fetchCalculations()} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : calculations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No Calculations Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first SEO ROI calculation
            </p>
            <Button asChild>
              <Link href={domainUrl('/calculators/seo/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Calculation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculations.map((calc) => (
              <CalculatorCard
                key={calc.id}
                id={calc.id}
                name={calc.name}
                type="seo"
                createdAt={calc.createdAt}
                totalTraffic={calc.totalTraffic}
                adjustedNps={calc.adjustedNps}
                shortTermReturn={calc.shortTermReturn}
                lifetimeReturn={calc.lifetimeReturn}
                ctrScenario={calc.ctrScenario}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                basePath={domainUrl('/calculators/seo')}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCalculations(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCalculations(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
