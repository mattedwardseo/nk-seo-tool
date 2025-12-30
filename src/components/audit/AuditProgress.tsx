'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AuditStatusBadge } from './AuditStatusBadge'
import { type AuditStatusType, AuditStatus } from '@/types/audit'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditProgressProps {
  auditId: string
  onComplete?: () => void
  onError?: (error: string) => void
  /** Polling interval in ms. Default 2000. Set to 0 for immediate single fetch (testing). */
  pollInterval?: number
}

interface StatusResponse {
  success: boolean
  data: {
    id: string
    status: AuditStatusType
    progress: number
    currentStep: string | null
    currentStepDescription: string | null
    errorMessage: string | null
    isComplete: boolean
    isFailed: boolean
    isInProgress: boolean
    estimatedSecondsRemaining: number | null
  }
}

const DEFAULT_POLL_INTERVAL = 2000 // 2 seconds

export function AuditProgress({
  auditId,
  onComplete,
  onError,
  pollInterval = DEFAULT_POLL_INTERVAL,
}: AuditProgressProps): React.ReactElement {
  const [status, setStatus] = React.useState<StatusResponse['data'] | null>(null)
  const [isPolling, setIsPolling] = React.useState(true)

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true

    const pollStatus = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/audits/${auditId}/status`)
        const data: StatusResponse = await response.json()

        if (data.success && isMounted) {
          setStatus(data.data)

          if (data.data.isComplete) {
            setIsPolling(false)
            onComplete?.()
          } else if (data.data.isFailed) {
            setIsPolling(false)
            onError?.(data.data.errorMessage || 'Audit failed')
          }
        }
      } catch {
        // Continue polling on network errors
      }

      // Only schedule next poll if still polling and interval > 0
      if (isPolling && pollInterval > 0 && isMounted) {
        timeoutId = setTimeout(pollStatus, pollInterval)
      }
    }

    pollStatus()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [auditId, isPolling, onComplete, onError, pollInterval])

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-center">
            <Clock className="mx-auto mb-2 h-8 w-8" />
            <p>Loading audit status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isComplete = status.status === AuditStatus.COMPLETED
  const isFailed = status.status === AuditStatus.FAILED

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Progress</CardTitle>
            <CardDescription>
              {isComplete
                ? 'Audit completed successfully'
                : isFailed
                  ? 'Audit failed'
                  : 'Your audit is being processed'}
            </CardDescription>
          </div>
          <AuditStatusBadge status={status.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{status.progress}%</span>
          </div>
          <Progress
            value={status.progress}
            className={cn(
              'h-2',
              isComplete && 'bg-green-100 [&>div]:bg-green-500',
              isFailed && 'bg-red-100 [&>div]:bg-red-500'
            )}
          />
        </div>

        {/* Current Step */}
        {status.currentStepDescription && !isComplete && !isFailed && (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-muted-foreground text-sm">Current Step</p>
            <p className="font-medium">{status.currentStepDescription}</p>
          </div>
        )}

        {/* Completion Status */}
        {isComplete && (
          <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">Audit Complete</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                View the results to see your SEO scores and recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Error Status */}
        {isFailed && status.errorMessage && (
          <div className="flex items-center gap-3 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">Audit Failed</p>
              <p className="text-sm text-red-600 dark:text-red-400">{status.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {status.estimatedSecondsRemaining !== null &&
          status.estimatedSecondsRemaining > 0 &&
          !isComplete &&
          !isFailed && (
            <p className="text-muted-foreground text-center text-sm">
              Estimated time remaining: ~{Math.ceil(status.estimatedSecondsRemaining / 60)} min
            </p>
          )}
      </CardContent>
    </Card>
  )
}
