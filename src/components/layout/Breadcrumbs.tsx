'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDomain } from '@/contexts/DomainContext'

interface BreadcrumbItem {
  label: string
  href: string
}

const pathLabels: Record<string, string> = {
  audits: 'SEO Audits',
  new: 'New',
  schedule: 'Schedules',
  settings: 'Settings',
  'site-audit': 'Site Audit',
  'local-seo': 'Local SEO',
  'seo-audit': 'Keyword Audit',
  'keyword-tracking': 'Keyword Tracking',
  calculators: 'Calculators',
  seo: 'SEO Calculator',
  'google-ads': 'Google Ads Calculator',
  capacity: 'Capacity Calculator',
  competitors: 'Competitors',
  'gbp-comparison': 'GBP Comparison',
  gbp: 'GBP Dashboard',
  grid: 'Grid View',
  history: 'History',
}

export function Breadcrumbs(): React.ReactElement {
  const pathname = usePathname()
  const { selectedDomain } = useDomain()

  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/' }]

    if (pathname === '/') {
      return items
    }

    const segments = pathname.split('/').filter(Boolean)

    // Handle new domain-scoped routes: /d/[domainId]/...
    if (segments[0] === 'd' && segments.length >= 2) {
      const domainId = segments[1]
      const domainPath = `/d/${domainId}`

      // Add domain name as second breadcrumb
      if (selectedDomain) {
        items.push({ label: selectedDomain.name, href: domainPath })
      } else {
        items.push({ label: 'Domain', href: domainPath })
      }

      // Process remaining segments after /d/[domainId]
      let currentPath = domainPath
      for (let i = 2; i < segments.length; i++) {
        const segment = segments[i]
        if (!segment) continue

        currentPath += `/${segment}`

        // Skip dynamic IDs (long alphanumeric strings) - show "Details" instead
        if (segment.match(/^[a-z0-9]{20,}$/i)) {
          items.push({ label: 'Details', href: currentPath })
        } else {
          items.push({
            label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            href: currentPath,
          })
        }
      }

      return items
    }

    // Handle legacy routes (non-domain-scoped)
    // Add domain name after Dashboard if one is selected
    if (selectedDomain) {
      items.push({ label: selectedDomain.name, href: '/' })
    }

    let currentPath = ''
    for (const segment of segments) {
      currentPath += `/${segment}`

      // Skip dynamic segments in breadcrumb labels (they'll be handled differently)
      if (segment.startsWith('[') || segment.match(/^[a-z0-9]{20,}$/i)) {
        items.push({ label: 'Details', href: currentPath })
      } else {
        items.push({
          label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
        })
      }
    }

    return items
  }, [pathname, selectedDomain])

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />}
              {isLast ? (
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'text-muted-foreground flex items-center gap-1 transition-colors duration-150',
                    'hover:text-foreground cursor-pointer'
                  )}
                >
                  {index === 0 && <Home className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
