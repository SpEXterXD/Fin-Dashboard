"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import { formatValue } from "@/lib/format"
import type { WidgetConfig } from "@/types/widget-config"

export function CardWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { refreshInterval: widget.refreshInterval, revalidateOnFocus: false },
  )

  if (isLoading) return <Skeleton className="h-24 w-full" />
  if (error) return <p className="text-sm text-destructive">Failed to load data.</p>
  if (!data) return <p className="text-sm text-muted-foreground">No data.</p>

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {widget.fieldPaths?.slice(0, 6).map((p) => {
        const v = getByPath(data, p)
        return (
          <div key={p} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{p}</p>
            <p className="text-lg font-medium">{formatValue(v, widget.options?.format)}</p>
          </div>
        )
      })}
    </div>
  )
}
