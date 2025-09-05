"use client"

import { useState } from 'react'

export default function TestFieldsPage() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Field Usage Test</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-semibold text-red-800">WRONG - Don't do this:</h2>
          <p className="text-red-700 mt-2">
            Putting your API key in the URL field will cause the error you're seeing.
          </p>
          <div className="mt-3">
            <label className="block text-sm font-medium text-red-800">URL Field (WRONG):</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Don't put your API key here!"
              className="w-full p-2 border border-red-300 rounded mt-1"
            />
            <p className="text-xs text-red-600 mt-1">
              Current value: {url || 'empty'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-semibold text-green-800">CORRECT - Do this:</h2>
          <p className="text-green-700 mt-2">
            Put your API key in the API Key field for realtime widgets.
          </p>
          <div className="mt-3">
            <label className="block text-sm font-medium text-green-800">API Key Field (CORRECT):</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Put your API key here!"
              className="w-full p-2 border border-green-300 rounded mt-1"
            />
            <p className="text-xs text-green-600 mt-1">
              Current value: {apiKey ? `${apiKey.substring(0, 8)}...` : 'empty'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800">For Regular Widgets (URL Field):</h3>
          <p className="text-blue-700 mt-2">
            Use complete API endpoint URLs like:
          </p>
          <div className="mt-2 font-mono text-sm bg-blue-100 p-2 rounded">
            https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">For Realtime Widgets (API Key Field):</h3>
          <p className="text-yellow-700 mt-2">
            Just enter your API key in the password field. The WebSocket connection will use it automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
