type Bucket = { tokens: number; updatedAt: number }
const buckets = new Map<string, Bucket>()

export async function rateLimit(key: string, scope: string, capacity = 60, refillPerMs = 1 / 1000) {
  const now = Date.now()
  const id = `${scope}:${key}`
  const b = buckets.get(id) ?? { tokens: capacity, updatedAt: now }
  const elapsed = Math.max(0, now - b.updatedAt)
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerMs)
  b.updatedAt = now
  if (b.tokens < 1) {
    buckets.set(id, b)
    return false
  }
  b.tokens -= 1
  buckets.set(id, b)
  return true
}
