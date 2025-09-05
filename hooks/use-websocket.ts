"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface WebSocketMessage {
  type: "trade" | "ping" | "error"
  data?: Array<{
    p: number // price
    s: string // symbol
    t: number // timestamp
    v: number // volume
    c?: string[] // conditions
  }>
}

export interface WebSocketSubscription {
  symbol: string
  callback: (data: WebSocketMessage) => void
}

export interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  subscriptions: Map<string, WebSocketSubscription>
}

const WEBSOCKET_URL = "wss://ws.finnhub.io"
const RECONNECT_DELAY = 3000
const MAX_RECONNECT_ATTEMPTS = 5

// Comprehensive token validation function
const isValidToken = (token: string): boolean => {
  if (!token) return false
  if (token === "demo") return false
  if (token.length < 10) return false
  
  // Check for common invalid patterns
  if (token.includes("demo")) return false
  if (token.includes("your_") || token.includes("replace")) return false
  if (token.includes("api_key") || token.includes("apikey")) return false
  
  // Check for duplicated patterns (like the malformed token we're seeing)
  const halfLength = Math.floor(token.length / 2)
  const firstHalf = token.substring(0, halfLength)
  const secondHalf = token.substring(halfLength, halfLength * 2)
  if (firstHalf === secondHalf && token.length > 20) {
    console.warn("Detected duplicated token pattern:", token.substring(0, 20) + "...")
    return false
  }
  
  // Check for repeated character patterns
  const uniqueChars = new Set(token).size
  if (uniqueChars < 5 && token.length > 15) return false
  
  return true
}

export function useWebSocket(apiKey?: string) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    subscriptions: new Map()
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const subscriptionsRef = useRef<Map<string, WebSocketSubscription>>(new Map())

  const connect = useCallback(() => {
    console.log("Connect function called")
    
    // Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    
    // Clean up any existing connection first
    if (wsRef.current) {
      console.log("Cleaning up existing WebSocket connection")
      wsRef.current.close(1000, "Reconnecting")
      wsRef.current = null
    }

    const token = apiKey || process.env.NEXT_PUBLIC_FINNHUB_TOKEN
    const cleanToken = token?.trim() || ""
    console.log("DEBUG: Raw token from apiKey:", apiKey)
    console.log("DEBUG: Raw token from env:", process.env.NEXT_PUBLIC_FINNHUB_TOKEN)
    console.log("DEBUG: Final cleanToken:", cleanToken)
    console.log("DEBUG: Token length:", cleanToken.length)
    console.log("DEBUG: Token validation result:", isValidToken(cleanToken))
    
    // Use comprehensive token validation
    if (!isValidToken(cleanToken)) {
      console.log("Invalid token detected, skipping connection")
      console.log("Token details:", {
        length: cleanToken.length,
        startsWith: cleanToken.substring(0, 10),
        endsWith: cleanToken.substring(cleanToken.length - 10),
        isDemo: cleanToken === "demo",
        containsDemo: cleanToken.includes("demo")
      })
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: "Invalid API key. Please provide a valid Finnhub API key. Get one free at finnhub.io/register"
      }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const wsUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(cleanToken)}`
      console.log("Creating WebSocket connection to:", wsUrl.substring(0, wsUrl.indexOf('token=') + 20) + "...")
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log("WebSocket connected")
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false, 
          error: null 
        }))
        reconnectAttemptsRef.current = 0

        // Re-subscribe to all active subscriptions
        subscriptionsRef.current.forEach((_, symbol) => {
          ws.send(JSON.stringify({ type: "subscribe", symbol }))
        })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("WebSocket message received:", message)
          
          if (message.type === "trade" && message.data) {
            console.log("Processing trade data:", message.data)
            message.data.forEach(trade => {
              console.log("Trade for symbol:", trade.s, "Price:", trade.p)
              const subscription = subscriptionsRef.current.get(trade.s)
              if (subscription) {
                console.log("Found subscription for:", trade.s)
                subscription.callback(message)
              } else {
                console.log("No subscription for:", trade.s, "Active subscriptions:", Array.from(subscriptionsRef.current.keys()))
              }
            })
          } else if (message.type === "ping") {
            console.log("Received ping, sending pong")
            // Respond to ping with pong
            ws.send(JSON.stringify({ type: "pong" }))
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason)
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false 
        }))

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_DELAY)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error event:", error)
        console.error("Error type:", typeof error)
        console.error("Error properties:", Object.keys(error))
        console.error("Error target:", error.target)
        console.error("Error readyState:", (error.target as WebSocket)?.readyState)
        
        let errorMessage = "WebSocket connection failed"
        
        // Check if it's an authentication error
        if (!cleanToken || cleanToken === "demo" || cleanToken.length < 10) {
          errorMessage = "Invalid API key. Please provide a valid Finnhub API key."
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = `WebSocket error: ${error.message}`
        }
        
        console.error("Setting error message:", errorMessage)
        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isConnecting: false 
        }))
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Failed to create WebSocket:", error)
      let errorMessage = "Failed to create WebSocket connection"
      
      if (!token || token === "demo" || token.length < 10) {
        errorMessage = "Invalid API key. Please provide a valid Finnhub API key."
      } else if (error instanceof Error) {
        errorMessage = `Failed to create WebSocket: ${error.message}`
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isConnecting: false 
      }))
    }
  }, [apiKey])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected")
      wsRef.current = null
    }

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isConnecting: false,
      error: null 
    }))
  }, [])

  const subscribe = useCallback((symbol: string, callback: (data: WebSocketMessage) => void) => {
    console.log("Subscribing to symbol:", symbol)
    subscriptionsRef.current.set(symbol, { symbol, callback })
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = { type: "subscribe", symbol }
      console.log("Sending subscribe message:", message)
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.log("WebSocket not open, subscription queued. ReadyState:", wsRef.current?.readyState)
    }

    setState(prev => ({
      ...prev,
      subscriptions: new Map(subscriptionsRef.current)
    }))
  }, [])

  const unsubscribe = useCallback((symbol: string) => {
    subscriptionsRef.current.delete(symbol)
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", symbol }))
    }

    setState(prev => ({
      ...prev,
      subscriptions: new Map(subscriptionsRef.current)
    }))
  }, [])

  // Auto-connect on mount (only if we have a valid API key)
  useEffect(() => {
    const token = apiKey || process.env.NEXT_PUBLIC_FINNHUB_TOKEN
    const cleanToken = token?.trim() || ""
    
    // Only attempt connection if we have a valid token
    if (isValidToken(cleanToken)) {
      connect()
    } else {
      // Set error state if no valid token is available
      setState(prev => ({
        ...prev,
        error: "No valid API key provided. Please add a Finnhub API key in widget settings or set NEXT_PUBLIC_FINNHUB_TOKEN environment variable.",
        isConnecting: false,
        isConnected: false
      }))
    }
    
    return () => {
      disconnect()
    }
  }, [apiKey, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    subscribe,
    unsubscribe
  }
}
