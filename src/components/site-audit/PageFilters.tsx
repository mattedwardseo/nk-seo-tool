'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, AlertTriangle, List } from 'lucide-react';

export interface PageFilterState {
  filter: 'all' | 'errors' | 'warnings';
  sortBy: 'issueCount' | 'onpageScore' | 'statusCode' | 'url';
  sortOrder: 'asc' | 'desc';
}

interface PageFiltersProps {
  filters: PageFilterState;
  onChange: (filters: PageFilterState) => void;
  totalPages: number;
  errorPages?: number;
  warningPages?: number;
}

export function PageFilters({
  filters,
  onChange,
  totalPages,
  errorPages = 0,
  warningPages = 0,
}: PageFiltersProps): React.ReactElement {
  const handleFilterChange = (filter: 'all' | 'errors' | 'warnings'): void => {
    onChange({ ...filters, filter });
  };

  const handleSortByChange = (sortBy: string): void => {
    onChange({
      ...filters,
      sortBy: sortBy as 'issueCount' | 'onpageScore' | 'statusCode' | 'url',
    });
  };

  const handleSortOrderChange = (sortOrder: string): void => {
    onChange({
      ...filters,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filters.filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('all')}
        >
          <List className="h-4 w-4 mr-1" />
          All ({totalPages})
        </Button>
        <Button
          variant={filters.filter === 'errors' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('errors')}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Errors ({errorPages})
        </Button>
        <Button
          variant={filters.filter === 'warnings' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('warnings')}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Warnings ({warningPages})
        </Button>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <Select value={filters.sortBy} onValueChange={handleSortByChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="issueCount">Issue Count</SelectItem>
            <SelectItem value="onpageScore">OnPage Score</SelectItem>
            <SelectItem value="statusCode">Status Code</SelectItem>
            <SelectItem value="url">URL (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
