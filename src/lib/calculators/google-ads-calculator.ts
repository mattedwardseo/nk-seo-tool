/**
 * Google Ads Calculator
 * Calculates ROI projections for Google Ads campaigns
 * Uses same conversion funnel as SEO Calculator
 */

// Input types
export interface GoogleAdsInputs {
  // Ad campaign inputs
  totalBudget: number          // Monthly total budget ($5000 default)
  mgmtFeeType: 'percentage' | 'fixed'  // How mgmt fee is calculated
  mgmtFeeValue: number         // 0.30 = 30% OR fixed $ amount
  avgCpc: number               // Average cost per click ($7 default)

  // Conversion funnel rates (same as SEO)
  websiteConvRate: number      // Website conversion rate (0.15 = 15%)
  receptionRate: number        // Reception/booking rate (0.66 = 66%)
  attendanceRate: number       // Appointment attendance rate (0.85 = 85%)
  referralRate: number         // New patient referral rate (0.25 = 25%)

  // Business value inputs
  avgShortTermValue: number    // First visit value ($1000 default)
  avgLifetimeValue: number     // Lifetime patient value ($10000 default)
}

// Calculation result
export interface GoogleAdsCalculationResult {
  // Budget breakdown
  mgmtFeeAmount: number        // Management fee in dollars
  adSpendBudget: number        // Actual ad spend (total - mgmt fee)

  // Traffic metrics
  monthlyClicks: number        // adSpendBudget / avgCpc

  // Conversion funnel
  prospects: number            // clicks × websiteConvRate
  npBookings: number           // prospects × receptionRate
  actualNps: number            // npBookings × attendanceRate
  npReferrals: number          // actualNps × referralRate
  adjustedNps: number          // actualNps + npReferrals

  // ROI metrics
  costPerAcquisition: number   // totalBudget / adjustedNps
  shortTermReturn: number      // adjustedNps × avgShortTermValue
  shortTermRoas: number        // shortTermReturn / totalBudget (as multiplier)
  lifetimeReturn: number       // adjustedNps × avgLifetimeValue
  lifetimeRoas: number         // lifetimeReturn / totalBudget (as multiplier)

  // Annual projections
  annualClicks: number
  annualNps: number
  annualShortTermReturn: number
  annualLifetimeReturn: number
  annualTotalBudget: number
}

// Default inputs matching user's spec
export const DEFAULT_GOOGLE_ADS_INPUTS: GoogleAdsInputs = {
  totalBudget: 5000,
  mgmtFeeType: 'percentage',
  mgmtFeeValue: 0.30,  // 30%
  avgCpc: 7.00,
  websiteConvRate: 0.15,
  receptionRate: 0.66,
  attendanceRate: 0.85,
  referralRate: 0.25,
  avgShortTermValue: 1000,
  avgLifetimeValue: 10000,
}

/**
 * Calculate management fee amount based on type
 */
export function calculateMgmtFee(
  totalBudget: number,
  feeType: 'percentage' | 'fixed',
  feeValue: number
): number {
  if (feeType === 'percentage') {
    return totalBudget * feeValue
  }
  return Math.min(feeValue, totalBudget) // Fixed fee capped at total budget
}

/**
 * Calculate Google Ads ROI metrics
 */
export function calculateGoogleAdsMetrics(
  inputs: GoogleAdsInputs
): GoogleAdsCalculationResult {
  // Budget breakdown
  const mgmtFeeAmount = calculateMgmtFee(
    inputs.totalBudget,
    inputs.mgmtFeeType,
    inputs.mgmtFeeValue
  )
  const adSpendBudget = inputs.totalBudget - mgmtFeeAmount

  // Traffic - clicks from ad spend
  const monthlyClicks = inputs.avgCpc > 0
    ? Math.floor(adSpendBudget / inputs.avgCpc)
    : 0

  // Conversion funnel (same as SEO calculator)
  const prospects = monthlyClicks * inputs.websiteConvRate
  const npBookings = prospects * inputs.receptionRate
  const actualNps = npBookings * inputs.attendanceRate
  const npReferrals = actualNps * inputs.referralRate
  const adjustedNps = actualNps + npReferrals

  // ROI calculations
  const costPerAcquisition = adjustedNps > 0
    ? inputs.totalBudget / adjustedNps
    : 0

  const shortTermReturn = adjustedNps * inputs.avgShortTermValue
  const shortTermRoas = inputs.totalBudget > 0
    ? shortTermReturn / inputs.totalBudget
    : 0

  const lifetimeReturn = adjustedNps * inputs.avgLifetimeValue
  const lifetimeRoas = inputs.totalBudget > 0
    ? lifetimeReturn / inputs.totalBudget
    : 0

  // Annual projections
  const annualClicks = monthlyClicks * 12
  const annualNps = adjustedNps * 12
  const annualShortTermReturn = shortTermReturn * 12
  const annualLifetimeReturn = lifetimeReturn * 12
  const annualTotalBudget = inputs.totalBudget * 12

  return {
    mgmtFeeAmount,
    adSpendBudget,
    monthlyClicks,
    prospects,
    npBookings,
    actualNps,
    npReferrals,
    adjustedNps,
    costPerAcquisition,
    shortTermReturn,
    shortTermRoas,
    lifetimeReturn,
    lifetimeRoas,
    annualClicks,
    annualNps,
    annualShortTermReturn,
    annualLifetimeReturn,
    annualTotalBudget,
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
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Format ROAS as multiplier (e.g., "3.5x")
 */
export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}
