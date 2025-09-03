export async function fetchViaProxy(url: string) {
  const encoded = encodeURIComponent(url)
  const res = await fetch(`/api/proxy?url=${encoded}`)
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return res.json()
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { text }
  }
}
