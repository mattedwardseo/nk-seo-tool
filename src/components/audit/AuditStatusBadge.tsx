'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AuditStatus, type AuditStatusType } from '@/types/audit'
import { CheckCircle2, Clock, Loader2, XCircle, Search } from 'lucide-react'

interface AuditStatusBadgeProps {
  status: AuditStatusType
  className?: string
}

const statusConfig: Record<
  AuditStatusType,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: React.ReactNode
    className: string
  }
> = {
  [AuditStatus.PENDING]: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  [AuditStatus.CRAWLING]: {
    label: 'Crawling',
    variant: 'secondary',
    icon: <Search className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  [AuditStatus.ANALYZING]: {
    label: 'Analyzing',
    variant: 'secondary',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
  [AuditStatus.COMPLETED]: {
    label: 'Completed',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  [AuditStatus.FAILED]: {
    label: 'Failed',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
}

export function AuditStatusBadge({ status, className }: AuditStatusBadgeProps): React.ReactElement {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn('flex items-center gap-1.5 font-medium', config.className, className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}
