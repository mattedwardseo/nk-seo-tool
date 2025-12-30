'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Minus } from 'lucide-react'
import type { GBPComparisonProfile, ComparisonField } from '@/lib/local-seo/types'

interface ComparisonTableProps {
  target: GBPComparisonProfile
  competitors: GBPComparisonProfile[]
  comparison: ComparisonField[]
}

export function ComparisonTable({
  target,
  competitors,
  comparison,
}: ComparisonTableProps): React.ReactElement {
  // Group comparison fields by category
  const categories = ['identity', 'engagement', 'content', 'contact', 'media'] as const
  const categoryLabels: Record<typeof categories[number], string> = {
    identity: 'Profile Identity',
    engagement: 'Ratings & Reviews',
    content: 'Content & Details',
    contact: 'Contact Information',
    media: 'Photos & Media',
  }

  const formatValue = (value: string | number | boolean | null): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )
    }
    if (typeof value === 'number') {
      // Format decimals nicely
      if (value % 1 !== 0) {
        return value.toFixed(1)
      }
      return value.toLocaleString()
    }
    return value
  }

  const getWinBadge = (field: ComparisonField): React.ReactNode => {
    if (field.targetWinning) {
      return <Badge variant="default" className="bg-green-600 text-xs">Win</Badge>
    }
    // Check if it's a tie (all have same value)
    const allSame = field.competitorValues.every(
      (cv) => cv.value === field.targetValue
    )
    if (allSame) {
      return <Minus className="h-4 w-4 text-muted-foreground" />
    }
    return <Badge variant="destructive" className="text-xs">Gap</Badge>
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryFields = comparison.filter((f) => f.category === category)
        if (categoryFields.length === 0) return null

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold mb-2">{categoryLabels[category]}</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Field</TableHead>
                    <TableHead className="bg-blue-50 dark:bg-blue-950">
                      {target.businessName.length > 20
                        ? target.businessName.slice(0, 20) + '...'
                        : target.businessName}
                      <span className="text-xs text-muted-foreground block">(You)</span>
                    </TableHead>
                    {competitors.map((comp, index) => (
                      <TableHead key={comp.gmbCid || index}>
                        {comp.businessName.length > 20
                          ? comp.businessName.slice(0, 20) + '...'
                          : comp.businessName}
                      </TableHead>
                    ))}
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell className="bg-blue-50/50 dark:bg-blue-950/50">
                        {formatValue(field.targetValue)}
                      </TableCell>
                      {field.competitorValues.map((cv, index) => (
                        <TableCell key={index}>{formatValue(cv.value)}</TableCell>
                      ))}
                      <TableCell className="text-center">{getWinBadge(field)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Yes/Has</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>No/Missing</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="default" className="bg-green-600 text-xs">Win</Badge>
          <span>You&apos;re ahead</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="destructive" className="text-xs">Gap</Badge>
          <span>Competitors ahead</span>
        </div>
      </div>
    </div>
  )
}
