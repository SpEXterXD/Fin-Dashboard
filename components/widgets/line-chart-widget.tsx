"use client"

import useSWR from "swr"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import type { WidgetConfig } from "@/types/widget-config"
import { useEffect, useState } from "react"
import { swrOptions } from "@/lib/swr"

export function LineChartWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading, mutate } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { ...swrOptions, refreshInterval: widget.refreshInterval },
  )

  const [lastUpdated, setLastUpdated] = useState<string>("")
  useEffect(() => {
    if (data) setLastUpdated(new Date().toLocaleTimeString())
  }, [data])

  if (isLoading) return <div role="status" aria-live="polite" className="h-[280px] animate-pulse rounded-md bg-muted" />
  if (error)
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Failed to load chart data.</p>
        <button className="text-xs underline" onClick={() => mutate()}>
          Retry
        </button>
      </div>
    )
  if (!data) return <p className="text-sm text-muted-foreground">No data.</p>

  const arrPath = widget.fieldPaths.find((p) => Array.isArray(getByPath(data, p)))
  const series = (arrPath ? getByPath(data, arrPath) : Array.isArray(data) ? data : []) as Record<string, unknown>[]
  const xKey = widget.options?.xKey || "date"
  const yKey =
    widget.options?.yKey ||
    widget.fieldPaths
      .find((p) => p !== arrPath)
      ?.split(".")
      .pop() ||
    "value"

  return (
    <section role="region" aria-label={`${widget.title} chart`} className="space-y-2">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line isAnimationActive type="monotone" dataKey={yKey} stroke="hsl(var(--chart-1))" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">Last updated: {lastUpdated || "—"}</p>
    </section>
  )
}
