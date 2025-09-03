"use client"

import useSWR from "swr"
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import type { WidgetConfig } from "@/types/widget-config"
import { useEffect, useState } from "react"

export function CandlestickChartWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading, mutate } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { refreshInterval: widget.refreshInterval },
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

  // Check for Alpha Vantage rate limit error
  const rateLimitError = (data as Record<string, unknown>)?.["Information"] as string
  if (rateLimitError && rateLimitError.includes("rate limit")) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Alpha Vantage API Rate Limit Reached</p>
        <p className="text-xs text-muted-foreground">
          The demo API key has reached its daily limit (25 requests). 
          Try again tomorrow or use a premium API key.
        </p>
      </div>
    )
  }

  function normalizeSeries(input: unknown): Record<string, unknown>[] {
    const tsDaily = (input as Record<string, unknown>)?.["Time Series (Daily)"] as
      | Record<string, Record<string, string>>
      | undefined
    if (tsDaily && typeof tsDaily === "object") {
      const rows = Object.entries(tsDaily).map(([date, values]) => ({
        date,
        open: Number(values["1. open"] ?? NaN),
        high: Number(values["2. high"] ?? NaN),
        low: Number(values["3. low"] ?? NaN),
        close: Number(values["4. close"] ?? NaN),
        volume: Number(values["5. volume"] ?? NaN),
      }))
      rows.sort((a, b) => String(a.date).localeCompare(String(b.date)))
      return rows
    }
    const arrPath = widget.fieldPaths.find((p) => Array.isArray(getByPath(input, p)))
    const series = (arrPath ? getByPath(input, arrPath) : Array.isArray(input) ? input : []) as Record<string, unknown>[]
    return series
  }

  const series = normalizeSeries(data)

  // Auto-detect keys based on data structure
  const isAlphaVantageDaily = Boolean((data as Record<string, unknown>)?.["Time Series (Daily)"])
  const xKey = isAlphaVantageDaily ? "date" : (widget.options?.xKey || "date")
  const oKey = isAlphaVantageDaily ? "open" : (widget.options?.oKey || "open")
  const hKey = isAlphaVantageDaily ? "high" : (widget.options?.hKey || "high")
  const lKey = isAlphaVantageDaily ? "low" : (widget.options?.lKey || "low")
  const cKey = isAlphaVantageDaily ? "close" : (widget.options?.cKey || "close")

  const transformedData = series.map((item) => ({
    [xKey]: item?.[xKey] as unknown as string,
    open: Number(item?.[oKey] ?? NaN),
    high: Number(item?.[hKey] ?? NaN),
    low: Number(item?.[lKey] ?? NaN),
    close: Number(item?.[cKey] ?? NaN),
  }))

  return (
    <section role="region" aria-label={`${widget.title} candlestick chart`} className="space-y-2">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={transformedData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="high" fill="var(--chart-1)" />
            <Bar dataKey="low" fill="var(--chart-2)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">Last updated: {lastUpdated || "—"}</p>
    </section>
  )
}
