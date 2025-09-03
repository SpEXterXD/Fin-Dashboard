type WidgetType = "card" | "table" | "chart"

type WidgetConfig = {
  id: string
  title: string
  type: WidgetType
  endpoint: string
  refreshInterval: number
  fieldPaths: string[]
  options?: {
    xKey?: string
    yKey?: string
    format?: "currency" | "percent" | "number" | "text"
  }
}
