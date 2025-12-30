'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface FilterState {
  sortBy: 'position' | 'positionChange' | 'keyword' | 'searchVolume'
  sortOrder: 'asc' | 'desc'
  positionFilter: 'top3' | 'top10' | 'top100' | 'notRanking' | 'all'
  changeFilter: 'improved' | 'declined' | 'unchanged' | 'new' | 'lost' | 'all'
}

interface ResultFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function ResultFilters({ filters, onChange }: ResultFiltersProps) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleChange('sortBy', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="position">Position</SelectItem>
            <SelectItem value="positionChange">Change</SelectItem>
            <SelectItem value="keyword">Keyword</SelectItem>
            <SelectItem value="searchVolume">Volume</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Order</Label>
        <Select
          value={filters.sortOrder}
          onValueChange={(value) => handleChange('sortOrder', value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Position</Label>
        <Select
          value={filters.positionFilter}
          onValueChange={(value) => handleChange('positionFilter', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="top3">Top 3</SelectItem>
            <SelectItem value="top10">Top 10</SelectItem>
            <SelectItem value="top100">Top 100</SelectItem>
            <SelectItem value="notRanking">Not Ranking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Change</Label>
        <Select
          value={filters.changeFilter}
          onValueChange={(value) => handleChange('changeFilter', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Changes</SelectItem>
            <SelectItem value="improved">Improved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="unchanged">Unchanged</SelectItem>
            <SelectItem value="new">New Rankings</SelectItem>
            <SelectItem value="lost">Lost Rankings</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
