/**
 * Capacity Calculator
 *
 * Calculates practice capacity, utilization, and revenue potential
 * based on operatories, hours, and appointment duration.
 */

export interface CapacityInputs {
  // Practice setup
  operatories: number
  daysOpenPerWeek: number
  hoursPerDay: number
  appointmentDuration: number // in minutes

  // Current state
  currentPatientsMonthly?: number
  currentRevenueMonthly?: number

  // Value metrics
  avgShortTermValue: number
  avgLifetimeValue: number
}

export interface CapacityCalculationResult {
  // Practice capacity
  maxAppointmentsDaily: number
  maxAppointmentsWeekly: number
  maxAppointmentsMonthly: number

  // Revenue potential
  maxRevenueMonthly: number
  maxLifetimeValueMonthly: number

  // Current state analysis
  currentPatientsMonthly: number
  currentRevenueMonthly: number
  capacityUtilization: number // 0-100 percentage

  // Gap analysis
  revenueGap: number
  potentialLtvGap: number
  patientsNeeded: number

  // Annualized
  annualMaxRevenue: number
  annualCurrentRevenue: number
  annualRevenueGap: number
}

export const DEFAULT_CAPACITY_INPUTS: CapacityInputs = {
  operatories: 4,
  daysOpenPerWeek: 5,
  hoursPerDay: 8,
  appointmentDuration: 60, // 1 hour appointments
  currentPatientsMonthly: undefined,
  currentRevenueMonthly: undefined,
  avgShortTermValue: 1000,
  avgLifetimeValue: 10000,
}

export function calculateCapacityMetrics(inputs: CapacityInputs): CapacityCalculationResult {
  const {
    operatories,
    daysOpenPerWeek,
    hoursPerDay,
    appointmentDuration,
    currentPatientsMonthly = 0,
    currentRevenueMonthly = 0,
    avgShortTermValue,
    avgLifetimeValue,
  } = inputs

  // Calculate appointments per operatory per day
  const minutesPerDay = hoursPerDay * 60
  const appointmentsPerOperatoryPerDay = Math.floor(minutesPerDay / appointmentDuration)

  // Total capacity calculations
  const maxAppointmentsDaily = appointmentsPerOperatoryPerDay * operatories
  const maxAppointmentsWeekly = maxAppointmentsDaily * daysOpenPerWeek

  // Average weeks per month (52 weeks / 12 months = 4.33)
  const weeksPerMonth = 52 / 12
  const maxAppointmentsMonthly = Math.round(maxAppointmentsWeekly * weeksPerMonth)

  // Revenue potential
  const maxRevenueMonthly = maxAppointmentsMonthly * avgShortTermValue
  const maxLifetimeValueMonthly = maxAppointmentsMonthly * avgLifetimeValue

  // Capacity utilization (if current patients provided)
  const capacityUtilization =
    currentPatientsMonthly > 0
      ? Math.min(100, (currentPatientsMonthly / maxAppointmentsMonthly) * 100)
      : 0

  // Gap analysis
  const patientsNeeded = Math.max(0, maxAppointmentsMonthly - currentPatientsMonthly)
  const revenueGap = Math.max(0, maxRevenueMonthly - currentRevenueMonthly)
  const potentialLtvGap = patientsNeeded * avgLifetimeValue

  // Annualized
  const annualMaxRevenue = maxRevenueMonthly * 12
  const annualCurrentRevenue = currentRevenueMonthly * 12
  const annualRevenueGap = revenueGap * 12

  return {
    maxAppointmentsDaily,
    maxAppointmentsWeekly,
    maxAppointmentsMonthly,
    maxRevenueMonthly,
    maxLifetimeValueMonthly,
    currentPatientsMonthly,
    currentRevenueMonthly,
    capacityUtilization: Math.round(capacityUtilization * 10) / 10,
    revenueGap,
    potentialLtvGap,
    patientsNeeded,
    annualMaxRevenue,
    annualCurrentRevenue,
    annualRevenueGap,
  }
}

// Formatting utilities
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

// Utilization status helpers
export type UtilizationStatus = 'critical' | 'low' | 'moderate' | 'good' | 'optimal'

export function getUtilizationStatus(utilization: number): UtilizationStatus {
  if (utilization < 25) return 'critical'
  if (utilization < 50) return 'low'
  if (utilization < 75) return 'moderate'
  if (utilization < 90) return 'good'
  return 'optimal'
}

export function getUtilizationColor(status: UtilizationStatus): string {
  switch (status) {
    case 'critical':
      return 'text-red-600'
    case 'low':
      return 'text-orange-600'
    case 'moderate':
      return 'text-yellow-600'
    case 'good':
      return 'text-green-600'
    case 'optimal':
      return 'text-emerald-600'
  }
}

export function getUtilizationBgColor(status: UtilizationStatus): string {
  switch (status) {
    case 'critical':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'low':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'moderate':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'good':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'optimal':
      return 'bg-emerald-100 dark:bg-emerald-900/30'
  }
}
