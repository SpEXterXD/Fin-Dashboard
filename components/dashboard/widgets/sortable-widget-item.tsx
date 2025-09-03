"use client"

import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { WidgetCard } from "../widget/card"
import { WidgetRenderer } from "../widget/renderer"
import { useDashboard } from "@/hooks/use-dashboard-store"
import type { WidgetConfig } from "@/types/widget-config"
import { useState } from "react"
import { EditWidgetDialog } from "../edit-widget-dialog"
import { WidgetErrorBoundary } from "../widget/error-boundary"

export function SortableWidgetItem({ id, widget }: { id: string; widget: WidgetConfig }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const { removeWidget, updateWidget } = useDashboard()
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [open, setOpen] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className="min-h-[220px]">
      <WidgetCard
        title={widget.title}
        onRemove={() => removeWidget(widget.id)}
        onEdit={() => setOpen(true)}
        dragHandleProps={{ ...attributes, ...listeners }}
        meta={widget.type.toUpperCase()}
      >
        <WidgetErrorBoundary>
          <WidgetRenderer widget={widget} />
        </WidgetErrorBoundary>
      </WidgetCard>
      <EditWidgetDialog
        open={open}
        onOpenChange={setOpen}
        widget={widget}
        onSave={(changes) => updateWidget(widget.id, changes)}
      />
    </div>
  )
}
