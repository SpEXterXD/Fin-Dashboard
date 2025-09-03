type CacheEntry<T> = { value: T; expiresAt: number }

export function createTTLCache<T = Response>(defaultTtlSeconds = 10) {
  const store = new Map<string, CacheEntry<T>>()
  function get(key: string): T | undefined {
    const e = store.get(key)
    if (!e) return undefined
    if (Date.now() > e.expiresAt) {
      store.delete(key)
      return undefined
    }
    return e.value
  }
  function set(key: string, value: T, ttlSeconds = defaultTtlSeconds) {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }
  function clear() {
    store.clear()
  }
  return { get, set, clear }
}

export const responseCache = createTTLCache<Response>(10)
