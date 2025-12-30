'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          There was an error loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={reset} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

