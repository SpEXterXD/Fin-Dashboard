"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Download } from "lucide-react"
import { useDashboard } from "@/hooks/use-dashboard-store"

export function ImportExport() {
  const { widgets, replaceAll } = useDashboard()
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleExport() {
    const data = JSON.stringify({ widgets }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "finview-config.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (parsed?.widgets) replaceAll(parsed.widgets)
      } catch {}
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
      <Button variant="outline" className="gap-2 bg-transparent" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" /> Import
      </Button>
      <Button variant="secondary" className="gap-2" onClick={handleExport}>
        <Download className="h-4 w-4" /> Export
      </Button>
    </div>
  )
}
