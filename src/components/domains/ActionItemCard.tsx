'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react'

type Severity = 'critical' | 'warning' | 'info' | 'success'

interface ActionItem {
  id: string
  title: string
  description: string
  severity: Severity
  href: string
  count?: number
}

interface ActionItemCardProps {
  items: ActionItem[]
  className?: string
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    containerClass: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
    iconClass: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
    iconClass: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  info: {
    icon: Info,
    containerClass: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
    iconClass: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
}

export function ActionItemCard({ items, className }: ActionItemCardProps) {
  if (items.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-8 text-center',
        className
      )}>
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
        <p className="font-medium text-foreground">All caught up!</p>
        <p className="text-sm text-muted-foreground">No action items at this time.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const config = severityConfig[item.severity]
        const Icon = config.icon

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-lg border-l-4 p-3',
              'transition-all duration-150 hover:shadow-sm',
              config.containerClass
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {item.title}
                </span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 text-xs font-semibold rounded-full',
                    config.badge
                  )}>
                    {item.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )
      })}
    </div>
  )
}

