"use client"

import { useCallback, useEffect, useState } from "react"
import type { AnyWidgetConfig } from "@/types/widget-config"
import { loadState, saveState } from "@/lib/storage"

type PersistedState = {
  widgets: AnyWidgetConfig[]
  order: string[]
}

const initialState: PersistedState = {
  widgets: [],
  order: [],
}

export function useDashboard() {
  const [state, setState] = useState<PersistedState>(initialState)

  useEffect(() => {
    const s = loadState<PersistedState>()
    if (s) setState(s)
  }, [])

  useEffect(() => {
    saveState(state)
  }, [state])

  const addWidget = useCallback((w: AnyWidgetConfig) => {
    setState((prev) => ({
      widgets: [...prev.widgets, w],
      order: [...prev.order, w.id],
    }))
  }, [])

  const removeWidget = useCallback((id: string) => {
    setState((prev) => ({
      widgets: prev.widgets.filter((x) => x.id !== id),
      order: prev.order.filter((x) => x !== id),
    }))
  }, [])

  const updateOrder = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, order: ids }))
  }, [])

  const refreshWidget = useCallback((id: string) => {
    // trigger SWR revalidation by emitting a key; each widget uses its own SWR key including id
    const ev = new CustomEvent("fin-revalidate", { detail: { id } })
    window.dispatchEvent(ev)
  }, [])

  return {
    widgets: state.widgets,
    order: state.order,
    addWidget,
    removeWidget,
    updateOrder,
    refreshWidget,
  }
}
