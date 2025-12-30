'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Copy, Calculator } from 'lucide-react'
import { CTRToggle } from './CTRToggle'
import { KeywordInputs, type KeywordInput } from './KeywordInputs'
import { LocalMapsSection } from './LocalMapsSection'
import { ResultsSummary } from './ResultsSummary'
import { ConversionFunnel } from './ConversionFunnel'
import {
  calculateSEOMetrics,
  CTR_PRESETS,
  DEFAULT_LOCAL_CTR,
  DEFAULT_SEO_INPUTS,
  type CTRScenario,
  type SEOCalculationResult,
} from '@/lib/calculators/seo-calculator'

interface SEOCalculatorFormProps {
  domainId: string
  domainName: string
  calculationId?: string
  initialData?: {
    name?: string | null
    keywordsSnapshot?: KeywordInput[] | null
    combinedSearchVolume: number
    localSearchVolume?: number | null
    localCtr?: number | null
    localConvRate?: number | null
    ctrScenario: string
    ctrPercentage: number
    websiteConvRate: number
    receptionRate: number
    attendanceRate: number
    referralRate: number
    marketingInvestment: number
    avgShortTermValue: number
    avgLifetimeValue: number
    operatories?: number | null
    daysOpen?: number | null
    notes?: string | null
  }
  mode: 'create' | 'edit'
}

export function SEOCalculatorForm({
  domainId,
  domainName,
  calculationId,
  initialData,
  mode,
}: SEOCalculatorFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(initialData?.name ?? '')
  const [keywords, setKeywords] = useState<KeywordInput[]>(initialData?.keywordsSnapshot ?? [])
  const [combinedSearchVolume, setCombinedSearchVolume] = useState(
    initialData?.combinedSearchVolume ?? 5000
  )

  // Local Maps state
  const [localMapsEnabled, setLocalMapsEnabled] = useState(
    !!initialData?.localSearchVolume
  )
  const [localSearchVolume, setLocalSearchVolume] = useState(
    initialData?.localSearchVolume ?? 0
  )
  const [localCtr, setLocalCtr] = useState(initialData?.localCtr ?? DEFAULT_LOCAL_CTR)
  const [localConvRate, setLocalConvRate] = useState(initialData?.localConvRate ?? 0.2)

  // CTR state
  const [ctrScenario, setCtrScenario] = useState<CTRScenario>(
    (initialData?.ctrScenario as CTRScenario) ?? 'average'
  )
  const [ctrPercentage, setCtrPercentage] = useState(
    initialData?.ctrPercentage ?? CTR_PRESETS.average
  )

  // Funnel rates
  const [websiteConvRate, setWebsiteConvRate] = useState(
    initialData?.websiteConvRate ?? DEFAULT_SEO_INPUTS.websiteConvRate
  )
  const [receptionRate, setReceptionRate] = useState(
    initialData?.receptionRate ?? DEFAULT_SEO_INPUTS.receptionRate
  )
  const [attendanceRate, setAttendanceRate] = useState(
    initialData?.attendanceRate ?? DEFAULT_SEO_INPUTS.attendanceRate
  )
  const [referralRate, setReferralRate] = useState(
    initialData?.referralRate ?? DEFAULT_SEO_INPUTS.referralRate
  )

  // Business inputs
  const [marketingInvestment, setMarketingInvestment] = useState(
    initialData?.marketingInvestment ?? DEFAULT_SEO_INPUTS.marketingInvestment
  )
  const [avgShortTermValue, setAvgShortTermValue] = useState(
    initialData?.avgShortTermValue ?? DEFAULT_SEO_INPUTS.avgShortTermValue
  )
  const [avgLifetimeValue, setAvgLifetimeValue] = useState(
    initialData?.avgLifetimeValue ?? DEFAULT_SEO_INPUTS.avgLifetimeValue
  )
  const [operatories, setOperatories] = useState<number | undefined>(
    initialData?.operatories ?? undefined
  )
  const [daysOpen, setDaysOpen] = useState<number | undefined>(
    initialData?.daysOpen ?? undefined
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  // Calculate total search volume from keywords if available
  useEffect(() => {
    if (keywords.length > 0) {
      const total = keywords.reduce((sum, kw) => sum + (kw.searchVolume || 0), 0)
      if (total > 0) {
        setCombinedSearchVolume(total)
      }
    }
  }, [keywords])

  // Calculate results in real-time
  const results: SEOCalculationResult = useMemo(() => {
    return calculateSEOMetrics({
      combinedSearchVolume,
      keywords: keywords.length > 0 ? keywords : undefined,
      localSearchVolume: localMapsEnabled ? localSearchVolume : undefined,
      localCtr: localMapsEnabled ? localCtr : undefined,
      localConvRate: localMapsEnabled ? localConvRate : undefined,
      ctrScenario,
      ctrPercentage,
      websiteConvRate,
      receptionRate,
      attendanceRate,
      referralRate,
      marketingInvestment,
      avgShortTermValue,
      avgLifetimeValue,
      operatories,
      daysOpen,
    })
  }, [
    combinedSearchVolume,
    keywords,
    localMapsEnabled,
    localSearchVolume,
    localCtr,
    localConvRate,
    ctrScenario,
    ctrPercentage,
    websiteConvRate,
    receptionRate,
    attendanceRate,
    referralRate,
    marketingInvestment,
    avgShortTermValue,
    avgLifetimeValue,
    operatories,
    daysOpen,
  ])

  const handleCtrChange = (scenario: CTRScenario, percentage: number) => {
    setCtrScenario(scenario)
    setCtrPercentage(percentage)
  }

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const payload = {
        domainId,
        name: name || undefined,
        keywordsSnapshot: keywords.length > 0 ? keywords : undefined,
        combinedSearchVolume,
        localSearchVolume: localMapsEnabled ? localSearchVolume : undefined,
        localCtr: localMapsEnabled ? localCtr : undefined,
        localConvRate: localMapsEnabled ? localConvRate : undefined,
        ctrScenario,
        ctrPercentage,
        websiteConvRate,
        receptionRate,
        attendanceRate,
        referralRate,
        marketingInvestment,
        avgShortTermValue,
        avgLifetimeValue,
        operatories,
        daysOpen,
        notes: notes || undefined,
      }

      const url =
        mode === 'edit' && calculationId
          ? `/api/calculators/seo/${calculationId}`
          : '/api/calculators/seo'

      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save calculation')
      }

      // Redirect to the calculation detail page
      router.push(`/calculators/seo/${data.data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save calculation')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!calculationId) return
    setError(null)
    setIsDuplicating(true)

    try {
      const response = await fetch(`/api/calculators/seo/${calculationId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: `${name || 'Calculation'} (Copy)` }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate calculation')
      }

      router.push(`/calculators/seo/${data.data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate calculation')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              SEO Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Domain: <span className="font-medium">{domainName}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Calculation Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 2025 Projection"
              />
            </div>

            <Separator />

            {/* Keywords */}
            <KeywordInputs keywords={keywords} onChange={setKeywords} />

            {/* Combined Search Volume (manual override) */}
            <div className="space-y-2">
              <Label htmlFor="combinedSearchVolume">Combined Monthly Search Volume</Label>
              <Input
                id="combinedSearchVolume"
                type="number"
                value={combinedSearchVolume}
                onChange={(e) => setCombinedSearchVolume(parseInt(e.target.value) || 0)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                {keywords.length > 0
                  ? 'Auto-calculated from keywords above'
                  : 'Enter total search volume for your target keywords'}
              </p>
            </div>

            <Separator />

            {/* Local Maps Section */}
            <LocalMapsSection
              enabled={localMapsEnabled}
              onEnabledChange={setLocalMapsEnabled}
              localSearchVolume={localSearchVolume}
              onLocalSearchVolumeChange={setLocalSearchVolume}
              localCtr={localCtr}
              onLocalCtrChange={setLocalCtr}
              localConvRate={localConvRate}
              onLocalConvRateChange={setLocalConvRate}
            />

            <Separator />

            {/* CTR Toggle */}
            <CTRToggle
              value={ctrScenario}
              onChange={handleCtrChange}
              customPercentage={ctrPercentage}
              onCustomChange={(pct) => {
                setCtrPercentage(pct)
              }}
            />

            <Separator />

            {/* Conversion Rates */}
            <div className="space-y-4">
              <h4 className="font-medium">Conversion Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteConvRate">Website Conv. Rate (%)</Label>
                  <Input
                    id="websiteConvRate"
                    type="number"
                    value={websiteConvRate * 100}
                    onChange={(e) => setWebsiteConvRate(parseFloat(e.target.value) / 100 || 0)}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receptionRate">Reception Rate (%)</Label>
                  <Input
                    id="receptionRate"
                    type="number"
                    value={receptionRate * 100}
                    onChange={(e) => setReceptionRate(parseFloat(e.target.value) / 100 || 0)}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceRate">Attendance Rate (%)</Label>
                  <Input
                    id="attendanceRate"
                    type="number"
                    value={attendanceRate * 100}
                    onChange={(e) => setAttendanceRate(parseFloat(e.target.value) / 100 || 0)}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referralRate">Referral Rate (%)</Label>
                  <Input
                    id="referralRate"
                    type="number"
                    value={referralRate * 100}
                    onChange={(e) => setReferralRate(parseFloat(e.target.value) / 100 || 0)}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Business Inputs */}
            <div className="space-y-4">
              <h4 className="font-medium">Business Inputs</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketingInvestment">Marketing Investment ($)</Label>
                  <Input
                    id="marketingInvestment"
                    type="number"
                    value={marketingInvestment}
                    onChange={(e) => setMarketingInvestment(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgShortTermValue">Avg Short-Term Value ($)</Label>
                  <Input
                    id="avgShortTermValue"
                    type="number"
                    value={avgShortTermValue}
                    onChange={(e) => setAvgShortTermValue(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgLifetimeValue">Avg Lifetime Value ($)</Label>
                  <Input
                    id="avgLifetimeValue"
                    type="number"
                    value={avgLifetimeValue}
                    onChange={(e) => setAvgLifetimeValue(parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatories">Operatories</Label>
                  <Input
                    id="operatories"
                    type="number"
                    value={operatories ?? ''}
                    onChange={(e) =>
                      setOperatories(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min="1"
                    max="50"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daysOpen">Days Open/Week</Label>
                  <Input
                    id="daysOpen"
                    type="number"
                    value={daysOpen ?? ''}
                    onChange={(e) =>
                      setDaysOpen(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    min="1"
                    max="7"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this calculation..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving || isDuplicating}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'edit' ? 'Save Changes' : 'Create Calculation'}
                  </>
                )}
              </Button>

              {mode === 'edit' && calculationId && (
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isSaving || isDuplicating}
                >
                  {isDuplicating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Results */}
      <div className="space-y-6">
        <ResultsSummary results={results} marketingInvestment={marketingInvestment} />
        <ConversionFunnel
          results={results}
          rates={{
            ctrPercentage,
            websiteConvRate,
            receptionRate,
            attendanceRate,
            referralRate,
          }}
        />
      </div>
    </div>
  )
}
