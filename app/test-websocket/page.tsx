"use client"

import { useState } from 'react'

export default function TestWebSocketPage() {
  const [token, setToken] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testToken = () => {
    addLog(`Testing token: ${token ? `${token.substring(0, 8)}...` : 'empty'}`)
    
    // Test the same validation logic
    const isValidToken = (token: string): boolean => {
      if (!token) return false
      if (token === "demo") return false
      if (token.length < 10) return false
      
      // Check for common invalid patterns
      if (token.includes("demo")) return false
      if (token.includes("your_") || token.includes("replace")) return false
      if (token.includes("api_key") || token.includes("apikey")) return false
      
      // Check for duplicated patterns
      const halfLength = Math.floor(token.length / 2)
      const firstHalf = token.substring(0, halfLength)
      const secondHalf = token.substring(halfLength, halfLength * 2)
      if (firstHalf === secondHalf && token.length > 20) {
        addLog(`Detected duplicated token pattern: ${token.substring(0, 20)}...`)
        return false
      }
      
      // Check for repeated character patterns
      const uniqueChars = new Set(token).size
      if (uniqueChars < 5 && token.length > 15) return false
      
      return true
    }

    const result = isValidToken(token)
    addLog(`Token validation result: ${result ? 'VALID' : 'INVALID'}`)
    
    if (!result) {
      addLog(`Token details: length=${token.length}, startsWith=${token.substring(0, 10)}`)
    }
  }

  const testWebSocket = () => {
    if (!token) {
      addLog('No token provided')
      return
    }

    addLog('Attempting WebSocket connection...')
    
    try {
      const wsUrl = `wss://ws.finnhub.io?token=${encodeURIComponent(token)}`
      addLog(`Connecting to: ${wsUrl.substring(0, wsUrl.indexOf('token=') + 20)}...`)
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        addLog('WebSocket connected successfully!')
        ws.close()
      }
      
      ws.onerror = (error) => {
        addLog(`WebSocket error: ${JSON.stringify(error)}`)
      }
      
      ws.onclose = (event) => {
        addLog(`WebSocket closed: code=${event.code}, reason=${event.reason}`)
      }
      
    } catch (error) {
      addLog(`Failed to create WebSocket: ${error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Token Tester</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Enter your Finnhub API token:
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your API token here"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testToken}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Token Validation
          </button>
          
          <button
            onClick={testWebSocket}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test WebSocket Connection
          </button>
          
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Test Logs:</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Test your token above.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="font-mono text-sm mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">How to get a valid API key:</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
            <li>Go to <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="underline">finnhub.io/register</a></li>
            <li>Sign up for a free account</li>
            <li>Get your API key from the dashboard</li>
            <li>Paste it in the input field above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
