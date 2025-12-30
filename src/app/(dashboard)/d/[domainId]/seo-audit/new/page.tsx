'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KeywordAuditForm } from '@/components/seo-audit'
import { ArrowLeft, Search } from 'lucide-react'
import { useDomain } from '@/contexts/DomainContext'

export default function NewSEOAuditPage() {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/seo-audit')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Search className="h-6 w-6" />
            New Keyword Audit
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Analyze keyword optimization
          </p>
        </div>
      </div>

      <KeywordAuditForm
        onSuccess={(auditId) => {
          router.push(domainUrl(`/seo-audit/${auditId}`))
        }}
      />
    </div>
  )
}
