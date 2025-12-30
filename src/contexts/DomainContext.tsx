'use client';

/**
 * DomainContext
 * Global state management for domain-centric architecture (Phase 12)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { DomainStatus } from '@prisma/client';

export interface Domain {
  id: string;
  userId: string;
  name: string;
  domain: string;
  businessName: string | null;
  city: string | null;
  state: string | null;
  status: DomainStatus;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    id: string;
    roiOperatories: number;
    roiDaysOpen: number;
    roiAvgPatientValue: number;
    roiConversionRate: number;
    roiCloseRate: number;
    siteAuditMaxPages: number;
    siteAuditEnableJavascript: boolean;
    localSeoGridSize: number;
    localSeoRadiusMiles: number;
  } | null;
}

export interface CreateDomainInput {
  name: string;
  domain: string;
  businessName?: string;
  city?: string;
  state?: string;
}

interface DomainContextValue {
  selectedDomain: Domain | null;
  domains: Domain[];
  pinnedDomains: Domain[];
  recentDomains: Domain[];
  isLoading: boolean;
  error: string | null;
  selectDomain: (domainId: string) => void;
  togglePinDomain: (domainId: string) => Promise<void>;
  createDomain: (data: CreateDomainInput) => Promise<Domain>;
  refreshDomains: () => Promise<void>;
}

const DomainContext = createContext<DomainContextValue | undefined>(undefined);

const SELECTED_DOMAIN_KEY = 'selectedDomainId';
const RECENT_DOMAINS_KEY = 'recentDomainIds';
const MAX_RECENT_DOMAINS = 5;

interface DomainProviderProps {
  children: ReactNode;
}

export function DomainProvider({ children }: DomainProviderProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [recentDomainIds, setRecentDomainIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Computed: pinned domains sorted alphabetically
  const pinnedDomains = domains
    .filter((d) => d.isPinned)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Computed: recent domains (excluding pinned, max 5)
  const recentDomains = recentDomainIds
    .map((id) => domains.find((d) => d.id === id))
    .filter((d): d is Domain => d !== undefined && !d.isPinned)
    .slice(0, MAX_RECENT_DOMAINS);

  // Load recent domains from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECENT_DOMAINS_KEY);
      if (saved) {
        try {
          setRecentDomainIds(JSON.parse(saved));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  /**
   * Fetch all domains from API
   */
  const fetchDomains = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/domains');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch domains');
      }

      // Convert date strings to Date objects
      const domainsData: Domain[] = data.data.map((d: Domain) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
      }));

      setDomains(domainsData);

      // Auto-select domain
      const savedDomainId =
        typeof window !== 'undefined'
          ? localStorage.getItem(SELECTED_DOMAIN_KEY)
          : null;

      if (savedDomainId) {
        const savedDomain = domainsData.find((d) => d.id === savedDomainId);
        if (savedDomain) {
          setSelectedDomain(savedDomain);
        } else {
          // Saved domain not found, select first
          setSelectedDomain(domainsData[0] || null);
        }
      } else {
        // No saved selection, select first domain
        setSelectedDomain(domainsData[0] || null);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select a domain by ID and add to recent
   */
  const selectDomain = useCallback(
    (domainId: string): void => {
      const domain = domains.find((d) => d.id === domainId);
      if (domain) {
        setSelectedDomain(domain);
        if (typeof window !== 'undefined') {
          localStorage.setItem(SELECTED_DOMAIN_KEY, domainId);

          // Add to recent domains (most recent first, max 5)
          setRecentDomainIds((prev) => {
            const updated = [domainId, ...prev.filter((id) => id !== domainId)].slice(0, MAX_RECENT_DOMAINS);
            localStorage.setItem(RECENT_DOMAINS_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      }
    },
    [domains]
  );

  /**
   * Toggle pin status for a domain
   */
  const togglePinDomain = useCallback(
    async (domainId: string): Promise<void> => {
      const domain = domains.find((d) => d.id === domainId);
      if (!domain) return;

      try {
        const response = await fetch(`/api/domains/${domainId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: !domain.isPinned }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update domain');
        }

        // Update local state
        setDomains((prev) =>
          prev.map((d) =>
            d.id === domainId ? { ...d, isPinned: !d.isPinned } : d
          )
        );

        // Update selected domain if it's the one being toggled
        if (selectedDomain?.id === domainId) {
          setSelectedDomain((prev) =>
            prev ? { ...prev, isPinned: !prev.isPinned } : null
          );
        }
      } catch (err) {
        console.error('Error toggling pin:', err);
      }
    },
    [domains, selectedDomain]
  );

  /**
   * Create a new domain
   */
  const createDomain = useCallback(
    async (data: CreateDomainInput): Promise<Domain> => {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create domain');
      }

      const newDomain: Domain = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };

      // Add to domains list
      setDomains((prev) => [newDomain, ...prev]);

      // Auto-select new domain
      setSelectedDomain(newDomain);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SELECTED_DOMAIN_KEY, newDomain.id);
      }

      return newDomain;
    },
    []
  );

  /**
   * Refresh domains list
   */
  const refreshDomains = useCallback(async (): Promise<void> => {
    await fetchDomains();
  }, [fetchDomains]);

  // Initial fetch on mount
  useEffect(() => {
    void fetchDomains();
  }, [fetchDomains]);

  const value: DomainContextValue = {
    selectedDomain,
    domains,
    pinnedDomains,
    recentDomains,
    isLoading,
    error,
    selectDomain,
    togglePinDomain,
    createDomain,
    refreshDomains,
  };

  return (
    <DomainContext.Provider value={value}>{children}</DomainContext.Provider>
  );
}

/**
 * Hook to access domain context
 */
export function useDomain(): DomainContextValue {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}
