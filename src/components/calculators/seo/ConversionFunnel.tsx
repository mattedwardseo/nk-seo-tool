'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown } from 'lucide-react'
import { formatPercent, type SEOCalculationResult } from '@/lib/calculators/seo-calculator'

interface ConversionFunnelProps {
  results: SEOCalculationResult
  rates: {
    ctrPercentage: number
    websiteConvRate: number
    receptionRate: number
    attendanceRate: number
    referralRate: number
  }
}

export function ConversionFunnel({ results, rates }: ConversionFunnelProps) {
  const stages = [
    {
      label: 'Search Volume',
      value: Math.round(results.totalTraffic / rates.ctrPercentage),
      rate: null,
      rateLabel: null,
      width: 'w-full',
      color: 'bg-blue-500',
    },
    {
      label: 'Website Traffic',
      value: results.totalTraffic,
      rate: rates.ctrPercentage,
      rateLabel: 'CTR',
      width: 'w-[90%]',
      color: 'bg-blue-600',
    },
    {
      label: 'Prospects',
      value: results.prospects,
      rate: rates.websiteConvRate,
      rateLabel: 'Website Conv.',
      width: 'w-[75%]',
      color: 'bg-purple-500',
    },
    {
      label: 'Booked Appointments',
      value: results.npBookings,
      rate: rates.receptionRate,
      rateLabel: 'Reception Rate',
      width: 'w-[60%]',
      color: 'bg-purple-600',
    },
    {
      label: 'Actual New Patients',
      value: results.actualNps,
      rate: rates.attendanceRate,
      rateLabel: 'Attendance Rate',
      width: 'w-[45%]',
      color: 'bg-green-500',
    },
    {
      label: 'Patient Referrals',
      value: results.npReferrals,
      rate: rates.referralRate,
      rateLabel: 'Referral Rate',
      width: 'w-[30%]',
      color: 'bg-green-600',
    },
    {
      label: 'Adjusted New Patients',
      value: results.adjustedNps,
      rate: null,
      rateLabel: 'Total',
      width: 'w-[40%]',
      color: 'bg-green-700',
      isTotal: true,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="relative">
              {/* Connection Arrow */}
              {index > 0 && (
                <div className="flex justify-center -mt-1 mb-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Funnel Bar */}
              <div className="flex items-center gap-3">
                <div className={`h-10 ${stage.width} mx-auto rounded-lg ${stage.color} flex items-center justify-between px-4 transition-all`}>
                  <span className="text-white text-sm font-medium truncate">
                    {stage.label}
                  </span>
                  <span className="text-white text-sm font-bold">
                    {typeof stage.value === 'number' && stage.value % 1 !== 0
                      ? stage.value.toFixed(1)
                      : Math.round(stage.value).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Rate Badge */}
              {stage.rate !== null && (
                <div className="flex justify-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {stage.rateLabel}: {formatPercent(stage.rate)}
                  </span>
                </div>
              )}

              {/* Total Label */}
              {stage.isTotal && (
                <div className="flex justify-center mt-1">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Actual + Referrals
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Funnel Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Overall Conversion</p>
              <p className="text-lg font-bold">
                {formatPercent(results.adjustedNps / (results.totalTraffic / rates.ctrPercentage))}
              </p>
              <p className="text-xs text-muted-foreground">Search → Patient</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Traffic to Patient</p>
              <p className="text-lg font-bold">
                {formatPercent(results.adjustedNps / results.totalTraffic)}
              </p>
              <p className="text-xs text-muted-foreground">Website → Patient</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
