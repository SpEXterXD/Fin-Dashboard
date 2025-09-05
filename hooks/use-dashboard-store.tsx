"use client"

import type React from "react"
import { createContext, useCallback, useContext, useMemo, useState, useRef, useEffect } from "react"
import type { WidgetConfig } from "@/types/widget-config"

interface DashboardContextType {
  widgets: WidgetConfig[]
  addWidget: (widget: WidgetConfig) => void
  removeWidget: (id: string) => void
  reorder: (widgets: WidgetConfig[]) => void
  replaceAll: (widgets: WidgetConfig[]) => void
  updateWidget: (id: string, partial: Partial<WidgetConfig>) => void
  getWidget: (id: string) => WidgetConfig | undefined
  clearWidgets: () => void
  widgetCount: number
}

const DashboardContext = createContext<DashboardContextType | null>(null)

// Validation function for widget configuration
function validateWidgetConfig(widget: WidgetConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!widget.id || typeof widget.id !== 'string') {
    errors.push('Widget must have a valid ID')
  }
  
  if (!widget.title || typeof widget.title !== 'string') {
    errors.push('Widget must have a title')
  }
  
  if (!widget.type || !['card', 'table', 'chart', 'realtime'].includes(widget.type)) {
    errors.push('Widget must have a valid type')
  }
  
  // Endpoint is required for non-realtime widgets
  if (widget.type !== 'realtime' && (!widget.endpoint || typeof widget.endpoint !== 'string')) {
    errors.push('Widget must have an endpoint')
  }
  
  if (typeof widget.refreshInterval !== 'number' || widget.refreshInterval < 5) {
    errors.push('Widget must have a refresh interval of at least 5 seconds')
  }
  
  // Field paths are required for non-realtime widgets
  if (widget.type !== 'realtime' && !Array.isArray(widget.fieldPaths)) {
    errors.push('Widget must have field paths array')
  }
  
  // Validate real-time specific options
  if (widget.type === 'realtime') {
    if (!widget.realtime?.enabled) {
      errors.push('Real-time widget must have realtime.enabled set to true')
    }
    if (!widget.realtime?.symbol || typeof widget.realtime.symbol !== 'string') {
      errors.push('Real-time widget must have a symbol')
    }
  }
  
  // Validate chart-specific options
  if (widget.type === 'chart' && widget.options?.kind === 'candlestick') {
    const requiredKeys = ['xKey', 'oKey', 'hKey', 'lKey', 'cKey']
    for (const key of requiredKeys) {
      if (!widget.options[key as keyof typeof widget.options]) {
        errors.push(`Candlestick chart requires ${key}`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const isInitialized = useRef(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return
    
    try {
      const stored = localStorage.getItem("finview.config.v1")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.widgets && Array.isArray(parsed.widgets)) {
          // Validate stored widgets
          const validWidgets = parsed.widgets.filter((widget: unknown) => {
            const validation = validateWidgetConfig(widget as WidgetConfig)
            if (!validation.isValid) {
              console.warn('Invalid stored widget:', widget, validation.errors)
            }
            return validation.isValid
          })
          
          if (validWidgets.length > 0) {
            setWidgets(validWidgets)
            console.log(`Loaded ${validWidgets.length} valid widgets from storage`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard configuration:', error)
      // Clear corrupted storage
      localStorage.removeItem("finview.config.v1")
    } finally {
      isInitialized.current = true
    }
  }, [])

  // Persist to localStorage whenever widgets change
  useEffect(() => {
    if (!isInitialized.current) return
    
    try {
      const config = { widgets, version: '1.0', lastUpdated: new Date().toISOString() }
      localStorage.setItem("finview.config.v1", JSON.stringify(config))
    } catch (error) {
      console.error('Failed to save dashboard configuration:', error)
    }
  }, [widgets])

  const addWidget = useCallback((widget: WidgetConfig) => {
    const validation = validateWidgetConfig(widget)
    if (!validation.isValid) {
      console.error('Invalid widget configuration:', validation.errors)
      throw new Error(`Invalid widget: ${validation.errors.join(', ')}`)
    }
    
    setWidgets(prev => {
      // Check for duplicate IDs
      if (prev.some(w => w.id === widget.id)) {
        console.warn('Widget with ID already exists, generating new ID')
        widget.id = crypto.randomUUID()
      }
      return [...prev, widget]
    })
  }, [])

  const removeWidget = useCallback((id: string) => {
    if (!id) return
    
    setWidgets(prev => prev.filter(w => w.id !== id))
  }, [])

  const reorder = useCallback((newWidgets: WidgetConfig[]) => {
    if (!Array.isArray(newWidgets)) {
      console.error('Invalid widgets array for reordering')
      return
    }
    
    // Validate all widgets before reordering
    const validWidgets = newWidgets.filter(widget => {
      const validation = validateWidgetConfig(widget)
      if (!validation.isValid) {
        console.warn('Invalid widget during reorder:', widget, validation.errors)
      }
      return validation.isValid
    })
    
    if (validWidgets.length !== newWidgets.length) {
      console.warn('Some widgets were invalid and removed during reorder')
    }
    
    setWidgets(validWidgets)
  }, [])

  const replaceAll = useCallback((newWidgets: WidgetConfig[]) => {
    if (!Array.isArray(newWidgets)) {
      console.error('Invalid widgets array for replacement')
      return
    }
    
    // Validate all widgets
    const validWidgets = newWidgets.filter(widget => {
      const validation = validateWidgetConfig(widget)
      if (!validation.isValid) {
        console.warn('Invalid widget during replacement:', widget, validation.errors)
      }
      return validation.isValid
    })
    
    setWidgets(validWidgets)
  }, [])

  const updateWidget = useCallback((id: string, partial: Partial<WidgetConfig>) => {
    if (!id) return
    
    setWidgets(prev => prev.map(widget => {
      if (widget.id === id) {
        const updated = { ...widget, ...partial }
        const validation = validateWidgetConfig(updated)
        if (!validation.isValid) {
          console.warn('Invalid widget update:', updated, validation.errors)
          return widget // Keep original if update is invalid
        }
        return updated
      }
      return widget
    }))
  }, [])

  const getWidget = useCallback((id: string): WidgetConfig | undefined => {
    return widgets.find(w => w.id === id)
  }, [widgets])

  const clearWidgets = useCallback(() => {
    setWidgets([])
  }, [])

  const value = useMemo(
    () => ({
      widgets,
      addWidget,
      removeWidget,
      reorder,
      replaceAll,
      updateWidget,
      getWidget,
      clearWidgets,
      widgetCount: widgets.length
    }),
    [widgets, addWidget, removeWidget, reorder, replaceAll, updateWidget, getWidget, clearWidgets]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return context
}
