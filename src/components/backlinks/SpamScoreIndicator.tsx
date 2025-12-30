'use client'

import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

interface SpamScoreIndicatorProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeConfig = {
  sm: { container: 'w-16', icon: 'h-4 w-4', text: 'text-sm', label: 'text-xs' },
  md: { container: 'w-24', icon: 'h-6 w-6', text: 'text-lg', label: 'text-sm' },
  lg: { container: 'w-32', icon: 'h-8 w-8', text: 'text-2xl', label: 'text-base' },
}

export function SpamScoreIndicator({ 
  score, 
  size = 'md',
  showLabel = true 
}: SpamScoreIndicatorProps) {
  const config = sizeConfig[size]
  
  const getConfig = (score: number) => {
    if (score <= 10) {
      return {
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        label: 'Excellent',
        description: 'Very low spam risk',
      }
    }
    if (score <= 30) {
      return {
        icon: Shield,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'Good',
        description: 'Low spam risk',
      }
    }
    if (score <= 50) {
      return {
        icon: ShieldAlert,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        label: 'Warning',
        description: 'Moderate spam risk',
      }
    }
    return {
      icon: ShieldX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'High Risk',
      description: 'High spam risk detected',
    }
  }

  const { icon: Icon, color, bgColor, label, description } = getConfig(score)

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'flex items-center justify-center rounded-full p-3',
        bgColor
      )}>
        <Icon className={cn(config.icon, color)} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={cn('font-bold tabular-nums', config.text, color)}>
            {score}%
          </span>
          {showLabel && (
            <span className={cn('font-medium', config.label, color)}>
              {label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

