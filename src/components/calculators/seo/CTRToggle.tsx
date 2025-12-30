'use client'

import { cn } from '@/lib/utils'
import { CTR_PRESETS, type CTRScenario } from '@/lib/calculators/seo-calculator'

interface CTRToggleProps {
  value: CTRScenario
  onChange: (scenario: CTRScenario, percentage: number) => void
  customPercentage?: number
  onCustomChange?: (percentage: number) => void
  disabled?: boolean
}

const SCENARIOS: Array<{
  value: CTRScenario
  label: string
  description: string
  color: string
}> = [
  {
    value: 'good',
    label: 'Good',
    description: '25% CTR',
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    value: 'average',
    label: 'Average',
    description: '15% CTR',
    color: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  {
    value: 'bad',
    label: 'Bad',
    description: '5% CTR',
    color: 'bg-red-500 hover:bg-red-600 text-white',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Set your own',
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
]

export function CTRToggle({
  value,
  onChange,
  customPercentage = 0.15,
  onCustomChange,
  disabled = false,
}: CTRToggleProps) {
  const handleScenarioClick = (scenario: CTRScenario) => {
    if (disabled) return
    const percentage = scenario === 'custom' ? customPercentage : CTR_PRESETS[scenario]
    onChange(scenario, percentage)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">CTR Scenario</label>
      <div className="grid grid-cols-4 gap-2">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.value}
            type="button"
            disabled={disabled}
            onClick={() => handleScenarioClick(scenario.value)}
            className={cn(
              'rounded-lg px-3 py-2 text-center transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              disabled && 'opacity-50 cursor-not-allowed',
              value === scenario.value
                ? scenario.color
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            <div className="font-medium text-sm">{scenario.label}</div>
            <div
              className={cn(
                'text-xs mt-0.5',
                value === scenario.value ? 'opacity-90' : 'opacity-70'
              )}
            >
              {scenario.description}
            </div>
          </button>
        ))}
      </div>

      {value === 'custom' && onCustomChange && (
        <div className="flex items-center gap-3 pt-2">
          <label htmlFor="customCtr" className="text-sm text-muted-foreground">
            Custom CTR:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="customCtr"
              type="range"
              min="0"
              max="50"
              step="1"
              value={customPercentage * 100}
              onChange={(e) => onCustomChange(parseInt(e.target.value) / 100)}
              disabled={disabled}
              className="w-32"
            />
            <span className="text-sm font-medium w-12">
              {(customPercentage * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
