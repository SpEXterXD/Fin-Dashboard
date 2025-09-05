"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, TrendingUp } from "lucide-react"
import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog"
import { DashboardProvider, useDashboard } from "@/hooks/use-dashboard-store"
import { ImportExport } from "@/components/dashboard/import-export"
import { ThemeToggle } from "@/components/theme-toggle"
import type { WidgetConfig } from "@/types/widget-config"

function DashboardInner() {
  const { widgets, replaceAll, addWidget, widgetCount } = useDashboard()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load from localStorage
  useEffect(() => {
    if (!mounted) return
    
    const loadFromStorage = async () => {
      try {
        setIsLoading(true)
        const raw = localStorage.getItem("finview.config.v1")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed?.widgets && Array.isArray(parsed.widgets)) {
            replaceAll(parsed.widgets)
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard configuration:', error)
        // Clear corrupted storage
        localStorage.removeItem("finview.config.v1")
      } finally {
        setIsLoading(false)
      }
    }

    loadFromStorage()
  }, [replaceAll, mounted])

  // Persist on change
  useEffect(() => {
    if (!mounted || isLoading) return
    
    const saveToStorage = async () => {
      try {
        const config = { 
          widgets, 
          version: '1.0', 
          lastUpdated: new Date().toISOString() 
        }
        localStorage.setItem("finview.config.v1", JSON.stringify(config))
      } catch (error) {
        console.error('Failed to save dashboard configuration:', error)
      }
    }

    // Debounce storage updates
    const timeoutId = setTimeout(saveToStorage, 500)
    return () => clearTimeout(timeoutId)
  }, [widgets, mounted, isLoading])

  const handleCreateWidget = useCallback((widget: WidgetConfig) => {
    try {
      addWidget(widget)
      setOpen(false)
    } catch (error) {
      console.error('Failed to create widget:', error)
      // You could show a toast notification here
    }
  }, [addWidget])

  const handleAddWidget = useCallback(() => {
    setOpen(true)
  }, [])

  // Memoize the empty state to avoid unnecessary re-renders
  const emptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-chart-2/10 rounded-full blur-xl animate-pulse" />
        <div className="relative rounded-full bg-gradient-to-br from-card/80 to-card/60 p-8 border border-border/30 backdrop-blur-sm shadow-lg">
          <div className="relative">
            <Plus className="h-16 w-16 text-primary" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary/20 rounded-full animate-ping" />
          </div>
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
        Welcome to FinView
      </h2>
      <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed">
        Create your personalized financial dashboard with real-time data, charts, and insights. 
        Connect to any financial API and build your custom view.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleAddWidget}
          className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="h-4 w-4" /> Add Your First Widget
        </Button>
      </div>
    </div>
  ), [handleAddWidget])

  // Memoize the header to avoid unnecessary re-renders
  const header = useMemo(() => (
    <header className="mb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              FinView Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect any finance API and build your personalized financial view
            </p>
          </div>
          
          {widgetCount > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{widgetCount} active widgets</span>
              </div>
              <div className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
              <span>Real-time updates enabled</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ImportExport />
          <Button 
            onClick={handleAddWidget}
            className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            size="lg"
          >
            <Plus className="h-4 w-4" /> Add Widget
          </Button>
        </div>
      </div>
    </header>
  ), [handleAddWidget, widgetCount])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-chart-1/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-chart-2/3 via-transparent to-transparent pointer-events-none opacity-30" />
      
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {header}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            </div>
          </div>
        ) : widgetCount === 0 ? (
          emptyState
        ) : (
          <WidgetGrid />
        )}

        <AddWidgetDialog
          open={open}
          onOpenChange={setOpen}
          onCreate={handleCreateWidget}
        />
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  )
}
