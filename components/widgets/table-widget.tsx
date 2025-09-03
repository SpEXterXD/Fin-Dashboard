"use client"

import useSWR from "swr"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchViaProxy } from "@/lib/fetcher"
import { getByPath } from "@/lib/json-utils"
import { formatValue } from "@/lib/format"
import type { WidgetConfig } from "@/types/widget-config"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { ArrowUpDown } from "lucide-react"
import { swrConfigs } from "@/lib/swr"

const PAGE_SIZE = 8 // Reduced to show more rows in view
const MIN_ROW_HEIGHT = 44 // Slightly reduced row height
const HEADER_HEIGHT = 52 // Reduced header height
const PADDING_HEIGHT = 24 // Reduced padding

export function TableWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading, mutate } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { ...swrConfigs.widget, refreshInterval: widget.refreshInterval },
  )

  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const [sortPath, setSortPath] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    if (data) setLastUpdated(new Date().toLocaleTimeString())
  }, [data])

  const arrPath = useMemo(() => (data ? widget.fieldPaths.find((p) => Array.isArray(getByPath(data, p))) : undefined), [data, widget.fieldPaths])
  const fieldPaths = useMemo(() => widget.fieldPaths.filter((p) => p !== arrPath), [widget.fieldPaths, arrPath])

  // Normalize selected field paths to be relative to the array path so that
  // users can select either "result.description" or just "description".
  const rowFieldPaths = useMemo(() => {
    if (!arrPath) return fieldPaths
    const prefix = `${arrPath}.`
    return fieldPaths.map((p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p))
  }, [fieldPaths, arrPath])

  const dataArray = useMemo(() => {
    const base = data ? (arrPath ? getByPath(data, arrPath) : Array.isArray(data) ? data : []) : []
    return (base ?? []) as Record<string, unknown>[]
  }, [data, arrPath])

  const columns = useMemo(() => rowFieldPaths.map((path) => path.split(".").pop() || path), [rowFieldPaths])

  const filtered = useMemo(() => {
    if (!q) return dataArray
    const ql = q.toLowerCase()
    return dataArray.filter((row) => rowFieldPaths.some((p) => String(getByPath(row, p) ?? "").toLowerCase().includes(ql)))
  }, [dataArray, rowFieldPaths, q])

  const sorted = useMemo(() => {
    if (!sortPath) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      const av = getByPath(a, sortPath)
      const bv = getByPath(b, sortPath)
      const an = Number(av)
      const bn = Number(bv)
      const isNum = Number.isFinite(an) && Number.isFinite(bn)
      const cmp = isNum ? an - bn : String(av ?? "").localeCompare(String(bv ?? ""))
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [filtered, sortPath, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = useMemo(() => sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE), [sorted, safePage])

  // Calculate dynamic table height based on content
  const tableHeight = useMemo(() => {
    if (paged.length === 0) return 180 // Empty state height
    const rowsHeight = paged.length * MIN_ROW_HEIGHT
    const totalHeight = HEADER_HEIGHT + rowsHeight + PADDING_HEIGHT
    return Math.min(Math.max(totalHeight, 180), 500) // Min 180px, Max 500px
  }, [paged.length])

  function toggleSort(path: string) {
    if (sortPath !== path) {
      setSortPath(path)
      setSortDir("asc")
      setPage(0)
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    }
  }

  function ariaSortFor(path: string): "none" | "ascending" | "descending" {
    if (sortPath !== path) return "none"
    return sortDir === "asc" ? "ascending" : "descending"
  }

  return (
    <section role="region" aria-label={`${widget.title} table`} className="flex flex-col space-y-4">
      {isLoading ? (
        <div role="status" aria-live="polite" className="h-[400px] animate-pulse rounded-lg bg-muted/50" />
      ) : error ? (
        <div className="space-y-3 p-6 rounded-lg border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Failed to load table data</p>
          <button 
            className="text-xs text-destructive hover:text-destructive/80 underline transition-colors" 
            onClick={() => mutate()}
          >
            Retry
          </button>
        </div>
      ) : dataArray.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted/50 p-6 mb-4">
            <svg className="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="Search data..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
                className="pl-10 max-w-sm bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {sorted.length} of {dataArray.length} items
              </span>
              {q && (
                <span className="text-primary font-medium">
                  {sorted.length} results
                </span>
              )}
            </div>
          </div>

          <div 
            className="rounded-lg border border-border/50 overflow-hidden bg-card/30 shadow-sm transition-all duration-300 w-full widget-table-container"
            style={{ height: `${tableHeight}px` }}
          >
            <div className="h-full overflow-auto">
              <Table className="w-full table-fixed">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-border/50 bg-muted/50 hover:bg-muted/60">
                    {rowFieldPaths.map((path, i) => (
                      <TableHead 
                        key={path} 
                        aria-sort={ariaSortFor(path)} 
                        className="font-semibold text-foreground py-3 px-4 whitespace-nowrap"
                        style={{ width: `${100 / rowFieldPaths.length}%` }}
                      >
                        <button
                          className="inline-flex items-center gap-2 hover:text-primary transition-colors group"
                          onClick={() => toggleSort(path)}
                          aria-label={`Sort by ${columns[i]}`}
                        >
                          <span className="capitalize">{columns[i]}</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={rowFieldPaths.length} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm text-muted-foreground">No results found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className="border-border/30 hover:bg-muted/20 transition-colors group"
                      >
                        {rowFieldPaths.map((path) => {
                          const value = getByPath(row, path)
                          return (
                            <TableCell 
                              key={path} 
                              className="text-sm font-medium py-3 px-4 whitespace-nowrap"
                              style={{ width: `${100 / rowFieldPaths.length}%` }}
                            >
                              <span className="text-foreground group-hover:text-foreground/90">
                                {formatValue(value, widget.options?.format)}
                              </span>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last updated: {lastUpdated || "—"}</span>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-muted/50"
                  disabled={safePage === 0}
                  aria-disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, Math.min(totalPages - 5, safePage - 2)) + i
                    if (pageNum >= totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          pageNum === safePage
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-muted/50"
                  disabled={safePage + 1 >= totalPages}
                  aria-disabled={safePage + 1 >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Next
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
