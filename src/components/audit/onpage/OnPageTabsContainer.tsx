'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, AlertTriangle, Gauge } from 'lucide-react'
import type { OnPageStepResult } from '@/types/audit'
import { OnPageContentTab } from './content-tab'
import { TechnicalIssuesTab } from './issues-tab'
import { PerformanceLighthouseTab } from './performance-tab'

interface OnPageTabsContainerProps {
  data: OnPageStepResult
}

export function OnPageTabsContainer({ data }: OnPageTabsContainerProps): React.ReactElement {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="content" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">On-Page Content</span>
          <span className="sm:hidden">Content</span>
        </TabsTrigger>
        <TabsTrigger value="issues" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Technical Issues</span>
          <span className="sm:hidden">Issues</span>
        </TabsTrigger>
        <TabsTrigger value="performance" className="gap-2">
          <Gauge className="h-4 w-4" />
          <span className="hidden sm:inline">Performance</span>
          <span className="sm:hidden">Perf</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-6">
        <OnPageContentTab data={data} />
      </TabsContent>

      <TabsContent value="issues" className="mt-6">
        <TechnicalIssuesTab data={data} />
      </TabsContent>

      <TabsContent value="performance" className="mt-6">
        <PerformanceLighthouseTab data={data} />
      </TabsContent>
    </Tabs>
  )
}

export default OnPageTabsContainer
