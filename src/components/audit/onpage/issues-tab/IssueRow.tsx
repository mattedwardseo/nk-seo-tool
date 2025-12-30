'use client'

import { useState } from 'react'
import { ChevronDown, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { IssueDefinition } from '../types'

interface IssueRowProps {
  issue: IssueDefinition
  /** Whether this issue is currently failing */
  isFailing?: boolean
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-l-yellow-500',
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  notice: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

export function IssueRow({ issue, isFailing = true }: IssueRowProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const config = severityConfig[issue.severity]
  const Icon = isFailing ? config.icon : CheckCircle

  // Check if guidance is available (for future use)
  const hasGuidance = !!(issue.description || issue.guidance || issue.dentalContext)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          'rounded-lg border-l-4 transition-colors',
          isFailing ? config.borderColor : 'border-l-green-500',
          isFailing ? config.bgColor : 'bg-green-50 dark:bg-green-950/20'
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between p-3 text-left',
              'hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-r-lg',
              !hasGuidance && 'cursor-default'
            )}
            disabled={!hasGuidance}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isFailing ? config.iconColor : 'text-green-500'
                )}
              />
              <div>
                <span className="font-medium text-sm">{issue.title}</span>
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded text-xs font-medium',
                    isFailing ? config.badgeColor : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  )}
                >
                  {isFailing ? issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1) : 'Passed'}
                </span>
              </div>
            </div>
            {hasGuidance && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                  isOpen && 'rotate-180'
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {hasGuidance && (
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-0 ml-8 space-y-2 text-sm">
              {issue.description && (
                <div>
                  <span className="font-medium text-muted-foreground">Why it matters: </span>
                  <span>{issue.description}</span>
                </div>
              )}
              {issue.guidance && (
                <div>
                  <span className="font-medium text-muted-foreground">How to fix: </span>
                  <span>{issue.guidance}</span>
                </div>
              )}
              {issue.dentalContext && (
                <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                  <span className="font-medium">Dental Practice Tip: </span>
                  <span>{issue.dentalContext}</span>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  )
}

export default IssueRow
