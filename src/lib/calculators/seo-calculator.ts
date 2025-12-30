// Phase 13: SEO Calculator
// Calculation logic for organic + local maps traffic → leads → patients → revenue

/**
 * CTR Presets for organic search based on user-defined scenarios
 */
export const CTR_PRESETS = {
  good: 0.25, // 25% CTR
  average: 0.15, // 15% CTR
  bad: 0.05, // 5% CTR
} as const

export type CTRScenario = keyof typeof CTR_PRESETS | 'custom'

/**
 * Default local maps CTR (typically higher than organic)
 */
export const DEFAULT_LOCAL_CTR = 0.35 // 35%

/**
 * Input data for SEO calculation
 */
export interface SEOCalculationInput {
  // Keywords and traffic source
  combinedSearchVolume: number
  keywords?: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    position?: number
  }>

  // Local Maps inputs (optional)
  localSearchVolume?: number
  localCtr?: number
  localConvRate?: number

  // CTR settings
  ctrScenario: CTRScenario
  ctrPercentage: number // 0-1

  // Funnel rates
  websiteConvRate: number // 0-1 (calls, forms, chats, bookings)
  receptionRate: number // 0-1 (booking rate from reception)
  attendanceRate: number // 0-1 (show rate for appointments)
  referralRate: number // 0-1 (new patient referral rate)

  // Business inputs
  marketingInvestment: number // Monthly marketing spend
  avgShortTermValue: number // First visit + immediate treatment
  avgLifetimeValue: number // Long-term patient value

  // Optional context
  operatories?: number
  daysOpen?: number
}

/**
 * Calculated results from SEO calculation
 */
export interface SEOCalculationResult {
  // Traffic
  organicTraffic: number
  localTraffic: number
  totalTraffic: number

  // Conversion funnel
  prospects: number // Total leads from traffic
  npBookings: number // Booked appointments
  actualNps: number // Patients who show up
  npReferrals: number // Referrals from those patients
  adjustedNps: number // Total including referrals

  // Cost metrics
  costPerAcquisition: number

  // Revenue metrics
  shortTermReturn: number
  shortTermRoi: number // Multiple of investment
  lifetimeReturn: number
  lifetimeRoi: number // Multiple of investment
}

/**
 * Get CTR value for a scenario
 */
export function getCtrForScenario(scenario: CTRScenario, customValue?: number): number {
  if (scenario === 'custom') {
    return customValue ?? CTR_PRESETS.average
  }
  return CTR_PRESETS[scenario]
}

/**
 * Calculate full SEO metrics from inputs
 */
export function calculateSEOMetrics(input: SEOCalculationInput): SEOCalculationResult {
  // Calculate organic traffic
  const organicTraffic = Math.round(input.combinedSearchVolume * input.ctrPercentage)

  // Calculate local maps traffic (if provided)
  const localTraffic = input.localSearchVolume
    ? Math.round(input.localSearchVolume * (input.localCtr ?? DEFAULT_LOCAL_CTR))
    : 0

  // Total traffic
  const totalTraffic = organicTraffic + localTraffic

  // Calculate prospects (leads from website conversions)
  // For organic traffic, use website conv rate
  // For local traffic, use local conv rate if provided, otherwise website conv rate
  const organicProspects = organicTraffic * input.websiteConvRate
  const localProspects = localTraffic * (input.localConvRate ?? input.websiteConvRate)
  const prospects = organicProspects + localProspects

  // Convert prospects through the funnel
  const npBookings = prospects * input.receptionRate
  const actualNps = npBookings * input.attendanceRate
  const npReferrals = actualNps * input.referralRate
  const adjustedNps = actualNps + npReferrals

  // Calculate cost metrics
  const costPerAcquisition = adjustedNps > 0 ? input.marketingInvestment / adjustedNps : 0

  // Calculate returns
  const shortTermReturn = adjustedNps * input.avgShortTermValue
  const shortTermRoi = input.marketingInvestment > 0 ? shortTermReturn / input.marketingInvestment : 0
  const lifetimeReturn = adjustedNps * input.avgLifetimeValue
  const lifetimeRoi = input.marketingInvestment > 0 ? lifetimeReturn / input.marketingInvestment : 0

  return {
    organicTraffic,
    localTraffic,
    totalTraffic,
    prospects: Math.round(prospects * 100) / 100, // Round to 2 decimals
    npBookings: Math.round(npBookings * 100) / 100,
    actualNps: Math.round(actualNps * 100) / 100,
    npReferrals: Math.round(npReferrals * 100) / 100,
    adjustedNps: Math.round(adjustedNps * 100) / 100,
    costPerAcquisition: Math.round(costPerAcquisition * 100) / 100,
    shortTermReturn: Math.round(shortTermReturn * 100) / 100,
    shortTermRoi: Math.round(shortTermRoi * 100) / 100,
    lifetimeReturn: Math.round(lifetimeReturn * 100) / 100,
    lifetimeRoi: Math.round(lifetimeRoi * 100) / 100,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format ROI multiplier for display
 */
export function formatROI(value: number): string {
  return `${value.toFixed(1)}x`
}

/**
 * Default SEO calculation inputs (used for forms)
 */
export const DEFAULT_SEO_INPUTS: Omit<SEOCalculationInput, 'combinedSearchVolume'> = {
  ctrScenario: 'average',
  ctrPercentage: CTR_PRESETS.average,
  websiteConvRate: 0.15,
  receptionRate: 0.66,
  attendanceRate: 0.85,
  referralRate: 0.25,
  marketingInvestment: 5000,
  avgShortTermValue: 1000,
  avgLifetimeValue: 10000,
}

/**
 * Quick estimate for SEO potential without full keyword data
 * Uses industry averages
 */
export function calculateQuickEstimate(params: {
  estimatedSearchVolume: number
  scenario: CTRScenario
  avgPatientValue?: number
}): {
  good: { monthly: number; annual: number }
  average: { monthly: number; annual: number }
  bad: { monthly: number; annual: number }
} {
  const baseInputs: Omit<SEOCalculationInput, 'combinedSearchVolume' | 'ctrScenario' | 'ctrPercentage'> = {
    websiteConvRate: 0.15,
    receptionRate: 0.66,
    attendanceRate: 0.85,
    referralRate: 0.25,
    marketingInvestment: 5000,
    avgShortTermValue: params.avgPatientValue ?? 1000,
    avgLifetimeValue: (params.avgPatientValue ?? 1000) * 10,
  }

  const scenarios: CTRScenario[] = ['good', 'average', 'bad']
  const results: Record<string, { monthly: number; annual: number }> = {}

  for (const scenario of scenarios) {
    const result = calculateSEOMetrics({
      combinedSearchVolume: params.estimatedSearchVolume,
      ctrScenario: scenario,
      ctrPercentage: getCtrForScenario(scenario),
      ...baseInputs,
    })

    results[scenario] = {
      monthly: Math.round(result.shortTermReturn),
      annual: Math.round(result.shortTermReturn * 12),
    }
  }

  return results as {
    good: { monthly: number; annual: number }
    average: { monthly: number; annual: number }
    bad: { monthly: number; annual: number }
  }
}
