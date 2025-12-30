'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface LinkVelocityChartProps {
  newBacklinks30d: number | null
  lostBacklinks30d: number | null
  newReferring30d: number | null
  lostReferring30d: number | null
}

export function LinkVelocityChart({
  newBacklinks30d,
  lostBacklinks30d,
  // newReferring30d, lostReferring30d - reserved for future domain-level chart
}: LinkVelocityChartProps) {
  // Generate mock historical data based on available 30d data
  const generateHistoricalData = () => {
    const data = []
    const baseNew = (newBacklinks30d || 0) / 30
    const baseLost = (lostBacklinks30d || 0) / 30
    
    for (let i = 30; i >= 0; i -= 5) {
      const dayLabel = i === 0 ? 'Today' : `${i}d ago`
      const randomVariation = 0.7 + Math.random() * 0.6
      
      data.push({
        day: dayLabel,
        new: Math.round(baseNew * 5 * randomVariation),
        lost: Math.round(baseLost * 5 * randomVariation),
      })
    }
    
    return data
  }

  const data = generateHistoricalData()

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="day" 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <YAxis 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-muted-foreground capitalize">{value} Links</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="new"
            stroke="#059669"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNew)"
          />
          <Area
            type="monotone"
            dataKey="lost"
            stroke="#DC2626"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

