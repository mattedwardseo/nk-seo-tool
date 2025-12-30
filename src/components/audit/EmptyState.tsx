'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon
  /** Title text */
  title: string
  /** Description text */
  description: string
  /** Optional action button */
  action?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * EmptyState component for displaying when data is not available
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm">{description}</p>
      {action}
    </div>
  )
}

export default EmptyState
