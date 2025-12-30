import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CompetitorComparison,
  CompetitorComparisonSkeleton,
  CompetitorComparisonEmpty,
  type CompetitorMetrics,
} from '../CompetitorComparison'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockTargetMetrics: CompetitorMetrics = {
  domain: 'example-dental.com',
  rank: 450,
  organicTraffic: 5000,
  backlinks: 1500,
  referringDomains: 120,
  rankingKeywords: 350,
  top10Keywords: 45,
  trafficValue: 2500,
}

const mockCompetitors: CompetitorMetrics[] = [
  {
    domain: 'competitor1.com',
    rank: 650,
    organicTraffic: 12000,
    backlinks: 5000,
    referringDomains: 350,
    rankingKeywords: 800,
    top10Keywords: 120,
    trafficValue: 8000,
  },
  {
    domain: 'competitor2.com',
    rank: 500,
    organicTraffic: 7500,
    backlinks: 2500,
    referringDomains: 200,
    rankingKeywords: 550,
    top10Keywords: 75,
    trafficValue: 4500,
  },
  {
    domain: 'competitor3.com',
    rank: 350,
    organicTraffic: 3000,
    backlinks: 800,
    referringDomains: 80,
    rankingKeywords: 200,
    top10Keywords: 25,
  },
]

// ============================================================================
// CompetitorComparison Tests
// ============================================================================

describe('CompetitorComparison', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByText('Competitor Comparison')).toBeInTheDocument()
      expect(screen.getByText('See how your site compares to top competitors')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
          title="Custom Title"
          description="Custom description"
        />
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('displays the target position badge', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      // Target + 3 competitors = 4 total, target is sorted by rank
      expect(screen.getByText(/#\d+ of \d+/)).toBeInTheDocument()
    })
  })

  describe('table structure', () => {
    it('renders table headers', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByText('Domain')).toBeInTheDocument()
      expect(screen.getByText('Rank')).toBeInTheDocument()
      expect(screen.getByText('Traffic')).toBeInTheDocument()
      expect(screen.getByText('Backlinks')).toBeInTheDocument()
      expect(screen.getByText('Ref. Domains')).toBeInTheDocument()
      expect(screen.getByText('Keywords')).toBeInTheDocument()
    })

    it('displays all domains including target', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByText('example-dental.com')).toBeInTheDocument()
      expect(screen.getByText('competitor1.com')).toBeInTheDocument()
      expect(screen.getByText('competitor2.com')).toBeInTheDocument()
      expect(screen.getByText('competitor3.com')).toBeInTheDocument()
    })

    it('marks target domain with "You" badge', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      expect(screen.getByText('You')).toBeInTheDocument()
    })
  })

  describe('maxCompetitors prop', () => {
    it('limits displayed competitors', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
          maxCompetitors={2}
        />
      )

      expect(screen.getByText('competitor1.com')).toBeInTheDocument()
      expect(screen.getByText('competitor2.com')).toBeInTheDocument()
      expect(screen.queryByText('competitor3.com')).not.toBeInTheDocument()
    })
  })

  describe('metric display', () => {
    it('formats large numbers correctly', () => {
      render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
        />
      )

      // Check that numbers are formatted (5000 -> 5.0K)
      expect(screen.getAllByText(/\d+\.?\d*K/).length).toBeGreaterThan(0)
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <CompetitorComparison
          targetDomain="example-dental.com"
          targetMetrics={mockTargetMetrics}
          competitors={mockCompetitors}
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

// ============================================================================
// CompetitorComparisonSkeleton Tests
// ============================================================================

describe('CompetitorComparisonSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CompetitorComparisonSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('respects rows prop', () => {
    const { container } = render(<CompetitorComparisonSkeleton rows={3} />)

    // Should have 3 body rows
    const tableBody = container.querySelector('tbody')
    expect(tableBody?.children.length).toBe(3)
  })

  it('applies custom className', () => {
    const { container } = render(<CompetitorComparisonSkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })
})

// ============================================================================
// CompetitorComparisonEmpty Tests
// ============================================================================

describe('CompetitorComparisonEmpty', () => {
  it('renders empty state message', () => {
    render(<CompetitorComparisonEmpty />)

    expect(screen.getByText('No Competitor Data')).toBeInTheDocument()
    expect(screen.getByText(/not yet available/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<CompetitorComparisonEmpty className="empty-class" />)

    expect(container.firstChild).toHaveClass('empty-class')
  })
})
