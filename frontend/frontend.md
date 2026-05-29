# PriceWatch — Next.js Frontend Architecture & Design System

The PriceWatch frontend is a premium, real-time client application built on Next.js 15, React 19, and TypeScript. It features a high-density "Bloomberg Terminal" aesthetic with dark graphite themes, neon semantic alerts, glowing micro-animations, and fluid transitions.

---

## 1. Core Technology Stack

- **Framework**: Next.js 15 (App Router for optimized client/server routing)
- **Library**: React 19 (features concurrent state transitions, server actions compatibility)
- **Styling**: Tailwind CSS v4 (configured with variable theme tokens for deep flexibility)
- **Animations**: Framer Motion (orchestrates springs, glows, and coordinate transitions)
- **State Management**: Zustand (lightweight, decoupled state modules)
- **Data Fetching**: TanStack React Query v5 (caches database catalogs, handles REST API states)
- **Icons**: Lucide React (clean, lightweight vector set)

---

## 2. Directory Layout & Architecture

The project follows a modular, feature-based directory structure under `frontend/src`:

```
src/
├── app/                  # Next.js 15 Pages and Layout Layouts
│   ├── analytics/        # Analytical charts & history plots
│   ├── basket/           # Smart Basket Optimizer page
│   ├── products/         # Catalog explorer & details view
│   ├── watchlist/        # Alert config and watchlist page
│   ├── layout.tsx        # Global provider setups (QueryClient, Toasts)
│   ├── page.tsx          # Real-time Live Intelligence Terminal
│   └── globals.css       # Core design theme, variables, grid overlays
├── components/           # UI Components
│   ├── domain/           # Feature-specific (e.g., ProductCard, LiveFeed)
│   └── shared/           # Reusable elements (Badges, Toast, Navbar)
├── store/                # Zustand State Slices
│   └── index.ts          # Unified stores (UI, LiveStore, BasketStore, AlertStore)
├── types/                # TypeScript Contracts
│   └── index.ts          # Strict structural typings matching backend shapes
└── lib/                  # Helper Utilities
    └── utils.ts          # Math computations, currency & time formatters
```

---

## 3. Global Client State Management (Zustand Slices)

To maintain extreme performance under heavy real-time streaming, the app divides global state into four decoupled slices inside `src/store/index.ts`:

### 3.1 UI Store (`useUIStore`)
- Controls layout states such as global search visibility and live-streaming toggles (`isLiveMode`).

### 3.2 Live Event Store (`useLiveStore`)
- **Memory Optimization**: Uses **bounded ring buffers** (`slice(-MAX)`) to keep list lengths fixed and prevent page degradation during fast updates.
  - `events`: Array of raw WebSocket events (Cap: 200).
  - `tickerItems`: Text items for the crawling news ticker (Cap: 30).
  - `activityFeed`: UI event messages for the activity logger (Cap: 50).

### 3.3 Basket Store (`useBasketStore`)
- Manages client-side cart operations (adding, adjusting quantities, clearing, platform selections).

### 3.4 Alert/Watchlist Store (`useAlertStore`)
- Tracks user-configured price alerts and product bookmarking (`watchlist`).

---

## 4. Visual Aesthetics & Design System (`globals.css`)

### 4.1 Theme Palette (Neon Graphite)
The CSS styling is built around custom HSL variables loaded via Tailwind's `@theme` interface:
- **Base Background**: Zinc 950 (`#09090b`) with a faint Bloomberg-style grid overlay (`rgba(255,255,255,0.015)`).
- **Price Drop Accent**: Emerald 400 (`#10b981`) for savings and positive fluctuations.
- **Trending Indicator**: Amber 500 (`#f59e0b`) for active catalog spikes.
- **Activity Streams**: Cyan 400 (`#06b6d4`) for ETA status updates.
- **Alert Flags**: Red 500 (`#ef4444`) for error boundaries and thresholds.

### 4.2 Micro-Animations & Glows
- **Scrolling News Tickers**: CSS-accelerated animation loops sliding news feeds smoothly without CPU-bound DOM updates.
- **Pulsing Shadows**: Subtle keyframe glows that dynamically expand and contract depending on positive event fluctuations.
- **Framer Motion Sprongs**: Product cards render into grid containers using physics-based spring controls (`stiffness: 300`, `damping: 26`) for an extremely fluid experience.

---

## 5. Intelligent Client Algorithms

### 5.1 Value Score Indexing
Calculated on the client (`ProductCard.tsx`) to grade every marketplace listing relative to competitors.
```typescript
function calculateValueScore(listing: Listing, allListings: Listing[]): number {
  const prices = allListings.map((l) => l.current_price);
  const etas = allListings.map((l) => l.eta_minutes);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minEta = Math.min(...etas);
  const maxEta = Math.max(...etas);

  const priceRange = maxPrice - minPrice || 1;
  const etaRange = maxEta - minEta || 1;

  // Normalized scores (0 to 100)
  const priceScore = 100 - ((listing.current_price - minPrice) / priceRange) * 100;
  const etaScore = 100 - ((listing.eta_minutes - minEta) / etaRange) * 100;
  const stockScore = listing.in_stock ? (listing.stock_count && listing.stock_count < 5 ? 60 : 100) : 0;

  // Weighted Composition: 50% Price, 35% Speed (ETA), 15% Stock Urgency
  return Math.round(priceScore * 0.5 + etaScore * 0.35 + stockScore * 0.15);
}
```

### 5.2 Multi-Platform Splits UI
- In `/basket`, orders are grouped by optimal strategies.
- Results dynamically display estimated cost savings, visual delivery splits formatted with custom badges (`PlatformBadge`), and real-time toasts displaying positive delta indicators.
