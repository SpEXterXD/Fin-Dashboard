"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Wifi, WifiOff, AlertTriangle, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { formatValue } from "@/lib/format"
import { useRealtimeData, type RealtimeData } from "@/hooks/use-realtime-data"
import type { WidgetConfig } from "@/types/widget-config"

export function RealtimeCardWidget({ widget }: { widget: WidgetConfig }) {
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)

  console.log("RealtimeCardWidget render:", {
    widgetId: widget.id,
    symbol: widget.realtime?.symbol,
    enabled: widget.realtime?.enabled,
    hasApiKey: !!widget.realtime?.apiKey
  })

  const { lastUpdate, isSubscribed, isConnected } = useRealtimeData({
    symbol: widget.realtime?.symbol || "",
    enabled: widget.realtime?.enabled || false,
    apiKey: widget.realtime?.apiKey,
    onUpdate: (data) => {
      console.log("RealtimeCardWidget received data update:", data)
      setPreviousPrice(realtimeData?.price || null)
      setRealtimeData(data)
    }
  })

  // Use the data from the hook as the primary source
  const displayData = realtimeData || lastUpdate
  
  console.log("RealtimeCardWidget state:", {
    isConnected,
    isSubscribed,
    hasDisplayData: !!displayData,
    displayData
  })

  const formatPrice = (price: number) => {
    return formatValue(price, widget.options?.format || "currency")
  }

  const formatVolume = (volume: number) => {
    return formatValue(volume, "number")
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getPriceChangeIndicator = () => {
    if (!displayData || !previousPrice) return null
    
    const change = displayData.price - previousPrice
    if (change === 0) return null
    
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  if (!widget.realtime?.enabled) {
    return (
      <div className="space-y-3 p-4 rounded-lg border border-muted/30 bg-muted/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Real-time mode not enabled</p>
        </div>
        <p className="text-xs text-muted-foreground/70">
          Enable real-time updates in widget settings
        </p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">WebSocket not connected</span>
        </div>
        <p className="text-xs text-destructive/70">
          {widget.realtime?.apiKey ? "Attempting to reconnect..." : "API key required for real-time data"}
        </p>
        <div className="flex items-center gap-2 text-xs text-destructive/60">
          <Clock className="h-3 w-3" />
          <span>Check your API key and network connection</span>
        </div>
      </div>
    )
  }

  if (!displayData) {
    return (
      <div className="space-y-3 p-4 rounded-lg border border-muted/30 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Connecting...</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {widget.realtime.symbol}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        <div className="text-xs text-muted-foreground/70">
          {isSubscribed ? "Waiting for data..." : "Not subscribed"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Wifi className={`h-4 w-4 ${isSubscribed ? 'text-green-500' : 'text-muted-foreground'}`} />
            {isSubscribed && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {isSubscribed ? 'Live' : 'Connecting...'}
          </span>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {widget.realtime.symbol}
        </Badge>
      </div>

      {/* Price Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">
            {formatPrice(displayData.price)}
          </div>
          {getPriceChangeIndicator()}
        </div>
        
        {displayData.volume > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Volume:</span>
            <span className="text-sm font-medium text-foreground">
              {formatVolume(displayData.volume)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span>Last update:</span>
          <span className="font-mono">{formatTime(displayData.timestamp)}</span>
        </div>
      </div>

      {/* Trade Conditions */}
      {displayData.conditions && displayData.conditions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground/70">Trade conditions:</p>
          <div className="flex flex-wrap gap-1">
            {displayData.conditions.map((condition: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {condition}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span>Connection:</span>
          <span className="font-mono">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  )
}
