export function getByPath(obj: unknown, path: string): unknown {
  if (!path || !obj) return obj
  
  try {
    return path.split(".").reduce((acc, key) => {
      if (acc == null || typeof acc !== 'object') return undefined
      return (acc as Record<string, unknown>)[key]
    }, obj)
  } catch (error) {
    console.warn('Error getting path:', path, error)
    return undefined
  }
}

export function flattenJsonPaths(value: unknown, prefix = "", maxDepth = 10): string[] {
  const paths = new Set<string>()
  
  function traverse(current: unknown, currentPrefix: string, depth: number): void {
    if (depth > maxDepth) return
    
    if (Array.isArray(current)) {
      if (current.length > 0) {
        paths.add(currentPrefix || "$")
        traverse(current[0], currentPrefix, depth + 1)
      } else {
        paths.add(currentPrefix || "$")
      }
    } else if (current !== null && typeof current === "object") {
      const keys = Object.keys(current as Record<string, unknown>)
      if (keys.length === 0) {
        paths.add(currentPrefix || "$")
      } else {
        for (const key of keys) {
          const newPrefix = currentPrefix ? `${currentPrefix}.${key}` : key
          paths.add(newPrefix)
          try {
            traverse((current as Record<string, unknown>)[key], newPrefix, depth + 1)
          } catch (error) {
            console.warn('Error traversing path:', newPrefix, error)
          }
        }
      }
    } else {
      if (currentPrefix) paths.add(currentPrefix)
    }
  }
  
  traverse(value, prefix, 0)
  return Array.from(paths).filter(Boolean).sort()
}

export function matchPaths(paths: string[], query: string): string[] {
  if (!query.trim()) return paths
  
  const normalizedQuery = query.toLowerCase().trim()
  const results: string[] = []
  
  for (const path of paths) {
    if (path.toLowerCase().includes(normalizedQuery)) {
      results.push(path)
    }
  }
  
  // Sort by relevance (exact matches first, then by position)
  return results.sort((a, b) => {
    const aLower = a.toLowerCase()
    const bLower = b.toLowerCase()
    
    // Exact match gets priority
    if (aLower === normalizedQuery) return -1
    if (bLower === normalizedQuery) return 1
    
    // Then by position of match
    const aIndex = aLower.indexOf(normalizedQuery)
    const bIndex = bLower.indexOf(normalizedQuery)
    
    if (aIndex !== bIndex) return aIndex - bIndex
    
    // Finally by length (shorter paths first)
    return a.length - b.length
  })
}

export function validateJsonPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false
  
  // Check for valid path format (alphanumeric, dots, brackets for arrays)
  const pathRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[0-9]+\])*$/
  return pathRegex.test(path)
}

export function getPathValue(obj: unknown, path: string): { value: unknown; exists: boolean } {
  const value = getByPath(obj, path)
  return {
    value,
    exists: value !== undefined
  }
}
