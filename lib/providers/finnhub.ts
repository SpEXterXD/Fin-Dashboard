export function finnhub(url: URL) {
  const hasToken = !!url.searchParams.get("token")
  if (!hasToken) {
    const token = process.env.FINNHUB_TOKEN || ""
    if (token) url.searchParams.set("token", token)
  }
  return { finalUrl: url.toString(), headers: { accept: "application/json" } }
}
