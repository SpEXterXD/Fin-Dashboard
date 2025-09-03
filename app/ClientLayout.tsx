"use client"

import type React from "react"

import { Analytics } from "@vercel/analytics/next"
import { DashboardProvider } from "@/hooks/use-dashboard-store"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="fin-dashboard-theme"
        >
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </ThemeProvider>
      </Suspense>
      <Analytics />
    </>
  )
}
