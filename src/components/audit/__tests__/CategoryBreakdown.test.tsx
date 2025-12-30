import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryBreakdown } from '../CategoryBreakdown'
import type {
  OnPageStepResult,
  SerpStepResult,
  BacklinksStepResult,
  BusinessStepResult,
} from '@/types/audit'

// Mock data
const mockOnPageData: OnPageStepResult = {
  pagesAnalyzed: 50,
  issuesFound: 12,
  pageSpeed: 85,
  mobileScore: 78,
  httpsEnabled: true,
  hasSchema: false,
  brokenLinks: 3,
  missingAltTags: 7,
  missingMetaDescriptions: 2,
}

const mockSerpData: SerpStepResult = {
  keywordsTracked: 25,
  avgPosition: 8.5,
  top3Count: 5,
  top10Count: 15,
  featuredSnippets: 2,
  localPackPresence: true,
}

const mockBacklinksData: BacklinksStepResult = {
  totalBacklinks: 15000,
  referringDomains: 250,
  domainRank: 450,
  spamScore: 12,
  dofollowRatio: 0.65,
}

const mockBusinessData: BusinessStepResult = {
  hasGmbListing: true,
  gmbRating: 4.7,
  reviewCount: 85,
  napConsistent: true,
  categoriesSet: true,
  photosCount: 25,
  postsRecent: false,
}

describe('CategoryBreakdown', () => {
  describe('tab navigation', () => {
    it('renders all four tabs', () => {
      render(
        <CategoryBreakdown
          onPage={mockOnPageData}
          serp={mockSerpData}
          backlinks={mockBacklinksData}
          business={mockBusinessData}
        />
      )

      expect(screen.getByRole('tab', { name: /technical/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /content/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /local/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /backlinks/i })).toBeInTheDocument()
    })

    it('shows technical tab content by default', () => {
      render(
        <CategoryBreakdown onPage={mockOnPageData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('Pages Analyzed')).toBeInTheDocument()
    })

    it('switches to content tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={mockOnPageData}
          serp={mockSerpData}
          backlinks={null}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('Keywords Tracked')).toBeInTheDocument()
      })
    })

    it('switches to local tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={null} backlinks={null} business={mockBusinessData} />
      )

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
      })
    })

    it('switches to backlinks tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Total Backlinks')).toBeInTheDocument()
      })
    })
  })

  describe('technical metrics', () => {
    it('displays pages analyzed', () => {
      render(
        <CategoryBreakdown onPage={mockOnPageData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('Pages Analyzed')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('displays issues found with good indicator', () => {
      const lowIssuesData = { ...mockOnPageData, issuesFound: 3 }
      render(
        <CategoryBreakdown onPage={lowIssuesData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('Issues Found')).toBeInTheDocument()
    })

    it('displays page speed score', () => {
      render(
        <CategoryBreakdown onPage={mockOnPageData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('Page Speed Score')).toBeInTheDocument()
    })

    it('displays HTTPS status', () => {
      render(
        <CategoryBreakdown onPage={mockOnPageData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('HTTPS Enabled')).toBeInTheDocument()
    })

    it('displays schema markup status', () => {
      render(
        <CategoryBreakdown onPage={mockOnPageData} serp={null} backlinks={null} business={null} />
      )

      expect(screen.getByText('Schema Markup')).toBeInTheDocument()
    })
  })

  describe('content/SERP metrics', () => {
    it('displays keywords tracked', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={mockSerpData} backlinks={null} business={null} />
      )

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('Keywords Tracked')).toBeInTheDocument()
      })
    })

    it('displays average position', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={mockSerpData} backlinks={null} business={null} />
      )

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('Average Position')).toBeInTheDocument()
      })
    })

    it('displays top 3 and top 10 rankings', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={mockSerpData} backlinks={null} business={null} />
      )

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('Top 3 Rankings')).toBeInTheDocument()
        expect(screen.getByText('Top 10 Rankings')).toBeInTheDocument()
      })
    })

    it('displays local pack presence', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={mockSerpData} backlinks={null} business={null} />
      )

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('Local Pack Presence')).toBeInTheDocument()
      })
    })
  })

  describe('local/business metrics', () => {
    it('displays GMB listing status', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={null} backlinks={null} business={mockBusinessData} />
      )

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('Google Business Profile')).toBeInTheDocument()
      })
    })

    it('displays GMB rating', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={null} backlinks={null} business={mockBusinessData} />
      )

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('GMB Rating')).toBeInTheDocument()
        expect(screen.getByText('4.7/5')).toBeInTheDocument()
      })
    })

    it('displays review count', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={null} backlinks={null} business={mockBusinessData} />
      )

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('Review Count')).toBeInTheDocument()
      })
    })

    it('displays NAP consistency', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown onPage={null} serp={null} backlinks={null} business={mockBusinessData} />
      )

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('NAP Consistent')).toBeInTheDocument()
      })
    })
  })

  describe('backlinks metrics', () => {
    it('displays total backlinks', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Total Backlinks')).toBeInTheDocument()
      })
    })

    it('displays referring domains', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Referring Domains')).toBeInTheDocument()
      })
    })

    it('displays domain rank', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Domain Rank')).toBeInTheDocument()
        expect(screen.getByText('450/1000')).toBeInTheDocument()
      })
    })

    it('displays spam score', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Spam Score')).toBeInTheDocument()
      })
    })

    it('displays dofollow ratio', async () => {
      const user = userEvent.setup()
      render(
        <CategoryBreakdown
          onPage={null}
          serp={null}
          backlinks={mockBacklinksData}
          business={null}
        />
      )

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('Dofollow Ratio')).toBeInTheDocument()
      })
    })
  })

  describe('null data handling', () => {
    it('shows "No data available" for null onPage data', () => {
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      expect(screen.getByText('No data available for this category')).toBeInTheDocument()
    })

    it('shows "No data available" for null serp data', async () => {
      const user = userEvent.setup()
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      await user.click(screen.getByRole('tab', { name: /content/i }))
      await waitFor(() => {
        expect(screen.getByText('No data available for this category')).toBeInTheDocument()
      })
    })

    it('shows "No data available" for null business data', async () => {
      const user = userEvent.setup()
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      await user.click(screen.getByRole('tab', { name: /local/i }))
      await waitFor(() => {
        expect(screen.getByText('No data available for this category')).toBeInTheDocument()
      })
    })

    it('shows "No data available" for null backlinks data', async () => {
      const user = userEvent.setup()
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      await user.click(screen.getByRole('tab', { name: /backlinks/i }))
      await waitFor(() => {
        expect(screen.getByText('No data available for this category')).toBeInTheDocument()
      })
    })
  })

  describe('card structure', () => {
    it('renders with title', () => {
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      expect(screen.getByText('Detailed Breakdown')).toBeInTheDocument()
    })

    it('renders with description', () => {
      render(<CategoryBreakdown onPage={null} serp={null} backlinks={null} business={null} />)

      expect(screen.getByText('Metrics from each analysis step')).toBeInTheDocument()
    })
  })
})
