import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  GBPCompleteness,
  GBPSummary,
  GBPCompletenessSkeleton,
  type GBPCompletenessData,
  type GBPField,
} from '../GBPCompleteness'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockFields: GBPField[] = [
  {
    id: 'name',
    name: 'Business Name',
    status: 'complete',
    importance: 'critical',
    value: 'Example Dental',
  },
  {
    id: 'phone',
    name: 'Phone Number',
    status: 'complete',
    importance: 'critical',
    value: '(555) 123-4567',
  },
  {
    id: 'address',
    name: 'Address',
    status: 'incomplete',
    importance: 'critical',
    recommendation: 'Add your full business address',
  },
  {
    id: 'hours',
    name: 'Business Hours',
    status: 'partial',
    importance: 'important',
    recommendation: 'Complete all weekday hours',
  },
  {
    id: 'photos',
    name: 'Photos',
    status: 'missing',
    importance: 'optional',
    recommendation: 'Add at least 10 photos',
  },
]

const mockData: GBPCompletenessData = {
  businessName: 'Example Dental Practice',
  completeness: 75,
  fields: mockFields,
  isVerified: true,
  profileUrl: 'https://business.google.com/example',
}

const mockDataUnverified: GBPCompletenessData = {
  ...mockData,
  isVerified: false,
}

const mockDataLowScore: GBPCompletenessData = {
  ...mockData,
  completeness: 40,
}

const mockDataAllComplete: GBPCompletenessData = {
  businessName: 'Complete Dental',
  completeness: 100,
  fields: mockFields.map((f) => ({ ...f, status: 'complete' as const })),
  isVerified: true,
}

// ============================================================================
// GBPCompleteness Tests
// ============================================================================

describe('GBPCompleteness', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
      expect(screen.getByText('Profile completeness and optimization status')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <GBPCompleteness data={mockData} title="Custom Title" description="Custom description" />
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('displays the completeness percentage', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('shows verified badge when isVerified is true', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('shows not verified badge when isVerified is false', () => {
      render(<GBPCompleteness data={mockDataUnverified} />)

      expect(screen.getByText('Not Verified')).toBeInTheDocument()
    })

    it('displays business name when provided', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('Example Dental Practice')).toBeInTheDocument()
    })
  })

  describe('status labels', () => {
    it('shows "Good" status for 75-89% completeness', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('shows "Needs Work" status for under 50% completeness', () => {
      render(<GBPCompleteness data={mockDataLowScore} />)

      expect(screen.getByText('Needs Work')).toBeInTheDocument()
    })

    it('shows "Excellent" status for 90%+ completeness', () => {
      render(<GBPCompleteness data={{ ...mockData, completeness: 95 }} />)

      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('shows "Fair" status for 50-74% completeness', () => {
      render(<GBPCompleteness data={{ ...mockData, completeness: 60 }} />)

      expect(screen.getByText('Fair')).toBeInTheDocument()
    })
  })

  describe('fields display', () => {
    it('shows only incomplete fields by default', () => {
      render(<GBPCompleteness data={mockData} />)

      // Incomplete fields should be visible
      expect(screen.getByText('Address')).toBeInTheDocument()
      expect(screen.getByText('Business Hours')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()

      // Complete fields should NOT be visible by default
      expect(screen.queryByText('Phone Number')).not.toBeInTheDocument()
    })

    it('shows all fields when showAllFields is true', () => {
      render(<GBPCompleteness data={mockData} showAllFields />)

      // Use getAllByText for fields that appear multiple times and check count
      expect(screen.getAllByText('Business Name').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Phone Number')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
      expect(screen.getByText('All Fields')).toBeInTheDocument() // Section header
    })

    it('displays recommendations for incomplete fields', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText('Add your full business address')).toBeInTheDocument()
      expect(screen.getByText('Complete all weekday hours')).toBeInTheDocument()
    })

    it('displays field values when available', () => {
      render(<GBPCompleteness data={mockData} showAllFields />)

      expect(screen.getByText('Example Dental')).toBeInTheDocument()
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
    })

    it('shows importance badges', () => {
      render(<GBPCompleteness data={mockData} />)

      // Should show importance badges for incomplete fields
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('Important')).toBeInTheDocument()
      expect(screen.getByText('Optional')).toBeInTheDocument()
    })
  })

  describe('statistics', () => {
    it('shows field completion count', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText(/2 of 5 fields complete/)).toBeInTheDocument()
    })

    it('shows critical missing fields count', () => {
      render(<GBPCompleteness data={mockData} />)

      expect(screen.getByText(/1 critical field missing/)).toBeInTheDocument()
    })

    it('does not show critical missing if none missing', () => {
      render(<GBPCompleteness data={mockDataAllComplete} />)

      expect(screen.queryByText(/critical.*missing/i)).not.toBeInTheDocument()
    })
  })

  describe('all complete state', () => {
    it('shows success message when all fields complete', () => {
      render(<GBPCompleteness data={mockDataAllComplete} />)

      expect(screen.getByText('All Fields Complete!')).toBeInTheDocument()
      expect(
        screen.getByText('Your Google Business Profile is fully optimized.')
      ).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<GBPCompleteness data={mockData} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

// ============================================================================
// GBPSummary Tests
// ============================================================================

describe('GBPSummary', () => {
  it('renders the summary', () => {
    render(<GBPSummary completeness={80} isVerified criticalMissing={0} />)

    expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
    expect(screen.getByText('80% complete')).toBeInTheDocument()
  })

  it('shows verified badge', () => {
    render(<GBPSummary completeness={80} isVerified criticalMissing={0} />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('shows not verified badge', () => {
    render(<GBPSummary completeness={80} isVerified={false} criticalMissing={0} />)

    expect(screen.getByText('Not Verified')).toBeInTheDocument()
  })

  it('shows critical missing count when greater than 0', () => {
    render(<GBPSummary completeness={60} isVerified criticalMissing={2} />)

    expect(screen.getByText('2 critical missing')).toBeInTheDocument()
  })

  it('does not show critical missing when 0', () => {
    render(<GBPSummary completeness={80} isVerified criticalMissing={0} />)

    expect(screen.queryByText(/critical missing/)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <GBPSummary completeness={80} isVerified criticalMissing={0} className="custom-summary" />
    )

    expect(container.firstChild).toHaveClass('custom-summary')
  })
})

// ============================================================================
// GBPCompletenessSkeleton Tests
// ============================================================================

describe('GBPCompletenessSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<GBPCompletenessSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(<GBPCompletenessSkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })
})
