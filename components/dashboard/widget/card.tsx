"use client"

import type { ReactNode } from "react"
import { X, GripVertical, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 border border-border/60 bg-card/40 backdrop-blur-md hover:bg-card/60 relative shadow-sm hover:shadow-md">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 border-b border-border/40 bg-gradient-to-r from-card/80 to-card/60 p-5">
        <div className="flex items-center gap-3">
          <button
            aria-label="Drag widget"
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-bold text-balance truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {title}
              </CardTitle>
              {meta ? (
                <Badge 
                  variant="outline" 
                  className="px-3 py-1 text-xs font-semibold border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  {meta}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={onEdit} 
                  aria-label="Edit widget"
                  className="h-9 w-9 hover:bg-primary/15 hover:text-primary transition-all duration-200 hover:scale-105"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configure</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={onRemove} 
                  aria-label="Remove widget"
                  className="h-9 w-9 hover:bg-destructive/15 hover:text-destructive transition-all duration-200 hover:scale-105"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="relative p-6">{children}</CardContent>
    </Card>
  )
}
