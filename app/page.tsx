"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog"
import { DashboardProvider, useDashboard } from "@/hooks/use-dashboard-store"
import { ImportExport } from "@/components/dashboard/import-export"
import { ThemeToggle } from "@/components/theme-toggle"

function DashboardInner() {
  const { widgets, replaceAll, addWidget } = useDashboard()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load from localStorage
  useEffect(() => {
    if (!mounted) return
    try {
      const raw = localStorage.getItem("finview.config.v1")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.widgets) replaceAll(parsed.widgets)
      }
    } catch {}
  }, [replaceAll, mounted])

  // Persist on change
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("finview.config.v1", JSON.stringify({ widgets }))
    } catch {}
  }, [widgets, mounted])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-balance">My Dashboard</h1>
          <p className="text-muted-foreground">Connect any finance API and build your own view.</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ImportExport />
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Widget
          </Button>
        </div>
      </header>

      <WidgetGrid />

      <AddWidgetDialog
        open={open}
        onOpenChange={setOpen}
        onCreate={(w) => {
          addWidget(w)
          setOpen(false)
        }}
      />
    </main>
  )
}

export default function Page() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  )
}
