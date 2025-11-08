'use client'

import { SessionProvider } from "next-auth/react"
import { ErrorToastProvider } from "@/providers/ErrorToastProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorToastProvider>
        {children}
      </ErrorToastProvider>
    </SessionProvider>
  )
}