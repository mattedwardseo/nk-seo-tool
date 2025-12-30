'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { DomainProvider } from '@/contexts/DomainContext'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Hydration guard - only render full layout after client mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = (): void => {
    setSidebarCollapsed((prev) => !prev)
  }

  const toggleMobileMenu = (): void => {
    setMobileMenuOpen((prev) => !prev)
  }

  // Render minimal skeleton during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-background flex h-screen overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="bg-background border-border h-14 border-b" />
          <main className="bg-muted/30 flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <DomainProvider>
      <div className="bg-background flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
              onClick={toggleMobileMenu}
            />
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <Sidebar onToggle={toggleMobileMenu} />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={toggleMobileMenu} showMenuButton />

          <main className={cn('flex-1 overflow-y-auto p-4 lg:p-6', 'bg-muted/30')}>
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </DomainProvider>
  )
}
