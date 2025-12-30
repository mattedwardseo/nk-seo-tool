'use client'

import type { OnPageStepResult } from '@/types/audit'
import { CoreWebVitalsCard } from './CoreWebVitalsCard'
import { PageTimingSection } from './PageTimingSection'
import { ResourcesSection } from './ResourcesSection'
import { LighthouseAudits } from './LighthouseAudits'

interface PerformanceLighthouseTabProps {
  data: OnPageStepResult
}

export function PerformanceLighthouseTab({ data }: PerformanceLighthouseTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Core Web Vitals - LCP, FID, CLS */}
      <CoreWebVitalsCard timing={data.timing} meta={data.meta} />

      {/* Page Timing - Connection and render timing */}
      <PageTimingSection timing={data.timing} />

      {/* Resources - Size and compression */}
      <ResourcesSection resources={data.resources} />

      {/* Lighthouse Results - Category scores and individual audits */}
      <LighthouseAudits lighthouse={data.lighthouse} />
    </div>
  )
}

export default PerformanceLighthouseTab
