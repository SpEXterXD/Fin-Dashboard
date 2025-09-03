import { alphaVantage } from "./alpha-vantage"
import { finnhub } from "./finnhub"

export function buildProviderRequest(url: URL): { finalUrl: string; headers: Record<string, string> } {
  const host = url.hostname
  if (host.includes("alphavantage")) return alphaVantage(url)
  if (host.includes("finnhub")) return finnhub(url)
  // default passthrough
  return { finalUrl: url.toString(), headers: {} }
}
