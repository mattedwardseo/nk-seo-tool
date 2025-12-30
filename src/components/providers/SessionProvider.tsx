'use client'

import React, { ReactNode } from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps): React.ReactElement {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
