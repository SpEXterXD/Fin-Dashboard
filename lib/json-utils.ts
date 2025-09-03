export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), obj)
}

export function flattenJsonPaths(value: unknown, prefix = "", out: string[] = []): string[] {
  if (Array.isArray(value)) {
    out.push(prefix || "$")
    if (value.length > 0) flattenJsonPaths(value[0], prefix, out)
  } else if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const p = prefix ? `${prefix}.${key}` : key
      out.push(p)
      try {
        flattenJsonPaths((value as Record<string, unknown>)[key], p, out)
      } catch {}
    }
  } else {
    if (prefix) out.push(prefix)
  }
  return Array.from(new Set(out)).filter(Boolean)
}

export function matchPaths(paths: string[], query: string) {
  const q = query.toLowerCase()
  return paths.filter((p) => p.toLowerCase().includes(q))
}
