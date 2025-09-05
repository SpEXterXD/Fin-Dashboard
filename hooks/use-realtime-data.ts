"use client"

import { useEffect, useState, useCallback } from "react"
import { useWebSocket, WebSocketMessage } from "./use-websocket"

export interface RealtimeData {
  symbol: string
  price: number
  volume: number
  timestamp: number
  conditions?: string[]
}

export interface RealtimeConfig {
  symbol: string
  enabled: boolean
  apiKey?: string
  onUpdate: (data: RealtimeData) => void
}

export function useRealtimeData(config: RealtimeConfig) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket(config.apiKey)
  const [lastUpdate, setLastUpdate] = useState<RealtimeData | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log("RealtimeData received message:", message, "Looking for symbol:", config.symbol)
    if (message.type === "trade" && message.data) {
      const trade = message.data.find(t => t.s === config.symbol)
      console.log("Found trade for symbol:", config.symbol, "Trade:", trade)
      if (trade) {
        const realtimeData: RealtimeData = {
          symbol: trade.s,
          price: trade.p,
          volume: trade.v,
          timestamp: trade.t,
          conditions: trade.c
        }
        
        console.log("Setting realtime data:", realtimeData)
        setLastUpdate(realtimeData)
        config.onUpdate(realtimeData)
      } else {
        console.log("No trade found for symbol:", config.symbol, "Available trades:", message.data.map(t => t.s))
      }
    }
  }, [config])

  useEffect(() => {
    console.log("RealtimeData effect triggered:", {
      enabled: config.enabled,
      symbol: config.symbol,
      isConnected,
      isSubscribed
    })
    
    if (!config.enabled || !isConnected) {
      if (isSubscribed) {
        console.log("Unsubscribing due to disabled or disconnected")
        unsubscribe(config.symbol)
        setIsSubscribed(false)
      }
      return
    }

    if (!isSubscribed) {
      console.log("Subscribing to symbol:", config.symbol)
      subscribe(config.symbol, handleMessage)
      setIsSubscribed(true)
    }

    return () => {
      if (isSubscribed) {
        console.log("Cleanup: unsubscribing from symbol:", config.symbol)
        unsubscribe(config.symbol)
        setIsSubscribed(false)
      }
    }
  }, [config.enabled, config.symbol, isConnected, isSubscribed, subscribe, unsubscribe, handleMessage])

  return {
    lastUpdate,
    isSubscribed,
    isConnected
  }
}
