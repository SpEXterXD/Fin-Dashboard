"use client"

import { RealtimeDebug } from "@/components/debug/realtime-debug"
import { WebSocketDebug } from "@/components/debug/websocket-debug"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Realtime Widget Debug</h1>
        <p className="text-muted-foreground">
          Use these tools to debug your realtime widget issues
        </p>
      </div>
      
      <div className="grid gap-6">
        <WebSocketDebug />
        <RealtimeDebug />
      </div>
    </div>
  )
}
