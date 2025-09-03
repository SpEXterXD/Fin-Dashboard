import type { NextRequest } from "next/server"
import { buildProviderRequest } from "@/lib/providers/router"
import { rateLimit } from "@/lib/rate-limit"
import { responseCache } from "@/lib/cache"

const ALLOWLIST = new Set(["www.alphavantage.co", "finnhub.io"]) // extend as needed

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return new Response(JSON.stringify({ error: "Missing url param" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }
  try {
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol) || !ALLOWLIST.has(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Blocked host" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    }

    // Rate limit by IP + host
    const ip = req.headers.get("x-forwarded-for") || "anon"
    const allowed = await rateLimit(ip, parsed.hostname)
    if (!allowed) {
      const res = new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": "30" },
      })
      return res
    }

    // Provider-specific normalization & key injection
    const { finalUrl, headers } = buildProviderRequest(parsed)

    // Cache lookup
    const cached = responseCache.get(finalUrl)
    if (cached) return cached

    const upstream = await fetch(finalUrl, { method: "GET", headers: { accept: "application/json, text/plain;q=0.9,*/*;q=0.1", ...headers } })
    const buf = await upstream.arrayBuffer()
    const res = new Response(buf, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/octet-stream",
        "cache-control": "public, max-age=5, stale-while-revalidate=25",
      },
    })

    // Cache only successful JSON/text for a short period
    if (upstream.ok) {
      responseCache.set(finalUrl, res.clone(), 10)
    }

    return res
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Proxy failed"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
