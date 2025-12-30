import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Protected routes that require authentication
 * Note: (dashboard) is a route group, so pages are at / and /audits, not /dashboard
 */
const protectedRoutes = ['/', '/audits', '/d', '/site-audit', '/local-seo', '/seo-audit', '/keyword-tracking', '/calculators']

/**
 * Auth routes that should redirect to home if already logged in
 */
const authRoutes = ['/login', '/register']

/**
 * Legacy routes that should be redirected to domain-scoped routes
 * Maps old path prefixes to new domain-scoped equivalents
 */
const legacyRoutes: Record<string, string> = {
  '/audits': '/audits',
  '/site-audit': '/site-audit',
  '/local-seo': '/local-seo',
  '/seo-audit': '/seo-audit',
  '/keyword-tracking': '/keyword-tracking',
  '/calculators': '/calculators',
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl

  // Check for legacy route redirects with domainId query param
  const domainId = searchParams.get('domainId')
  if (domainId) {
    // Check if this is a legacy route that should be redirected
    for (const [legacyPrefix, newPath] of Object.entries(legacyRoutes)) {
      if (pathname.startsWith(legacyPrefix)) {
        // Build the new domain-scoped URL
        const restOfPath = pathname.slice(legacyPrefix.length)
        const newUrl = new URL(`/d/${domainId}${newPath}${restOfPath}`, request.url)

        // Remove the domainId param as it's now part of the URL
        newUrl.searchParams.delete('domainId')

        return NextResponse.redirect(newUrl)
      }
    }
  }

  // Check if the route is an auth route FIRST (to avoid login loops)
  const isAuthRoute = authRoutes.some((route) => pathname === route)

  // Auth routes are handled separately - don't treat as protected
  if (isAuthRoute) {
    const session = await auth()
    const isAuthenticated = !!session?.user

    // Redirect authenticated users away from auth pages
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Allow unauthenticated users to access auth pages
    return NextResponse.next()
  }

  // Check if the route is protected (excluding root exactly for auth routes)
  const isProtectedRoute = protectedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )

  // Get the session for protected routes
  if (isProtectedRoute) {
    const session = await auth()
    const isAuthenticated = !!session?.user

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except:
    // - API routes (handled separately)
    // - Static files
    // - _next internal routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
