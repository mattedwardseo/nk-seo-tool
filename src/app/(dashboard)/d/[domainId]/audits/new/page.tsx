'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { NewAuditForm, AuditProgress } from '@/components/audit'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useDomain } from '@/contexts/DomainContext'

export default function NewAuditPage(): React.ReactElement {
  const params = useParams()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [auditId, setAuditId] = React.useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const handleAuditCreated = (id: string): void => {
    setAuditId(id)
  }

  const handleComplete = (): void => {
    // Optionally auto-redirect on completion
  }

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
          <Link href={domainUrl('/audits')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to projects</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
          <p className="text-muted-foreground text-sm">
            {selectedDomain?.name || 'Loading...'} - Run a comprehensive SEO audit
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <NewAuditForm onAuditCreated={handleAuditCreated} />

        {/* Progress or Instructions */}
        {auditId ? (
          <div className="space-y-4">
            <AuditProgress auditId={auditId} onComplete={handleComplete} />
            <Button
              variant="outline"
              className="w-full cursor-pointer transition-colors duration-150"
              asChild
            >
              <Link href={domainUrl(`/audits/${auditId}`)}>
                View Full Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg border p-6">
            <h2 className="mb-4 font-semibold">What We Analyze</h2>
            <ul className="text-muted-foreground space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong className="text-foreground">Technical SEO</strong> - Page speed,
                  mobile-friendliness, HTTPS, schema markup
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong className="text-foreground">Content & Rankings</strong> - Keyword
                  positions, featured snippets, SERP presence
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong className="text-foreground">Local SEO</strong> - Google Business Profile,
                  reviews, NAP consistency
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span>
                  <strong className="text-foreground">Backlinks</strong> - Domain authority,
                  referring domains, link quality
                </span>
              </li>
            </ul>
            <div className="bg-background text-muted-foreground mt-6 rounded-md p-3 text-xs">
              Projects typically complete in 30-60 seconds
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
