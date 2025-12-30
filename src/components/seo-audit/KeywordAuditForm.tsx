'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Globe, Target } from 'lucide-react'

interface KeywordAuditFormProps {
  domainId?: string
  onSuccess?: (auditId: string) => void
}

export function KeywordAuditForm({ domainId, onSuccess }: KeywordAuditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [url, setUrl] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [locationName, setLocationName] = useState('United States')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/seo-audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          targetKeyword,
          locationName: locationName || undefined,
          domainId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create audit')
      }

      if (onSuccess) {
        onSuccess(data.data.auditId)
      } else {
        router.push(`/seo-audit/${data.data.auditId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Keyword Optimization Audit
        </CardTitle>
        <CardDescription>
          Analyze how well a page is optimized for a target keyword. Get actionable recommendations
          to improve rankings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Page URL
            </Label>
            <Input
              id="url"
              type="text"
              placeholder="https://example.com/services/dental-implants"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Enter the full URL of the page you want to analyze
            </p>
          </div>

          {/* Target Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="keyword" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target Keyword
            </Label>
            <Input
              id="keyword"
              type="text"
              placeholder="dentist chicago"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              The keyword you want this page to rank for
            </p>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              type="text"
              placeholder="United States"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Geographic location for search data (e.g., &quot;Chicago, Illinois, United
              States&quot;)
            </p>
          </div>

          {/* Cost Notice */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Estimated Cost:</strong> ~$0.07-0.10 per audit
              <br />
              <span className="text-xs">
                Includes domain analysis, SERP data, backlinks, keyword suggestions, and AI-powered
                report generation.
              </span>
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing... (30-60 seconds)
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run Keyword Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
