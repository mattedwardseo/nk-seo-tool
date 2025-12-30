'use client'

import { cn } from '@/lib/utils'
import { Trophy, Medal, Award, MinusCircle } from 'lucide-react'

interface DomainRankBadgeProps {
  rank: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeConfig = {
  sm: { container: 'h-12 w-12', icon: 'h-5 w-5', text: 'text-sm' },
  md: { container: 'h-16 w-16', icon: 'h-6 w-6', text: 'text-xl' },
  lg: { container: 'h-20 w-20', icon: 'h-8 w-8', text: 'text-2xl' },
}

export function DomainRankBadge({ 
  rank, 
  size = 'md',
  showLabel = true 
}: DomainRankBadgeProps) {
  const config = sizeConfig[size]
  
  const getConfig = (rank: number) => {
    if (rank >= 70) {
      return {
        icon: Trophy,
        gradient: 'from-amber-400 to-amber-600',
        bgGradient: 'from-amber-500/20 to-amber-600/20',
        label: 'Excellent',
        ring: 'ring-amber-500/50',
      }
    }
    if (rank >= 50) {
      return {
        icon: Medal,
        gradient: 'from-emerald-400 to-emerald-600',
        bgGradient: 'from-emerald-500/20 to-emerald-600/20',
        label: 'Strong',
        ring: 'ring-emerald-500/50',
      }
    }
    if (rank >= 30) {
      return {
        icon: Award,
        gradient: 'from-blue-400 to-blue-600',
        bgGradient: 'from-blue-500/20 to-blue-600/20',
        label: 'Moderate',
        ring: 'ring-blue-500/50',
      }
    }
    return {
      icon: MinusCircle,
      gradient: 'from-slate-400 to-slate-600',
      bgGradient: 'from-slate-500/20 to-slate-600/20',
      label: 'Building',
      ring: 'ring-slate-500/50',
    }
  }

  const { icon: Icon, gradient, bgGradient, label, ring } = getConfig(rank)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-gradient-to-br',
        bgGradient,
        'ring-2',
        ring,
        config.container
      )}>
        <Icon className={cn(
          config.icon,
          'bg-gradient-to-br bg-clip-text',
          gradient.replace('from-', 'text-').split(' ')[0]
        )} />
        <div className={cn(
          'absolute -bottom-1 left-1/2 -translate-x-1/2',
          'px-2 py-0.5 rounded-full',
          'bg-gradient-to-r',
          gradient,
          'text-white font-bold shadow-lg',
          config.text
        )}>
          {rank}
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
}

