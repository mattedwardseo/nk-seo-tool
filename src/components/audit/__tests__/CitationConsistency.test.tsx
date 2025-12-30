import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CitationConsistency,
  CitationSummary,
  CitationConsistencySkeleton,
  type CitationConsistencyData,
  type CitationSource,
} from '../CitationConsistency'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSources: CitationSource[] = [
  {
    id: 'google',
    name: 'Google Business Profile',
    url: 'https://business.google.com/example',
    napData: { name: 'Example Dental', address: '123 Main St', phone: '(555) 123-4567' },
    status: 'consistent',
    fieldStatus: { name: 'consistent', address: 'consistent', phone: 'consistent' },
    importance: 'high',
    lastVerified: '2024-01-15',
  },
  {
    id: 'yelp',
    name: 'Yelp',
    url: 'https://yelp.com/example-dental',
    napData: { name: 'Example Dental', address: '123 Main Street', phone: '(555) 123-4567' },
    status: 'inconsistent',
    fieldStatus: { name: 'consistent', address: 'inconsistent', phone: 'consistent' },
    importance: 'high',
    lastVerified: '2024-01-14',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    napData: { name: 'Example Dental Practice', address: '123 Main St', phone: '555-123-4567' },
    status: 'partial',
    fieldStatus: { name: 'inconsistent', address: 'consistent', phone: 'inconsistent' },
    importance: 'medium',
  },
  {
    id: 'healthgrades',
    name: 'Healthgrades',
    napData: null,
    status: 'missing',
    fieldStatus: { name: 'missing', address: 'missing', phone: 'missing' },
    importance: 'low',
  },
]

const mockData: CitationConsistencyData = {
  canonicalNap: {
    name: 'Example Dental',
    address: '123 Main St',
    phone: '(555) 123-4567',
  },
  sources: mockSources,
  consistencyScore: 75,
  statusCounts: {
    consistent: 1,
    inconsistent: 1,
    missing: 1,
    partial: 1,
  },
}

const mockDataHighScore: CitationConsistencyData = {
  ...mockData,
  consistencyScore: 90,
  statusCounts: { consistent: 4, inconsistent: 0, missing: 0, partial: 0 },
  sources: mockSources.map((s) => ({ ...s, status: 'consistent' as const })),
}

const mockDataLowScore: CitationConsistencyData = {
  ...mockData,
  consistencyScore: 50,
}

// ============================================================================
// CitationConsistency Tests
// ============================================================================

describe('CitationConsistency', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Citation Consistency')).toBeInTheDocument()
      expect(
        screen.getByText('NAP (Name, Address, Phone) consistency across directories')
      ).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <CitationConsistency
          data={mockData}
          title="Custom Citation Title"
          description="Custom citation description"
        />
      )

      expect(screen.getByText('Custom Citation Title')).toBeInTheDocument()
      expect(screen.getByText('Custom citation description')).toBeInTheDocument()
    })

    it('displays the consistency score badge', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('75% consistent')).toBeInTheDocument()
    })
  })

  describe('canonical NAP display', () => {
    it('shows correct business information section', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Correct Business Information')).toBeInTheDocument()
    })

    it('displays canonical name', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Example Dental')).toBeInTheDocument()
    })

    it('displays canonical address', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('123 Main St')).toBeInTheDocument()
    })

    it('displays canonical phone', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
    })
  })

  describe('consistency meter', () => {
    it('shows overall consistency label', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Overall Consistency')).toBeInTheDocument()
    })

    it('displays consistency percentage', () => {
      render(<CitationConsistency data={mockData} />)

      // Both in meter and badge
      expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1)
    })

    it('shows status counts', () => {
      render(<CitationConsistency data={mockData} />)

      // Status labels appear in both the summary and table, use getAllByText
      expect(screen.getAllByText('Consistent').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Inconsistent').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Missing').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Partial').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('citations table', () => {
    it('renders the table headers', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Source')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      // Name, Address, Phone appear in both canonical NAP section and table headers
      expect(screen.getAllByText('Name').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Address').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Phone').length).toBeGreaterThanOrEqual(1)
    })

    it('displays source names', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
      expect(screen.getByText('Yelp')).toBeInTheDocument()
      expect(screen.getByText('Facebook')).toBeInTheDocument()
      expect(screen.getByText('Healthgrades')).toBeInTheDocument()
    })

    it('shows importance badges', () => {
      render(<CitationConsistency data={mockData} />)

      expect(screen.getAllByText('High').length).toBeGreaterThan(0)
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
    })

    it('shows only issues when showOnlyIssues is true', () => {
      render(<CitationConsistency data={mockData} showOnlyIssues />)

      // Consistent source should not be shown
      expect(screen.queryByText('Google Business Profile')).not.toBeInTheDocument()

      // Inconsistent sources should be shown
      expect(screen.getByText('Yelp')).toBeInTheDocument()
      expect(screen.getByText('Facebook')).toBeInTheDocument()
      expect(screen.getByText('Healthgrades')).toBeInTheDocument()
    })
  })

  describe('issue warning', () => {
    it('shows issue warning when there are issues', () => {
      render(<CitationConsistency data={mockData} />)

      // 1 inconsistent + 1 partial = 2 issues
      expect(screen.getByText('2 Citation Issues Found')).toBeInTheDocument()
    })

    it('shows singular "Issue" for one issue', () => {
      render(
        <CitationConsistency
          data={{
            ...mockData,
            statusCounts: { consistent: 3, inconsistent: 1, missing: 0, partial: 0 },
          }}
        />
      )

      expect(screen.getByText('1 Citation Issue Found')).toBeInTheDocument()
    })

    it('does not show warning when no issues', () => {
      render(<CitationConsistency data={mockDataHighScore} />)

      expect(screen.queryByText(/Citation Issue/)).not.toBeInTheDocument()
    })

    it('shows helpful message about local SEO', () => {
      render(<CitationConsistency data={mockData} />)

      expect(
        screen.getByText(/Inconsistent NAP information can hurt your local SEO rankings/)
      ).toBeInTheDocument()
    })
  })

  describe('all consistent state', () => {
    it('shows success message when all consistent and showOnlyIssues', () => {
      render(<CitationConsistency data={mockDataHighScore} showOnlyIssues />)

      expect(screen.getByText('All Citations Consistent!')).toBeInTheDocument()
      expect(
        screen.getByText('Your business information is consistent across all sources.')
      ).toBeInTheDocument()
    })
  })

  describe('badge variants', () => {
    it('shows default badge for high consistency', () => {
      render(<CitationConsistency data={mockDataHighScore} />)

      const badge = screen.getByText('90% consistent')
      expect(badge).toBeInTheDocument()
    })

    it('shows destructive badge for low consistency', () => {
      render(<CitationConsistency data={mockDataLowScore} />)

      const badge = screen.getByText('50% consistent')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<CitationConsistency data={mockData} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

// ============================================================================
// CitationSummary Tests
// ============================================================================

describe('CitationSummary', () => {
  it('renders the summary', () => {
    render(<CitationSummary consistencyScore={85} totalSources={10} issueCount={2} />)

    expect(screen.getByText('NAP Consistency')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('10 citations tracked')).toBeInTheDocument()
  })

  it('shows issue count when greater than 0', () => {
    render(<CitationSummary consistencyScore={75} totalSources={10} issueCount={3} />)

    expect(screen.getByText('3 issues')).toBeInTheDocument()
  })

  it('does not show issue count when 0', () => {
    render(<CitationSummary consistencyScore={100} totalSources={10} issueCount={0} />)

    expect(screen.queryByText(/issues/)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CitationSummary
        consistencyScore={85}
        totalSources={10}
        issueCount={0}
        className="custom-summary"
      />
    )

    expect(container.firstChild).toHaveClass('custom-summary')
  })
})

// ============================================================================
// CitationConsistencySkeleton Tests
// ============================================================================

describe('CitationConsistencySkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CitationConsistencySkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(<CitationConsistencySkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })
})
