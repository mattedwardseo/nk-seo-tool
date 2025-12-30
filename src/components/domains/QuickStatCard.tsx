'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface QuickStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function QuickStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  className,
}: QuickStatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (trend.value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-muted-foreground'
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-5',
        'hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-muted/50 to-transparent opacity-50" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'bg-primary/5 group-hover:bg-primary/10 transition-colors'
          )}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </span>
          {subtitle && (
            <span className="text-sm text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

