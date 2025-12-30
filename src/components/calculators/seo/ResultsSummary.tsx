'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowRight,
  Zap,
} from 'lucide-react'
import {
  formatCurrency,
  formatROI,
  type SEOCalculationResult,
} from '@/lib/calculators/seo-calculator'

interface ResultsSummaryProps {
  results: SEOCalculationResult
  marketingInvestment: number
}

export function ResultsSummary({ results, marketingInvestment }: ResultsSummaryProps) {
  const metrics = [
    {
      label: 'Monthly Traffic',
      value: results.totalTraffic.toLocaleString(),
      subtitle: `${results.organicTraffic.toLocaleString()} organic + ${results.localTraffic.toLocaleString()} local`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Prospects (Leads)',
      value: results.prospects.toFixed(1),
      subtitle: 'From website conversions',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'New Patients',
      value: results.adjustedNps.toFixed(1),
      subtitle: `${results.actualNps.toFixed(1)} actual + ${results.npReferrals.toFixed(1)} referrals`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Cost Per Acquisition',
      value: formatCurrency(results.costPerAcquisition),
      subtitle: `${formatCurrency(marketingInvestment)} / ${results.adjustedNps.toFixed(1)} NPs`,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROI Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Short-Term ROI */}
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Short-Term Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(results.shortTermReturn)}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Investment:</span>
              <span className="text-sm font-medium">{formatCurrency(marketingInvestment)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-green-600">
                {formatROI(results.shortTermRoi)} ROI
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              First visit + immediate treatment value
            </p>
          </CardContent>
        </Card>

        {/* Lifetime ROI */}
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Lifetime Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(results.lifetimeReturn)}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Investment:</span>
              <span className="text-sm font-medium">{formatCurrency(marketingInvestment)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-blue-600">
                {formatROI(results.lifetimeRoi)} ROI
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Long-term patient value over relationship
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Annual Projections */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annual Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Annual Traffic</p>
              <p className="text-xl font-bold">{(results.totalTraffic * 12).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual New Patients</p>
              <p className="text-xl font-bold">{(results.adjustedNps * 12).toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual Short-Term Return</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(results.shortTermReturn * 12)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual Lifetime Return</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(results.lifetimeReturn * 12)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
