import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  BacklinkGap,
  BacklinkGapSummary,
  BacklinkGapSkeleton,
  type BacklinkGapDomain,
} from '../BacklinkGap'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockGapDomains: BacklinkGapDomain[] = [
  {
    domain: 'high-authority-blog.com',
    rank: 850,
    totalBacklinks: 5,
    linksTo: ['competitor1.com', 'competitor2.com', 'competitor3.com'],
    linksToTarget: false,
    type: 'blog',
    spamScore: 15,
  },
  {
    domain: 'dental-directory.com',
    rank: 650,
    totalBacklinks: 3,
    linksTo: ['competitor1.com', 'competitor2.com'],
    linksToTarget: false,
    type: 'directory',
    spamScore: 25,
  },
  {
    domain: 'local-news.com',
    rank: 500,
    totalBacklinks: 2,
    linksTo: ['competitor1.com'],
    linksToTarget: false,
    type: 'news',
    spamScore: 10,
  },
  {
    domain: 'already-links.com',
    rank: 700,
    totalBacklinks: 4,
    linksTo: ['competitor1.com', 'competitor2.com'],
    linksToTarget: true, // Already links to target
    type: 'blog',
    spamScore: 5,
  },
  {
    domain: 'spammy-site.com',
    rank: 200,
    totalBacklinks: 1,
    linksTo: ['competitor1.com'],
    linksToTarget: false,
    type: 'other',
    spamScore: 75,
  },
]

const competitorDomains = ['competitor1.com', 'competitor2.com', 'competitor3.com']

// ============================================================================
// BacklinkGap Tests
// ============================================================================

describe('BacklinkGap', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      expect(screen.getByText('Backlink Gap Analysis')).toBeInTheDocument()
      expect(screen.getByText('Domains linking to competitors but not to you')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
          title="Custom Gap Title"
          description="Custom gap description"
        />
      )

      expect(screen.getByText('Custom Gap Title')).toBeInTheDocument()
      expect(screen.getByText('Custom gap description')).toBeInTheDocument()
    })

    it('displays opportunity count badge', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      // 4 domains don't link to target (excluding already-links.com)
      expect(screen.getByText('4 opportunities')).toBeInTheDocument()
    })

    it('displays high authority count', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      // 2 domains have rank >= 500 (high-authority-blog.com, dental-directory.com, local-news.com)
      expect(screen.getByText(/\d+ high authority/)).toBeInTheDocument()
    })
  })

  describe('table structure', () => {
    it('renders table headers', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      expect(screen.getByText('Referring Domain')).toBeInTheDocument()
      expect(screen.getByText('Rank')).toBeInTheDocument()
      expect(screen.getByText('Opportunity')).toBeInTheDocument()
      expect(screen.getByText('Spam')).toBeInTheDocument()
    })

    it('shows competitor domain columns', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      // Shows truncated domain names in headers
      expect(screen.getByText('competitor1')).toBeInTheDocument()
      expect(screen.getByText('competitor2')).toBeInTheDocument()
      expect(screen.getByText('competitor3')).toBeInTheDocument()
    })

    it('displays gap domains (excluding those linking to target)', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      expect(screen.getByText('high-authority-blog.com')).toBeInTheDocument()
      expect(screen.getByText('dental-directory.com')).toBeInTheDocument()
      // Should NOT show domains that already link to target
      expect(screen.queryByText('already-links.com')).not.toBeInTheDocument()
    })

    it('shows domain type labels', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      expect(screen.getByText('Blog')).toBeInTheDocument()
      expect(screen.getByText('Directory')).toBeInTheDocument()
      expect(screen.getByText('News')).toBeInTheDocument()
    })

    it('shows spam scores', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      expect(screen.getByText('15%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('shows opportunity badges', () => {
      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
        />
      )

      // High opportunity = links to 75%+ of competitors
      expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('show more/less functionality', () => {
    it('shows "Show More" button when more rows available', () => {
      // Create more than initialRows (default 10) gap domains
      const manyGaps = Array.from({ length: 15 }, (_, i) => ({
        ...mockGapDomains[0],
        domain: `gap-domain-${i}.com`,
      }))

      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={manyGaps}
          initialRows={10}
        />
      )

      expect(screen.getByText(/Show \d+ More/)).toBeInTheDocument()
    })

    it('toggles between show more and show less', async () => {
      const user = userEvent.setup()
      const manyGaps = Array.from({ length: 15 }, (_, i) => ({
        ...mockGapDomains[0],
        domain: `gap-domain-${i}.com`,
      }))

      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={manyGaps}
          initialRows={10}
        />
      )

      // Click show more
      await user.click(screen.getByText(/Show \d+ More/))
      expect(screen.getByText(/Show Less/)).toBeInTheDocument()

      // Click show less
      await user.click(screen.getByText(/Show Less/))
      expect(screen.getByText(/Show \d+ More/)).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no gaps', () => {
      // All domains already link to target
      const noGaps = mockGapDomains.map((d) => ({ ...d, linksToTarget: true }))

      render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={noGaps}
        />
      )

      expect(screen.getByText('No Link Gaps Found')).toBeInTheDocument()
      expect(screen.getByText(/Great job!/)).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <BacklinkGap
          targetDomain="example.com"
          competitorDomains={competitorDomains}
          gapDomains={mockGapDomains}
          className="custom-gap-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-gap-class')
    })
  })
})

// ============================================================================
// BacklinkGapSummary Tests
// ============================================================================

describe('BacklinkGapSummary', () => {
  it('renders the summary card', () => {
    render(<BacklinkGapSummary totalOpportunities={25} highAuthorityCount={10} averageRank={550} />)

    expect(screen.getByText('Link Building Opportunities')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('550')).toBeInTheDocument()
  })

  it('shows labels for metrics', () => {
    render(<BacklinkGapSummary totalOpportunities={25} highAuthorityCount={10} averageRank={550} />)

    expect(screen.getByText('Gap domains')).toBeInTheDocument()
    expect(screen.getByText('High authority')).toBeInTheDocument()
    expect(screen.getByText('Avg. rank')).toBeInTheDocument()
  })

  it('shows potential traffic gain when provided', () => {
    render(
      <BacklinkGapSummary
        totalOpportunities={25}
        highAuthorityCount={10}
        averageRank={550}
        potentialTrafficGain={5000}
      />
    )

    expect(screen.getByText('+5,000')).toBeInTheDocument()
    expect(screen.getByText('Est. traffic')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <BacklinkGapSummary
        totalOpportunities={25}
        highAuthorityCount={10}
        averageRank={550}
        className="summary-class"
      />
    )

    expect(container.firstChild).toHaveClass('summary-class')
  })
})

// ============================================================================
// BacklinkGapSkeleton Tests
// ============================================================================

describe('BacklinkGapSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<BacklinkGapSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('respects rows prop', () => {
    const { container } = render(<BacklinkGapSkeleton rows={3} />)

    const tableBody = container.querySelector('tbody')
    expect(tableBody?.children.length).toBe(3)
  })

  it('applies custom className', () => {
    const { container } = render(<BacklinkGapSkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })
})
