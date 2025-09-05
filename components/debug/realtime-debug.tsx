"use client"

import { useState } from "react"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RealtimeDebug() {
  const [symbol, setSymbol] = useState("AAPL")
  const [apiKey, setApiKey] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [lastData, setLastData] = useState<any>(null)

  const { lastUpdate, isSubscribed, isConnected } = useRealtimeData({
    symbol,
    enabled,
    apiKey: apiKey || undefined,
    onUpdate: (data) => {
      console.log("Debug component received data:", data)
      setLastData(data)
    }
  })

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Realtime Data Debug</CardTitle>
        <CardDescription>
          Test realtime data flow with detailed logging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="debug-symbol">Symbol</Label>
            <Input
              id="debug-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, MSFT"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debug-api-key">API Key (Optional)</Label>
            <Input
              id="debug-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty to use env var"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Connection:</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Subscription:</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Subscribed" : "Not Subscribed"}
            </Badge>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-2">
          <Button 
            onClick={() => setEnabled(!enabled)}
            variant={enabled ? "destructive" : "default"}
          >
            {enabled ? "Disable" : "Enable"} Realtime
          </Button>
        </div>

        {/* Data Display */}
        {lastData && (
          <div className="space-y-2">
            <Label>Latest Data:</Label>
            <div className="p-3 rounded-md bg-muted/50 border">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(lastData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {lastUpdate && !lastData && (
          <div className="space-y-2">
            <Label>Hook Data (no callback):</Label>
            <div className="p-3 rounded-md bg-muted/50 border">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(lastUpdate, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>1. Enter a stock symbol (e.g., AAPL, MSFT, GOOGL)</p>
          <p>2. Optionally enter an API key (or use NEXT_PUBLIC_FINNHUB_TOKEN)</p>
          <p>3. Click "Enable Realtime" to start receiving data</p>
          <p>4. Check browser console for detailed logs</p>
          <p>5. Data should appear below when trades are received</p>
        </div>
      </CardContent>
    </Card>
  )
}
