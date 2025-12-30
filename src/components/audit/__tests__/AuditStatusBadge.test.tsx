import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuditStatusBadge } from '../AuditStatusBadge'
import { AuditStatus } from '@/types/audit'

describe('AuditStatusBadge', () => {
  describe('rendering', () => {
    it('renders PENDING status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.PENDING} />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('renders CRAWLING status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.CRAWLING} />)
      expect(screen.getByText('Crawling')).toBeInTheDocument()
    })

    it('renders ANALYZING status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.ANALYZING} />)
      expect(screen.getByText('Analyzing')).toBeInTheDocument()
    })

    it('renders SCORING status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.SCORING} />)
      expect(screen.getByText('Scoring')).toBeInTheDocument()
    })

    it('renders COMPLETED status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.COMPLETED} />)
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('renders FAILED status correctly', () => {
      render(<AuditStatusBadge status={AuditStatus.FAILED} />)
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <AuditStatusBadge status={AuditStatus.COMPLETED} className="custom-class" />
      )
      const badge = container.querySelector('.custom-class')
      expect(badge).toBeInTheDocument()
    })

    it('has gray styling for PENDING status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.PENDING} />)
      const badge = container.querySelector('.bg-gray-100')
      expect(badge).toBeInTheDocument()
    })

    it('has blue styling for CRAWLING status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.CRAWLING} />)
      const badge = container.querySelector('.bg-blue-100')
      expect(badge).toBeInTheDocument()
    })

    it('has purple styling for ANALYZING status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.ANALYZING} />)
      const badge = container.querySelector('.bg-purple-100')
      expect(badge).toBeInTheDocument()
    })

    it('has orange styling for SCORING status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.SCORING} />)
      const badge = container.querySelector('.bg-orange-100')
      expect(badge).toBeInTheDocument()
    })

    it('has green styling for COMPLETED status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.COMPLETED} />)
      const badge = container.querySelector('.bg-green-100')
      expect(badge).toBeInTheDocument()
    })

    it('has red styling for FAILED status', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.FAILED} />)
      const badge = container.querySelector('.bg-red-100')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('icons', () => {
    it('renders Clock icon for PENDING', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.PENDING} />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders animated spinner for ANALYZING', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.ANALYZING} />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('renders icon with correct size', () => {
      const { container } = render(<AuditStatusBadge status={AuditStatus.COMPLETED} />)
      const icon = container.querySelector('.h-3.w-3')
      expect(icon).toBeInTheDocument()
    })
  })
})
