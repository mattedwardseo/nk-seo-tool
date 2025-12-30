'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { CompetitorDashboard } from '@/components/competitors'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useDomain } from '@/contexts/DomainContext'

export default function CompetitorPage(): React.ReactElement {
  const params = useParams()
  const domainId = params.domainId as string
  const auditId = params.id as string
  const { selectedDomain } = useDomain()

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="hover:bg-accent cursor-pointer transition-colors duration-150"
        >
          <Link href={domainUrl(`/audits/${auditId}`)}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to audit</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Competitor Comparison</h1>
          <p className="text-muted-foreground text-sm">
            {selectedDomain?.name || 'Loading...'} - Compare SEO performance against local competitors
          </p>
        </div>
      </div>

      {/* Competitor Dashboard */}
      <CompetitorDashboard auditId={auditId} />
    </div>
  )
}
