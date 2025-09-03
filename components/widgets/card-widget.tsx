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
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
      {widget.fieldPaths?.slice(0, 8).map((p, index) => {
        const v = getByPath(data, p)
        return (
          <div 
            key={p} 
            className="group relative rounded-lg border border-border/60 bg-gradient-to-br from-card/50 to-card/30 p-4 transition-all duration-200 hover:bg-gradient-to-br hover:from-card/70 hover:to-card/50 hover:border-primary/50 hover:shadow-md shadow-sm"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground/70 truncate mb-2 uppercase tracking-wide" title={p}>
                {p.split('.').pop() || p}
              </p>
              <p className="text-lg font-semibold break-words whitespace-pre-wrap leading-tight text-foreground group-hover:text-foreground/90 transition-colors">
                {formatValue(v, widget.options?.format)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
