export type WidgetType = "card" | "table" | "chart"

export type WidgetConfig = {
  id: string
  title: string
  type: WidgetType
  endpoint: string
  refreshInterval: number
  fieldPaths: string[]
  options?: {
    // generic
    format?: "currency" | "percent" | "number" | "text"
    // chart
    kind?: "line" | "candlestick"
    xKey?: string
    yKey?: string
    // candlestick
    oKey?: string
    hKey?: string
    lKey?: string
    cKey?: string
  }
}
