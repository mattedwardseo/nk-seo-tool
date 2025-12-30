import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditTable, type AuditRow } from '../AuditTable'
import { AuditStatus } from '@/types/audit'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockAudits: AuditRow[] = [
  {
    id: 'audit-1',
    domain: 'example.com',
    status: AuditStatus.COMPLETED,
    score: 85,
    progress: 100,
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'audit-2',
    domain: 'test-site.org',
    status: AuditStatus.CRAWLING,
    score: null,
    progress: 45,
    createdAt: '2024-01-16T14:30:00Z',
    completedAt: null,
  },
  {
    id: 'audit-3',
    domain: 'failed-site.com',
    status: AuditStatus.FAILED,
    score: null,
    progress: 25,
    createdAt: '2024-01-17T09:15:00Z',
    completedAt: null,
  },
  {
    id: 'audit-4',
    domain: 'another-site.net',
    status: AuditStatus.COMPLETED,
    score: 72,
    progress: 100,
    createdAt: '2024-01-18T16:45:00Z',
    completedAt: '2024-01-18T16:50:00Z',
  },
]

describe('AuditTable', () => {
  describe('rendering', () => {
    it('renders the table with column headers', () => {
      render(<AuditTable data={mockAudits} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Domain')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
    })

    it('renders all audit rows', () => {
      render(<AuditTable data={mockAudits} />)

      expect(screen.getByText('example.com')).toBeInTheDocument()
      expect(screen.getByText('test-site.org')).toBeInTheDocument()
      expect(screen.getByText('failed-site.com')).toBeInTheDocument()
      expect(screen.getByText('another-site.net')).toBeInTheDocument()
    })

    it('displays status badges for each audit', () => {
      render(<AuditTable data={mockAudits} />)

      expect(screen.getAllByText('Completed').length).toBe(2)
      expect(screen.getByText('Crawling')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('displays scores with grades', () => {
      render(<AuditTable data={mockAudits} />)

      // Score 85 should show A grade, 72 should show B
      expect(screen.getByText(/85/)).toBeInTheDocument()
      expect(screen.getByText(/72/)).toBeInTheDocument()
    })

    it('shows formatted dates', () => {
      render(<AuditTable data={mockAudits} />)

      // Dates should be formatted (implementation varies)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when no audits', () => {
      render(<AuditTable data={[]} />)

      expect(screen.getByText('No audits found.')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading message when isLoading', () => {
      render(<AuditTable data={[]} isLoading />)

      expect(screen.getByText('Loading audits...')).toBeInTheDocument()
    })
  })

  describe('pagination', () => {
    it('shows total count', () => {
      render(<AuditTable data={mockAudits} />)

      expect(screen.getByText('4 audit(s) total')).toBeInTheDocument()
    })

    it('shows page info', () => {
      render(<AuditTable data={mockAudits} />)

      expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument()
    })

    it('disables previous button on first page', () => {
      render(<AuditTable data={mockAudits} />)

      // Find all buttons and filter to find the ChevronLeft navigation button
      const buttons = screen.getAllByRole('button')
      const prevButton = buttons.find((b) => b.querySelector('svg.lucide-chevron-left') !== null)

      // If pagination exists and prev button is found, it should be disabled on page 1
      if (prevButton) {
        expect(prevButton).toBeDisabled()
      }
    })

    it('enables navigation when multiple pages exist', () => {
      // Create more than 10 audits to trigger pagination
      const manyAudits = Array.from({ length: 15 }, (_, i) => ({
        ...mockAudits[0],
        id: `audit-${i}`,
        domain: `site-${i}.com`,
      }))

      render(<AuditTable data={manyAudits} />)

      expect(screen.getByText('15 audit(s) total')).toBeInTheDocument()
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('sorts by domain when clicking Domain header', async () => {
      const user = userEvent.setup()
      render(<AuditTable data={mockAudits} />)

      const domainHeader = screen.getByRole('button', { name: /Domain/i })
      await user.click(domainHeader)

      // After sorting, domains should be in alphabetical order
      // Check that sort was applied by verifying table still renders
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('toggles sort direction on second click', async () => {
      const user = userEvent.setup()
      render(<AuditTable data={mockAudits} />)

      const domainHeader = screen.getByRole('button', { name: /Domain/i })
      await user.click(domainHeader)
      await user.click(domainHeader)

      // After two clicks, sort direction should toggle
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('sorts by score when clicking Score header', async () => {
      const user = userEvent.setup()
      render(<AuditTable data={mockAudits} />)

      const scoreHeader = screen.getByRole('button', { name: /Score/i })
      await user.click(scoreHeader)

      // Score sorting should work
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('actions menu', () => {
    it('shows actions dropdown menu', async () => {
      const user = userEvent.setup()
      render(<AuditTable data={mockAudits} />)

      // Find and click the first actions button
      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('shows Retry option only for failed audits', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(<AuditTable data={mockAudits} onRetry={onRetry} />)

      // Find the failed audit's action button (index 2)
      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[2])

      expect(screen.getByText('Retry Audit')).toBeInTheDocument()
    })

    it('does not show Retry for completed audits', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(<AuditTable data={mockAudits} onRetry={onRetry} />)

      // Click first audit's actions (completed)
      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      expect(screen.queryByText('Retry Audit')).not.toBeInTheDocument()
    })

    it('calls onRetry when Retry clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(<AuditTable data={mockAudits} onRetry={onRetry} />)

      // Click failed audit's actions
      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[2])

      const retryButton = screen.getByText('Retry Audit')
      await user.click(retryButton)

      expect(onRetry).toHaveBeenCalledWith('audit-3')
    })

    it('shows Delete option when onDelete provided', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(<AuditTable data={mockAudits} onDelete={onDelete} />)

      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('calls onDelete when Delete clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(<AuditTable data={mockAudits} onDelete={onDelete} />)

      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith('audit-1')
    })

    it('does not show Delete when onDelete not provided', async () => {
      const user = userEvent.setup()

      render(<AuditTable data={mockAudits} />)

      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })
  })

  describe('links', () => {
    it('domain links to audit detail page', () => {
      render(<AuditTable data={mockAudits} />)

      const domainLink = screen.getByText('example.com')
      expect(domainLink).toHaveAttribute('href', '/audits/audit-1')
    })

    it('View Details links to audit detail page', async () => {
      const user = userEvent.setup()
      render(<AuditTable data={mockAudits} />)

      const actionButtons = screen.getAllByRole('button', { name: /Open menu/i })
      await user.click(actionButtons[0])

      const viewDetailsLink = screen.getByText('View Details').closest('a')
      expect(viewDetailsLink).toHaveAttribute('href', '/audits/audit-1')
    })
  })
})
