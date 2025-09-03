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
import { swrOptions } from "@/lib/swr"

const PAGE_SIZE = 10

export function TableWidget({ widget }: { widget: WidgetConfig }) {
  const { data, error, isLoading, mutate } = useSWR(
    widget.endpoint ? ["w", widget.endpoint] : null,
    async () => fetchViaProxy(widget.endpoint),
    { ...swrOptions, refreshInterval: widget.refreshInterval },
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

  const dataArray = useMemo(() => {
    const base = data ? (arrPath ? getByPath(data, arrPath) : Array.isArray(data) ? data : []) : []
    return (base ?? []) as Record<string, unknown>[]
  }, [data, arrPath])

  const columns = useMemo(() => fieldPaths.map((path) => path.split(".").pop() || path), [fieldPaths])

  const filtered = useMemo(() => {
    if (!q) return dataArray
    const ql = q.toLowerCase()
    return dataArray.filter((row) => fieldPaths.some((p) => String(getByPath(row, p) ?? "").toLowerCase().includes(ql)))
  }, [dataArray, fieldPaths, q])

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
    <section role="region" aria-label={`${widget.title} table`} className="space-y-3">
      {isLoading ? (
        <div role="status" aria-live="polite" className="h-[280px] animate-pulse rounded-md bg-muted" />
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">Failed to load table data.</p>
          <button className="text-xs underline" onClick={() => mutate()}>
            Retry
          </button>
        </div>
      ) : dataArray.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <Input
              placeholder="Search..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(0)
              }}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">{sorted.length} items</p>
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {fieldPaths.map((path, i) => (
                    <TableHead key={path} aria-sort={ariaSortFor(path)}>
                      <button
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => toggleSort(path)}
                        aria-label={`Sort by ${columns[i]}`}
                      >
                        {columns[i]}
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={fieldPaths.length}>
                      <p className="text-sm text-muted-foreground">No results.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row, index) => (
                    <TableRow key={index}>
                      {fieldPaths.map((path) => {
                        const value = getByPath(row, path)
                        return (
                          <TableCell key={path} className="text-xs">
                            {formatValue(value, widget.options?.format)}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              className="text-sm text-muted-foreground disabled:opacity-50"
              disabled={safePage === 0}
              aria-disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} / {totalPages}
            </span>
            <button
              className="text-sm text-muted-foreground disabled:opacity-50"
              disabled={safePage + 1 >= totalPages}
              aria-disabled={safePage + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
          </div>

          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated || "—"}</p>
        </>
      )}
    </section>
  )
}
