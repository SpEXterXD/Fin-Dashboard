export interface RateLimitConfig {
  capacity: number
  refillPerMs: number
  maxBuckets: number
  cleanupIntervalMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  capacity: 60,
  refillPerMs: 1 / 1000, // 1 token per second
  maxBuckets: 1000,
  cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
}

type Bucket = {
  tokens: number
  updatedAt: number
  lastAccess: number
}

class RateLimiter {
  private buckets = new Map<string, Bucket>()
  private config: RateLimitConfig
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanup()
  }

  async checkLimit(key: string, scope: string): Promise<boolean> {
    const now = Date.now()
    const id = `${scope}:${key}`
    
    // Cleanup old buckets if we're at capacity
    if (this.buckets.size >= this.config.maxBuckets) {
      this.cleanup()
    }
    
    let bucket = this.buckets.get(id)
    
    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        updatedAt: now,
        lastAccess: now
      }
    } else {
      // Refill tokens based on time elapsed
      const elapsed = Math.max(0, now - bucket.updatedAt)
      const refillAmount = elapsed * this.config.refillPerMs
      
      bucket.tokens = Math.min(
        this.config.capacity,
        bucket.tokens + refillAmount
      )
      bucket.updatedAt = now
      bucket.lastAccess = now
    }
    
    // Check if we have tokens
    if (bucket.tokens < 1) {
      this.buckets.set(id, bucket)
      return false
    }
    
    // Consume a token
    bucket.tokens -= 1
    this.buckets.set(id, bucket)
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.config.cleanupIntervalMs
    
    for (const [id, bucket] of this.buckets.entries()) {
      if (bucket.lastAccess < cutoff) {
        this.buckets.delete(id)
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupIntervalMs)
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.buckets.clear()
  }

  getStats(): { totalBuckets: number; config: RateLimitConfig } {
    return {
      totalBuckets: this.buckets.size,
      config: this.config
    }
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter()

export async function rateLimit(
  key: string, 
  scope: string, 
  config?: Partial<RateLimitConfig>
): Promise<boolean> {
  if (config) {
    // Create a new instance for custom config
    const customLimiter = new RateLimiter(config)
    const result = await customLimiter.checkLimit(key, scope)
    customLimiter.destroy()
    return result
  }
  
  return globalRateLimiter.checkLimit(key, scope)
}

// Export for testing and advanced usage
export { RateLimiter, globalRateLimiter }
