# Fin Dashboard

A customizable, real-time finance dashboard built with Next.js, React, TypeScript, Tailwind, SWR, and Recharts. Users can connect finance APIs, add configurable widgets (Cards, Tables, Charts), and rearrange the layout with drag-and-drop.

## Features

- Widgets
  - Card: show scalar fields from any JSON API
  - Table: searchable, sortable, paginated tabular data
  - Charts: line or candlestick using Recharts (dynamically imported)
  - Drag-and-drop reorder via dnd-kit
  - Edit dialog: title, endpoint, refresh interval, fields, chart options
- Data
  - API proxy with host allowlist and provider key injection (Alpha Vantage, Finnhub)
  - In-memory TTL cache and token-bucket rate-limiter on the proxy route
  - SWR-based polling with centralized options
- UX
  - Skeletons, error boundaries, empty states
  - Theme toggle (light/dark/system) with hydration-safe setup
- Persistence
  - Auto-save widgets to localStorage
  - Import/export dashboard configs as JSON

## Getting Started

1. Install deps

```bash
pnpm install
# or npm install
```

2. Environment variables

Create `.env.local` and add any provider keys (optional but recommended):

```bash
ALPHA_VANTAGE_KEY=your_key
FINNHUB_TOKEN=your_token
```

3. Run dev server

```bash
pnpm dev
# or npm run dev
```

Open http://localhost:3000.

## Usage

- Click “Add Widget”, paste a JSON API URL (e.g., Finnhub market status), click “Test”.
- Select “Display Mode” (Card/Table/Chart).
- Once data loads, use the “Fields” explorer to pick paths.
  - Card: choose scalar fields (e.g., `exchange`, `isOpen`)
  - Table: include one array path and column fields
  - Charts: specify x/y keys (line) or OHLC/x keys (candlestick)
- Create the widget, drag to reorder, click the gear to edit later.

## Architecture Overview

- app/
  - api/proxy/route.ts — secure proxy, allowlist, rate-limit, caching, provider key injection
  - layout.tsx, ClientLayout.tsx — app layout, ThemeProvider
- components/
  - dashboard/ — grid, widget renderer, dialogs, error boundary
  - widgets/ — Card, Table, Line, Candlestick
  - ui/ — headless UI primitives (Radix-based)
- hooks/
  - use-dashboard-store.tsx — widget store (Context)
- lib/
  - fetcher.ts — client fetch via proxy
  - providers/ — provider router + injectors
  - rate-limit.ts, cache.ts — server utilities
  - swr.ts — centralized SWR defaults

## Key Design Choices

- Proxy with allowlist and server-side key injection keeps secrets off the client and enables caching/rate limits.
- SWR chosen for simple polling and client caching; configurable refresh per widget.
- Dynamic import for chart widgets reduces hydration cost.
- Error boundary at widget level prevents one faulty widget from breaking the page.

## Adding a New Provider

- Create `lib/providers/<name>.ts` that injects keys and normalizes request params.
- Register it in `lib/providers/router.ts` based on hostname.
- Optionally add an adapter that normalizes API responses to a common shape.

## Accessibility & Theming

- Theme toggle leverages `next-themes`; SSR is hydration-safe (mounted checks + suppressHydrationWarning).
- Buttons/inputs include labels and aria attributes where applicable.

## Testing Tips

- Use public JSON APIs to verify widgets quickly.
- For Table, ensure you include one array path + its child field paths as columns.
- Watch the console/network for `429` responses (rate limit); the UI will show a retry option.


