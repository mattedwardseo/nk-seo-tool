import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditFilters } from '../AuditFilters'
import { AuditStatus } from '@/types/audit'

describe('AuditFilters', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: 'ALL' as const,
    onStatusFilterChange: vi.fn(),
  }

  describe('search input', () => {
    it('renders search input', () => {
      render(<AuditFilters {...defaultProps} />)
      expect(screen.getByPlaceholderText('Search by domain...')).toBeInTheDocument()
    })

    it('displays current search value', () => {
      render(<AuditFilters {...defaultProps} search="example.com" />)
      const input = screen.getByPlaceholderText('Search by domain...') as HTMLInputElement
      expect(input.value).toBe('example.com')
    })

    it('calls onSearchChange when typing', () => {
      const onSearchChange = vi.fn()
      render(<AuditFilters {...defaultProps} onSearchChange={onSearchChange} />)

      const input = screen.getByPlaceholderText('Search by domain...')
      fireEvent.change(input, { target: { value: 'test' } })

      expect(onSearchChange).toHaveBeenCalledWith('test')
    })
  })

  describe('status filter dropdown', () => {
    it('renders status filter button', () => {
      render(<AuditFilters {...defaultProps} />)
      expect(screen.getByRole('button', { name: /all statuses/i })).toBeInTheDocument()
    })

    it('displays current status filter label', () => {
      render(<AuditFilters {...defaultProps} statusFilter={AuditStatus.COMPLETED} />)
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup()
      render(<AuditFilters {...defaultProps} />)

      const button = screen.getByRole('button', { name: /all statuses/i })
      await user.click(button)

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
      expect(screen.getByText('Crawling')).toBeInTheDocument()
      expect(screen.getByText('Analyzing')).toBeInTheDocument()
      expect(screen.getByText('Scoring')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('calls onStatusFilterChange when selecting status', async () => {
      const user = userEvent.setup()
      const onStatusFilterChange = vi.fn()
      render(<AuditFilters {...defaultProps} onStatusFilterChange={onStatusFilterChange} />)

      const button = screen.getByRole('button', { name: /all statuses/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument()
      })
      const completedOption = screen.getByText('Completed')
      await user.click(completedOption)

      await waitFor(() => {
        expect(onStatusFilterChange).toHaveBeenCalledWith(AuditStatus.COMPLETED)
      })
    })

    it('highlights active filter with border', () => {
      const { container } = render(
        <AuditFilters {...defaultProps} statusFilter={AuditStatus.COMPLETED} />
      )
      const button = container.querySelector('.border-primary')
      expect(button).toBeInTheDocument()
    })
  })

  describe('clear filters button', () => {
    it('does not show clear button when no filters applied', () => {
      render(<AuditFilters {...defaultProps} />)
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('shows clear button when search has value', () => {
      render(<AuditFilters {...defaultProps} search="test" />)
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('shows clear button when status filter is not ALL', () => {
      render(<AuditFilters {...defaultProps} statusFilter={AuditStatus.PENDING} />)
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('clears all filters when clear button is clicked', () => {
      const onSearchChange = vi.fn()
      const onStatusFilterChange = vi.fn()
      render(
        <AuditFilters
          {...defaultProps}
          search="test"
          onSearchChange={onSearchChange}
          statusFilter={AuditStatus.COMPLETED}
          onStatusFilterChange={onStatusFilterChange}
        />
      )

      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(onSearchChange).toHaveBeenCalledWith('')
      expect(onStatusFilterChange).toHaveBeenCalledWith('ALL')
    })
  })

  describe('responsive layout', () => {
    it('renders with flex layout', () => {
      const { container } = render(<AuditFilters {...defaultProps} />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex')
    })

    it('has gap between elements', () => {
      const { container } = render(<AuditFilters {...defaultProps} />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('gap-3')
    })
  })
})
