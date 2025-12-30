// Phase 13: Calculator Database Operations
// CRUD operations for SEO, Google Ads, and Capacity calculators

import { createId } from '@paralleldrive/cuid2'
import { prisma } from '@/lib/prisma'
import { calculateSEOMetrics, type SEOCalculationInput } from '@/lib/calculators/seo-calculator'
import {
  calculateGoogleAdsMetrics,
  type GoogleAdsInputs,
} from '@/lib/calculators/google-ads-calculator'
import {
  calculateCapacityMetrics,
  type CapacityInputs,
} from '@/lib/calculators/capacity-calculator'

// ============================================
// SEO Calculator Operations
// ============================================

export interface CreateSEOCalculationParams {
  domainId: string
  userId: string
  name?: string

  // Keyword data
  keywordsSnapshot?: Array<{
    keyword: string
    searchVolume: number
    cpc: number
    position?: number
  }>
  combinedSearchVolume: number

  // Local Maps inputs
  localSearchVolume?: number
  localCtr?: number
  localConvRate?: number

  // CTR settings
  ctrScenario: string
  ctrPercentage: number

  // Funnel rates
  websiteConvRate: number
  receptionRate: number
  attendanceRate: number
  referralRate: number

  // Business inputs
  marketingInvestment: number
  avgShortTermValue: number
  avgLifetimeValue: number
  operatories?: number
  daysOpen?: number

  notes?: string
}

/**
 * Create a new SEO calculation
 */
export async function createSEOCalculation(params: CreateSEOCalculationParams): Promise<string> {
  // Calculate results
  const input: SEOCalculationInput = {
    combinedSearchVolume: params.combinedSearchVolume,
    keywords: params.keywordsSnapshot,
    localSearchVolume: params.localSearchVolume,
    localCtr: params.localCtr,
    localConvRate: params.localConvRate,
    ctrScenario: params.ctrScenario as 'good' | 'average' | 'bad' | 'custom',
    ctrPercentage: params.ctrPercentage,
    websiteConvRate: params.websiteConvRate,
    receptionRate: params.receptionRate,
    attendanceRate: params.attendanceRate,
    referralRate: params.referralRate,
    marketingInvestment: params.marketingInvestment,
    avgShortTermValue: params.avgShortTermValue,
    avgLifetimeValue: params.avgLifetimeValue,
    operatories: params.operatories,
    daysOpen: params.daysOpen,
  }

  const results = calculateSEOMetrics(input)

  const calculation = await prisma.seo_calculations.create({
    data: {
      id: createId(),
      domain_id: params.domainId,
      user_id: params.userId,
      name: params.name || null,
      keywords_snapshot: params.keywordsSnapshot as unknown as undefined,
      combined_search_volume: params.combinedSearchVolume,
      local_search_volume: params.localSearchVolume || null,
      local_ctr: params.localCtr || null,
      local_conv_rate: params.localConvRate || null,
      ctr_scenario: params.ctrScenario,
      ctr_percentage: params.ctrPercentage,
      website_conv_rate: params.websiteConvRate,
      reception_rate: params.receptionRate,
      attendance_rate: params.attendanceRate,
      referral_rate: params.referralRate,
      marketing_investment: params.marketingInvestment,
      avg_short_term_value: params.avgShortTermValue,
      avg_lifetime_value: params.avgLifetimeValue,
      operatories: params.operatories || null,
      days_open: params.daysOpen || null,
      organic_traffic: results.organicTraffic,
      local_traffic: results.localTraffic,
      total_traffic: results.totalTraffic,
      prospects: results.prospects,
      np_bookings: results.npBookings,
      actual_nps: results.actualNps,
      np_referrals: results.npReferrals,
      adjusted_nps: results.adjustedNps,
      cost_per_acquisition: results.costPerAcquisition,
      short_term_return: results.shortTermReturn,
      short_term_roi: results.shortTermRoi,
      lifetime_return: results.lifetimeReturn,
      lifetime_roi: results.lifetimeRoi,
      notes: params.notes || null,
    },
    select: { id: true },
  })

  return calculation.id
}

/**
 * Get all SEO calculations for a domain
 */
export async function getSEOCalculations(params: {
  domainId: string
  userId: string
  page?: number
  limit?: number
}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const skip = (page - 1) * limit

  const [calculations, total] = await Promise.all([
    prisma.seo_calculations.findMany({
      where: {
        domain_id: params.domainId,
        user_id: params.userId,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        ctr_scenario: true,
        combined_search_volume: true,
        total_traffic: true,
        adjusted_nps: true,
        short_term_return: true,
        lifetime_return: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.seo_calculations.count({
      where: {
        domain_id: params.domainId,
        user_id: params.userId,
      },
    }),
  ])

  return {
    calculations: calculations.map((calc) => ({
      id: calc.id,
      name: calc.name,
      ctrScenario: calc.ctr_scenario,
      combinedSearchVolume: calc.combined_search_volume,
      totalTraffic: calc.total_traffic,
      adjustedNps: calc.adjusted_nps ? Number(calc.adjusted_nps) : null,
      shortTermReturn: calc.short_term_return ? Number(calc.short_term_return) : null,
      lifetimeReturn: calc.lifetime_return ? Number(calc.lifetime_return) : null,
      createdAt: calc.created_at.toISOString(),
      updatedAt: calc.updated_at.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get a single SEO calculation by ID
 */
export async function getSEOCalculation(params: { id: string; userId: string }) {
  const calc = await prisma.seo_calculations.findUnique({
    where: { id: params.id },
  })

  if (!calc || calc.user_id !== params.userId) {
    return null
  }

  return {
    id: calc.id,
    domainId: calc.domain_id,
    name: calc.name,
    keywordsSnapshot: calc.keywords_snapshot as Array<{
      keyword: string
      searchVolume: number
      cpc: number
      position?: number
    }> | null,
    combinedSearchVolume: calc.combined_search_volume,
    localSearchVolume: calc.local_search_volume,
    localCtr: calc.local_ctr ? Number(calc.local_ctr) : null,
    localConvRate: calc.local_conv_rate ? Number(calc.local_conv_rate) : null,
    ctrScenario: calc.ctr_scenario,
    ctrPercentage: Number(calc.ctr_percentage),
    websiteConvRate: Number(calc.website_conv_rate),
    receptionRate: Number(calc.reception_rate),
    attendanceRate: Number(calc.attendance_rate),
    referralRate: Number(calc.referral_rate),
    marketingInvestment: Number(calc.marketing_investment),
    avgShortTermValue: Number(calc.avg_short_term_value),
    avgLifetimeValue: Number(calc.avg_lifetime_value),
    operatories: calc.operatories,
    daysOpen: calc.days_open,
    organicTraffic: calc.organic_traffic,
    localTraffic: calc.local_traffic,
    totalTraffic: calc.total_traffic,
    prospects: calc.prospects ? Number(calc.prospects) : null,
    npBookings: calc.np_bookings ? Number(calc.np_bookings) : null,
    actualNps: calc.actual_nps ? Number(calc.actual_nps) : null,
    npReferrals: calc.np_referrals ? Number(calc.np_referrals) : null,
    adjustedNps: calc.adjusted_nps ? Number(calc.adjusted_nps) : null,
    costPerAcquisition: calc.cost_per_acquisition ? Number(calc.cost_per_acquisition) : null,
    shortTermReturn: calc.short_term_return ? Number(calc.short_term_return) : null,
    shortTermRoi: calc.short_term_roi ? Number(calc.short_term_roi) : null,
    lifetimeReturn: calc.lifetime_return ? Number(calc.lifetime_return) : null,
    lifetimeRoi: calc.lifetime_roi ? Number(calc.lifetime_roi) : null,
    notes: calc.notes,
    createdAt: calc.created_at.toISOString(),
    updatedAt: calc.updated_at.toISOString(),
  }
}

/**
 * Update an SEO calculation
 */
export async function updateSEOCalculation(params: {
  id: string
  userId: string
  data: Partial<CreateSEOCalculationParams>
}) {
  // First verify ownership
  const existing = await prisma.seo_calculations.findUnique({
    where: { id: params.id },
    select: { user_id: true },
  })

  if (!existing || existing.user_id !== params.userId) {
    return null
  }

  // Build update object (only include fields that are provided)
  const updateData: Record<string, unknown> = {}

  if (params.data.name !== undefined) updateData.name = params.data.name
  if (params.data.keywordsSnapshot !== undefined)
    updateData.keywords_snapshot = params.data.keywordsSnapshot as unknown as undefined
  if (params.data.combinedSearchVolume !== undefined)
    updateData.combined_search_volume = params.data.combinedSearchVolume
  if (params.data.localSearchVolume !== undefined) updateData.local_search_volume = params.data.localSearchVolume
  if (params.data.localCtr !== undefined) updateData.local_ctr = params.data.localCtr
  if (params.data.localConvRate !== undefined) updateData.local_conv_rate = params.data.localConvRate
  if (params.data.ctrScenario !== undefined) updateData.ctr_scenario = params.data.ctrScenario
  if (params.data.ctrPercentage !== undefined) updateData.ctr_percentage = params.data.ctrPercentage
  if (params.data.websiteConvRate !== undefined) updateData.website_conv_rate = params.data.websiteConvRate
  if (params.data.receptionRate !== undefined) updateData.reception_rate = params.data.receptionRate
  if (params.data.attendanceRate !== undefined) updateData.attendance_rate = params.data.attendanceRate
  if (params.data.referralRate !== undefined) updateData.referral_rate = params.data.referralRate
  if (params.data.marketingInvestment !== undefined)
    updateData.marketing_investment = params.data.marketingInvestment
  if (params.data.avgShortTermValue !== undefined) updateData.avg_short_term_value = params.data.avgShortTermValue
  if (params.data.avgLifetimeValue !== undefined) updateData.avg_lifetime_value = params.data.avgLifetimeValue
  if (params.data.operatories !== undefined) updateData.operatories = params.data.operatories
  if (params.data.daysOpen !== undefined) updateData.days_open = params.data.daysOpen
  if (params.data.notes !== undefined) updateData.notes = params.data.notes

  // Recalculate results if any calculation-affecting fields changed
  if (Object.keys(updateData).some((k) => !['name', 'notes'].includes(k))) {
    // Need to fetch full record to recalculate
    const fullRecord = await prisma.seo_calculations.findUnique({
      where: { id: params.id },
    })

    if (fullRecord) {
      const input: SEOCalculationInput = {
        combinedSearchVolume:
          (updateData.combined_search_volume as number) ?? fullRecord.combined_search_volume,
        localSearchVolume: (updateData.local_search_volume as number) ?? fullRecord.local_search_volume ?? undefined,
        localCtr: (updateData.local_ctr as number) ?? (fullRecord.local_ctr ? Number(fullRecord.local_ctr) : undefined),
        localConvRate: (updateData.local_conv_rate as number) ?? (fullRecord.local_conv_rate ? Number(fullRecord.local_conv_rate) : undefined),
        ctrScenario: ((updateData.ctr_scenario as string) ?? fullRecord.ctr_scenario) as 'good' | 'average' | 'bad' | 'custom',
        ctrPercentage: (updateData.ctr_percentage as number) ?? Number(fullRecord.ctr_percentage),
        websiteConvRate: (updateData.website_conv_rate as number) ?? Number(fullRecord.website_conv_rate),
        receptionRate: (updateData.reception_rate as number) ?? Number(fullRecord.reception_rate),
        attendanceRate: (updateData.attendance_rate as number) ?? Number(fullRecord.attendance_rate),
        referralRate: (updateData.referral_rate as number) ?? Number(fullRecord.referral_rate),
        marketingInvestment:
          (updateData.marketing_investment as number) ?? Number(fullRecord.marketing_investment),
        avgShortTermValue:
          (updateData.avg_short_term_value as number) ?? Number(fullRecord.avg_short_term_value),
        avgLifetimeValue:
          (updateData.avg_lifetime_value as number) ?? Number(fullRecord.avg_lifetime_value),
      }

      const results = calculateSEOMetrics(input)

      updateData.organic_traffic = results.organicTraffic
      updateData.local_traffic = results.localTraffic
      updateData.total_traffic = results.totalTraffic
      updateData.prospects = results.prospects
      updateData.np_bookings = results.npBookings
      updateData.actual_nps = results.actualNps
      updateData.np_referrals = results.npReferrals
      updateData.adjusted_nps = results.adjustedNps
      updateData.cost_per_acquisition = results.costPerAcquisition
      updateData.short_term_return = results.shortTermReturn
      updateData.short_term_roi = results.shortTermRoi
      updateData.lifetime_return = results.lifetimeReturn
      updateData.lifetime_roi = results.lifetimeRoi
    }
  }

  const updated = await prisma.seo_calculations.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true },
  })

  return updated.id
}

/**
 * Delete an SEO calculation
 */
export async function deleteSEOCalculation(params: { id: string; userId: string }): Promise<boolean> {
  const existing = await prisma.seo_calculations.findUnique({
    where: { id: params.id },
    select: { user_id: true },
  })

  if (!existing || existing.user_id !== params.userId) {
    return false
  }

  await prisma.seo_calculations.delete({
    where: { id: params.id },
  })

  return true
}

/**
 * Duplicate an SEO calculation
 */
export async function duplicateSEOCalculation(params: {
  id: string
  userId: string
  newName?: string
}): Promise<string | null> {
  const existing = await getSEOCalculation({ id: params.id, userId: params.userId })

  if (!existing) {
    return null
  }

  const newId = await createSEOCalculation({
    domainId: existing.domainId,
    userId: params.userId,
    name: params.newName ?? `${existing.name ?? 'Calculation'} (Copy)`,
    keywordsSnapshot: existing.keywordsSnapshot ?? undefined,
    combinedSearchVolume: existing.combinedSearchVolume,
    localSearchVolume: existing.localSearchVolume ?? undefined,
    localCtr: existing.localCtr ?? undefined,
    localConvRate: existing.localConvRate ?? undefined,
    ctrScenario: existing.ctrScenario,
    ctrPercentage: existing.ctrPercentage,
    websiteConvRate: existing.websiteConvRate,
    receptionRate: existing.receptionRate,
    attendanceRate: existing.attendanceRate,
    referralRate: existing.referralRate,
    marketingInvestment: existing.marketingInvestment,
    avgShortTermValue: existing.avgShortTermValue,
    avgLifetimeValue: existing.avgLifetimeValue,
    operatories: existing.operatories ?? undefined,
    daysOpen: existing.daysOpen ?? undefined,
    notes: existing.notes ?? undefined,
  })

  return newId
}

// ============================================
// Calculator Counts for Domain Tools
// ============================================

/**
 * Get calculator counts for a domain
 */
export async function getCalculatorCounts(params: { domainId: string; userId: string }) {
  const [seoCount, googleAdsCount, capacityCount] = await Promise.all([
    prisma.seo_calculations.count({
      where: {
        domain_id: params.domainId,
        user_id: params.userId,
      },
    }),
    prisma.google_ads_calculations.count({
      where: {
        domain_id: params.domainId,
        user_id: params.userId,
      },
    }),
    prisma.capacity_calculations.count({
      where: {
        domain_id: params.domainId,
        user_id: params.userId,
      },
    }),
  ])

  return {
    seoCalculations: seoCount,
    googleAdsCalculations: googleAdsCount,
    capacityCalculations: capacityCount,
  }
}

// ============================================
// Google Ads Calculator Operations
// ============================================

export interface CreateGoogleAdsCalculationParams {
  domainId: string
  userId: string
  name?: string

  // Ad campaign inputs
  totalBudget: number
  mgmtFeeType: 'percentage' | 'fixed'
  mgmtFeeValue: number
  avgCpc: number

  // Funnel rates
  websiteConvRate: number
  receptionRate: number
  attendanceRate: number
  referralRate: number

  // Business inputs
  avgShortTermValue: number
  avgLifetimeValue: number

  notes?: string
}

/**
 * Create a new Google Ads calculation
 */
export async function createGoogleAdsCalculation(
  params: CreateGoogleAdsCalculationParams
): Promise<string> {
  // Calculate results
  const inputs: GoogleAdsInputs = {
    totalBudget: params.totalBudget,
    mgmtFeeType: params.mgmtFeeType,
    mgmtFeeValue: params.mgmtFeeValue,
    avgCpc: params.avgCpc,
    websiteConvRate: params.websiteConvRate,
    receptionRate: params.receptionRate,
    attendanceRate: params.attendanceRate,
    referralRate: params.referralRate,
    avgShortTermValue: params.avgShortTermValue,
    avgLifetimeValue: params.avgLifetimeValue,
  }

  const results = calculateGoogleAdsMetrics(inputs)

  const id = createId()

  await prisma.google_ads_calculations.create({
    data: {
      id,
      domain_id: params.domainId,
      user_id: params.userId,
      name: params.name,

      // Inputs
      total_budget: params.totalBudget,
      mgmt_fee_type: params.mgmtFeeType,
      mgmt_fee_value: params.mgmtFeeValue,
      avg_cpc: params.avgCpc,
      website_conv_rate: params.websiteConvRate,
      reception_rate: params.receptionRate,
      attendance_rate: params.attendanceRate,
      referral_rate: params.referralRate,
      avg_short_term_value: params.avgShortTermValue,
      avg_lifetime_value: params.avgLifetimeValue,

      // Calculated results
      ad_spend_budget: results.adSpendBudget,
      monthly_clicks: results.monthlyClicks,
      prospects: results.prospects,
      np_bookings: results.npBookings,
      actual_nps: results.actualNps,
      np_referrals: results.npReferrals,
      adjusted_nps: results.adjustedNps,
      cost_per_acquisition: results.costPerAcquisition,
      short_term_return: results.shortTermReturn,
      short_term_roas: results.shortTermRoas,
      lifetime_return: results.lifetimeReturn,
      lifetime_roas: results.lifetimeRoas,

      notes: params.notes,
    },
  })

  return id
}

/**
 * Get Google Ads calculations for a domain
 */
export async function getGoogleAdsCalculations(params: {
  domainId: string
  userId: string
  limit?: number
  offset?: number
}) {
  const calculations = await prisma.google_ads_calculations.findMany({
    where: {
      domain_id: params.domainId,
      user_id: params.userId,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: params.limit ?? 20,
    skip: params.offset ?? 0,
  })

  return calculations.map((calc) => ({
    id: calc.id,
    domainId: calc.domain_id,
    userId: calc.user_id,
    name: calc.name,
    totalBudget: Number(calc.total_budget),
    mgmtFeeType: calc.mgmt_fee_type as 'percentage' | 'fixed',
    mgmtFeeValue: Number(calc.mgmt_fee_value),
    avgCpc: Number(calc.avg_cpc),
    websiteConvRate: Number(calc.website_conv_rate),
    receptionRate: Number(calc.reception_rate),
    attendanceRate: Number(calc.attendance_rate),
    referralRate: Number(calc.referral_rate),
    avgShortTermValue: Number(calc.avg_short_term_value),
    avgLifetimeValue: Number(calc.avg_lifetime_value),
    adSpendBudget: calc.ad_spend_budget ? Number(calc.ad_spend_budget) : null,
    monthlyClicks: calc.monthly_clicks,
    prospects: calc.prospects ? Number(calc.prospects) : null,
    npBookings: calc.np_bookings ? Number(calc.np_bookings) : null,
    actualNps: calc.actual_nps ? Number(calc.actual_nps) : null,
    npReferrals: calc.np_referrals ? Number(calc.np_referrals) : null,
    adjustedNps: calc.adjusted_nps ? Number(calc.adjusted_nps) : null,
    costPerAcquisition: calc.cost_per_acquisition ? Number(calc.cost_per_acquisition) : null,
    shortTermReturn: calc.short_term_return ? Number(calc.short_term_return) : null,
    shortTermRoas: calc.short_term_roas ? Number(calc.short_term_roas) : null,
    lifetimeReturn: calc.lifetime_return ? Number(calc.lifetime_return) : null,
    lifetimeRoas: calc.lifetime_roas ? Number(calc.lifetime_roas) : null,
    notes: calc.notes,
    createdAt: calc.created_at.toISOString(),
    updatedAt: calc.updated_at.toISOString(),
  }))
}

/**
 * Get a single Google Ads calculation
 */
export async function getGoogleAdsCalculation(params: { id: string; userId: string }) {
  const calc = await prisma.google_ads_calculations.findUnique({
    where: { id: params.id },
  })

  if (!calc || calc.user_id !== params.userId) {
    return null
  }

  return {
    id: calc.id,
    domainId: calc.domain_id,
    userId: calc.user_id,
    name: calc.name,
    totalBudget: Number(calc.total_budget),
    mgmtFeeType: calc.mgmt_fee_type as 'percentage' | 'fixed',
    mgmtFeeValue: Number(calc.mgmt_fee_value),
    avgCpc: Number(calc.avg_cpc),
    websiteConvRate: Number(calc.website_conv_rate),
    receptionRate: Number(calc.reception_rate),
    attendanceRate: Number(calc.attendance_rate),
    referralRate: Number(calc.referral_rate),
    avgShortTermValue: Number(calc.avg_short_term_value),
    avgLifetimeValue: Number(calc.avg_lifetime_value),
    adSpendBudget: calc.ad_spend_budget ? Number(calc.ad_spend_budget) : null,
    monthlyClicks: calc.monthly_clicks,
    prospects: calc.prospects ? Number(calc.prospects) : null,
    npBookings: calc.np_bookings ? Number(calc.np_bookings) : null,
    actualNps: calc.actual_nps ? Number(calc.actual_nps) : null,
    npReferrals: calc.np_referrals ? Number(calc.np_referrals) : null,
    adjustedNps: calc.adjusted_nps ? Number(calc.adjusted_nps) : null,
    costPerAcquisition: calc.cost_per_acquisition ? Number(calc.cost_per_acquisition) : null,
    shortTermReturn: calc.short_term_return ? Number(calc.short_term_return) : null,
    shortTermRoas: calc.short_term_roas ? Number(calc.short_term_roas) : null,
    lifetimeReturn: calc.lifetime_return ? Number(calc.lifetime_return) : null,
    lifetimeRoas: calc.lifetime_roas ? Number(calc.lifetime_roas) : null,
    notes: calc.notes,
    createdAt: calc.created_at.toISOString(),
    updatedAt: calc.updated_at.toISOString(),
  }
}

/**
 * Delete a Google Ads calculation
 */
export async function deleteGoogleAdsCalculation(params: {
  id: string
  userId: string
}): Promise<boolean> {
  const existing = await prisma.google_ads_calculations.findUnique({
    where: { id: params.id },
    select: { user_id: true },
  })

  if (!existing || existing.user_id !== params.userId) {
    return false
  }

  await prisma.google_ads_calculations.delete({
    where: { id: params.id },
  })

  return true
}

/**
 * Duplicate a Google Ads calculation
 */
export async function duplicateGoogleAdsCalculation(params: {
  id: string
  userId: string
  newName?: string
}): Promise<string | null> {
  const existing = await getGoogleAdsCalculation({ id: params.id, userId: params.userId })

  if (!existing) {
    return null
  }

  const newId = await createGoogleAdsCalculation({
    domainId: existing.domainId,
    userId: params.userId,
    name: params.newName ?? `${existing.name ?? 'Calculation'} (Copy)`,
    totalBudget: existing.totalBudget,
    mgmtFeeType: existing.mgmtFeeType,
    mgmtFeeValue: existing.mgmtFeeValue,
    avgCpc: existing.avgCpc,
    websiteConvRate: existing.websiteConvRate,
    receptionRate: existing.receptionRate,
    attendanceRate: existing.attendanceRate,
    referralRate: existing.referralRate,
    avgShortTermValue: existing.avgShortTermValue,
    avgLifetimeValue: existing.avgLifetimeValue,
    notes: existing.notes ?? undefined,
  })

  return newId
}

// ============================================
// Capacity Calculator Operations
// ============================================

export interface CreateCapacityCalculationParams {
  domainId: string
  userId: string
  name?: string

  // Practice setup
  operatories: number
  daysOpenPerWeek: number
  hoursPerDay: number
  appointmentDuration: number // minutes

  // Current state (optional)
  currentPatientsMonthly?: number
  currentRevenueMonthly?: number

  // Value metrics
  avgShortTermValue: number
  avgLifetimeValue: number

  notes?: string
}

/**
 * Create a new Capacity calculation
 */
export async function createCapacityCalculation(
  params: CreateCapacityCalculationParams
): Promise<string> {
  // Calculate results
  const inputs: CapacityInputs = {
    operatories: params.operatories,
    daysOpenPerWeek: params.daysOpenPerWeek,
    hoursPerDay: params.hoursPerDay,
    appointmentDuration: params.appointmentDuration,
    currentPatientsMonthly: params.currentPatientsMonthly,
    currentRevenueMonthly: params.currentRevenueMonthly,
    avgShortTermValue: params.avgShortTermValue,
    avgLifetimeValue: params.avgLifetimeValue,
  }

  const results = calculateCapacityMetrics(inputs)

  const id = createId()

  await prisma.capacity_calculations.create({
    data: {
      id,
      domain_id: params.domainId,
      user_id: params.userId,
      name: params.name,

      // Practice setup inputs
      operatories: params.operatories,
      days_open_per_week: params.daysOpenPerWeek,
      hours_per_day: params.hoursPerDay,
      appointment_duration: params.appointmentDuration,

      // Current state
      current_patients_monthly: params.currentPatientsMonthly,
      current_revenue_monthly: params.currentRevenueMonthly,

      // Value metrics
      avg_short_term_value: params.avgShortTermValue,
      avg_lifetime_value: params.avgLifetimeValue,

      // Calculated results
      max_appointments_daily: results.maxAppointmentsDaily,
      max_appointments_weekly: results.maxAppointmentsWeekly,
      max_appointments_monthly: results.maxAppointmentsMonthly,
      max_revenue_monthly: results.maxRevenueMonthly,
      capacity_utilization: results.capacityUtilization,
      revenue_gap: results.revenueGap,
      potential_ltv_gap: results.potentialLtvGap,

      notes: params.notes,
    },
  })

  return id
}

/**
 * Get Capacity calculations for a domain
 */
export async function getCapacityCalculations(params: {
  domainId: string
  userId: string
  limit?: number
  offset?: number
}) {
  const calculations = await prisma.capacity_calculations.findMany({
    where: {
      domain_id: params.domainId,
      user_id: params.userId,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: params.limit ?? 20,
    skip: params.offset ?? 0,
  })

  return calculations.map((calc) => ({
    id: calc.id,
    domainId: calc.domain_id,
    userId: calc.user_id,
    name: calc.name,
    operatories: calc.operatories,
    daysOpenPerWeek: calc.days_open_per_week,
    hoursPerDay: Number(calc.hours_per_day),
    appointmentDuration: calc.appointment_duration,
    currentPatientsMonthly: calc.current_patients_monthly,
    currentRevenueMonthly: calc.current_revenue_monthly ? Number(calc.current_revenue_monthly) : null,
    avgShortTermValue: Number(calc.avg_short_term_value),
    avgLifetimeValue: Number(calc.avg_lifetime_value),
    maxAppointmentsDaily: calc.max_appointments_daily,
    maxAppointmentsWeekly: calc.max_appointments_weekly,
    maxAppointmentsMonthly: calc.max_appointments_monthly,
    maxRevenueMonthly: calc.max_revenue_monthly ? Number(calc.max_revenue_monthly) : null,
    capacityUtilization: calc.capacity_utilization ? Number(calc.capacity_utilization) : null,
    revenueGap: calc.revenue_gap ? Number(calc.revenue_gap) : null,
    potentialLtvGap: calc.potential_ltv_gap ? Number(calc.potential_ltv_gap) : null,
    notes: calc.notes,
    createdAt: calc.created_at.toISOString(),
    updatedAt: calc.updated_at.toISOString(),
  }))
}

/**
 * Get a single Capacity calculation
 */
export async function getCapacityCalculation(params: { id: string; userId: string }) {
  const calc = await prisma.capacity_calculations.findUnique({
    where: { id: params.id },
  })

  if (!calc || calc.user_id !== params.userId) {
    return null
  }

  return {
    id: calc.id,
    domainId: calc.domain_id,
    userId: calc.user_id,
    name: calc.name,
    operatories: calc.operatories,
    daysOpenPerWeek: calc.days_open_per_week,
    hoursPerDay: Number(calc.hours_per_day),
    appointmentDuration: calc.appointment_duration,
    currentPatientsMonthly: calc.current_patients_monthly,
    currentRevenueMonthly: calc.current_revenue_monthly ? Number(calc.current_revenue_monthly) : null,
    avgShortTermValue: Number(calc.avg_short_term_value),
    avgLifetimeValue: Number(calc.avg_lifetime_value),
    maxAppointmentsDaily: calc.max_appointments_daily,
    maxAppointmentsWeekly: calc.max_appointments_weekly,
    maxAppointmentsMonthly: calc.max_appointments_monthly,
    maxRevenueMonthly: calc.max_revenue_monthly ? Number(calc.max_revenue_monthly) : null,
    capacityUtilization: calc.capacity_utilization ? Number(calc.capacity_utilization) : null,
    revenueGap: calc.revenue_gap ? Number(calc.revenue_gap) : null,
    potentialLtvGap: calc.potential_ltv_gap ? Number(calc.potential_ltv_gap) : null,
    notes: calc.notes,
    createdAt: calc.created_at.toISOString(),
    updatedAt: calc.updated_at.toISOString(),
  }
}

/**
 * Delete a Capacity calculation
 */
export async function deleteCapacityCalculation(params: {
  id: string
  userId: string
}): Promise<boolean> {
  const existing = await prisma.capacity_calculations.findUnique({
    where: { id: params.id },
    select: { user_id: true },
  })

  if (!existing || existing.user_id !== params.userId) {
    return false
  }

  await prisma.capacity_calculations.delete({
    where: { id: params.id },
  })

  return true
}

/**
 * Duplicate a Capacity calculation
 */
export async function duplicateCapacityCalculation(params: {
  id: string
  userId: string
  newName?: string
}): Promise<string | null> {
  const existing = await getCapacityCalculation({ id: params.id, userId: params.userId })

  if (!existing) {
    return null
  }

  const newId = await createCapacityCalculation({
    domainId: existing.domainId,
    userId: params.userId,
    name: params.newName ?? `${existing.name ?? 'Calculation'} (Copy)`,
    operatories: existing.operatories,
    daysOpenPerWeek: existing.daysOpenPerWeek,
    hoursPerDay: existing.hoursPerDay,
    appointmentDuration: existing.appointmentDuration,
    currentPatientsMonthly: existing.currentPatientsMonthly ?? undefined,
    currentRevenueMonthly: existing.currentRevenueMonthly ?? undefined,
    avgShortTermValue: existing.avgShortTermValue,
    avgLifetimeValue: existing.avgLifetimeValue,
    notes: existing.notes ?? undefined,
  })

  return newId
}
