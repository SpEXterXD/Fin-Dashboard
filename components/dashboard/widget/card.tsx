"use client"

import type { ReactNode } from "react"
import { X, GripVertical, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function WidgetCard({
  title,
  meta,
  onRemove,
  onEdit,
  dragHandleProps,
  children,
}: {
  title: string
  meta?: string
  onRemove?: () => void
  onEdit?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <button aria-label="Drag widget" className="text-muted-foreground hover:text-foreground" {...dragHandleProps}>
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <CardTitle className="text-lg text-balance">{title}</CardTitle>
            {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit widget">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove widget">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
