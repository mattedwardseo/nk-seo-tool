'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { generateActionPlan, getActionPlanSummary, type ActionItem } from '@/lib/seo/generate-action-plan'

interface ActionPlanTabProps {
  auditData: any
}

export function ActionPlanTab({ auditData }: ActionPlanTabProps): React.ReactElement {
  const [actionPlan, setActionPlan] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stepResults = auditData.step_results || {}
      const plan = generateActionPlan(stepResults)
      setActionPlan(plan)
    } catch (error) {
      console.error('Error generating action plan:', error)
    } finally {
      setLoading(false)
    }
  }, [auditData])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Generating action plan...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = getActionPlanSummary(actionPlan)
  const sections = {
    technical: actionPlan.filter((i) => i.section === 'technical'),
    onsite: actionPlan.filter((i) => i.section === 'onsite'),
    gbp: actionPlan.filter((i) => i.section === 'gbp'),
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Local SEO Action Plan</CardTitle>
              <CardDescription className="mt-2">
                Prioritized recommendations based on your audit results. Each item includes why it matters and what to
                do.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm">
                {summary.total} Items
              </Badge>
              {summary.byStatus.critical > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {summary.byStatus.critical} Critical
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Alert */}
      {summary.byStatus.critical > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{summary.byStatus.critical} critical issues</strong> found that need immediate attention. Address
            these first for maximum SEO impact.
          </AlertDescription>
        </Alert>
      )}

      {/* Top Priority Items */}
      {summary.criticalItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Priority Actions
            </CardTitle>
            <CardDescription>Start here - these items have the biggest impact on your rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.criticalItems.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="border-l-destructive flex items-start gap-3 rounded-lg border-l-4 bg-muted/50 p-3">
                  <div className="bg-destructive/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-sm">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical SEO Section */}
      {sections.technical.length > 0 && (
        <ActionSection title="Technical SEO" icon="⚙️" description="Foundation elements that affect crawlability and indexation" items={sections.technical} />
      )}

      {/* On-Site Optimization Section */}
      {sections.onsite.length > 0 && (
        <ActionSection title="On-Site Optimization" icon="📄" description="Content and structure elements that signal relevance" items={sections.onsite} />
      )}

      {/* Google Business Profile Section */}
      {sections.gbp.length > 0 && (
        <ActionSection title="Google Business Profile" icon="🏢" description="Optimization factors for local pack visibility" items={sections.gbp} />
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Address Critical Issues:</strong> Start with the {summary.byStatus.critical} critical items highlighted
              above. These have immediate impact on rankings.
            </p>
            <p>
              <strong>2. Implement Warning Items:</strong> Work through the {summary.byStatus.warning} warning-level
              improvements to strengthen your local SEO foundation.
            </p>
            <p>
              <strong>3. Monitor & Maintain:</strong> Maintain the {summary.byStatus.good} items marked as good. Re-run
              this audit monthly to track progress.
            </p>
            <p className="text-muted-foreground mt-4 text-xs">
              💡 Tip: Focus on one section at a time. Complete all Technical SEO fixes first, then move to On-Site, then
              GBP.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ActionSectionProps {
  title: string
  icon: string
  description: string
  items: ActionItem[]
}

function ActionSection({ title, icon, description, items }: ActionSectionProps): React.ReactElement {
  const issueCount = items.filter((i) => i.status !== 'good').length
  const criticalCount = items.filter((i) => i.status === 'critical').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{icon}</span>
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {issueCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {issueCount} Issues
              </Badge>
            )}
            {issueCount === 0 && (
              <Badge variant="default" className="text-xs">
                All Good
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <StatusIcon status={item.status} />
                  <span className="text-left font-medium">{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-9 pr-4 pt-2">
                  {/* Why this matters */}
                  <div>
                    <p className="mb-1 text-sm font-semibold">Why this matters:</p>
                    <p className="text-muted-foreground text-sm">{item.why}</p>
                  </div>

                  {/* Action to take */}
                  <div>
                    <p className="mb-1 text-sm font-semibold">What to do:</p>
                    <p className="text-sm">{item.action}</p>
                  </div>

                  {/* Details */}
                  {item.details.length > 0 && (
                    <div>
                      <p className="mb-1 text-sm font-semibold">Details:</p>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {item.details.map((detail, idx) => (
                          <li key={idx}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Priority badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Priority: {item.priority <= 3 ? 'High' : item.priority <= 6 ? 'Medium' : 'Low'}
                    </Badge>
                    {item.value !== undefined && (
                      <span className="text-muted-foreground text-xs">
                        Current value: {typeof item.value === 'number' ? item.value : item.value}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: 'good' | 'warning' | 'critical' }): React.ReactElement {
  switch (status) {
    case 'good':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-500" />
  }
}
