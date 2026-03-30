'use client'

import dynamic from 'next/dynamic'
import type { PropsWithChildren } from 'react'

const AuthProvider = dynamic(
  () => import('@/lib/authContext').then((mod) => mod.AuthProvider),
  { ssr: false }
)

export function AuthClientProvider({ children }: PropsWithChildren<{}>) {
  return <AuthProvider>{children}</AuthProvider>
}
