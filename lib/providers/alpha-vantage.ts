export function alphaVantage(url: URL) {
  // Ensure function param present
  if (!url.searchParams.get("function")) {
    url.searchParams.set("function", "GLOBAL_QUOTE")
  }
  const key = process.env.ALPHA_VANTAGE_KEY || ""
  url.searchParams.set("apikey", key)
  return { finalUrl: url.toString(), headers: { accept: "application/json" } }
}
