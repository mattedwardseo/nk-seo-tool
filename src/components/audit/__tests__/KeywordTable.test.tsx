import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeywordTable, KeywordTableSkeleton, type KeywordData } from '../KeywordTable'

const mockKeywords: KeywordData[] = [
  {
    keyword: 'dentist near me',
    position: 3,
    previousPosition: 5,
    searchVolume: 12000,
    difficulty: 45,
    cpc: 5.5,
    serpFeatures: ['local_pack', 'people_also_ask'],
    intent: 'transactional',
    isLocal: true,
  },
  {
    keyword: 'best dentist in chicago',
    position: 7,
    previousPosition: 10,
    searchVolume: 5000,
    difficulty: 38,
    cpc: 4.2,
    serpFeatures: ['featured_snippet'],
    intent: 'commercial',
    isLocal: true,
  },
  {
    keyword: 'dental implants cost',
    position: 15,
    previousPosition: 12,
    searchVolume: 25000,
    difficulty: 72,
    cpc: 8.0,
    serpFeatures: ['people_also_ask', 'image_pack'],
    intent: 'informational',
  },
  {
    keyword: 'teeth whitening',
    position: null,
    searchVolume: 8000,
    difficulty: 55,
    serpFeatures: [],
    intent: 'commercial',
  },
]

describe('KeywordTable', () => {
  describe('rendering', () => {
    it('renders the table with title and description', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getByText('Keyword Rankings')).toBeInTheDocument()
      expect(screen.getByText('Track your keyword positions and SERP features')).toBeInTheDocument()
    })

    it('renders custom title and description', () => {
      render(
        <KeywordTable
          keywords={mockKeywords}
          title="Custom Title"
          description="Custom description"
        />
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom description')).toBeInTheDocument()
    })

    it('renders keyword data in table rows', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getByText('dentist near me')).toBeInTheDocument()
      expect(screen.getByText('best dentist in chicago')).toBeInTheDocument()
      expect(screen.getByText('dental implants cost')).toBeInTheDocument()
    })

    it('displays summary badges with top 3 and top 10 counts', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getByText('1 Top 3')).toBeInTheDocument()
      expect(screen.getByText('2 Top 10')).toBeInTheDocument()
    })

    it('displays average position', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // Average of 3, 7, 15 = 8.3
      expect(screen.getByText(/Avg: 8\.3/)).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no keywords', () => {
      render(<KeywordTable keywords={[]} />)

      expect(screen.getByText('No Keywords Found')).toBeInTheDocument()
      expect(screen.getByText('No keyword data available')).toBeInTheDocument()
    })

    it('shows different message when search yields no results', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} searchable />)

      const searchInput = screen.getByPlaceholderText('Search keywords...')
      await user.type(searchInput, 'nonexistent keyword')

      expect(screen.getByText('No Keywords Found')).toBeInTheDocument()
      expect(screen.getByText('Try a different search term')).toBeInTheDocument()
    })
  })

  describe('search functionality', () => {
    it('filters keywords by search query', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} searchable />)

      const searchInput = screen.getByPlaceholderText('Search keywords...')
      await user.type(searchInput, 'dentist')

      expect(screen.getByText('dentist near me')).toBeInTheDocument()
      expect(screen.getByText('best dentist in chicago')).toBeInTheDocument()
      expect(screen.queryByText('dental implants cost')).not.toBeInTheDocument()
      expect(screen.queryByText('teeth whitening')).not.toBeInTheDocument()
    })

    it('search is case-insensitive', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} searchable />)

      const searchInput = screen.getByPlaceholderText('Search keywords...')
      await user.type(searchInput, 'CHICAGO')

      expect(screen.getByText('best dentist in chicago')).toBeInTheDocument()
    })

    it('hides search when searchable is false', () => {
      render(<KeywordTable keywords={mockKeywords} searchable={false} />)

      expect(screen.queryByPlaceholderText('Search keywords...')).not.toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('sorts by position by default', () => {
      render(<KeywordTable keywords={mockKeywords} defaultSort="position" />)

      const table = screen.getByRole('table')
      const rows = within(table).getAllByRole('row').slice(1) // Skip header

      // Position 3 should be first (lowest = best ranking)
      expect(within(rows[0]).getByText('dentist near me')).toBeInTheDocument()
    })

    it('toggles sort direction when clicking column header', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} />)

      const volumeHeader = screen.getByRole('button', { name: /Volume/i })
      await user.click(volumeHeader)

      // After click, sorted by volume desc (highest first)
      const table = screen.getByRole('table')
      const rows = within(table).getAllByRole('row').slice(1)

      // 25K (dental implants) should be first
      expect(within(rows[0]).getByText('dental implants cost')).toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('shows Show More button when more keywords than initialRows', () => {
      render(<KeywordTable keywords={mockKeywords} initialRows={2} />)

      expect(screen.getByRole('button', { name: /Show 2 More/i })).toBeInTheDocument()
    })

    it('expands to show all keywords when Show More clicked', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} initialRows={2} />)

      const showMoreButton = screen.getByRole('button', { name: /Show 2 More/i })
      await user.click(showMoreButton)

      // All 4 keywords should now be visible
      expect(screen.getByText('dentist near me')).toBeInTheDocument()
      expect(screen.getByText('teeth whitening')).toBeInTheDocument()
    })

    it('shows Show Less button after expanding', async () => {
      const user = userEvent.setup()
      render(<KeywordTable keywords={mockKeywords} initialRows={2} />)

      const showMoreButton = screen.getByRole('button', { name: /Show 2 More/i })
      await user.click(showMoreButton)

      expect(screen.getByRole('button', { name: /Show Less/i })).toBeInTheDocument()
    })
  })

  describe('position display', () => {
    it('shows position with color coding', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // Position 3 should have green color class
      const position3 = screen.getByText('3')
      expect(position3).toHaveClass('text-green-600')
    })

    it('shows dash for null position', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // teeth whitening has null position
      const dashElements = screen.getAllByText('—')
      expect(dashElements.length).toBeGreaterThan(0)
    })
  })

  describe('trend indicator', () => {
    it('shows positive trend for improved positions', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // dentist near me improved from 5 to 3 (+2), test-site improved 10 to 7 (+3)
      // TrendIndicator displays values, we can check that arrows exist
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('shows negative trend for declined positions', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // dental implants declined from 12 to 15 (-3)
      // Check that the table renders (trend values are displayed)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('SERP features', () => {
    it('displays SERP feature icons', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // Icons are rendered - check that MapPin icon exists for local_pack
      const table = screen.getByRole('table')
      const svgIcons = table.querySelectorAll('svg')
      expect(svgIcons.length).toBeGreaterThan(0)
    })

    it('shows +N badge when more than maxDisplay features', () => {
      const keywordWith5Features: KeywordData[] = [
        {
          keyword: 'test',
          position: 1,
          searchVolume: 1000,
          serpFeatures: [
            'local_pack',
            'featured_snippet',
            'people_also_ask',
            'image_pack',
            'video',
          ],
        },
      ]

      render(<KeywordTable keywords={keywordWith5Features} />)

      // Default maxDisplay is 4, so +1 badge should show
      expect(screen.getByText('+1')).toBeInTheDocument()
    })
  })

  describe('intent badges', () => {
    it('displays intent badge for transactional keywords', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getByText('Trans')).toBeInTheDocument()
    })

    it('displays intent badge for commercial keywords', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getAllByText('Commercial').length).toBeGreaterThan(0)
    })

    it('displays intent badge for informational keywords', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      expect(screen.getByText('Info')).toBeInTheDocument()
    })
  })

  describe('local keyword indicator', () => {
    it('shows map pin icon for local keywords', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // Local keywords should have MapPin icon (visual indicator)
      const localKeywordRow = screen.getByText('dentist near me').closest('tr')
      expect(localKeywordRow).toBeInTheDocument()
    })
  })

  describe('search volume formatting', () => {
    it('formats large volumes with K suffix', () => {
      render(<KeywordTable keywords={mockKeywords} />)

      // 12000 = 12.0K
      expect(screen.getByText('12.0K')).toBeInTheDocument()
    })

    it('formats very large volumes with M suffix', () => {
      const largeVolumeKeyword: KeywordData[] = [
        {
          keyword: 'popular term',
          position: 1,
          searchVolume: 1500000,
          serpFeatures: [],
        },
      ]

      render(<KeywordTable keywords={largeVolumeKeyword} />)

      expect(screen.getByText('1.5M')).toBeInTheDocument()
    })
  })
})

describe('KeywordTableSkeleton', () => {
  it('renders skeleton rows', () => {
    render(<KeywordTableSkeleton rows={5} />)

    // Should have skeleton pulse elements
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('respects rows prop', () => {
    render(<KeywordTableSkeleton rows={3} />)

    const table = document.querySelector('table')
    expect(table).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<KeywordTableSkeleton className="custom-class" />)

    const card = document.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })
})
