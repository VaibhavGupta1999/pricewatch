// ============================================
// PriceWatch — Zustand Stores (Feature-Split)
// Optimized with stable selectors and useShallow
// ============================================

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo } from "react";
import type { TickerItem, ActivityEvent, BasketItem, RealtimeEvent } from "@/types";
import { uid } from "@/lib/utils";

// ============================================
// 1. UI Store — theme, layout, modals
// ============================================

interface UIState {
  isLiveMode: boolean;
  isSearchOpen: boolean;
  toggleLiveMode: () => void;
  setSearchOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLiveMode: true,
  isSearchOpen: false,
  toggleLiveMode: () => set((s) => ({ isLiveMode: !s.isLiveMode })),
  setSearchOpen: (v) => set({ isSearchOpen: v }),
}));

// Stable scalar selectors — these are primitives, no useShallow needed
export const useIsLiveMode = () => useUIStore((s) => s.isLiveMode);
export const useIsSearchOpen = () => useUIStore((s) => s.isSearchOpen);

// ============================================
// 2. Live Event Store — realtime WebSocket events
// Uses a bounded ring buffer to prevent memory leaks.
// ============================================

const MAX_EVENTS = 200;
const MAX_TICKER = 30;
const MAX_ACTIVITY = 50;

interface LiveEventState {
  events: RealtimeEvent[];
  tickerItems: TickerItem[];
  activityFeed: ActivityEvent[];
  pushEvent: (event: RealtimeEvent) => void;
  pushTicker: (item: TickerItem) => void;
  pushActivity: (item: ActivityEvent) => void;
}

export const useLiveStore = create<LiveEventState>((set) => ({
  events: [],
  tickerItems: [],
  activityFeed: [],
  pushEvent: (event) =>
    set((s) => ({
      events: [...s.events, event].slice(-MAX_EVENTS),
    })),
  pushTicker: (item) =>
    set((s) => ({
      tickerItems: [item, ...s.tickerItems].slice(0, MAX_TICKER),
    })),
  pushActivity: (item) =>
    set((s) => ({
      activityFeed: [item, ...s.activityFeed].slice(0, MAX_ACTIVITY),
    })),
}));

// Shallow selectors — only re-render when the specific array reference changes
export const useTickerItems = () => useLiveStore(useShallow((s) => s.tickerItems));
export const useActivityFeed = () => useLiveStore(useShallow((s) => s.activityFeed));
export const useActivityFeedCount = () => useLiveStore((s) => s.activityFeed.length);

// ============================================
// 3. Basket Store — cart and optimization
// ============================================

interface BasketState {
  items: BasketItem[];
  addItem: (item: BasketItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearBasket: () => void;
}

export const useBasketStore = create<BasketState>((set) => ({
  items: [],
  addItem: (item) =>
    set((s) => {
      const exists = s.items.find((i) => i.product.id === item.product.id);
      if (exists) {
        return {
          items: s.items.map((i) =>
            i.product.id === item.product.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...s.items, item] };
    }),
  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),
  updateQuantity: (productId, qty) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.max(1, qty) } : i
      ),
    })),
  clearBasket: () => set({ items: [] }),
}));

// Scalar selector — prevents re-render on items array content change
export const useBasketCount = () => useBasketStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0));
// Shallow selector for the full items array
export const useBasketItems = () => useBasketStore(useShallow((s) => s.items));

// ============================================
// 4. Alert / Watchlist Store
// ============================================

interface AlertItem {
  id: string;
  productId: string;
  productName: string;
  targetPrice?: number;
  createdAt: number;
}

interface AlertState {
  watchlist: string[]; // product IDs
  alerts: AlertItem[];
  addToWatchlist: (productId: string) => void;
  removeFromWatchlist: (productId: string) => void;
  addAlert: (alert: Omit<AlertItem, "id" | "createdAt">) => void;
  removeAlert: (alertId: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  watchlist: [],
  alerts: [],
  addToWatchlist: (productId) =>
    set((s) => ({
      watchlist: s.watchlist.includes(productId)
        ? s.watchlist
        : [...s.watchlist, productId],
    })),
  removeFromWatchlist: (productId) =>
    set((s) => ({
      watchlist: s.watchlist.filter((id) => id !== productId),
    })),
  addAlert: (alert) =>
    set((s) => ({
      alerts: [...s.alerts, { ...alert, id: uid(), createdAt: Date.now() }],
    })),
  removeAlert: (alertId) =>
    set((s) => ({
      alerts: s.alerts.filter((a) => a.id !== alertId),
    })),
}));

// Scalar selector
export const useWatchlistCount = () => useAlertStore((s) => s.watchlist.length);

