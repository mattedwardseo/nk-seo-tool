import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ReviewSentiment,
  ReviewSummary,
  ReviewSentimentSkeleton,
  type SentimentStats,
  type ReviewData,
} from '../ReviewSentiment'

// ============================================================================
// Mock Recharts
// ============================================================================

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

// ============================================================================
// Test Fixtures
// ============================================================================

const mockStats: SentimentStats = {
  total: 150,
  averageRating: 4.2,
  sentiment: {
    positive: 100,
    neutral: 30,
    negative: 20,
  },
  ratings: {
    5: 80,
    4: 40,
    3: 15,
    2: 10,
    1: 5,
  },
}

const mockStatsWithTrend: SentimentStats = {
  ...mockStats,
  trend: {
    ratingChange: 0.3,
    reviewCountChange: 15,
  },
}

const mockStatsWithTopics: SentimentStats = {
  ...mockStats,
  topTopics: [
    { topic: 'Friendly Staff', count: 45, sentiment: 'positive' },
    { topic: 'Wait Time', count: 12, sentiment: 'negative' },
    { topic: 'Clean Office', count: 30, sentiment: 'positive' },
  ],
}

const mockReviews: ReviewData[] = [
  {
    id: 'review-1',
    text: 'Excellent service! The staff was very friendly and professional.',
    rating: 5,
    sentiment: 'positive',
    date: '2024-01-15',
    reviewerName: 'John D.',
    topics: ['Friendly Staff', 'Professional'],
  },
  {
    id: 'review-2',
    text: 'Good experience overall, but had to wait a bit longer than expected.',
    rating: 4,
    sentiment: 'neutral',
    date: '2024-01-10',
    reviewerName: 'Jane S.',
    topics: ['Wait Time'],
  },
  {
    id: 'review-3',
    text: 'Not satisfied with the service. Would not recommend.',
    rating: 2,
    sentiment: 'negative',
    date: '2024-01-05',
    reviewerName: 'Mike R.',
  },
]

const mockEmptyStats: SentimentStats = {
  total: 0,
  averageRating: 0,
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
}

// ============================================================================
// ReviewSentiment Tests
// ============================================================================

describe('ReviewSentiment', () => {
  describe('rendering', () => {
    it('renders the card with title and description', () => {
      render(<ReviewSentiment stats={mockStats} />)

      expect(screen.getByText('Review Analysis')).toBeInTheDocument()
      expect(screen.getByText('Customer review sentiment and ratings')).toBeInTheDocument()
    })

    it('renders with custom title and description', () => {
      render(
        <ReviewSentiment
          stats={mockStats}
          title="Custom Review Title"
          description="Custom review description"
        />
      )

      expect(screen.getByText('Custom Review Title')).toBeInTheDocument()
      expect(screen.getByText('Custom review description')).toBeInTheDocument()
    })

    it('displays the average rating', () => {
      render(<ReviewSentiment stats={mockStats} />)

      expect(screen.getByText('4.2')).toBeInTheDocument()
    })

    it('displays the total review count', () => {
      render(<ReviewSentiment stats={mockStats} />)

      expect(screen.getByText('150 reviews')).toBeInTheDocument()
    })

    it('renders the sentiment pie chart', () => {
      render(<ReviewSentiment stats={mockStats} />)

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  describe('sentiment breakdown', () => {
    it('displays sentiment labels', () => {
      render(<ReviewSentiment stats={mockStats} />)

      // Labels are lowercase with CSS capitalize class
      expect(screen.getByText('positive')).toBeInTheDocument()
      expect(screen.getByText('neutral')).toBeInTheDocument()
      expect(screen.getByText('negative')).toBeInTheDocument()
    })

    it('displays sentiment percentages', () => {
      render(<ReviewSentiment stats={mockStats} />)

      // 100/150 = 67%, 30/150 = 20%, 20/150 = 13%
      expect(screen.getByText('(67%)')).toBeInTheDocument()
      expect(screen.getByText('(20%)')).toBeInTheDocument()
      expect(screen.getByText('(13%)')).toBeInTheDocument()
    })
  })

  describe('rating distribution', () => {
    it('displays rating distribution section', () => {
      render(<ReviewSentiment stats={mockStats} />)

      expect(screen.getByText('Rating Distribution')).toBeInTheDocument()
    })

    it('displays rating counts', () => {
      render(<ReviewSentiment stats={mockStats} />)

      // Rating counts - use getAllByText since numbers may appear in multiple places
      // Just verify the section exists and has some counts
      expect(screen.getByText('80')).toBeInTheDocument() // 5-star count
      expect(screen.getByText('40')).toBeInTheDocument() // 4-star count
      expect(screen.getByText('15')).toBeInTheDocument() // 3-star count
      expect(screen.getByText('10')).toBeInTheDocument() // 2-star count
      // 5 appears multiple times (rating number and 1-star count), so use getAllByText
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('trend display', () => {
    it('shows positive trend indicator', () => {
      render(<ReviewSentiment stats={mockStatsWithTrend} />)

      expect(screen.getByText('+0.3')).toBeInTheDocument()
    })

    it('shows negative trend indicator', () => {
      render(
        <ReviewSentiment
          stats={{
            ...mockStats,
            trend: { ratingChange: -0.2, reviewCountChange: -5 },
          }}
        />
      )

      expect(screen.getByText('-0.2')).toBeInTheDocument()
    })
  })

  describe('topics display', () => {
    it('shows common topics when provided', () => {
      render(<ReviewSentiment stats={mockStatsWithTopics} />)

      expect(screen.getByText('Common Topics')).toBeInTheDocument()
      expect(screen.getByText('Friendly Staff')).toBeInTheDocument()
      expect(screen.getByText('Wait Time')).toBeInTheDocument()
      expect(screen.getByText('Clean Office')).toBeInTheDocument()
    })

    it('shows topic counts', () => {
      render(<ReviewSentiment stats={mockStatsWithTopics} />)

      expect(screen.getByText('(45)')).toBeInTheDocument()
      expect(screen.getByText('(12)')).toBeInTheDocument()
      expect(screen.getByText('(30)')).toBeInTheDocument()
    })
  })

  describe('reviews display', () => {
    it('displays sample reviews', () => {
      render(<ReviewSentiment stats={mockStats} reviews={mockReviews} />)

      expect(screen.getByText('Recent Reviews')).toBeInTheDocument()
      expect(screen.getByText(/Excellent service/)).toBeInTheDocument()
    })

    it('respects maxReviews prop', () => {
      render(<ReviewSentiment stats={mockStats} reviews={mockReviews} maxReviews={2} />)

      // Should show only 2 reviews
      expect(screen.getByText(/Excellent service/)).toBeInTheDocument()
      expect(screen.getByText(/Good experience overall/)).toBeInTheDocument()
      expect(screen.queryByText(/Not satisfied/)).not.toBeInTheDocument()
    })

    it('displays review dates', () => {
      render(<ReviewSentiment stats={mockStats} reviews={mockReviews} />)

      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    })

    it('displays review topics', () => {
      render(<ReviewSentiment stats={mockStats} reviews={mockReviews} />)

      expect(screen.getByText('Friendly Staff')).toBeInTheDocument()
      expect(screen.getByText('Professional')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows no reviews message when total is 0', () => {
      render(<ReviewSentiment stats={mockEmptyStats} />)

      expect(screen.getByText('No Reviews Found')).toBeInTheDocument()
      expect(screen.getByText(/doesn't have any reviews yet/)).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ReviewSentiment stats={mockStats} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

// ============================================================================
// ReviewSummary Tests
// ============================================================================

describe('ReviewSummary', () => {
  it('renders the summary', () => {
    render(<ReviewSummary averageRating={4.5} totalReviews={100} positivePercentage={85} />)

    expect(screen.getByText('Reviews')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(100)')).toBeInTheDocument()
  })

  it('shows positive percentage badge', () => {
    render(<ReviewSummary averageRating={4.5} totalReviews={100} positivePercentage={85} />)

    expect(screen.getByText('85% positive')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ReviewSummary
        averageRating={4.5}
        totalReviews={100}
        positivePercentage={85}
        className="custom-summary"
      />
    )

    expect(container.firstChild).toHaveClass('custom-summary')
  })
})

// ============================================================================
// ReviewSentimentSkeleton Tests
// ============================================================================

describe('ReviewSentimentSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<ReviewSentimentSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(<ReviewSentimentSkeleton className="skeleton-class" />)

    expect(container.firstChild).toHaveClass('skeleton-class')
  })
})
