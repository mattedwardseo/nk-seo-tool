/**
 * TrendIndicator Component Tests
 *
 * Tests for trend indicator components showing metric changes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendIndicator, TrendArrow, TrendBadge } from '../TrendIndicator'

describe('TrendIndicator', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<TrendIndicator value={5} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('displays positive value with plus sign', () => {
      render(<TrendIndicator value={5} showValue />)
      expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('displays negative value with minus sign', () => {
      render(<TrendIndicator value={-3} showValue />)
      expect(screen.getByText('-3')).toBeInTheDocument()
    })

    it('displays zero value', () => {
      render(<TrendIndicator value={0} showValue />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles null value', () => {
      render(<TrendIndicator value={null} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'No change data')
    })
  })

  describe('direction', () => {
    it('shows up trend for positive value', () => {
      render(<TrendIndicator value={5} />)
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('increased')
      )
    })

    it('shows down trend for negative value', () => {
      render(<TrendIndicator value={-5} />)
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('decreased')
      )
    })

    it('shows neutral trend for zero', () => {
      render(<TrendIndicator value={0} />)
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('unchanged')
      )
    })

    it('respects forced direction', () => {
      render(<TrendIndicator value={5} direction="down" />)
      // The icon should show down even though value is positive
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('decreased')
      )
    })
  })

  describe('percentage formatting', () => {
    it('formats as percentage when isPercentage is true', () => {
      render(<TrendIndicator value={5.5} isPercentage showValue />)
      expect(screen.getByText('+5.5%')).toBeInTheDocument()
    })

    it('includes percent in aria-label when isPercentage', () => {
      render(<TrendIndicator value={5} isPercentage />)
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('percent')
      )
    })
  })

  describe('color inversion', () => {
    it('uses inverted colors when invertColors is true', () => {
      const { container } = render(<TrendIndicator value={5} invertColors />)
      // Positive value with inverted colors should show red (bad)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('text-red')
    })

    it('uses normal colors by default', () => {
      const { container } = render(<TrendIndicator value={5} />)
      // Positive value should show green (good)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('text-green')
    })
  })

  describe('size variants', () => {
    it('renders small size', () => {
      const { container } = render(<TrendIndicator value={5} size="sm" />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('gap-0.5')
    })

    it('renders medium size', () => {
      const { container } = render(<TrendIndicator value={5} size="md" />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('gap-1')
    })
  })

  describe('showValue prop', () => {
    it('shows value by default', () => {
      render(<TrendIndicator value={5} />)
      expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('hides value when showValue is false', () => {
      render(<TrendIndicator value={5} showValue={false} />)
      expect(screen.queryByText('+5')).not.toBeInTheDocument()
    })
  })
})

describe('TrendArrow', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<TrendArrow direction="up" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('renders up arrow', () => {
      render(<TrendArrow direction="up" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'trending up')
    })

    it('renders down arrow', () => {
      render(<TrendArrow direction="down" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'trending down')
    })

    it('renders neutral', () => {
      render(<TrendArrow direction="neutral" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'no change')
    })
  })

  describe('colors', () => {
    it('shows green for up when not inverted', () => {
      const { container } = render(<TrendArrow direction="up" />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('text-green')
    })

    it('shows red for up when inverted', () => {
      const { container } = render(<TrendArrow direction="up" invertColors />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('text-red')
    })
  })
})

describe('TrendBadge', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<TrendBadge value={5} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('displays value', () => {
      render(<TrendBadge value={5} />)
      expect(screen.getByText('+5')).toBeInTheDocument()
    })

    it('handles null value', () => {
      render(<TrendBadge value={null} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'No change data')
    })
  })

  describe('percentage formatting', () => {
    it('formats as percentage when isPercentage is true', () => {
      render(<TrendBadge value={5.5} isPercentage />)
      expect(screen.getByText('+5.5%')).toBeInTheDocument()
    })
  })

  describe('background colors', () => {
    it('has green background for positive value', () => {
      const { container } = render(<TrendBadge value={5} />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('bg-green')
    })

    it('has red background for negative value', () => {
      const { container } = render(<TrendBadge value={-5} />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('bg-red')
    })

    it('has muted background for zero', () => {
      const { container } = render(<TrendBadge value={0} />)
      const span = container.firstChild as HTMLElement
      expect(span.className).toContain('bg-muted')
    })
  })
})
