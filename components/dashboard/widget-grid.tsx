"use client"

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDashboard } from "@/hooks/use-dashboard-store"
import { SortableWidgetItem } from "./widgets/sortable-widget-item"

export function WidgetGrid() {
  const { widgets, reorder } = useDashboard()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    reorder(arrayMove(widgets, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {widgets.map((w) => (
            <SortableWidgetItem key={w.id} id={w.id} widget={w} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
