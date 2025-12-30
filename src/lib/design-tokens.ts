/**
 * Design Tokens - SEO Platform Design System
 * 
 * A professional, data-focused design system inspired by SEMRush & BrightLocal
 * Optimized for extended analysis sessions with WCAG AA compliance
 */

// ============================================================================
// Color Palette
// ============================================================================

export const colors = {
  // Brand Colors - Deep Navy & Electric Orange accent
  brand: {
    primary: '#0D1F3C',      // Deep Navy - primary backgrounds
    secondary: '#1A365D',     // Navy Blue - secondary elements
    accent: '#FF6B35',        // Electric Orange - CTAs and highlights
    accentHover: '#E85A2A',   // Darker orange for hover states
  },

  // Semantic Colors - Traffic Light System
  status: {
    success: '#059669',       // Emerald - good metrics
    successLight: '#D1FAE5',
    successDark: '#065F46',
    
    warning: '#D97706',       // Amber - needs attention
    warningLight: '#FEF3C7',
    warningDark: '#92400E',
    
    error: '#DC2626',         // Red - critical issues
    errorLight: '#FEE2E2',
    errorDark: '#991B1B',
    
    info: '#2563EB',          // Blue - informational
    infoLight: '#DBEAFE',
    infoDark: '#1E40AF',
  },

  // Ranking Position Colors
  ranking: {
    top3: '#059669',          // Green - excellent
    top10: '#D97706',         // Amber - good
    top20: '#EA580C',         // Orange - okay
    notRanking: '#6B7280',    // Gray - not ranking
  },

  // Chart Palette - Distinct, accessible colors
  chart: {
    primary: '#2563EB',       // Blue
    secondary: '#059669',     // Emerald
    tertiary: '#D97706',      // Amber
    quaternary: '#7C3AED',    // Purple
    quinary: '#DC2626',       // Red
    senary: '#0891B2',        // Cyan
    // Extended palette for more data series
    extended: ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#DB2777', '#65A30D'],
  },

  // Neutral Palette - Light Theme
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Surface Colors
  surface: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardHover: '#F8FAFC',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Dark Mode Surfaces
  surfaceDark: {
    background: '#0F172A',
    card: '#1E293B',
    cardHover: '#334155',
    elevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const

// ============================================================================
// Typography
// ============================================================================

export const typography = {
  fonts: {
    sans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    mono: 'var(--font-geist-mono), ui-monospace, monospace',
    display: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
  },

  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ============================================================================
// Spacing
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
} as const

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const

// ============================================================================
// Shadows
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const

// ============================================================================
// Transitions
// ============================================================================

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  // Specific transitions
  colors: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  transform: 'transform 200ms ease',
  opacity: 'opacity 200ms ease',
  all: 'all 200ms ease',
} as const

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const

// ============================================================================
// Breakpoints
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// Component-Specific Tokens
// ============================================================================

export const components = {
  // Card Component
  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
    hoverShadow: shadows.md,
  },

  // Button Component
  button: {
    heightSm: '2rem',
    height: '2.5rem',
    heightLg: '3rem',
    paddingX: spacing[4],
    paddingXSm: spacing[3],
    paddingXLg: spacing[6],
    borderRadius: borderRadius.md,
  },

  // Input Component
  input: {
    height: '2.5rem',
    heightSm: '2rem',
    heightLg: '3rem',
    paddingX: spacing[3],
    borderRadius: borderRadius.md,
  },

  // Badge Component
  badge: {
    paddingX: spacing[2],
    paddingY: spacing[0.5],
    borderRadius: borderRadius.full,
  },

  // Sidebar Component
  sidebar: {
    width: '16rem',
    collapsedWidth: '4rem',
    itemPadding: `${spacing[2]} ${spacing[3]}`,
    sectionGap: spacing[6],
  },

  // Table Component
  table: {
    cellPaddingX: spacing[4],
    cellPaddingY: spacing[3],
    headerBackground: colors.neutral[50],
  },

  // Chart Component
  chart: {
    height: '300px',
    heightSm: '200px',
    heightLg: '400px',
  },
} as const

// ============================================================================
// Score Thresholds (for health indicators)
// ============================================================================

export const scoreThresholds = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 0,
} as const

export const getScoreColor = (score: number): string => {
  if (score >= scoreThresholds.excellent) return colors.status.success
  if (score >= scoreThresholds.good) return colors.chart.primary
  if (score >= scoreThresholds.fair) return colors.status.warning
  return colors.status.error
}

export const getScoreLabel = (score: number): string => {
  if (score >= scoreThresholds.excellent) return 'Excellent'
  if (score >= scoreThresholds.good) return 'Good'
  if (score >= scoreThresholds.fair) return 'Fair'
  return 'Needs Work'
}

// ============================================================================
// Ranking Position Helpers
// ============================================================================

export const getRankingColor = (rank: number | null): string => {
  if (rank === null || rank > 100) return colors.ranking.notRanking
  if (rank <= 3) return colors.ranking.top3
  if (rank <= 10) return colors.ranking.top10
  if (rank <= 20) return colors.ranking.top20
  return colors.ranking.notRanking
}

export const getRankingLabel = (rank: number | null): string => {
  if (rank === null || rank > 100) return 'Not Ranking'
  if (rank <= 3) return 'Top 3'
  if (rank <= 10) return 'Top 10'
  if (rank <= 20) return 'Top 20'
  return 'Below 20'
}

// Export default design system object
const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  components,
  scoreThresholds,
  getScoreColor,
  getScoreLabel,
  getRankingColor,
  getRankingLabel,
} as const

export default designSystem

