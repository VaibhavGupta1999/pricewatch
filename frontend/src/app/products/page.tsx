"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  Package, 
  Check, 
  Sparkles, 
  HelpCircle,
  Zap,
  ArrowUpDown,
  RefreshCw,
  Eye
} from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import type { Product } from "@/types";

// Static categories mapping for the UI
const CATEGORIES = [
  { id: "all", name: "All Categories" },
  { id: "A", name: "Electronics (Cat A)" },
  { id: "B", name: "Fresh & Produce (Cat B)" },
  { id: "C", name: "Daily Essentials (Cat C)" },
];

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [trendingOnly, setTrendingOnly] = useState(searchParams.get("trending") === "true");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("instock") === "true");
  const [sortBy, setSortBy] = useState<"name" | "price_low" | "price_high" | "score">(
    (searchParams.get("sort") as any) || "score"
  );

  // Sync state changes to URL
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");

    if (activeCategory !== "all") params.set("category", activeCategory);
    else params.delete("category");

    if (trendingOnly) params.set("trending", "true");
    else params.delete("trending");

    if (inStockOnly) params.set("instock", "true");
    else params.delete("instock");

    if (sortBy !== "score") params.set("sort", sortBy);
    else params.delete("sort");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, activeCategory, trendingOnly, inStockOnly, sortBy, pathname, router, searchParams]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Fetch products from the FastAPI backend using TanStack Query
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<{ results: Product[]; total: number }>({
    queryKey: ["products", debouncedSearch, activeCategory, trendingOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (activeCategory !== "all") params.append("category", activeCategory);
      if (trendingOnly) params.append("trending", "true");

      const response = await fetch(`/api/products/?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    // Keep data fresh, let WebSocket updates handle the live shifts
    staleTime: 60_000,
  });

  const productsList = data?.results || [];

  // Client-side filtering & sorting
  const processedProducts = useMemo(() => {
    let list = [...productsList];

    // Filter by stock if selected
    if (inStockOnly) {
      list = list.filter((p) => p.listings.some((l) => l.in_stock));
    }

    // Sort products
    list.sort((a, b) => {
      const aCheapest = a.listings.length ? Math.min(...a.listings.map((l) => l.current_price)) : Infinity;
      const bCheapest = b.listings.length ? Math.min(...b.listings.map((l) => l.current_price)) : Infinity;

      // Score calculates general value score based on price + eta + stock
      const getBestScore = (prod: Product) => {
        if (!prod.listings.length) return 0;
        const prices = prod.listings.map((l) => l.current_price);
        const etas = prod.listings.map((l) => l.eta_minutes);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices) || 1;
        const minEta = Math.min(...etas);
        const maxEta = Math.max(...etas) || 1;

        return Math.max(...prod.listings.map((l) => {
          const priceRange = maxPrice - minPrice || 1;
          const etaRange = maxEta - minEta || 1;
          const priceScore = 100 - ((l.current_price - minPrice) / priceRange) * 100;
          const etaScore = 100 - ((l.eta_minutes - minEta) / etaRange) * 100;
          return Math.round(priceScore * 0.5 + etaScore * 0.35 + (l.in_stock ? 15 : 0));
        }));
      };

      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price_low") {
        return aCheapest - bCheapest;
      } else if (sortBy === "price_high") {
        return bCheapest - aCheapest;
      } else if (sortBy === "score") {
        return getBestScore(b) - getBestScore(a);
      }
      return 0;
    });

    return list;
  }, [productsList, inStockOnly, sortBy]);

  return (
    <div className="relative min-h-full w-full py-8 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[40vw] h-[40vh] bg-insight/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-[30vw] h-[30vh] bg-price-drop/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Comparative Intelligence
              <span className="text-xs font-semibold px-2 py-0.5 bg-price-drop/10 border border-price-drop/20 text-price-drop rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Cross-platform comparison across Amazon, BigBasket, Blinkit, Swiggy Instamart & Zepto.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => refetch()}
              className="p-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all flex items-center gap-2 text-xs font-semibold"
              disabled={isRefetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Sync Feeds
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-zinc-900/20 border border-zinc-900/80 p-4 rounded-xl backdrop-blur-md">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Filter by name or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 focus:outline-none focus:ring-0 text-sm text-zinc-200 placeholder:text-zinc-600 rounded-lg pl-10 pr-4 transition-all"
            />
          </div>

          {/* Categories Tab Selector */}
          <div className="lg:col-span-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`h-10 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  activeCategory === cat.id 
                    ? "bg-zinc-100 border-zinc-100 text-zinc-950 shadow-md shadow-zinc-100/5" 
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Filters / Sorting Toggle */}
          <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-zinc-900">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTrendingOnly(!trendingOnly)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  trendingOnly 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900"
                }`}
                title="Trending Products"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Hot
              </button>

              <button 
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  inStockOnly 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900"
                }`}
                title="In-stock Only"
              >
                <Package className="w-3.5 h-3.5" />
                Instock
              </button>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-10 pl-3 pr-8 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 focus:outline-none text-xs font-semibold text-zinc-300 rounded-lg appearance-none cursor-pointer"
              >
                <option value="score">Value Score</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Products Grid Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse flex flex-col justify-between p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-800 rounded w-1/3" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-zinc-800 rounded" />
                  <div className="h-12 bg-zinc-800 rounded" />
                  <div className="h-12 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 bg-zinc-800 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center p-6 space-y-4">
            <HelpCircle className="w-12 h-12 text-zinc-600" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-300">FastAPI Offline</h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                Ensure your python uvicorn backend server is running correctly to retrieve live catalog listings.
              </p>
            </div>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center p-6 space-y-3">
            <SlidersHorizontal className="w-12 h-12 text-zinc-700" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-400">No Intelligence Found</h3>
              <p className="text-zinc-600 text-xs max-w-xs">
                No catalog items matched your query. Try clearing your search or updating active filters.
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {processedProducts.map((prod, idx) => (
                <ProductCard key={prod.id} product={prod} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
