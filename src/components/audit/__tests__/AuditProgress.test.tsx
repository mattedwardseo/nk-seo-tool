import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuditProgress } from '../AuditProgress'
import { AuditStatus } from '@/types/audit'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AuditProgress', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('loading state', () => {
    it('shows loading state initially', () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.CRAWLING,
              progress: 25,
              currentStep: 'onpage_crawl',
              currentStepDescription: 'Analyzing page content',
              errorMessage: null,
              isComplete: false,
              isFailed: false,
              isInProgress: true,
              estimatedSecondsRemaining: 120,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)
      expect(screen.getByText('Loading audit status...')).toBeInTheDocument()
    })
  })

  describe('in progress state', () => {
    it('shows progress bar with correct value', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.CRAWLING,
              progress: 50,
              currentStep: 'onpage_crawl',
              currentStepDescription: 'Analyzing page content',
              errorMessage: null,
              isComplete: false,
              isFailed: false,
              isInProgress: true,
              estimatedSecondsRemaining: 60,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      })
    })

    it('shows current step description', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.CRAWLING,
              progress: 30,
              currentStep: 'onpage_crawl',
              currentStepDescription: 'Analyzing page content',
              errorMessage: null,
              isComplete: false,
              isFailed: false,
              isInProgress: true,
              estimatedSecondsRemaining: 90,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('Analyzing page content')).toBeInTheDocument()
      })
    })

    it('shows estimated time remaining', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.CRAWLING,
              progress: 30,
              currentStep: 'onpage_crawl',
              currentStepDescription: 'Analyzing page content',
              errorMessage: null,
              isComplete: false,
              isFailed: false,
              isInProgress: true,
              estimatedSecondsRemaining: 120,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText(/Estimated time remaining/)).toBeInTheDocument()
      })
    })
  })

  describe('completed state', () => {
    it('shows completion message', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.COMPLETED,
              progress: 100,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: null,
              isComplete: true,
              isFailed: false,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('Audit Complete')).toBeInTheDocument()
      })
    })

    it('calls onComplete callback when completed', async () => {
      const onComplete = vi.fn()
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.COMPLETED,
              progress: 100,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: null,
              isComplete: true,
              isFailed: false,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" onComplete={onComplete} pollInterval={0} />)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })

    it('shows 100% progress when complete', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.COMPLETED,
              progress: 100,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: null,
              isComplete: true,
              isFailed: false,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })
  })

  describe('failed state', () => {
    it('shows error message when failed', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.FAILED,
              progress: 30,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: 'API rate limit exceeded',
              isComplete: false,
              isFailed: true,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('Audit Failed')).toBeInTheDocument()
        expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
      })
    })

    it('calls onError callback when failed', async () => {
      const onError = vi.fn()
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.FAILED,
              progress: 30,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: 'API error',
              isComplete: false,
              isFailed: true,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" onError={onError} pollInterval={0} />)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('API error')
      })
    })

    it('calls onError with default message when no error message', async () => {
      const onError = vi.fn()
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.FAILED,
              progress: 30,
              currentStep: null,
              currentStepDescription: null,
              errorMessage: null,
              isComplete: false,
              isFailed: true,
              isInProgress: false,
              estimatedSecondsRemaining: null,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" onError={onError} pollInterval={0} />)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Audit failed')
      })
    })
  })

  describe('status badge', () => {
    it('shows status badge for CRAWLING', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              id: 'test-id',
              status: AuditStatus.CRAWLING,
              progress: 25,
              currentStep: 'onpage_crawl',
              currentStepDescription: 'Analyzing',
              errorMessage: null,
              isComplete: false,
              isFailed: false,
              isInProgress: true,
              estimatedSecondsRemaining: 100,
            },
          }),
      })

      render(<AuditProgress auditId="test-id" pollInterval={0} />)

      await waitFor(() => {
        expect(screen.getByText('Crawling')).toBeInTheDocument()
      })
    })
  })
})
