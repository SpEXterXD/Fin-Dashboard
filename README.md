# FinView Dashboard

A production-ready financial dashboard built with Next.js, React, TypeScript, and Tailwind CSS. Connect to financial APIs, create customizable widgets, and build your personalized financial view with real-time data, advanced caching, and robust error handling.

## Features

### Core Dashboard
- **Widget System**: Create, edit, and manage multiple widget types
- **Drag & Drop**: Intuitive reordering with accessibility support
- **Real-time Updates**: Configurable refresh intervals per widget
- **WebSocket Support**: Real-time financial data via Finnhub WebSocket API
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Theme Support**: Light/dark/system themes with hydration safety

### Widget Types
- **Card Widgets**: Display scalar values with advanced formatting options
- **Table Widgets**: Searchable, sortable tabular data with pagination
- **Chart Widgets**: Line charts and candlestick charts using Recharts
- **Dynamic Loading**: Lazy-loaded chart components for optimal performance

### Security & Performance
- **API Proxy**: Secure gateway with host allowlist and rate limiting
- **Provider Integration**: Automatic API key injection for major providers
- **Rate Limiting**: Per-host token bucket algorithm with automatic cleanup
- **Response Caching**: TTL-based caching with LRU eviction and memory management
- **Error Handling**: Comprehensive error boundaries and graceful degradation


### Project Structure

```
fin-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── proxy/         # Secure API proxy
│   │   └── webhook/       # Webhook endpoints
│   ├── debug/             # Debug pages
│   ├── market-status/     # Market status page
│   ├── reset-websocket/   # WebSocket reset page
│   ├── test-fields/       # Field testing page
│   ├── test-websocket/    # WebSocket testing page
│   ├── ClientLayout.tsx   # Client-side layout wrapper
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/             # React components
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── widget/        # Widget components
│   │   └── widgets/       # Sortable widget items
│   ├── debug/             # Debug components
│   ├── ui/                # Reusable UI primitives (14 components)
│   ├── widgets/           # Widget implementations
│   ├── theme-provider.tsx # Theme context provider
│   └── theme-toggle.tsx   # Theme toggle component
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── providers/          # API provider integrations
│   ├── cache.ts            # TTL cache with statistics
│   ├── fetcher.ts          # HTTP client with retry logic
│   ├── format.ts           # Advanced data formatting
│   ├── json-utils.ts       # JSON path utilities
│   ├── rate-limit.ts       # Rate limiting implementation
│   ├── storage.ts          # Storage utilities
│   ├── swr.ts              # SWR configuration profiles
│   ├── types.d.ts          # Type definitions
│   └── utils.ts            # General utilities
├── styles/                 # Additional styles
├── types/                  # TypeScript definitions
└── public/                 # Static assets
```


### Rate Limiting & Caching

- **Per-host limits**: Customized for each API provider
- **IP-based tracking**: Automatic rate limit enforcement
- **Response caching**: TTL-based with stale-while-revalidate
- **Memory management**: Automatic cleanup and size limits
- **Performance metrics**: Built-in statistics and monitoring

### Error Handling

- **Validation**: Comprehensive input validation and sanitization
- **Error Boundaries**: Isolated widget failures
- **Retry Logic**: Exponential backoff with smart retry strategies
- **Graceful Degradation**: User-friendly error messages and fallbacks

## Security Features

- **Host Allowlist**: Only approved domains allowed
- **Rate Limiting**: Per-IP and per-host limits
- **Input Validation**: URL and parameter sanitization
- **Key Injection**: Server-side API key management
- **XSS Prevention**: Comprehensive sanitization and validation

## Performance Optimizations

- **Code Splitting**: Dynamic imports for chart components
- **Memoization**: React.memo and useMemo for expensive operations
- **Debouncing**: Storage updates and API calls
- **Lazy Loading**: Widget components and heavy dependencies
- **Memory Safety**: Automatic cleanup and resource limits

## DEMO API URL 

- **Card** -> https://finnhub.io/api/v1/stock/market-status?exchange=US&token=demo [Replace "demo" with your own key]
- **Table** -> https://finnhub.io/api/v1/search?q=apple&exchange=US&token=demo [Replace "demo" with your own key]
- **Line/Candle** -> https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo [Replace "demo" with your own key]

## DEMO

https://github.com/user-attachments/assets/62c51a24-01a7-4349-ac28-17a797d6f30d


