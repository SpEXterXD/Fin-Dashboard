"use client"

import { useState, useEffect } from 'react'

export default function MarketStatusPage() {
  const [marketStatus, setMarketStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMarketStatus = async () => {
      try {
        // Check US market status
        const response = await fetch('/api/proxy?url=' + encodeURIComponent('https://finnhub.io/api/v1/stock/market-status?exchange=US&token=demo'))
        const data = await response.json()
        setMarketStatus(data)
      } catch (error) {
        console.error('Failed to fetch market status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkMarketStatus()
  }, [])

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRecommendations = () => {
    if (!marketStatus) return []

    const recommendations = []
    
    if (marketStatus.isOpen) {
      recommendations.push("US markets are OPEN - try stocks like AAPL, MSFT, TSLA")
    } else {
      recommendations.push("US markets are CLOSED - try crypto symbols instead")
    }
    
    recommendations.push("Crypto markets are 24/7 - try BINANCE:BTCUSDT, BINANCE:ETHUSDT")
    recommendations.push("Forex markets are 24/5 - try IC MARKETS:1, IC MARKETS:2")
    
    return recommendations
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Market Status & Recommendations</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-semibold text-blue-800 mb-2">Current Time (ET)</h2>
          <p className="text-blue-700">{getCurrentTime()}</p>
        </div>

        {loading ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p>Loading market status...</p>
          </div>
        ) : marketStatus ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-semibold text-green-800 mb-2">US Market Status</h2>
            <p className="text-green-700">
              {marketStatus.isOpen ? "OPEN" : "CLOSED"}
            </p>
            {marketStatus.session && (
              <p className="text-green-600 text-sm mt-1">
                Session: {marketStatus.session}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">Failed to load market status</p>
          </div>
        )}

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h2 className="font-semibold text-yellow-800 mb-2">Symbol Recommendations</h2>
          <ul className="text-yellow-700 space-y-1">
            {getRecommendations().map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <h2 className="font-semibold text-purple-800 mb-2">High-Activity Symbols</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-purple-700">
            <div>
              <h3 className="font-medium">US Stocks</h3>
              <ul className="text-sm space-y-1">
                <li>• AAPL (Apple)</li>
                <li>• MSFT (Microsoft)</li>
                <li>• TSLA (Tesla)</li>
                <li>• NVDA (NVIDIA)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Crypto</h3>
              <ul className="text-sm space-y-1">
                <li>• BINANCE:BTCUSDT</li>
                <li>• BINANCE:ETHUSDT</li>
                <li>• BINANCE:ADAUSDT</li>
                <li>• BINANCE:BNBUSDT</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Forex</h3>
              <ul className="text-sm space-y-1">
                <li>• IC MARKETS:1 (EUR/USD)</li>
                <li>• IC MARKETS:2 (GBP/USD)</li>
                <li>• IC MARKETS:3 (USD/JPY)</li>
                <li>• IC MARKETS:4 (AUD/USD)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <h2 className="font-semibold text-gray-800 mb-2">Troubleshooting Tips</h2>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>• "Waiting for data" is normal - trades don't happen constantly</li>
            <li>• Try high-volume symbols during market hours</li>
            <li>• Crypto symbols trade 24/7 and usually have more activity</li>
            <li>• Check your browser console for WebSocket connection logs</li>
            <li>• Make sure you're using a valid API key</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
