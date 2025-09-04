"use client"

import useSWR from "swr"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area } from "recharts"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import type { WidgetConfig } from "@/types/widget-config"
import { useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

export function LineChartWidget({ widget }: { widget: WidgetConfig }) {
  const isMobile = useIsMobile()
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

  // Clean and constrain dataset for better readability and performance
  const cleanSeries = (Array.isArray(series) ? series : [])
    .filter((row) => Number.isFinite(Number((row as any)?.[yKey])))
    .slice(-100)

  // Formatters
  const formatNumber = (n: number): string =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, notation: "compact" }).format(n)
  const formatDate = (s: string): string => {
    // Try to format ISO-like dates; fallback to raw label
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: undefined })
    }
    return s
  }

  // Show error if no data points
  if (cleanSeries.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">No data points found in response.</p>
      </div>
    )
  }

  return (
    <section role="region" aria-label={`${widget.title} chart`} className="space-y-2">
      <div className="h-[340px]" style={{ height: isMobile ? 260 : 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cleanSeries} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tickFormatter={formatDate} minTickGap={isMobile ? 36 : 24} />
            <YAxis tickFormatter={(v) => formatNumber(Number(v))} width={isMobile ? 44 : 54} />
            <Tooltip 
              formatter={(value: unknown) => formatNumber(Number(value))}
              labelFormatter={(label: unknown) => typeof label === 'string' ? formatDate(label) : String(label)}
            />
            <Area 
              isAnimationActive
              type="monotone"
              dataKey={yKey}
              stroke="none"
              fill="url(#areaGradient)"
              fillOpacity={1}
              dot={false}
              activeDot={false}
            />
            <Line 
              isAnimationActive
              animationDuration={600}
              type="monotone" 
              dataKey={yKey} 
              stroke="url(#lineGradient)" 
              strokeWidth={isMobile ? 2 : 3}
              dot={isMobile ? false : { fill: "var(--chart-1)", strokeWidth: 2, r: 4 }}
              activeDot={isMobile ? { r: 4, fill: "var(--chart-1)" } : { r: 6, fill: "var(--chart-1)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">Last updated: {lastUpdated || "—"}</p>
    </section>
  )
}
