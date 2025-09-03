"use client"

import dynamic from "next/dynamic"
import { TableWidget } from "@/components/widgets/table-widget"
import { CardWidget } from "@/components/widgets/card-widget"
import type { WidgetConfig } from "@/types/widget-config"

const LineChartWidget = dynamic(() => import("@/components/widgets/line-chart-widget").then(m => m.LineChartWidget), { ssr: false })
const CandlestickChartWidget = dynamic(() => import("@/components/widgets/candlestick-chart-widget").then(m => m.CandlestickChartWidget), { ssr: false })

export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  if (widget.type === "chart" && widget.options?.kind === "candlestick") {
    return <CandlestickChartWidget widget={widget} />
  }
  switch (widget.type) {
    case "table":
      return <TableWidget widget={widget} />
    case "chart":
      return <LineChartWidget widget={widget} />
    default:
      return <CardWidget widget={widget} />
  }
}
