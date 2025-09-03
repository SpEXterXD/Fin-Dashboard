export type FormatType = "currency" | "percent" | "number" | "text" | "date" | "datetime"

export interface FormatOptions {
  type?: FormatType
  currency?: string
  precision?: number
  prefix?: string
  suffix?: string
  dateFormat?: Intl.DateTimeFormatOptions
}

export function formatValue(value: unknown, options?: FormatOptions | FormatType): string {
  // Handle legacy format parameter
  const formatType = typeof options === 'string' ? options : options?.type
  
  if (value == null || value === undefined) return "-"
  
  try {
    switch (formatType) {
      case "currency":
        return formatCurrency(value, options)
      case "percent":
        return formatPercent(value, options)
      case "date":
        return formatDate(value, options)
      case "datetime":
        return formatDateTime(value, options)
      case "number":
      case undefined:
        return formatNumber(value, options)
      case "text":
      default:
        return formatText(value, options)
    }
  } catch (error) {
    console.warn('Format error:', error)
    return formatText(value, options)
  }
}

function formatCurrency(value: unknown, options?: FormatOptions): string {
  if (!isFiniteNumber(value)) return formatText(value, options)
  
  const currency = options?.currency || "USD"
  const precision = options?.precision ?? 2
  
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: precision,
    minimumFractionDigits: precision
  }).format(Number(value))
  
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`
}

function formatPercent(value: unknown, options?: FormatOptions): string {
  if (!isFiniteNumber(value)) return formatText(value, options)
  
  const precision = options?.precision ?? 2
  
  const formatted = new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: precision,
    minimumFractionDigits: precision
  }).format(Number(value))
  
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`
}

function formatNumber(value: unknown, options?: FormatOptions): string {
  if (!isFiniteNumber(value)) return formatText(value, options)
  
  const precision = options?.precision ?? 4
  
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0
  }).format(Number(value))
  
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`
}

function formatDate(value: unknown, options?: FormatOptions): string {
  if (!isValidDate(value)) return formatText(value, options)
  
  const date = new Date(value)
  const formatOptions: Intl.DateTimeFormatOptions = options?.dateFormat || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  const formatted = new Intl.DateTimeFormat(undefined, formatOptions).format(date)
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`
}

function formatDateTime(value: unknown, options?: FormatOptions): string {
  if (!isValidDate(value)) return formatText(value, options)
  
  const date = new Date(value)
  const formatOptions: Intl.DateTimeFormatOptions = options?.dateFormat || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  const formatted = new Intl.DateTimeFormat(undefined, formatOptions).format(date)
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`
}

function formatText(value: unknown, options?: FormatOptions): string {
  const text = String(value)
  return `${options?.prefix || ''}${text}${options?.suffix || ''}`
}

function isFiniteNumber(value: unknown): value is number {
  const num = Number(value)
  return Number.isFinite(num) && !Number.isNaN(num)
}

function isValidDate(value: unknown): boolean {
  if (value instanceof Date) return !isNaN(value.getTime())
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  return false
}
