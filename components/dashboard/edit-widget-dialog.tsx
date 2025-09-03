"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { WidgetConfig } from "@/types/widget-config"

export function EditWidgetDialog({
  open,
  onOpenChange,
  widget,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  widget: WidgetConfig
  onSave: (changes: Partial<WidgetConfig>) => void
}) {
  const [title, setTitle] = useState(widget.title)
  const [endpoint, setEndpoint] = useState(widget.endpoint)
  const [refresh, setRefresh] = useState<number>(widget.refreshInterval)

  useEffect(() => {
    setTitle(widget.title)
    setEndpoint(widget.endpoint)
    setRefresh(widget.refreshInterval)
  }, [widget])

  function handleSave() {
    onSave({ title: title || widget.title, endpoint, refreshInterval: Math.max(5, Number(refresh) || widget.refreshInterval) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="w-title">Title</Label>
            <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="w-endpoint">API Endpoint</Label>
            <Input id="w-endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="w-refresh">Refresh Interval (seconds)</Label>
            <Input id="w-refresh" inputMode="numeric" pattern="[0-9]*" value={String(refresh)} onChange={(e) => setRefresh(Number(e.target.value) || widget.refreshInterval)} />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
