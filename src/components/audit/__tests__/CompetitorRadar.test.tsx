import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CompetitorRadar,
  SingleRadar,
  CompetitorRadarSkeleton,
  type RadarMetrics,
  type CompetitorRadarData,
} from '../CompetitorRadar'

// ============================================================================
// Mock Recharts
// ============================================================================

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: ({ name }: { name: string }) => <div data-testid={`radar-${name}`} />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

// ============================================================================
// Test Fixtures
// ============================================================================

const mockTargetMetrics: RadarMetrics = {
  technical: 85,
  content: 70,
  local: 90,
  backlinks: 65,
  authority: 75,
}

const mockCompetitors: CompetitorRadarData[] = [
  {
    domain: 'competitor1.com',
    metrics: {
      technical: 75,
      content: 80,
      local: 70,
      backlinks: 85,
      authority: 80,
    },
    color: '#ef4444',
  },
  {
    domain: 'competitor2.com',
    metrics: {
      technical: 60,
      content: 65,
      local: 95,
      backlinks: 50,
      authority: 55,
    },
  },
]

// ============================================================================
// CompetitorRadar Tests
// ============================================================================

describe('CompetitorRadar', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(<CompetitorRadar targetDomain="example.com" targetMetrics={mockTargetMetrics} />)

      expect(screen.getByText('SEO Performance Radar')).toBeInTheDocument()
      expect(screen.getByText('Compare performance across key SEO dimensions')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          title="Custom Radar Title"
          description="Custom radar description"
        />
      )

      expect(screen.getByText('Custom Radar Title')).toBeInTheDocument()
      expect(screen.getByText('Custom radar description')).toBeInTheDocument()
    })

    it('renders the radar chart', () => {
      render(<CompetitorRadar targetDomain="example.com" targetMetrics={mockTargetMetrics} />)

      expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    })

    it('renders grid and axes', () => {
      render(<CompetitorRadar targetDomain="example.com" targetMetrics={mockTargetMetrics} />)

      expect(screen.getByTestId('polar-grid')).toBeInTheDocument()
      expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument()
      expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument()
    })

    it('renders legend', () => {
      render(<CompetitorRadar targetDomain="example.com" targetMetrics={mockTargetMetrics} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('with competitors', () => {
    it('renders radar for target domain', () => {
      render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByTestId('radar-example.com')).toBeInTheDocument()
    })

    it('renders radars for competitors', () => {
      render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByTestId('radar-competitor1.com')).toBeInTheDocument()
      expect(screen.getByTestId('radar-competitor2.com')).toBeInTheDocument()
    })

    it('limits competitors displayed', () => {
      // Create many competitors with unique domains
      const manyCompetitors: CompetitorRadarData[] = Array.from({ length: 10 }, (_, i) => ({
        domain: `competitor${i + 1}.com`,
        metrics: mockTargetMetrics,
      }))

      render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          competitors={manyCompetitors}
        />
      )

      // Should not render all 10 competitors - component limits to 4
      // Target (1) + limited competitors (4) = 5 max, but verify not all 10
      const radars = screen.getAllByTestId(/^radar-/)
      expect(radars.length).toBeLessThan(11) // Not all 10 + target
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          className="custom-radar-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-radar-class')
    })

    it('applies custom height', () => {
      const { container } = render(
        <CompetitorRadar
          targetDomain="example.com"
          targetMetrics={mockTargetMetrics}
          height={500}
        />
      )

      const chartContainer = container.querySelector('[style*="height"]')
      expect(chartContainer).toHaveStyle({ height: '500px' })
    })
  })
})

// ============================================================================
// SingleRadar Tests
// ============================================================================

describe('SingleRadar', () => {
  it('renders the card with title', () => {
    render(<SingleRadar metrics={mockTargetMetrics} />)

    expect(screen.getByText('SEO Performance Overview')).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    render(
      <SingleRadar
        metrics={mockTargetMetrics}
        title="Single Domain Radar"
        description="Custom description"
      />
    )

    expect(screen.getByText('Single Domain Radar')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('renders the radar chart', () => {
    render(<SingleRadar metrics={mockTargetMetrics} />)

    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
  })

  it('renders single radar for score', () => {
    render(<SingleRadar metrics={mockTargetMetrics} />)

    expect(screen.getByTestId('radar-Score')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SingleRadar metrics={mockTargetMetrics} className="single-class" />
    )

    expect(container.firstChild).toHaveClass('single-class')
  })
})

// ============================================================================
// CompetitorRadarSkeleton Tests
// ============================================================================

describe('CompetitorRadarSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CompetitorRadarSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders simulated radar grid circles', () => {
    const { container } = render(<CompetitorRadarSkeleton />)

    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(<CompetitorRadarSkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })

  it('applies custom height', () => {
    const { container } = render(<CompetitorRadarSkeleton height={600} />)

    const chartContainer = container.querySelector('[style*="height"]')
    expect(chartContainer).toHaveStyle({ height: '600px' })
  })
})
