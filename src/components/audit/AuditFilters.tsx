'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, X } from 'lucide-react'
import { AuditStatus, type AuditStatusType } from '@/types/audit'
import { cn } from '@/lib/utils'

interface AuditFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: AuditStatusType | 'ALL'
  onStatusFilterChange: (value: AuditStatusType | 'ALL') => void
}

const statusOptions: { value: AuditStatusType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: AuditStatus.PENDING, label: 'Pending' },
  { value: AuditStatus.CRAWLING, label: 'Crawling' },
  { value: AuditStatus.ANALYZING, label: 'Analyzing' },
  { value: AuditStatus.COMPLETED, label: 'Completed' },
  { value: AuditStatus.FAILED, label: 'Failed' },
]

export function AuditFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AuditFiltersProps): React.ReactElement {
  const hasFilters = search || statusFilter !== 'ALL'

  const clearFilters = (): void => {
    onSearchChange('')
    onStatusFilterChange('ALL')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative max-w-sm min-w-[200px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by domain..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors duration-150',
              statusFilter !== 'ALL' && 'border-primary'
            )}
          >
            <Filter className="mr-2 h-4 w-4" />
            {statusOptions.find((opt) => opt.value === statusFilter)?.label || 'Status'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              className={cn(
                'cursor-pointer',
                statusFilter === option.value && 'bg-accent font-medium'
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="hover:bg-accent cursor-pointer transition-colors duration-150"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
