# PriceWatch

PriceWatch is a modern, real-time price intelligence and comparison platform designed for the Indian E-Commerce (Amazon, BigBasket) and Quick-Commerce (Blinkit, Zepto, Swiggy Instamart) ecosystems.

## Architecture

The project is a **fully standalone Next.js 15 application** — no separate backend server is required. All API logic is handled by Next.js API Routes with embedded mock data.

- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State**: Zustand (shallow rendering optimized)
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts (lazy-loaded)
- **API**: Next.js API Routes (embedded, serverless-compatible)

## Getting Started (Local)

### Prerequisites
- Node.js (v18 or higher)

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. That's it — no Python, no database, no backend!

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set the **Root Directory** to `frontend`
4. Click Deploy

Vercel will auto-detect Next.js and deploy it instantly. No environment variables needed.

---

## Features Implemented
- **Dynamic Cockpit UI**: Advanced Rate vs Time toggles with Recharts historical graphs.
- **Three-Category System**: View cross-listed, e-com exclusive, or quick-com exclusive items.
- **Basket Optimizer**: Smart cart splitting to minimize total order value + delivery ETA.
- **Watchlists**: Track nodes for price alerts.
- **Auth Modal**: Premium, glassmorphic OAuth UI.
- **Global Ticker**: Top 10 scrolling beeps for market highlights.
- **Market Analytics**: Real-time market intelligence dashboard with charts.
- **Live Realtime Simulation**: Mock engine that simulates price drops, ETA changes, stock alerts.

## Performance Optimizations
- **Tree-shaking**: `lucide-react`, `recharts`, `framer-motion` are optimized via Next.js `optimizePackageImports`
- **Lazy Loading**: Recharts sparkline charts are dynamically imported (`next/dynamic`) to avoid blocking initial load
- **QueryClient Tuning**: 60s stale time, no refetch-on-focus, no polling — eliminates redundant network calls
- **Standalone Output**: `output: "standalone"` for minimal Vercel bundle size
- **Image Optimization**: AVIF + WebP formats via Next.js Image optimization

## Upcoming Roadmap (Not Yet Implemented)
- Embeddable Widget (JS snippet for 3rd party integration)
- Playwright SPA crawling engine (real data ingestion)
- Postgres/Prisma database integration
- Celery + Redis Notification dispatch system
