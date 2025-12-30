'use client'

import * as React from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './ThemeToggle'
import { Breadcrumbs } from './Breadcrumbs'

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps): React.ReactElement {
  const { data: session, status } = useSession()

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuClick}
            className="hover:bg-accent cursor-pointer transition-colors duration-150 lg:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {status === 'loading' ? (
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session.user.image || undefined}
                    alt={session.user.name || 'User'}
                  />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {session.user.name && (
                    <p className="text-sm leading-none font-medium">{session.user.name}</p>
                  )}
                  <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
