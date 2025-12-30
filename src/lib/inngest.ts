import { Inngest, EventSchemas } from 'inngest'
import type { AuditOptions } from '@/types/audit'

/**
 * Inngest event schemas for type-safe events
 */
type Events = {
  // ============================================================================
  // SEO Audit Events
  // ============================================================================
  'audit/requested': {
    data: {
      auditId: string
      domain: string
      userId: string
      options?: AuditOptions
      // Phase 6: Enhanced audit inputs
      businessName?: string
      location?: string
      gmbPlaceId?: string
      targetKeywords?: string[]
      competitorDomains?: string[]
    }
  }
  'audit/step.complete': {
    data: {
      auditId: string
      step: string
      success: boolean
      duration: number
      error?: string
    }
  }
  'audit/completed': {
    data: {
      auditId: string
      duration: number
    }
  }
  'audit/failed': {
    data: {
      auditId: string
      step: string
      error: string
      retryable: boolean
    }
  }

  // ============================================================================
  // Local SEO Campaign Events
  // ============================================================================
  'local-seo/scan.requested': {
    data: {
      campaignId: string
      userId: string
      /** Optional: Only scan specific keywords (default: all campaign keywords) */
      keywords?: string[]
    }
  }
  'local-seo/scan.progress': {
    data: {
      scanId: string
      campaignId: string
      progress: number
      currentKeyword?: string
      pointsCompleted: number
      totalPoints: number
    }
  }
  'local-seo/scan.completed': {
    data: {
      scanId: string
      campaignId: string
      avgRank: number | null
      shareOfVoice: number
      apiCallsUsed: number
    }
  }
  'local-seo/scan.failed': {
    data: {
      scanId: string
      campaignId: string
      error: string
    }
  }
  'local-seo/gbp.refresh': {
    data: {
      campaignId: string
    }
  }

  // ============================================================================
  // Site Audit Events (Full Site Crawl via OnPage API)
  // ============================================================================
  'site-audit/scan.requested': {
    data: {
      scanId: string
      domain: string
      userId: string
      config: {
        maxCrawlPages: number
        enableJavascript: boolean
        enableBrowserRendering: boolean
        storeRawHtml: boolean
        calculateKeywordDensity: boolean
        startUrl?: string
      }
    }
  }
  'site-audit/scan.progress': {
    data: {
      scanId: string
      progress: number
      stage: 'submitting' | 'crawling' | 'fetching_results'
      pagesCrawled?: number
      totalPages?: number
    }
  }
  'site-audit/scan.completed': {
    data: {
      scanId: string
      domain: string
      pagesScanned: number
      onpageScore: number | null
      apiCost: number
    }
  }
  'site-audit/scan.failed': {
    data: {
      scanId: string
      error: string
      stage: string
    }
  }

  // ============================================================================
  // Keyword Tracking Events (Phase 15)
  // ============================================================================
  'keyword-tracking/run.requested': {
    data: {
      runId: string
      domainId: string
      userId: string
      config: {
        locationName: string
        languageCode: string
      }
    }
  }
  'keyword-tracking/run.progress': {
    data: {
      runId: string
      progress: number
      currentKeyword?: string
      keywordsCompleted: number
      totalKeywords: number
    }
  }
  'keyword-tracking/run.completed': {
    data: {
      runId: string
      domainId: string
      keywordsTracked: number
      avgPosition: number | null
    }
  }
  'keyword-tracking/run.failed': {
    data: {
      runId: string
      error: string
    }
  }

  // ============================================================================
  // AI SEO Events
  // ============================================================================
  'ai-seo/analysis.start': {
    data: {
      runId: string
      domainId: string
      domain: string
      businessName: string
      keywords: string[]
      llmPlatforms: string[]
    }
  }
  'ai-seo/analysis.completed': {
    data: {
      runId: string
      visibilityScore: number
      totalMentions: number
      totalCitations: number
    }
  }
  'ai-seo/analysis.failed': {
    data: {
      runId: string
      error: string
    }
  }
}

/**
 * Create Inngest client for background job processing
 * Used for async SEO audits, scheduled tasks, and webhook handling
 */
export const inngest = new Inngest({
  id: 'seo-tool',
  schemas: new EventSchemas().fromRecord<Events>(),
})
