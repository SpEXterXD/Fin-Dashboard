export function formatValue(v: unknown, as?: "currency" | "percent" | "number" | "text"): string {
  if (v == null) return "-"
  if (as === "currency" && isFiniteNumber(v)) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
      Number(v),
    )
  }
  if (as === "percent" && isFiniteNumber(v)) {
    return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 2 }).format(Number(v))
  }
  if ((as === "number" || as == null) && isFiniteNumber(v)) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(Number(v))
  }
  return String(v)
}

function isFiniteNumber(v: unknown): v is number {
  const n = Number(v)
  return Number.isFinite(n)
}
