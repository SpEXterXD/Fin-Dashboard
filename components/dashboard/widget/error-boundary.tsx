"use client"

import * as React from "react"

export function WidgetErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ErrorBoundaryImpl fallback={fallback}>{children}</ErrorBoundaryImpl>
}

type ErrorBoundaryProps = { children: React.ReactNode; fallback?: React.ReactNode }
type ErrorBoundaryState = { hasError: boolean; error?: Error }

class ErrorBoundaryImpl extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Widget error:", error)
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Failed to render widget.
        </div>
      )
    }
    return this.props.children
  }
}
