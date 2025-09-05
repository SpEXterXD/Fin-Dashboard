"use client"

import { useEffect } from 'react'

export default function ResetWebSocketPage() {
  useEffect(() => {
    // Force clear any existing WebSocket connections
    console.log("Resetting WebSocket connections...")
    
    // Clear any existing WebSocket references
    if (typeof window !== 'undefined') {
      // Clear any global WebSocket references
      const originalWebSocket = window.WebSocket
      
      // Override WebSocket temporarily to log all connections
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          console.log("New WebSocket connection attempted:", url)
          super(url, protocols)
        }
      }
      
      // Restore original WebSocket after a delay
      setTimeout(() => {
        window.WebSocket = originalWebSocket
        console.log("WebSocket override removed")
      }, 5000)
    }
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Reset Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-semibold text-blue-800">WebSocket Reset Active</h2>
          <p className="text-blue-700 mt-2">
            This page will log all WebSocket connection attempts for the next 5 seconds.
            Check your browser console to see what's happening.
          </p>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">Next Steps:</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
            <li>Open your browser console (F12)</li>
            <li>Navigate back to your main dashboard</li>
            <li>Watch for WebSocket connection logs</li>
            <li>Look for the malformed token in the logs</li>
          </ol>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800">To Fix the Issue:</h3>
          <ol className="list-decimal list-inside text-green-700 mt-2 space-y-1">
            <li>Get a real API key from <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="underline">finnhub.io/register</a></li>
            <li>Create a <code>.env.local</code> file in your project root</li>
            <li>Add: <code>NEXT_PUBLIC_FINNHUB_TOKEN=your_real_api_key</code></li>
            <li>Restart your development server</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
