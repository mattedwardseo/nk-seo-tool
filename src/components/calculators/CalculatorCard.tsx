'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreVertical, Pencil, Copy, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency, formatROI } from '@/lib/calculators/seo-calculator'

interface CalculatorCardProps {
  id: string
  name: string | null
  type: 'seo' | 'google-ads' | 'capacity'
  createdAt: string
  // SEO-specific metrics
  totalTraffic?: number
  adjustedNps?: number | null
  shortTermReturn?: number | null
  lifetimeReturn?: number | null
  ctrScenario?: string
  // Google Ads-specific metrics
  monthlyClicks?: number
  costPerAcquisition?: number | null
  roas?: number | null
  // Capacity-specific metrics
  capacityUtilization?: number | null
  revenueGap?: number | null
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  basePath?: string // Base path for calculator links (e.g., "/d/abc123/calculators/seo")
}

export function CalculatorCard({
  id,
  name,
  type,
  createdAt,
  totalTraffic,
  adjustedNps,
  shortTermReturn,
  lifetimeReturn,
  ctrScenario,
  monthlyClicks,
  costPerAcquisition,
  roas,
  capacityUtilization,
  revenueGap,
  onDuplicate,
  onDelete,
  basePath,
}: CalculatorCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const displayName = name || `${type.toUpperCase()} Calculation`
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const getHref = () => {
    // Use basePath if provided (for domain-scoped routes)
    if (basePath) {
      return `${basePath}/${id}`
    }
    // Fallback to old paths
    switch (type) {
      case 'seo':
        return `/calculators/seo/${id}`
      case 'google-ads':
        return `/calculators/google-ads/${id}`
      case 'capacity':
        return `/calculators/capacity/${id}`
      default:
        return '#'
    }
  }

  const getScenarioBadge = () => {
    if (!ctrScenario) return null
    const colors: Record<string, string> = {
      good: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      average: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      bad: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      custom: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[ctrScenario] || colors.custom}`}
      >
        {ctrScenario.charAt(0).toUpperCase() + ctrScenario.slice(1)} Case
      </span>
    )
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    await onDelete(id)
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex-1 min-w-0">
            <Link href={getHref()}>
              <CardTitle className="text-base font-medium truncate hover:text-primary cursor-pointer">
                {displayName}
              </CardTitle>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {getScenarioBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={getHref()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {type === 'seo' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Monthly Traffic
                </p>
                <p className="text-lg font-semibold">
                  {totalTraffic?.toLocaleString() ?? '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">New Patients</p>
                <p className="text-lg font-semibold">
                  {adjustedNps?.toFixed(1) ?? '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Monthly Return
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {shortTermReturn ? formatCurrency(shortTermReturn) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Lifetime Return</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {lifetimeReturn ? formatCurrency(lifetimeReturn) : '-'}
                </p>
              </div>
            </div>
          )}

          {type === 'google-ads' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monthly Clicks</p>
                <p className="text-lg font-semibold">
                  {monthlyClicks?.toLocaleString() ?? '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cost/Acquisition</p>
                <p className="text-lg font-semibold">
                  {costPerAcquisition ? formatCurrency(costPerAcquisition) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ROAS</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {roas ? formatROI(roas) : '-'}
                </p>
              </div>
            </div>
          )}

          {type === 'capacity' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="text-lg font-semibold">
                  {capacityUtilization ? `${capacityUtilization.toFixed(0)}%` : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Revenue Gap</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {revenueGap ? formatCurrency(revenueGap) : '-'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{displayName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
