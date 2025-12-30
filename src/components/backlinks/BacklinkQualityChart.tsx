'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface BacklinkQualityChartProps {
  domainRank: number
  referringDomainsCount: number
  dofollowRatio: number
  spamScore: number
}

export function BacklinkQualityChart({
  domainRank,
  // referringDomainsCount - available for future use
  dofollowRatio,
  spamScore,
}: BacklinkQualityChartProps) {
  // Quality distribution based on various factors
  const qualityData = useMemo(() => {
    // Calculate quality tiers based on metrics
    const highQuality = Math.round(
      (domainRank >= 50 ? 40 : domainRank >= 30 ? 25 : 15) *
      (1 - spamScore / 100) *
      dofollowRatio
    )
    const mediumQuality = Math.round(
      (100 - highQuality) * 0.5 * (1 - spamScore / 100)
    )
    const lowQuality = 100 - highQuality - mediumQuality

    return [
      { name: 'High Quality (DR 50+)', value: highQuality, color: '#059669' },
      { name: 'Medium Quality (DR 20-50)', value: mediumQuality, color: '#3B82F6' },
      { name: 'Low Quality (DR <20)', value: lowQuality, color: '#D97706' },
    ].filter(d => d.value > 0)
  }, [domainRank, dofollowRatio, spamScore])

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={qualityData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {qualityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Percentage']}
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

