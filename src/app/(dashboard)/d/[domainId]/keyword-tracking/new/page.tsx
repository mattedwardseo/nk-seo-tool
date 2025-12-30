'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Play, Loader2, AlertCircle, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDomain } from '@/contexts/DomainContext'
import { RunProgress } from '@/components/keyword-tracking'

export default function NewKeywordTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const domainId = params.domainId as string
  const { selectedDomain } = useDomain()
  const [starting, setStarting] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Helper to build domain-scoped URLs
  const domainUrl = (path: string): string => `/d/${domainId}${path}`

  const handleStartTracking = async () => {
    setStarting(true)
    setError(null)

    try {
      const response = await fetch('/api/keyword-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domainId,
          locationName: 'United States',
          languageCode: 'en',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRunId(data.data.runId)
      } else {
        setError(data.error || 'Failed to start tracking')
        setStarting(false)
      }
    } catch {
      setError('Failed to connect to server')
      setStarting(false)
    }
  }

  const handleComplete = () => {
    if (runId) {
      router.push(domainUrl(`/keyword-tracking/${runId}`))
    }
  }

  if (runId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tracking in Progress</h1>
          <p className="text-muted-foreground">
            Fetching SERP positions for your keywords
          </p>
        </div>

        <RunProgress runId={runId} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={domainUrl('/keyword-tracking')}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Run Keyword Tracking
          </h1>
          <p className="text-muted-foreground">
            {selectedDomain?.name || 'Loading...'} - Track SERP positions
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Start Tracking Run</CardTitle>
          <CardDescription>
            This will fetch live SERP rankings for all tracked keywords in your
            keyword library for {selectedDomain?.domain || 'your domain'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Domain</p>
              <p className="text-muted-foreground">{selectedDomain?.domain || 'Loading...'}</p>
            </div>
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">United States</p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Make sure you have keywords in your keyword
              library before running. The tracking will fetch live SERP data for
              each keyword, which incurs API costs (~$0.002/keyword).
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleStartTracking}
            disabled={starting}
            className="w-full cursor-pointer"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Tracking
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
