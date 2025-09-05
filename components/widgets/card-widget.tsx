"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import { formatValue } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle } from "lucide-react"
import type { WidgetConfig } from "@/types/widget-config"

export function CardWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading, mutate } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { refreshInterval: widget.refreshInterval, revalidateOnFocus: false },
  )

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">Failed to load data</p>
        </div>
        <button 
          className="inline-flex items-center gap-2 px-2 py-1 text-xs text-destructive hover:text-destructive/80 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors" 
          onClick={() => mutate()}
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-muted/30 p-4 mb-3 border border-border/30">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground font-medium">No data available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Check your API endpoint and field selection</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        {widget.fieldPaths?.slice(0, 8).map((p, index) => {
          const v = getByPath(data, p)
          const displayValue = formatValue(v, widget.options?.format)
          const fieldName = p.split('.').pop() || p
          const isNumeric = typeof v === 'number' && !isNaN(v)
          const isBoolean = typeof v === 'boolean'
          const isString = typeof v === 'string'
          
          return (
            <Tooltip key={p}>
              <TooltipTrigger asChild>
                <div 
                  className="group relative rounded-lg border border-border/60 bg-gradient-to-br from-card/50 to-card/30 p-4 transition-all duration-200 hover:bg-gradient-to-br hover:from-card/70 hover:to-card/50 hover:border-primary/50 hover:shadow-md shadow-sm backdrop-blur-sm"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground/70 truncate uppercase tracking-wide" title={p}>
                        {fieldName}
                      </p>
                      {isBoolean && (
                        <Badge 
                          variant={v ? "default" : "secondary"} 
                          className="text-xs px-1.5 py-0.5"
                        >
                          {v ? "Yes" : "No"}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-lg font-semibold break-words whitespace-pre-wrap leading-tight text-foreground group-hover:text-foreground/90 transition-colors">
                        {displayValue}
                      </p>
                      
                      {/* Additional context for specific fields */}
                      {fieldName.toLowerCase() === 't' && isNumeric && (
                        <p className="text-xs text-muted-foreground/60">
                          Timestamp
                        </p>
                      )}
                      
                      {fieldName.toLowerCase() === 'isopen' && isNumeric && (
                        <p className="text-xs text-muted-foreground/60">
                          {v === 1 ? 'Market Open' : 'Market Closed'}
                        </p>
                      )}
                      
                      {fieldName.toLowerCase() === 'session' && isString && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0.5 mt-1"
                        >
                          {v}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/0 group-hover:border-primary/20 transition-colors pointer-events-none" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Field: {fieldName}</p>
                  <p className="text-sm text-muted-foreground">Path: {p}</p>
                  <p className="text-sm text-muted-foreground">Type: {typeof v}</p>
                  {isNumeric && (
                    <p className="text-sm text-muted-foreground">Raw: {v}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
