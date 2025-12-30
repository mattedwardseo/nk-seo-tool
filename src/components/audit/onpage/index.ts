/**
 * OnPage Components Barrel Export
 *
 * Central export for all OnPage SEO display components.
 */

// Types
export * from './types'

// Classification & Reports
export * from './issue-classification'
export * from './thematic-reports'

// Main Container
export { OnPageTabsContainer } from './OnPageTabsContainer'

// Tab Components
export { OnPageContentTab } from './content-tab'
export { TechnicalIssuesTab } from './issues-tab'
export { PerformanceLighthouseTab } from './performance-tab'

// Building Blocks (for custom compositions)
export { IssueRow, IssuesSummary, ThematicReportCard, ThematicReportGrid } from './issues-tab'
export { MetaTagsSection, HeadingTree, SocialTagsSection, ContentAnalysis } from './content-tab'
export { CoreWebVitalsCard, PageTimingSection, ResourcesSection, LighthouseAudits } from './performance-tab'
