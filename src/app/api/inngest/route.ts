import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { auditFunctions } from '@/lib/inngest/audit-functions'
import { localSeoFunctions } from '@/lib/inngest/local-seo-functions'
import { siteAuditFunctions } from '@/lib/inngest/site-audit-functions'
import { keywordTrackingFunctions } from '@/lib/inngest/keyword-tracking-functions'
import { aiSeoFunctions } from '@/lib/inngest/functions/ai-seo'

// Inngest webhook handler for Next.js App Router
// Registers all audit, local SEO, site audit, keyword tracking, and AI SEO functions for background processing
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...auditFunctions,
    ...localSeoFunctions,
    ...siteAuditFunctions,
    ...keywordTrackingFunctions,
    ...aiSeoFunctions,
  ],
})
