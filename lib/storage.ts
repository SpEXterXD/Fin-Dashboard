export function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(key)
}

export function setStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, value)
}

export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(key)
}

export function getStorageObject<T>(key: string): T | null {
  const item = getStorageItem(key)
  if (!item) return null
  try {
    return JSON.parse(item) as T
  } catch {
    return null
  }
}

export function setStorageObject<T>(key: string, value: T): void {
  setStorageItem(key, JSON.stringify(value))
}
