export interface CacheConfig {
  defaultTtlSeconds: number
  maxSize: number
  cleanupIntervalMs: number
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtlSeconds: 10,
  maxSize: 1000,
  cleanupIntervalMs: 30 * 1000 // 30 seconds
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
}

export class TTLCache<T = Response> {
  private store = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanup()
  }

  get(key: string): T | undefined {
    this.stats.totalRequests++
    
    const entry = this.store.get(key)
    if (!entry) {
      this.stats.misses++
      return undefined
    }
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.stats.misses++
      return undefined
    }
    
    this.stats.hits++
    return entry.value
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.config.defaultTtlSeconds
    const expiresAt = Date.now() + ttl * 1000
    
    // Check if we need to evict items due to size limit
    if (this.store.size >= this.config.maxSize) {
      this.evictOldest()
    }
    
    this.store.set(key, { 
      value, 
      expiresAt,
      createdAt: Date.now()
    })
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
    this.resetStats()
  }

  private evictOldest(): void {
    let oldestKey: string | undefined
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.store.delete(oldestKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupIntervalMs)
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    }
  }

  getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0
    
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.stats.totalRequests
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.store.clear()
  }
}

// Global cache instance for responses
export const responseCache = new TTLCache<Response>({ defaultTtlSeconds: 10 })

// Export for testing and advanced usage
export { TTLCache as createTTLCache }
