import type { NextRequest } from "next/server"
import { buildProviderRequest } from "@/lib/providers/router"
import { rateLimit } from "@/lib/rate-limit"
import { responseCache } from "@/lib/cache"

// Security: Only allow connections to approved financial APIs
const ALLOWLIST = new Set([
  "www.alphavantage.co",
  "finnhub.io",
  "api.polygon.io",
  "api.twelvedata.com"
])

// Rate limiting configuration per host
const RATE_LIMIT_CONFIG = {
  "www.alphavantage.co": { capacity: 5, refillPerMs: 1 / 12000 }, // 5 requests per 12 seconds
  "finnhub.io": { capacity: 60, refillPerMs: 1 / 1000 }, // 60 requests per second
  "api.polygon.io": { capacity: 5, refillPerMs: 1 / 12000 }, // 5 requests per 12 seconds
  "api.twelvedata.com": { capacity: 8, refillPerMs: 1 / 60000 } // 8 requests per minute
}

interface ProxyError {
  error: string
  code: string
  details?: string
}

function createErrorResponse(error: ProxyError, status: number): Response {
  return new Response(JSON.stringify(error), {
    status,
    headers: { 
      "content-type": "application/json",
      "cache-control": "no-store"
    },
  })
}

function validateUrl(url: string): { isValid: boolean; parsed?: URL; error?: string } {
  try {
    const parsed = new URL(url)
    
    // Check protocol
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are allowed" }
    }
    
    // Check hostname
    if (!ALLOWLIST.has(parsed.hostname)) {
      return { isValid: false, error: `Host ${parsed.hostname} is not in the allowlist` }
    }
    
    // Check for suspicious patterns
    if (parsed.pathname.includes('..') || parsed.pathname.includes('//')) {
      return { isValid: false, error: "Invalid path detected" }
    }
    
    return { isValid: true, parsed }
  } catch (error) {
    return { isValid: false, error: "Invalid URL format" }
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Extract and validate URL parameter
    const url = req.nextUrl.searchParams.get("url")
    if (!url) {
      return createErrorResponse(
        { error: "Missing url parameter", code: "MISSING_URL" },
        400
      )
    }
    
    // Validate URL
    const validation = validateUrl(url)
    if (!validation.isValid) {
      return createErrorResponse(
        { error: validation.error!, code: "INVALID_URL" },
        400
      )
    }
    
    const parsed = validation.parsed!
    
    // Rate limiting by IP + host
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown"
    
    const hostConfig = RATE_LIMIT_CONFIG[parsed.hostname as keyof typeof RATE_LIMIT_CONFIG]
    const allowed = await rateLimit(ip, parsed.hostname, hostConfig)
    
    if (!allowed) {
      return createErrorResponse(
        { 
          error: "Rate limit exceeded", 
          code: "RATE_LIMIT_EXCEEDED",
          details: `Too many requests to ${parsed.hostname}`
        },
        429
      )
    }
    
    // Provider-specific normalization & key injection
    const { finalUrl, headers } = buildProviderRequest(parsed)
    
    // Cache lookup
    const cached = responseCache.get(finalUrl)
    if (cached) {
      console.log(`Cache hit for ${parsed.hostname}`)
      return cached
    }
    
    // Fetch from upstream
    const upstream = await fetch(finalUrl, { 
      method: "GET", 
      headers: { 
        "accept": "application/json, text/plain;q=0.9,*/*;q=0.1",
        "user-agent": "FinDashboard/1.0",
        ...headers 
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })
    
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Unknown error")
      console.error(`Upstream error for ${parsed.hostname}:`, upstream.status, errorText)
      
      return createErrorResponse(
        { 
          error: `Upstream error: ${upstream.status}`, 
          code: "UPSTREAM_ERROR",
          details: errorText
        },
        upstream.status
      )
    }
    
    // Read response
    const buffer = await upstream.arrayBuffer()
    const contentType = upstream.headers.get("content-type") || "application/octet-stream"
    
    // Create response
    const response = new Response(buffer, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=5, stale-while-revalidate=25",
        "x-proxy-cache": "MISS",
        "x-response-time": `${Date.now() - startTime}ms`
      },
    })
    
    // Cache successful responses
    if (upstream.ok && contentType.includes("application/json")) {
      responseCache.set(finalUrl, response.clone(), 10)
      console.log(`Cached response for ${parsed.hostname}`)
    }
    
    return response
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Proxy error:", error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return createErrorResponse(
        { error: "Request timeout", code: "TIMEOUT" },
        408
      )
    }
    
    return createErrorResponse(
      { error: `Proxy failed: ${errorMessage}`, code: "INTERNAL_ERROR" },
      500
    )
  }
}

// Health check endpoint
export async function HEAD() {
  return new Response(null, { status: 200 })
}
