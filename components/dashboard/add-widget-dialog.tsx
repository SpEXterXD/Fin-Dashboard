"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchViaProxy } from "@/lib/fetcher"
import { flattenJsonPaths, matchPaths } from "@/lib/json-utils"
import type { WidgetConfig, WidgetType } from "@/types/widget-config"

export function AddWidgetDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (w: WidgetConfig) => void
}) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [refresh, setRefresh] = useState(30)
  const [display, setDisplay] = useState<WidgetType>("card")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [chartKind, setChartKind] = useState<"line" | "candlestick">("line")
  const [xKey, setXKey] = useState("")
  const [yKey, setYKey] = useState("")
  const [oKey, setOKey] = useState("")
  const [hKey, setHKey] = useState("")
  const [lKey, setLKey] = useState("")
  const [cKey, setCKey] = useState("")
  const [realtimeSymbol, setRealtimeSymbol] = useState("")
  const [realtimeApiKey, setRealtimeApiKey] = useState("")

  const { data, error, isValidating, mutate } = useSWR(
    url ? ["test", url] : null, 
    async () => {
      try {
        return await fetchViaProxy(url)
      } catch (err) {
        console.error('Test fetch failed:', err)
        throw err
      }
    }, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000, // Prevent rapid refetches
      errorRetryCount: 1, // Limit retries for testing
      errorRetryInterval: 1000,
    }
  )

  const handleTest = useCallback(async () => {
    if (!url.trim()) {
      return
    }
    
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), 15000) // 15 second timeout
      })
      
      await Promise.race([
        mutate(),
        timeoutPromise
      ])
    } catch (err) {
      console.error('Test failed:', err)
      // The error will be handled by SWR and displayed in the UI
    }
  }, [url, mutate])

  const paths = useMemo(() => {
    if (!data) return []
    try {
      return flattenJsonPaths(data)
    } catch (err) {
      console.error('Error flattening JSON paths:', err)
      return []
    }
  }, [data])
  const filtered = useMemo(() => {
    try {
      return query ? matchPaths(paths, query) : paths
    } catch (err) {
      console.error('Error filtering paths:', err)
      return paths
    }
  }, [paths, query])

  const togglePath = (p: string) => setSelected((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]))

  const isAlphaVantageDaily = useMemo(() => Boolean((data as Record<string, unknown>)?.["Time Series (Daily)"]), [data])

  // Auto-fill sensible defaults for Alpha Vantage daily series
  useEffect(() => {
    if (!isAlphaVantageDaily || display !== "chart") return
    if (chartKind === "line") {
      if (!xKey) setXKey("date")
      if (!yKey) setYKey("close")
    } else {
      if (!xKey) setXKey("date")
      if (!oKey) setOKey("open")
      if (!hKey) setHKey("high")
      if (!lKey) setLKey("low")
      if (!cKey) setCKey("close")
    }
  }, [isAlphaVantageDaily, display, chartKind, xKey, yKey, oKey, hKey, lKey, cKey])

  const canSubmit = useMemo(() => {
    if (display === "realtime") {
      return Boolean(realtimeSymbol)
    }
    if (!url || error) return false
    if (display !== "chart") return true
    if (isAlphaVantageDaily) return true
    if (chartKind === "line") return Boolean(xKey && yKey)
    return Boolean(xKey && oKey && hKey && lKey && cKey)
  }, [url, error, display, chartKind, xKey, yKey, oKey, hKey, lKey, cKey, isAlphaVantageDaily, realtimeSymbol])

  function handleCreate() {
    const opts: WidgetConfig["options"] | undefined =
      display === "chart"
        ? chartKind === "line"
          ? { kind: "line", xKey, yKey }
          : { kind: "candlestick", xKey, oKey, hKey, lKey, cKey }
        : undefined

    const realtimeConfig = display === "realtime" && realtimeSymbol
      ? { 
          enabled: true, 
          symbol: realtimeSymbol,
          ...(realtimeApiKey ? { apiKey: realtimeApiKey } : {})
        }
      : undefined

    const w: WidgetConfig = {
      id: crypto.randomUUID(),
      title: title || "Untitled Widget",
      type: display,
      endpoint: display === "realtime" ? "" : url, // Empty endpoint for real-time widgets
      refreshInterval: Math.max(5, Number(refresh) || 30),
      fieldPaths: display === "realtime" ? [] : selected.slice(0, 20), // Empty field paths for real-time widgets
      realtime: realtimeConfig,
      options: opts,
    }
    onCreate(w)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Widget</DialogTitle>
          <DialogDescription>
            Create a new widget to display financial data from various APIs. Choose the widget type and configure the data source.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Basic */}
          <div className="grid gap-2">
            <Label htmlFor="w-name">Widget Name</Label>
            <Input
              id="w-name"
              placeholder="e.g., AAPL Price Tracker"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w-url">API URL</Label>
            <div className="flex gap-2">
              <Input
                id="w-url"
                placeholder="https://api.example.com/prices?symbol=AAPL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button type="button" onClick={handleTest} variant="secondary" disabled={!url.trim() || isValidating}>
                {isValidating ? "Testing..." : "Test"}
              </Button>
            </div>
            {isValidating ? (
              <p className="text-xs text-muted-foreground">Testing...</p>
            ) : error ? (
              <p className="text-xs text-destructive">Unable to connect. Check URL.</p>
            ) : data ? (
              <p className="text-xs text-green-600 dark:text-green-500">API Connection Successful</p>
            ) : (
              <p className="text-xs text-muted-foreground">Provide a URL and click Test.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="w-refresh">Refresh Interval (seconds)</Label>
              <Input
                id="w-refresh"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(refresh)}
                onChange={(e) => setRefresh(Number(e.target.value) || 30)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Display Mode</Label>
              <Tabs value={display} onValueChange={(v) => setDisplay(v as WidgetType)}>
                <TabsList>
                  <TabsTrigger value="card">Card</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="realtime">Real-time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {display === "chart" && (
            <div className="grid gap-3 rounded-md border p-3">
              <Label>Chart Style</Label>
              <Tabs value={chartKind} onValueChange={(v) => setChartKind(v as "line" | "candlestick")}>
                <TabsList>
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
                </TabsList>
                <TabsContent value="line" className="mt-3 grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label>X key (time)</Label>
                    <Input placeholder="e.g., date" value={xKey} onChange={(e) => setXKey(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Y key (value)</Label>
                    <Input placeholder="e.g., close" value={yKey} onChange={(e) => setYKey(e.target.value)} />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Tip: Select the array path and the value field in the list below.
                  </p>
                </TabsContent>
                <TabsContent value="candlestick" className="mt-3 grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label>X key (time)</Label>
                    <Input placeholder="e.g., date" value={xKey} onChange={(e) => setXKey(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Open key</Label>
                    <Input placeholder="open" value={oKey} onChange={(e) => setOKey(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>High key</Label>
                    <Input placeholder="high" value={hKey} onChange={(e) => setHKey(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Low key</Label>
                    <Input placeholder="low" value={lKey} onChange={(e) => setLKey(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Close key</Label>
                    <Input placeholder="close" value={cKey} onChange={(e) => setCKey(e.target.value)} />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Provide all OHLC keys for candlesticks. Keys must match the response fields.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {display === "realtime" && (
            <div className="grid gap-3 rounded-md border p-3">
              <Label>Real-time Configuration</Label>
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label>Symbol</Label>
                  <Input 
                    placeholder="e.g., AAPL, BINANCE:BTCUSDT, IC MARKETS:1" 
                    value={realtimeSymbol} 
                    onChange={(e) => setRealtimeSymbol(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the trading symbol. Examples: AAPL (US stocks), BINANCE:BTCUSDT (crypto), IC MARKETS:1 (forex)
                  </p>
                </div>
                <div className="grid gap-1">
                  <Label>API Key (Optional)</Label>
                  <Input 
                    placeholder="Your Finnhub API key" 
                    value={realtimeApiKey} 
                    onChange={(e) => setRealtimeApiKey(e.target.value)} 
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use environment variable NEXT_PUBLIC_FINNHUB_TOKEN
                  </p>
                </div>
              </div>
            </div>
          )}

          {!!data && (
            <div className="grid gap-2 rounded-md border p-3">
              <Label>Fields</Label>
              <Input placeholder="Search for fields..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-2">
                  <p className="mb-2 text-xs text-muted-foreground">Available Fields</p>
                  <div className="h-40 overflow-auto pr-1">
                    {filtered.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No fields.</p>
                    ) : (
                      filtered.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted"
                          onClick={() => togglePath(p)}
                          aria-pressed={selected.includes(p)}
                        >
                          {p}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <p className="mb-2 text-xs text-muted-foreground">Selected Fields</p>
                  <div className="h-40 overflow-auto pr-1">
                    {selected.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No fields selected.</p>
                    ) : (
                      selected.map((p) => (
                        <div key={p} className="flex items-center justify-between gap-2 rounded px-2 py-1">
                          <span className="truncate text-sm">{p}</span>
                          <Button variant="ghost" size="sm" onClick={() => togglePath(p)}>
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: For Table widgets, include one array path plus the nested field names you want as columns. For Card widgets, select individual scalar fields (e.g., exchange, isOpen).
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!canSubmit}>
              Add Widget
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
