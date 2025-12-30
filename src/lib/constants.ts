/**
 * Application Constants
 *
 * Centralized configuration values used throughout the application.
 */

/**
 * Temporary user ID for development/demo mode
 * This will be replaced with real authentication in Phase 5
 */
export const TEMP_USER_ID = 'demo-user-001'

/**
 * Application name for display
 */
export const APP_NAME = 'SEO Audit Platform'

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

/**
 * Audit cooldown period (milliseconds)
 * Minimum time between audits for the same domain
 */
export const AUDIT_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

/**
 * Navigation items for sidebar
 */
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'Home',
  },
  {
    title: 'Projects',
    href: '/audits',
    icon: 'FileSearch',
    children: [
      { title: 'All Projects', href: '/audits' },
      { title: 'New Project', href: '/audits/new' },
      { title: 'Schedules', href: '/audits/schedule' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
] as const

/**
 * Grade color mapping for Tailwind classes
 */
export const GRADE_COLORS = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  lime: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-700 dark:text-lime-400',
    border: 'border-lime-200 dark:border-lime-800',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
} as const

export type GradeColorKey = keyof typeof GRADE_COLORS
