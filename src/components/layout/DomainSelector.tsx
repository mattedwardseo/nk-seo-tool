'use client';

/**
 * DomainSelector Component
 * Enhanced dropdown with pinned, recent, and all domains sections
 */

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Pin, Clock, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDomain, type Domain } from '@/contexts/DomainContext';
import { cn } from '@/lib/utils';
import { CreateDomainDialog } from '@/components/domains/CreateDomainDialog';

export function DomainSelector() {
  const {
    selectedDomain,
    domains,
    pinnedDomains,
    recentDomains,
    isLoading,
    selectDomain,
    togglePinDomain
  } = useDomain();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);

  // Get unpinned domains that aren't in recent
  const recentIds = new Set(recentDomains.map((d) => d.id));
  const pinnedIds = new Set(pinnedDomains.map((d) => d.id));
  const otherDomains = domains.filter(
    (d) => !pinnedIds.has(d.id) && !recentIds.has(d.id)
  );

  const handlePinClick = async (e: React.MouseEvent, domainId: string): Promise<void> => {
    e.stopPropagation();
    await togglePinDomain(domainId);
  };

  const handleSettingsClick = (e: React.MouseEvent, domainId: string): void => {
    e.stopPropagation();
    setOpen(false);
    router.push(`/d/${domainId}/settings`);
  };

  const renderDomainItem = (domain: Domain): React.ReactElement => (
    <CommandItem
      key={domain.id}
      value={domain.id}
      onSelect={(currentValue) => {
        selectDomain(currentValue);
        setOpen(false);
      }}
      onMouseEnter={() => setHoveredDomainId(domain.id)}
      onMouseLeave={() => setHoveredDomainId(null)}
      className="group"
    >
      <Check
        className={cn(
          'mr-2 h-4 w-4 shrink-0',
          selectedDomain?.id === domain.id ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="font-medium truncate">{domain.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {domain.domain}
        </span>
      </div>
      {hoveredDomainId === domain.id && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => handlePinClick(e, domain.id)}
            className={cn(
              'p-1 rounded hover:bg-accent',
              domain.isPinned ? 'text-primary' : 'text-muted-foreground'
            )}
            title={domain.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => handleSettingsClick(e, domain.id)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title="Settings"
          >
            <Settings className="h-3 w-3" />
          </button>
        </div>
      )}
    </CommandItem>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="text-muted-foreground">Loading domains...</span>
            ) : selectedDomain ? (
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium">{selectedDomain.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedDomain.domain}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a domain...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search domains..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>No domains found.</CommandEmpty>

              {/* Pinned Domains */}
              {pinnedDomains.length > 0 && (
                <>
                  <CommandGroup heading={
                    <span className="flex items-center gap-1.5">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  }>
                    {pinnedDomains.map(renderDomainItem)}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Recent Domains */}
              {recentDomains.length > 0 && (
                <>
                  <CommandGroup heading={
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Recent
                    </span>
                  }>
                    {recentDomains.map(renderDomainItem)}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* All Other Domains */}
              {otherDomains.length > 0 && (
                <CommandGroup heading="All Domains">
                  {otherDomains.map(renderDomainItem)}
                </CommandGroup>
              )}

              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateDomainDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
