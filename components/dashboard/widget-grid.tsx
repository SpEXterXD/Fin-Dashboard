"use client"

import { useMemo, useCallback } from "react"
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDashboard } from "@/hooks/use-dashboard-store"
import { SortableWidgetItem } from "./widgets/sortable-widget-item"

export function WidgetGrid() {
  const { widgets, reorder } = useDashboard()
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 4 } 
    })
  )

  // Memoize the drag end handler to prevent unnecessary re-renders
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    
    if (oldIndex < 0 || newIndex < 0) return
    
    try {
      const newOrder = arrayMove(widgets, oldIndex, newIndex)
      reorder(newOrder)
    } catch (error) {
      console.error('Failed to reorder widgets:', error)
    }
  }, [widgets, reorder])

  // Memoize the grid items to prevent unnecessary re-renders
  const gridItems = useMemo(() => {
    return widgets.map((widget, index) => {
      const isTableWidget = widget.type === 'table'
      
      return (
        <div
          key={widget.id}
          className={`animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ${
            isTableWidget ? 'lg:col-span-2 xl:col-span-3' : ''
          }`}
          style={{ 
            animationDelay: `${Math.min(index * 100, 1000)}ms` // Cap animation delay
          }}
          data-widget-id={widget.id}
          data-widget-type={widget.type}
        >
          <SortableWidgetItem id={widget.id} widget={widget} />
        </div>
      )
    })
  }, [widgets])

  // Early return if no widgets
  if (widgets.length === 0) {
    return null
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `Picked up widget ${active.id}`
          },
          onDragOver({ active, over }) {
            if (over) {
              return `Widget ${active.id} is over ${over.id}`
            }
            return `Widget ${active.id} is no longer over a droppable area`
          },
          onDragEnd({ active, over }) {
            if (over) {
              return `Widget ${active.id} was dropped over ${over.id}`
            }
            return `Widget ${active.id} was dropped`
          },
          onDragCancel({ active }) {
            return `Dragging was cancelled. Widget ${active.id} was dropped.`
          }
        }
      }}
    >
      <SortableContext 
        items={widgets.map(w => w.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div 
          className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 auto-rows-max"
          role="region"
          aria-label="Dashboard widgets"
          aria-live="polite"
          aria-atomic="false"
        >
          {gridItems}
        </div>
      </SortableContext>
    </DndContext>
  )
}
