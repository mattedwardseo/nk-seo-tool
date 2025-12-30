'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Gauge, Search, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LighthouseData, LighthouseCategory } from '@/types/audit'

interface LighthouseAuditsProps {
  lighthouse: LighthouseData | undefined
}

interface CategoryCardProps {
  category: LighthouseCategory | null
  label: string
  description: string
}

function CategoryCard({ category, label, description }: CategoryCardProps): React.ReactElement {
  const score = category?.score !== null && category?.score !== undefined ? Math.round(category.score * 100) : 0
  const status = score >= 90 ? 'good' : score >= 50 ? 'moderate' : 'poor'

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            status === 'good' && 'border-green-500 text-green-600',
            status === 'moderate' && 'border-yellow-500 text-yellow-600',
            status === 'poor' && 'border-red-500 text-red-600'
          )}
        >
          {status === 'good' && 'Good'}
          {status === 'moderate' && 'Needs Work'}
          {status === 'poor' && 'Poor'}
        </Badge>
      </div>
      <div
        className={cn(
          'text-3xl font-bold',
          status === 'good' && 'text-green-600 dark:text-green-400',
          status === 'moderate' && 'text-yellow-600 dark:text-yellow-400',
          status === 'poor' && 'text-red-600 dark:text-red-400'
        )}
      >
        {category?.score !== null ? score : 'N/A'}
      </div>
      <Progress
        value={score}
        className={cn(
          'h-1.5 mt-2',
          status === 'good' && '[&>div]:bg-green-500',
          status === 'moderate' && '[&>div]:bg-yellow-500',
          status === 'poor' && '[&>div]:bg-red-500'
        )}
      />
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  )
}

function getAuditIcon(score: number | null): React.ReactElement {
  if (score === null) return <Info className="h-4 w-4 text-muted-foreground" />
  if (score >= 0.9) return <CheckCircle className="h-4 w-4 text-green-500" />
  if (score >= 0.5) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  return <XCircle className="h-4 w-4 text-red-500" />
}

function getAuditStatus(score: number | null): 'pass' | 'warning' | 'fail' | 'info' {
  if (score === null) return 'info'
  if (score >= 0.9) return 'pass'
  if (score >= 0.5) return 'warning'
  return 'fail'
}

export function LighthouseAudits({ lighthouse }: LighthouseAuditsProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'warning' | 'fail'>('all')

  if (!lighthouse) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Lighthouse Results</CardTitle>
              <CardDescription>Google Lighthouse audit results</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No Lighthouse data available</p>
        </CardContent>
      </Card>
    )
  }

  // Filter audits
  const filteredAudits = lighthouse.audits.filter((audit) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.id.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const status = getAuditStatus(audit.score)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pass' && status === 'pass') ||
      (statusFilter === 'warning' && status === 'warning') ||
      (statusFilter === 'fail' && status === 'fail')

    return matchesSearch && matchesStatus
  })

  // Count by status
  const statusCounts = lighthouse.audits.reduce(
    (acc, audit) => {
      const status = getAuditStatus(audit.score)
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    { pass: 0, warning: 0, fail: 0, info: 0 } as Record<string, number>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Lighthouse Results</CardTitle>
            <CardDescription>Google Lighthouse audit results</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Scores */}
        <div className="grid gap-4 md:grid-cols-3">
          <CategoryCard
            category={lighthouse.categories.performance}
            label="Performance"
            description="Page loading speed and optimization"
          />
          <CategoryCard
            category={lighthouse.categories.seo}
            label="SEO"
            description="Search engine optimization"
          />
          <CategoryCard
            category={lighthouse.categories.accessibility}
            label="Accessibility"
            description="WCAG compliance"
          />
        </div>

        {/* Audit List */}
        <div>
          <h4 className="text-sm font-medium mb-3">Individual Audits ({lighthouse.audits.length})</h4>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Badge
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                All ({lighthouse.audits.length})
              </Badge>
              <Badge
                variant={statusFilter === 'pass' ? 'default' : 'outline'}
                className={cn('cursor-pointer', statusFilter === 'pass' && 'bg-green-600')}
                onClick={() => setStatusFilter('pass')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Pass ({statusCounts.pass})
              </Badge>
              <Badge
                variant={statusFilter === 'warning' ? 'default' : 'outline'}
                className={cn('cursor-pointer', statusFilter === 'warning' && 'bg-yellow-600')}
                onClick={() => setStatusFilter('warning')}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Warning ({statusCounts.warning})
              </Badge>
              <Badge
                variant={statusFilter === 'fail' ? 'default' : 'outline'}
                className={cn('cursor-pointer', statusFilter === 'fail' && 'bg-red-600')}
                onClick={() => setStatusFilter('fail')}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Fail ({statusCounts.fail})
              </Badge>
            </div>
          </div>

          {/* Audits Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Audit</TableHead>
                  <TableHead className="w-24 text-right">Score</TableHead>
                  <TableHead className="w-32 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No audits match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.slice(0, 50).map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>{getAuditIcon(audit.score)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{audit.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {audit.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {audit.score !== null ? (
                          <span
                            className={cn(
                              'font-mono',
                              audit.score >= 0.9 && 'text-green-600',
                              audit.score >= 0.5 && audit.score < 0.9 && 'text-yellow-600',
                              audit.score < 0.5 && 'text-red-600'
                            )}
                          >
                            {Math.round(audit.score * 100)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {audit.displayValue || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredAudits.length > 50 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Showing 50 of {filteredAudits.length} audits
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LighthouseAudits
