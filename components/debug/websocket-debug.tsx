"use client"

import { useState } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WebSocketDebug() {
  const [apiKey, setApiKey] = useState("")
  const [testSymbol, setTestSymbol] = useState("AAPL")
  
  const { 
    isConnected, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    subscribe, 
    unsubscribe,
    subscriptions 
  } = useWebSocket(apiKey)

  const handleConnect = () => {
    if (apiKey.trim()) {
      connect()
    }
  }

  const handleSubscribe = () => {
    if (testSymbol.trim()) {
      subscribe(testSymbol, (data) => {
        console.log("Received data for", testSymbol, ":", data)
      })
    }
  }

  const handleUnsubscribe = () => {
    if (testSymbol.trim()) {
      unsubscribe(testSymbol)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>WebSocket Debug Tool</CardTitle>
        <CardDescription>
          Test your Finnhub WebSocket connection and real-time data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">Finnhub API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Finnhub API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isConnected ? "default" : isConnecting ? "secondary" : "destructive"}>
            {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
          </Badge>
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button onClick={handleConnect} disabled={!apiKey.trim() || isConnecting}>
            Connect
          </Button>
          <Button onClick={disconnect} variant="outline" disabled={!isConnected}>
            Disconnect
          </Button>
        </div>

        {/* Subscription Controls */}
        <div className="space-y-2">
          <Label htmlFor="test-symbol">Test Symbol</Label>
          <div className="flex gap-2">
            <Input
              id="test-symbol"
              placeholder="e.g., AAPL, MSFT, GOOGL"
              value={testSymbol}
              onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
            />
            <Button onClick={handleSubscribe} disabled={!isConnected || !testSymbol.trim()}>
              Subscribe
            </Button>
            <Button onClick={handleUnsubscribe} variant="outline" disabled={!isConnected || !testSymbol.trim()}>
              Unsubscribe
            </Button>
          </div>
        </div>

        {/* Active Subscriptions */}
        {subscriptions.size > 0 && (
          <div className="space-y-2">
            <Label>Active Subscriptions</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from(subscriptions.keys()).map((symbol) => (
                <Badge key={symbol} variant="outline">
                  {symbol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>1. Get a free API key from <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">finnhub.io/register</a></p>
          <p>2. Enter your API key (should be 20+ characters, not "demo" or duplicated patterns)</p>
          <p>3. Click Connect to establish WebSocket connection</p>
          <p>4. Enter a stock symbol and click Subscribe to receive real-time data</p>
          <p>5. Check browser console for incoming data messages</p>
        </div>
      </CardContent>
    </Card>
  )
}
