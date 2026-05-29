"use client";

import React, { memo, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Clock, ShoppingCart, Eye, TrendingUp, LineChart as LineChartIcon, Activity } from "lucide-react";
import { PlatformBadge, ValueScoreBadge } from "@/components/shared/Badges";
import { formatPrice, formatETA, calcSavingsPercent } from "@/lib/utils";
import type { Product, Listing } from "@/types";
import { useBasketStore } from "@/store";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy load Recharts — avoids ~80KB blocking the initial JS bundle
const LazySparkline = dynamic(() => import("./Sparkline"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full min-h-0 flex items-center justify-center">
      <div className="w-full h-8 bg-zinc-800/30 rounded animate-pulse" />
    </div>
  ),
});

function calculateValueScore(listing: Listing, allListings: Listing[]): number {
  const prices = allListings.map((l) => l.current_price);
  const etas = allListings.map((l) => l.eta_minutes);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minEta = Math.min(...etas);
  const maxEta = Math.max(...etas);

  const priceRange = maxPrice - minPrice || 1;
  const etaRange = maxEta - minEta || 1;

  const priceScore = 100 - ((listing.current_price - minPrice) / priceRange) * 100;
  const etaScore = 100 - ((listing.eta_minutes - minEta) / etaRange) * 100;
  const stockScore = listing.in_stock ? (listing.stock_count && listing.stock_count < 5 ? 60 : 100) : 0;

  return Math.round(priceScore * 0.5 + etaScore * 0.35 + stockScore * 0.15);
}

// Generate deterministic mock history data for the sparkline based on product ID
function generateMockHistory(basePrice: number, productId: string) {
  const data = [];
  let current = basePrice * 1.1; // Start 10% higher
  // Create 14 data points (2 weeks)
  for (let i = 0; i < 14; i++) {
    // Deterministic random walk
    const rand = Math.sin((productId.charCodeAt(0) + i) * 100);
    current = current + (rand * (basePrice * 0.05));
    data.push({ val: current });
  }
  // Make the last point the actual base price
  data.push({ val: basePrice });
  return data;
}

type ViewMode = "rate" | "time";

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = memo(function ProductCard({ product, index }: ProductCardProps) {
  const addItem = useBasketStore((s) => s.addItem);
  const [viewMode, setViewMode] = useState<ViewMode>("rate");
  const [isAdded, setIsAdded] = useState(false);

  const cheapest = useMemo(() => {
    if (!product.listings.length) return null;
    return product.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b));
  }, [product.listings]);

  const fastest = useMemo(() => {
    if (!product.listings.length) return null;
    return product.listings.reduce((a, b) => (a.eta_minutes < b.eta_minutes ? a : b));
  }, [product.listings]);

  const bestScore = useMemo(() => {
    if (!product.listings.length) return null;
    return product.listings.reduce((best, l) => {
      const score = calculateValueScore(l, product.listings);
      const bestScoreVal = calculateValueScore(best, product.listings);
      return score > bestScoreVal ? l : best;
    });
  }, [product.listings]);

  const handleAddToBasket = useCallback(() => {
    addItem({ product, quantity: 1 });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  }, [addItem, product]);

  const savingsPercent = useMemo(
    () => cheapest ? calcSavingsPercent(cheapest.original_price, cheapest.current_price) : 0,
    [cheapest]
  );
  const overallScore = useMemo(
    () => bestScore ? calculateValueScore(bestScore, product.listings) : 0,
    [bestScore, product.listings]
  );
  const imageUrl = product.image_url;
  
  const historyData = useMemo(() => {
    if (!cheapest) return [];
    return generateMockHistory(cheapest.current_price, product.id);
  }, [cheapest, product.id]);

  const handleSetRate = useCallback(() => setViewMode("rate"), []);
  const handleSetTime = useCallback(() => setViewMode("time"), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 350, damping: 28 }}
      className="group relative flex flex-col rounded-xl border border-zinc-900/60 bg-zinc-950/20 hover:bg-zinc-900/10 hover:border-zinc-800 transition-all duration-300 overflow-hidden"
    >
      {/* Product Image Section */}
      <div className="relative h-40 w-full bg-zinc-900 overflow-hidden border-b border-zinc-900/60 shrink-0">
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out text-transparent"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent pointer-events-none" />
        
        {product.is_trending && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 backdrop-blur-md shadow-lg">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Trending</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase mb-1 drop-shadow-md">
              CAT {product.category}
            </p>
            <Link href={`/products/${product.id}`} className="block group/link">
              <h3 className="text-sm font-bold text-white truncate drop-shadow-lg group-hover/link:text-zinc-200 transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 space-y-3">
        {/* Toggle Switch — uses stable callbacks to avoid re-rendering */}
        <div className="relative flex p-1 bg-zinc-900/50 rounded-lg border border-zinc-800/80">
          <button
            onClick={handleSetRate}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === "rate" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Activity className="w-3 h-3" />
            rate
            {viewMode === "rate" && (
              <motion.div
                layoutId={`view-toggle-bg-${product.id}`}
                className="absolute inset-0 bg-zinc-800 rounded-md border border-zinc-700/50 shadow-sm"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={handleSetTime}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === "time" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LineChartIcon className="w-3 h-3" />
            time
            {viewMode === "time" && (
              <motion.div
                layoutId={`view-toggle-bg-${product.id}`}
                className="absolute inset-0 bg-zinc-800 rounded-md border border-zinc-700/50 shadow-sm"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* View Content Area — CSS visibility swap instead of unmount for instant switching */}
        <div className="relative h-[116px]">
          {/* Rate View */}
          <div
            className={`absolute inset-0 space-y-2 flex flex-col transition-opacity duration-150 ${
              viewMode === "rate" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className="grid grid-cols-2 gap-2 flex-1">
              {/* Cheapest Badge Block */}
              <div className="space-y-1 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center gap-1 text-zinc-400">
                  <ArrowDown className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">Cheapest</span>
                </div>
                <p className="text-[15px] font-extrabold text-emerald-400 leading-none pt-0.5 truncate">{cheapest ? formatPrice(cheapest.current_price) : "—"}</p>
                <div className="pt-1 flex flex-wrap">
                  <PlatformBadge platformId={cheapest?.platform_id || ""} />
                </div>
              </div>

              {/* Fastest Badge Block */}
              <div className="space-y-1 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center gap-1 text-zinc-400">
                  <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wider truncate">Fastest</span>
                </div>
                <p className="text-[15px] font-extrabold text-blue-400 leading-none pt-0.5 truncate">{fastest ? formatETA(fastest.eta_minutes) : "—"}</p>
                <div className="pt-1 flex flex-wrap">
                  <PlatformBadge platformId={fastest?.platform_id || ""} />
                </div>
              </div>
            </div>

            {/* Grade Score Badge Block */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 overflow-hidden shrink-0">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Eye className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Overall Grade</span>
              </div>
              <ValueScoreBadge score={overallScore} />
            </div>
          </div>

          {/* Time View */}
          <div
            className={`absolute inset-0 flex flex-col p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 transition-opacity duration-150 ${
              viewMode === "time" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-zinc-500" />
                14-Day Trend
              </span>
              {savingsPercent > 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  -{savingsPercent.toFixed(0)}% Drop
                </span>
              )}
            </div>
            
            <div className="flex-1 w-full min-h-0">
              <LazySparkline data={historyData} />
            </div>
            
            {/* AI Insight */}
            <div className="mt-2 pt-2 border-t border-zinc-800/80">
              <p className="text-[10px] text-zinc-300 font-medium leading-tight line-clamp-2">
                <span className="text-indigo-400 font-bold mr-1">AI:</span>
                {savingsPercent > 5 
                  ? "Excellent time to buy. Price is significantly lower than average." 
                  : "Price is stable. Expected to remain within current ranges."}
              </p>
            </div>
          </div>
        </div>

        {/* Card Actions Row */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/80 mt-auto shrink-0">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 text-center text-[11px] font-bold text-zinc-300 hover:text-zinc-900 bg-zinc-800/80 hover:bg-zinc-100 border border-zinc-700/80 hover:border-zinc-300 py-2 rounded-lg transition-all"
          >
            Open Analytics
          </Link>
          <button
            onClick={handleAddToBasket}
            disabled={isAdded}
            className={`flex items-center justify-center gap-1.5 text-[11px] font-bold text-white px-4 py-2 rounded-lg transition-all cursor-pointer min-w-[76px] ${
              isAdded 
                ? "bg-zinc-700 border-zinc-600 shadow-none cursor-default"
                : "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            }`}
          >
            {isAdded ? (
              <span>Added!</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

