"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const { data, error, isValidating, mutate } = useSWR(url ? ["test", url] : null, async () => fetchViaProxy(url), {
    revalidateOnFocus: false,
  })

  const paths = useMemo(() => (data ? flattenJsonPaths(data) : []), [data])
  const filtered = useMemo(() => (query ? matchPaths(paths, query) : paths), [paths, query])

  const togglePath = (p: string) => setSelected((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]))

  const canSubmit = useMemo(() => {
    if (!url || error) return false
    if (display !== "chart") return true
    if (chartKind === "line") return Boolean(xKey && yKey)
    return Boolean(xKey && oKey && hKey && lKey && cKey)
  }, [url, error, display, chartKind, xKey, yKey, oKey, hKey, lKey, cKey])

  function handleCreate() {
    const opts: WidgetConfig["options"] | undefined =
      display === "chart"
        ? chartKind === "line"
          ? { kind: "line", xKey, yKey }
          : { kind: "candlestick", xKey, oKey, hKey, lKey, cKey }
        : undefined

    const w: WidgetConfig = {
      id: crypto.randomUUID(),
      title: title || "Untitled Widget",
      type: display,
      endpoint: url,
      refreshInterval: Math.max(5, Number(refresh) || 30),
      fieldPaths: selected.slice(0, 20),
      options: opts,
    }
    onCreate(w)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Widget</DialogTitle>
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
              <Button type="button" onClick={mutate} variant="secondary">
                Test
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

          {data && (
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
