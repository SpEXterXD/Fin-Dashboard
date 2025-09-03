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
        <details className="text-xs text-muted-foreground">
          <summary>Error details</summary>
          <p className="mt-1">{rateLimitError}</p>
        </details>
      </div>
    )
  }

  // Normalize Alpha Vantage TIME_SERIES_DAILY to an array of rows
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
      // Sort ascending by date for nicer charts
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
  const yKey = isAlphaVantageDaily ? "close" : (widget.options?.yKey || "close")

  // Debug logging
  console.log('Line chart data:', { 
    data, 
    series, 
    xKey, 
    yKey, 
    widget, 
    isAlphaVantageDaily,
    seriesLength: series.length,
    firstItem: series[0],
    hasTimeSeries: Boolean((data as Record<string, unknown>)?.["Time Series (Daily)"])
  })

  // Show error if no data points
  if (series.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">No data points found in response.</p>
        <details className="text-xs text-muted-foreground">
          <summary>Debug info</summary>
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify({ data, series, xKey, yKey, isAlphaVantageDaily }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <section role="region" aria-label={`${widget.title} chart`} className="space-y-2">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line 
              isAnimationActive 
              type="monotone" 
              dataKey={yKey} 
              stroke="var(--chart-1)" 
              strokeWidth={3}
              dot={{ fill: "var(--chart-1)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "var(--chart-1)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">Last updated: {lastUpdated || "—"}</p>
    </section>
  )
}
