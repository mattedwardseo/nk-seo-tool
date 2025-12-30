'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DollarSign, Users, TrendingUp, Calculator } from 'lucide-react'
import {
  calculateGoogleAdsMetrics,
  formatCurrency,
  formatRoas,
  formatNumber,
  DEFAULT_GOOGLE_ADS_INPUTS,
  type GoogleAdsInputs,
} from '@/lib/calculators/google-ads-calculator'

interface GoogleAdsCalculatorFormProps {
  domainId: string
  onSubmit: (data: GoogleAdsFormData) => Promise<void>
  initialData?: Partial<GoogleAdsFormData>
  isLoading?: boolean
}

export interface GoogleAdsFormData {
  name?: string
  totalBudget: number
  mgmtFeeType: 'percentage' | 'fixed'
  mgmtFeeValue: number
  avgCpc: number
  websiteConvRate: number
  receptionRate: number
  attendanceRate: number
  referralRate: number
  avgShortTermValue: number
  avgLifetimeValue: number
  notes?: string
}

export function GoogleAdsCalculatorForm({
  domainId: _domainId,
  onSubmit,
  initialData,
  isLoading = false,
}: GoogleAdsCalculatorFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name ?? '')
  const [totalBudget, setTotalBudget] = useState(initialData?.totalBudget ?? DEFAULT_GOOGLE_ADS_INPUTS.totalBudget)
  const [mgmtFeeType, setMgmtFeeType] = useState<'percentage' | 'fixed'>(
    initialData?.mgmtFeeType ?? DEFAULT_GOOGLE_ADS_INPUTS.mgmtFeeType
  )
  const [mgmtFeeValue, setMgmtFeeValue] = useState(
    initialData?.mgmtFeeValue ?? DEFAULT_GOOGLE_ADS_INPUTS.mgmtFeeValue
  )
  const [avgCpc, setAvgCpc] = useState(initialData?.avgCpc ?? DEFAULT_GOOGLE_ADS_INPUTS.avgCpc)
  const [websiteConvRate, setWebsiteConvRate] = useState(
    initialData?.websiteConvRate ?? DEFAULT_GOOGLE_ADS_INPUTS.websiteConvRate
  )
  const [receptionRate, setReceptionRate] = useState(
    initialData?.receptionRate ?? DEFAULT_GOOGLE_ADS_INPUTS.receptionRate
  )
  const [attendanceRate, setAttendanceRate] = useState(
    initialData?.attendanceRate ?? DEFAULT_GOOGLE_ADS_INPUTS.attendanceRate
  )
  const [referralRate, setReferralRate] = useState(
    initialData?.referralRate ?? DEFAULT_GOOGLE_ADS_INPUTS.referralRate
  )
  const [avgShortTermValue, setAvgShortTermValue] = useState(
    initialData?.avgShortTermValue ?? DEFAULT_GOOGLE_ADS_INPUTS.avgShortTermValue
  )
  const [avgLifetimeValue, setAvgLifetimeValue] = useState(
    initialData?.avgLifetimeValue ?? DEFAULT_GOOGLE_ADS_INPUTS.avgLifetimeValue
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  // Live calculation
  const results = useMemo(() => {
    const inputs: GoogleAdsInputs = {
      totalBudget,
      mgmtFeeType,
      mgmtFeeValue,
      avgCpc,
      websiteConvRate,
      receptionRate,
      attendanceRate,
      referralRate,
      avgShortTermValue,
      avgLifetimeValue,
    }
    return calculateGoogleAdsMetrics(inputs)
  }, [
    totalBudget,
    mgmtFeeType,
    mgmtFeeValue,
    avgCpc,
    websiteConvRate,
    receptionRate,
    attendanceRate,
    referralRate,
    avgShortTermValue,
    avgLifetimeValue,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name: name || undefined,
      totalBudget,
      mgmtFeeType,
      mgmtFeeValue,
      avgCpc,
      websiteConvRate,
      receptionRate,
      attendanceRate,
      referralRate,
      avgShortTermValue,
      avgLifetimeValue,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Calculation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="name">Calculation Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g., Q1 2025 Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalBudget">Total Monthly Budget ($)</Label>
              <Input
                id="totalBudget"
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="100"
              />
            </div>
            <div>
              <Label htmlFor="avgCpc">Average CPC ($)</Label>
              <Input
                id="avgCpc"
                type="number"
                value={avgCpc}
                onChange={(e) => setAvgCpc(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="0.50"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mgmtFeeType">Management Fee Type</Label>
              <Select
                value={mgmtFeeType}
                onValueChange={(v) => {
                  setMgmtFeeType(v as 'percentage' | 'fixed')
                  // Reset to default when switching
                  if (v === 'percentage') {
                    setMgmtFeeValue(0.3)
                  } else {
                    setMgmtFeeValue(1500)
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mgmtFeeValue">
                Management Fee ({mgmtFeeType === 'percentage' ? '%' : '$'})
              </Label>
              <Input
                id="mgmtFeeValue"
                type="number"
                value={mgmtFeeType === 'percentage' ? mgmtFeeValue * 100 : mgmtFeeValue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setMgmtFeeValue(mgmtFeeType === 'percentage' ? val / 100 : val)
                }}
                disabled={isLoading}
                min="0"
                step={mgmtFeeType === 'percentage' ? '5' : '100'}
              />
            </div>
          </div>

          <Separator />

          {/* Budget Breakdown Display */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Mgmt Fee</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(results.mgmtFeeAmount)}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Ad Spend</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(results.adSpendBudget)}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Est. Clicks</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatNumber(results.monthlyClicks)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conversion Funnel Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="websiteConvRate">Website Conversion Rate (%)</Label>
              <Input
                id="websiteConvRate"
                type="number"
                value={websiteConvRate * 100}
                onChange={(e) => setWebsiteConvRate((parseFloat(e.target.value) || 0) / 100)}
                disabled={isLoading}
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="receptionRate">Reception/Booking Rate (%)</Label>
              <Input
                id="receptionRate"
                type="number"
                value={receptionRate * 100}
                onChange={(e) => setReceptionRate((parseFloat(e.target.value) || 0) / 100)}
                disabled={isLoading}
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="attendanceRate">Attendance Rate (%)</Label>
              <Input
                id="attendanceRate"
                type="number"
                value={attendanceRate * 100}
                onChange={(e) => setAttendanceRate((parseFloat(e.target.value) || 0) / 100)}
                disabled={isLoading}
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="referralRate">Referral Rate (%)</Label>
              <Input
                id="referralRate"
                type="number"
                value={referralRate * 100}
                onChange={(e) => setReferralRate((parseFloat(e.target.value) || 0) / 100)}
                disabled={isLoading}
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Patient Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avgShortTermValue">Avg Short Term Value ($)</Label>
              <Input
                id="avgShortTermValue"
                type="number"
                value={avgShortTermValue}
                onChange={(e) => setAvgShortTermValue(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="100"
              />
            </div>
            <div>
              <Label htmlFor="avgLifetimeValue">Avg Lifetime Value ($)</Label>
              <Input
                id="avgLifetimeValue"
                type="number"
                value={avgLifetimeValue}
                onChange={(e) => setAvgLifetimeValue(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                min="0"
                step="500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <Calculator className="h-5 w-5" />
            Projected Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Monthly Clicks</div>
              <div className="text-2xl font-bold">{formatNumber(results.monthlyClicks)}</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">New Patients</div>
              <div className="text-2xl font-bold">{results.adjustedNps.toFixed(1)}</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">Cost Per Patient</div>
              <div className="text-2xl font-bold">{formatCurrency(results.costPerAcquisition)}</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground">ROAS</div>
              <div className="text-2xl font-bold text-green-600">{formatRoas(results.shortTermRoas)}</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Short Term Return</div>
              <div className="text-xl font-bold">{formatCurrency(results.shortTermReturn)}</div>
              <div className="text-sm text-muted-foreground">
                {formatRoas(results.shortTermRoas)} return on {formatCurrency(totalBudget)} spend
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Lifetime Return</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(results.lifetimeReturn)}</div>
              <div className="text-sm text-muted-foreground">
                {formatRoas(results.lifetimeRoas)} lifetime ROAS
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid md:grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Annual Ad Spend</div>
              <div className="text-lg font-semibold">{formatCurrency(results.annualTotalBudget)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Annual Lifetime Return</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(results.annualLifetimeReturn)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this calculation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Calculation'}
      </Button>
    </form>
  )
}
