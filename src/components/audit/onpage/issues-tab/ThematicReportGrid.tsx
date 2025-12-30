'use client'

import { ThematicReportCard } from './ThematicReportCard'
import type { ThematicReports } from '../types'

interface ThematicReportGridProps {
  reports: ThematicReports
}

export function ThematicReportGrid({ reports }: ThematicReportGridProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <ThematicReportCard report={reports.crawlability} />
      <ThematicReportCard report={reports.https} />
      <ThematicReportCard report={reports.coreWebVitals} />
      <ThematicReportCard report={reports.performance} />
      <ThematicReportCard report={reports.internalLinking} />
      <ThematicReportCard report={reports.markup} />
    </div>
  )
}

export default ThematicReportGrid
