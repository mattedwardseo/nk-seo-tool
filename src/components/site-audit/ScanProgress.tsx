'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Globe } from 'lucide-react';

interface ScanStatus {
  id: string;
  status: 'PENDING' | 'SUBMITTING' | 'CRAWLING' | 'FETCHING_RESULTS' | 'COMPLETED' | 'FAILED';
  progress: number;
  taskId: string | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  errorMessage: string | null;
}

interface ScanProgressProps {
  scanId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

function getStatusLabel(status: string): { label: string; description: string } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', description: 'Waiting in queue...' };
    case 'SUBMITTING':
      return { label: 'Starting', description: 'Submitting crawl task to DataForSEO...' };
    case 'CRAWLING':
      return { label: 'Crawling', description: 'Crawling website pages...' };
    case 'FETCHING_RESULTS':
      return { label: 'Fetching Results', description: 'Downloading crawl results...' };
    case 'COMPLETED':
      return { label: 'Completed', description: 'Site audit complete!' };
    case 'FAILED':
      return { label: 'Failed', description: 'Scan encountered an error' };
    default:
      return { label: status, description: '' };
  }
}

export function ScanProgress({
  scanId,
  onComplete,
  onError,
}: ScanProgressProps): React.ReactElement {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/site-audit/scans/${scanId}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data.data);

      // Check for completion
      if (data.data.status === 'COMPLETED') {
        setIsPolling(false);
        onComplete?.();
      } else if (data.data.status === 'FAILED') {
        setIsPolling(false);
        onError?.(data.data.errorMessage || 'Scan failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setIsPolling(false);
    }
  }, [scanId, onComplete, onError]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Poll every 3 seconds while in progress
    let interval: NodeJS.Timeout | null = null;
    if (isPolling) {
      interval = setInterval(fetchStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStatus, isPolling]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusLabel(status.status);
  const isComplete = status.status === 'COMPLETED';
  const isFailed = status.status === 'FAILED';
  const isInProgress = !isComplete && !isFailed;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scan Progress
          </span>
          <Badge
            variant={
              isComplete ? 'outline' : isFailed ? 'destructive' : 'default'
            }
          >
            {isComplete && <CheckCircle className="h-3 w-3 mr-1" />}
            {isFailed && <AlertCircle className="h-3 w-3 mr-1" />}
            {isInProgress && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {statusInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{statusInfo.description}</span>
            <span className="font-medium">{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-3" />
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Task ID</p>
            <p className="font-mono text-xs truncate">
              {status.taskId || 'Not assigned yet'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Started</p>
            <p>
              {status.startedAt
                ? new Date(status.startedAt).toLocaleTimeString()
                : 'Waiting...'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {isFailed && status.errorMessage && (
          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <p className="font-medium mb-1">Error Details:</p>
            <p>{status.errorMessage}</p>
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <div className="p-3 bg-green-500/10 rounded-lg text-sm text-green-700 dark:text-green-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Site audit completed successfully!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
