"use client"

import type React from "react"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { WidgetConfig } from "@/types/widget-config"

type Ctx = {
  widgets: WidgetConfig[]
  addWidget: (w: WidgetConfig) => void
  removeWidget: (id: string) => void
  reorder: (arr: WidgetConfig[]) => void
  replaceAll: (arr: WidgetConfig[]) => void
  updateWidget: (id: string, partial: Partial<WidgetConfig>) => void
}

const DashboardContext = createContext<Ctx | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])

  const addWidget = useCallback((w: WidgetConfig) => setWidgets((prev) => [...prev, w]), [])
  const removeWidget = useCallback((id: string) => setWidgets((prev) => prev.filter((w) => w.id !== id)), [])
  const reorder = useCallback((arr: WidgetConfig[]) => setWidgets(arr), [])
  const replaceAll = useCallback((arr: WidgetConfig[]) => setWidgets(arr ?? []), [])
  const updateWidget = useCallback((id: string, partial: Partial<WidgetConfig>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...partial } : w)))
  }, [])

  const value = useMemo(
    () => ({ widgets, addWidget, removeWidget, reorder, replaceAll, updateWidget }),
    [widgets, addWidget, removeWidget, reorder, replaceAll, updateWidget],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
