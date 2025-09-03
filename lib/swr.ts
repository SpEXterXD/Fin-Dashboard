import type { SWRConfiguration } from "swr"

// Default SWR configuration for the entire application
export const defaultSWRConfig: SWRConfiguration = {
  // Data fetching
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error, key) => {
    console.error('SWR error for key:', key, error)
  },
  
  // Performance
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  
  // Cache
  keepPreviousData: true,
  
  // Timeout
  timeout: 30000,
  
  // Custom error retry logic
  errorRetryCount: (error, key, config) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return 0
    }
    
    // Retry up to 3 times for other errors
    return 3
  },
  
  // Exponential backoff for retries
  errorRetryInterval: (index) => {
    return Math.min(1000 * Math.pow(2, index), 10000)
  }
}

// Widget-specific SWR configuration
export const widgetSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  
  // Widgets should refresh more frequently
  refreshInterval: 30000,
  
  // Keep widget data fresh
  revalidateOnFocus: true,
  
  // Widgets can have longer retry intervals
  errorRetryInterval: 10000,
  
  // Widgets should keep previous data to avoid flickering
  keepPreviousData: true
}

// API-specific SWR configuration
export const apiSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  
  // API calls should be more conservative
  refreshInterval: 0,
  
  // Don't retry API errors as aggressively
  errorRetryCount: 2,
  
  // Shorter retry intervals for API calls
  errorRetryInterval: 3000
}

// Helper function to merge configurations
export function mergeSWRConfig(
  base: SWRConfiguration,
  overrides: SWRConfiguration
): SWRConfiguration {
  return {
    ...base,
    ...overrides,
    // Deep merge for nested objects if needed
    onError: overrides.onError || base.onError,
    errorRetryCount: overrides.errorRetryCount || base.errorRetryCount,
    errorRetryInterval: overrides.errorRetryInterval || base.errorRetryInterval
  }
}

// Predefined configurations for common use cases
export const swrConfigs = {
  default: defaultSWRConfig,
  widget: widgetSWRConfig,
  api: apiSWRConfig,
  
  // High-frequency updates (e.g., real-time data)
  realtime: mergeSWRConfig(defaultSWRConfig, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    keepPreviousData: true
  }),
  
  // Low-frequency updates (e.g., configuration)
  config: mergeSWRConfig(defaultSWRConfig, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  }),
  
  // One-time fetches (e.g., initial data load)
  once: mergeSWRConfig(defaultSWRConfig, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false
  })
}
