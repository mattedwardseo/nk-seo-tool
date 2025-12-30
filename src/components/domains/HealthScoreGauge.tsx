'use client'

import { cn } from '@/lib/utils'

interface HealthScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeMap = {
  sm: { gauge: 80, text: 'text-lg', label: 'text-xs' },
  md: { gauge: 120, text: 'text-2xl', label: 'text-sm' },
  lg: { gauge: 160, text: 'text-3xl', label: 'text-base' },
}

export function HealthScoreGauge({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: HealthScoreGaugeProps) {
  const { gauge, text, label } = sizeMap[size]
  
  // Calculate rotation based on score (0-100 maps to 0-180 degrees)
  const rotation = Math.min(Math.max(score, 0), 100) * 1.8
  
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }
  
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  const getGradientId = `gauge-gradient-${size}`

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div 
        className="relative"
        style={{ width: gauge, height: gauge / 2 + 20 }}
      >
        <svg
          viewBox="0 0 100 60"
          className="w-full h-full"
        >
          {/* Define gradient */}
          <defs>
            <linearGradient id={getGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="33%" stopColor="#F59E0B" />
              <stop offset="66%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/30"
          />
          
          {/* Progress arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#${getGradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 126} 126`}
          />
          
          {/* Needle */}
          <g transform={`rotate(${rotation - 90}, 50, 50)`}>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle
              cx="50"
              cy="50"
              r="4"
              fill="currentColor"
              className="text-foreground"
            />
          </g>
        </svg>
        
        {/* Score value */}
        <div 
          className="absolute inset-x-0 bottom-0 flex flex-col items-center"
        >
          <span className={cn('font-bold tabular-nums', text, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <span className={cn('font-medium mt-1', label, getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  )
}

