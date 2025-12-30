'use client'

import type { OnPageStepResult } from '@/types/audit'
import { MetaTagsSection } from './MetaTagsSection'
import { HeadingTree } from './HeadingTree'
import { SocialTagsSection } from './SocialTagsSection'
import { ContentAnalysis } from './ContentAnalysis'

interface OnPageContentTabProps {
  data: OnPageStepResult
}

export function OnPageContentTab({ data }: OnPageContentTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Meta Tags - Title, Description, Canonical */}
      <MetaTagsSection meta={data.meta} />

      {/* Heading Structure - H1-H6 tree */}
      <HeadingTree htags={data.meta?.htags} />

      {/* Social Media Tags - OG and Twitter */}
      <SocialTagsSection socialTags={data.meta?.socialMediaTags} />

      {/* Content Analysis - Word count, Readability, Consistency */}
      <ContentAnalysis content={data.content} meta={data.meta} />
    </div>
  )
}

export default OnPageContentTab
