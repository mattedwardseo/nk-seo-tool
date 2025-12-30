'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  FileSearch,
  Globe,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Calculator,
  Search,
  TrendingUp,
  Check,
  ChevronsUpDown,
  Plus,
  Building2,
  Link2,
  Bot,
  Grid3X3,
  Layers,
  FolderCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { APP_NAME } from '@/lib/constants'
import { useDomain } from '@/contexts/DomainContext'
import { CreateDomainDialog } from '@/components/domains/CreateDomainDialog'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badgeKey?: 'audits' | 'siteScans' | 'localCampaigns' | 'seoCalculations' | 'keywordAudits' | 'keywordTrackingRuns' | 'aiSeoRuns'
  children?: { title: string; href: string }[]
  global?: boolean // If true, don't prepend domain path
  isNew?: boolean // Show "NEW" badge
}

interface NavSection {
  title: string | null // null for no header (Dashboard)
  items: NavItem[]
}

/**
 * Get navigation sections with domain-scoped paths
 * @param domainId - The selected domain ID, or null if no domain selected
 */
function getNavSections(domainId: string | null): NavSection[] {
  const domainPrefix = domainId ? `/d/${domainId}` : ''

  return [
    {
      title: null, // No header for Dashboard
      items: [
        {
          title: 'Dashboard',
          href: domainId ? `${domainPrefix}` : '/',
          icon: <Home className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'SEO ANALYSIS',
      items: [
        {
          title: 'SEO Audits',
          href: `${domainPrefix}/audits`,
          icon: <FileSearch className="h-4 w-4" />,
          badgeKey: 'audits',
          children: [
            { title: 'All Audits', href: `${domainPrefix}/audits` },
            { title: 'New Audit', href: `${domainPrefix}/audits/new` },
          ],
        },
        {
          title: 'Site Audit',
          href: `${domainPrefix}/site-audit`,
          icon: <Globe className="h-4 w-4" />,
          badgeKey: 'siteScans',
          children: [
            { title: 'All Scans', href: `${domainPrefix}/site-audit` },
            { title: 'New Scan', href: `${domainPrefix}/site-audit/new` },
          ],
        },
        {
          title: 'Keyword Audit',
          href: `${domainPrefix}/seo-audit`,
          icon: <Search className="h-4 w-4" />,
          badgeKey: 'keywordAudits',
          children: [
            { title: 'All Audits', href: `${domainPrefix}/seo-audit` },
            { title: 'New Audit', href: `${domainPrefix}/seo-audit/new` },
          ],
        },
        {
          title: 'Backlinks',
          href: `${domainPrefix}/backlinks`,
          icon: <Link2 className="h-4 w-4" />,
          children: [
            { title: 'Overview', href: `${domainPrefix}/backlinks` },
            { title: 'Referring Domains', href: `${domainPrefix}/backlinks/referring-domains` },
          ],
        },
      ],
    },
    {
      title: 'KEYWORD INTELLIGENCE',
      items: [
        {
          title: 'Keyword Tracking',
          href: `${domainPrefix}/keyword-tracking`,
          icon: <TrendingUp className="h-4 w-4" />,
          badgeKey: 'keywordTrackingRuns',
          children: [
            { title: 'All Runs', href: `${domainPrefix}/keyword-tracking` },
            { title: 'New Run', href: `${domainPrefix}/keyword-tracking/new` },
            { title: 'Schedule', href: `${domainPrefix}/keyword-tracking/schedule` },
          ],
        },
        {
          title: 'AI SEO',
          href: `${domainPrefix}/ai-seo`,
          icon: <Bot className="h-4 w-4" />,
          badgeKey: 'aiSeoRuns',
          isNew: true,
          children: [
            { title: 'Dashboard', href: `${domainPrefix}/ai-seo` },
            { title: 'New Analysis', href: `${domainPrefix}/ai-seo/new` },
            { title: 'LLM Mentions', href: `${domainPrefix}/ai-seo/mentions` },
          ],
        },
      ],
    },
    {
      title: 'LOCAL SEO',
      items: [
        {
          title: 'Geo Grids',
          href: `${domainPrefix}/local-seo`,
          icon: <Grid3X3 className="h-4 w-4" />,
          badgeKey: 'localCampaigns',
          children: [
            { title: 'All Campaigns', href: `${domainPrefix}/local-seo` },
            { title: 'New Campaign', href: `${domainPrefix}/local-seo/new` },
          ],
        },
        {
          title: 'GBP Profile',
          href: `${domainPrefix}/gbp`,
          icon: <Building2 className="h-4 w-4" />,
          children: [
            { title: 'Profile', href: `${domainPrefix}/gbp` },
            { title: 'Competitors', href: `${domainPrefix}/gbp/competitors` },
            { title: 'Analysis', href: `${domainPrefix}/gbp/analysis` },
          ],
        },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        {
          title: 'ROI Calculators',
          href: `${domainPrefix}/calculators`,
          icon: <Calculator className="h-4 w-4" />,
          badgeKey: 'seoCalculations',
          children: [
            { title: 'All Calculators', href: `${domainPrefix}/calculators` },
            { title: 'SEO Calculator', href: `${domainPrefix}/calculators/seo` },
            { title: 'Google Ads', href: `${domainPrefix}/calculators/google-ads` },
            { title: 'Capacity', href: `${domainPrefix}/calculators/capacity` },
          ],
        },
        {
          title: 'SEO Factors',
          href: `${domainPrefix}/seo-factors`,
          icon: <Layers className="h-4 w-4" />,
          isNew: true,
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        {
          title: 'Domain Management',
          href: '/settings/domains',
          icon: <FolderCog className="h-4 w-4" />,
          global: true,
        },
        {
          title: 'Settings',
          href: '/settings',
          icon: <Settings className="h-4 w-4" />,
          global: true,
        },
      ],
    },
  ]
}

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

interface ToolCounts {
  audits: number
  siteScans: number
  localCampaigns: number
  seoCalculations: number
  trackedKeywords: number
  keywordAudits: number
  keywordTrackingRuns: number
  aiSeoRuns?: number
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedDomain, domains, isLoading, selectDomain } = useDomain()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([
    'SEO Audits', 
    'Site Audit', 
    'Keyword Audit', 
    'Keyword Tracking', 
    'AI SEO',
    'Geo Grids', 
    'GBP Profile',
    'ROI Calculators',
  ])
  const [toolCounts, setToolCounts] = React.useState<ToolCounts | null>(null)
  const [domainSelectorOpen, setDomainSelectorOpen] = React.useState(false)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  // Get navigation sections based on selected domain
  const navSections = React.useMemo(
    () => getNavSections(selectedDomain?.id || null),
    [selectedDomain?.id]
  )

  // Fetch tool counts when domain changes
  React.useEffect(() => {
    if (!selectedDomain) {
      setToolCounts(null)
      return
    }

    async function fetchToolCounts(): Promise<void> {
      try {
        const response = await fetch(`/api/domains/${selectedDomain!.id}/tool-counts`)
        const data = await response.json()
        if (data.success) {
          setToolCounts(data.data)
        }
      } catch (error) {
        console.error('Error fetching tool counts:', error)
      }
    }

    void fetchToolCounts()
  }, [selectedDomain])

  const toggleExpand = (title: string): void => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string): boolean => {
    // Handle dashboard home for both root and domain-scoped
    if (href === '/' || (selectedDomain && href === `/d/${selectedDomain.id}`)) {
      return pathname === '/' || pathname === `/d/${selectedDomain?.id}`
    }
    return pathname.startsWith(href)
  }

  const getItemBadge = (badgeKey?: string): number | null => {
    if (!toolCounts || !badgeKey) return null
    return toolCounts[badgeKey as keyof ToolCounts] || null
  }

  const handleDomainSelect = (domainId: string): void => {
    selectDomain(domainId)
    setDomainSelectorOpen(false)
    // Navigate to the domain dashboard
    router.push(`/d/${domainId}`)
  }

  // Get domain health indicator color (placeholder - can be enhanced later)
  const getDomainHealthColor = (): string => {
    // This could be enhanced to show actual domain health
    return 'bg-emerald-500'
  }

  return (
    <aside
      className={cn(
        'bg-sidebar flex h-full flex-col border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with Logo */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link
            href={selectedDomain ? `/d/${selectedDomain.id}` : '/'}
            className="flex items-center gap-2.5 group"
          >
            <div className="bg-[#FF6B35] flex h-8 w-8 items-center justify-center rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <FileSearch className="text-white h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">{APP_NAME}</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="hover:bg-sidebar-accent cursor-pointer transition-colors duration-150 text-sidebar-foreground"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Domain Selector */}
      {!collapsed && (
        <div className="border-b border-sidebar-border p-3">
          <Popover open={domainSelectorOpen} onOpenChange={setDomainSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={domainSelectorOpen}
                className="w-full justify-between bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="text-sidebar-muted text-sm">Loading...</span>
                ) : selectedDomain ? (
                  <div className="flex items-center gap-2.5 text-left">
                    <div className={cn('h-2 w-2 rounded-full', getDomainHealthColor())} />
                    <div className="flex flex-col gap-0">
                      <span className="font-medium text-sm truncate max-w-[160px] text-sidebar-foreground">{selectedDomain.name}</span>
                      <span className="text-xs text-sidebar-muted truncate max-w-[160px]">
                        {selectedDomain.domain}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sidebar-muted text-sm">Select project...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-sidebar-muted" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[232px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search projects..." />
                <CommandList>
                  <CommandEmpty>No projects found.</CommandEmpty>
                  <CommandGroup heading="Your Projects">
                    {domains.map((domain) => (
                      <CommandItem
                        key={domain.id}
                        value={domain.id}
                        onSelect={handleDomainSelect}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedDomain?.id === domain.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{domain.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {domain.domain}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setDomainSelectorOpen(false)
                        setShowCreateDialog(true)
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
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {!selectedDomain ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-sidebar-muted">
              Select a project to view tools
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Header */}
                {section.title && !collapsed && (
                  <div className="px-4 pb-2">
                    <span className="text-[10px] font-bold tracking-widest text-sidebar-muted uppercase">
                      {section.title}
                    </span>
                  </div>
                )}

                {/* Section Items */}
                <ul className="space-y-0.5 px-2">
                  {section.items.map((item) => {
                    const badgeCount = getItemBadge(item.badgeKey)

                    return (
                      <li key={item.title}>
                        {item.children ? (
                          <div>
                            <button
                              onClick={() => toggleExpand(item.title)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                                'hover:bg-sidebar-accent cursor-pointer text-sidebar-foreground/90',
                                isActive(item.href) && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                              )}
                            >
                              <span className="text-sidebar-muted">{item.icon}</span>
                              {!collapsed && (
                                <>
                                  <span className="flex-1 text-left">{item.title}</span>
                                  {item.isNew && (
                                    <Badge className="h-4 px-1.5 text-[10px] font-bold bg-[#FF6B35] text-white border-0">
                                      NEW
                                    </Badge>
                                  )}
                                  {badgeCount !== null && badgeCount > 0 && (
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-sidebar-accent text-sidebar-foreground">
                                      {badgeCount}
                                    </Badge>
                                  )}
                                  {expandedItems.includes(item.title) ? (
                                    <ChevronDown className="h-4 w-4 text-sidebar-muted" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-sidebar-muted" />
                                  )}
                                </>
                              )}
                            </button>
                            {!collapsed && expandedItems.includes(item.title) && (
                              <ul className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-4">
                                {item.children.map((child) => (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      className={cn(
                                        'block rounded-md px-3 py-1.5 text-sm transition-all duration-150',
                                        'hover:bg-sidebar-accent cursor-pointer text-sidebar-foreground/70',
                                        pathname === child.href && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                                      )}
                                    >
                                      {child.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                              'hover:bg-sidebar-accent cursor-pointer text-sidebar-foreground/90',
                              isActive(item.href) && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                            )}
                          >
                            <span className="text-sidebar-muted">{item.icon}</span>
                            {!collapsed && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                {item.isNew && (
                                  <Badge className="h-4 px-1.5 text-[10px] font-bold bg-[#FF6B35] text-white border-0">
                                    NEW
                                  </Badge>
                                )}
                                {badgeCount !== null && badgeCount > 0 && (
                                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-sidebar-accent text-sidebar-foreground">
                                    {badgeCount}
                                  </Badge>
                                )}
                              </>
                            )}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="bg-sidebar-accent/30 text-sidebar-muted rounded-lg px-3 py-2.5 text-xs flex items-center justify-between">
            <span>Demo Mode</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Create Domain Dialog */}
      <CreateDomainDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </aside>
  )
}
