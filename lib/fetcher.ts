export interface FetcherOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
  headers?: Record<string, string>
}

export interface FetcherResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
  cached: boolean
}

export class FetcherError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string,
    public response?: Response
  ) {
    super(message)
    this.name = 'FetcherError'
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithTimeout(
  url: string, 
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetcherError('Request timeout', 408, url)
    }
    throw error
  }
}

export async function fetchViaProxy(
  url: string, 
  options: FetcherOptions = {}
): Promise<unknown> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    headers = {}
  } = options
  
  let lastError: Error
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const encoded = encodeURIComponent(url)
      const response = await fetchWithTimeout(
        `/api/proxy?url=${encoded}`,
        { 
          timeout,
          headers: {
            'Accept': 'application/json, text/plain;q=0.9',
            ...headers
          }
        }
      )
      
      if (!response.ok) {
        let errorMessage = `Proxy error: ${response.status}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If we can't parse the error response, use the status text
        }
        
        throw new FetcherError(
          errorMessage,
          response.status,
          url,
          response
        )
      }
      
      const contentType = response.headers.get("content-type") || ""
      
      if (contentType.includes("application/json")) {
        return await response.json()
      }
      
      if (contentType.includes("text/")) {
        const text = await response.text()
        try {
          return JSON.parse(text)
        } catch {
          return { text, contentType }
        }
      }
      
      // For binary or other content types
      return { contentType, size: response.headers.get("content-length") }
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on client errors (4xx)
      if (error instanceof FetcherError && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw lastError
      }
      
      // Wait before retrying
      if (retryDelay > 0) {
        await delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
      }
      
      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, lastError.message)
    }
  }
  
  throw lastError!
}

// Convenience function for simple fetches
export async function simpleFetch(url: string): Promise<unknown> {
  return fetchViaProxy(url, { retries: 1, retryDelay: 0 })
}

// Function to check if a URL is accessible
export async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    await fetchViaProxy(url, { retries: 1, timeout: 10000 })
    return true
  } catch {
    return false
  }
}
