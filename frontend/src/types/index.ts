// ============================================
// PriceWatch — Core Type Definitions
// ============================================

export type PlatformType = "ecommerce" | "quick_commerce";
export type ProductCategory = "A" | "B" | "C";

export interface Platform {
  id: string;
  name: string;
  type: PlatformType;
  logo_url: string;
}

export interface Listing {
  id: string;
  product_id: string;
  platform_id: string;
  current_price: number;
  original_price: number;
  eta_minutes: number;
  in_stock: boolean;
  stock_count: number | null;
  platform: Platform;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  image_url: string;
  tags: string;
  is_trending: boolean;
  listings: Listing[];
}

export interface ProductSearchResponse {
  results: Product[];
  total: number;
}

// ============================================
// Realtime Event Types
// ============================================

export type RealtimeEventType =
  | "PRICE_UPDATE"
  | "ETA_UPDATE"
  | "BEEP"
  | "STOCK_LOW"
  | "TREND_SPIKE"
  | "PLATFORM_SURGE"
  | "ALERT_TRIGGERED";

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  timestamp: number;
  product_id?: string;
  platform_id?: string;
  listing_id?: string;
  message?: string;
  new_price?: number;
  old_price?: number;
  new_eta?: number;
  old_eta?: number;
}

// ============================================
// Ticker Items
// ============================================

export interface TickerItem {
  id: string;
  product: string;
  platform: string;
  event: string;
  value: string;
  isPositive: boolean;
  timestamp: number;
}

// ============================================
// Activity Feed
// ============================================

export interface ActivityEvent {
  id: string;
  type: "price" | "eta" | "trend" | "alert" | "stock" | "insight";
  message: string;
  time: string;
  timestamp: number;
}

// ============================================
// Basket
// ============================================

export interface BasketItem {
  product: Product;
  quantity: number;
  selectedPlatformId?: string;
}

export interface BasketOptimization {
  totalSavings: number;
  totalEtaMinutes: number;
  splits: {
    platformId: string;
    platformName: string;
    items: { productName: string; price: number; eta: number }[];
    subtotal: number;
  }[];
  recommendation: string;
}

// ============================================
// Value Score
// ============================================

export interface ValueScore {
  overall: number; // 0-100
  priceScore: number;
  etaScore: number;
  stockScore: number;
  reliabilityScore: number;
  recommendation: "cheapest" | "fastest" | "balanced" | "best_overall";
}

// ============================================
// Platform Badge Colors
// ============================================

export const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  amazon: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-orange-500/10" },
  bigbasket: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", glow: "shadow-green-500/10" },
  blinkit: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", glow: "shadow-yellow-500/10" },
  zepto: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/10" },
  instamart: { bg: "bg-orange-600/10", text: "text-orange-300", border: "border-orange-600/20", glow: "shadow-orange-600/10" },
  country_delight: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
};

export const PLATFORM_NAMES: Record<string, string> = {
  amazon: "Amazon",
  bigbasket: "BigBasket",
  blinkit: "Blinkit",
  zepto: "Zepto",
  instamart: "Swiggy Instamart",
  country_delight: "Country Delight",
};
