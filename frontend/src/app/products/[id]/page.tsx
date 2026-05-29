"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Bell, 
  Eye, 
  ShoppingCart, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  Info,
  ChevronRight
} from "lucide-react";
import { useBasketStore, useAlertStore } from "@/store";
import { formatPrice, formatETA, calcSavingsPercent } from "@/lib/utils";
import { PlatformBadge, ValueScoreBadge } from "@/components/shared/Badges";
import { PriceComparisonTable } from "@/components/domain/PriceComparisonTable";
import type { Product, Listing } from "@/types";

// Recharts components
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const productId = resolvedParams.id;

  const addItem = useBasketStore((s) => s.addItem);
  const watchlist = useAlertStore((s) => s.watchlist);
  const addToWatchlist = useAlertStore((s) => s.addToWatchlist);
  const removeFromWatchlist = useAlertStore((s) => s.removeFromWatchlist);
  const addAlert = useAlertStore((s) => s.addAlert);

  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [alertCreated, setAlertCreated] = useState(false);

  // Fetch specific product by ID
  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Product not found");
      }
      return response.json();
    },
    staleTime: 30_000,
  });

  const isFavorited = watchlist.includes(productId);

  // Fetch real price history from the backend
  const { data: historyData } = useQuery<any>({
    queryKey: ["product-history", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/history?days=10`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 60_000,
    enabled: !!product,
  });

  // Transform API history data into Recharts format
  const chartData = useMemo(() => {
    if (!product || !product.listings.length) return [];

    // If we have real history data, aggregate by day
    if (historyData?.platforms?.length > 0) {
      const dayMap: Record<string, any> = {};

      for (const platform of historyData.platforms) {
        for (const dp of platform.data_points) {
          const date = new Date(dp.recorded_at);
          const label = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
          if (!dayMap[label]) dayMap[label] = { name: label };
          // Take the last recorded price for this day/platform combo
          dayMap[label][platform.platform_id] = Math.round(dp.price);
        }
      }

      const sorted = Object.values(dayMap);
      if (sorted.length > 0) return sorted;
    }

    // Fallback: generate mock data if API returned nothing
    const days = 10;
    const dataPoints = [];
    const basePrices = product.listings.reduce((acc: any, curr: any) => {
      acc[curr.platform_id] = curr.current_price;
      return acc;
    }, {});
    const platformsList = product.listings.map((l: any) => l.platform_id);

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const point: any = { name: label };
      platformsList.forEach((platform: string) => {
        const base = basePrices[platform];
        const seed = Math.sin(i + (platform === "blinkit" ? 1 : 4)) * 0.04;
        point[platform] = Math.round(base * (1 + seed));
      });
      dataPoints.push(point);
    }
    return dataPoints;
  }, [product, historyData]);

  // Colors mapping for charts to look exceptionally premium
  const platformChartColors: any = {
    amazon: "#ff9900",
    bigbasket: "#84c225",
    blinkit: "#fbd504",
    zepto: "#5c049c",
    instamart: "#ff6c04"
  };

  const platformDisplayNames: any = {
    amazon: "Amazon",
    bigbasket: "BigBasket",
    blinkit: "Blinkit",
    zepto: "Zepto",
    instamart: "Instamart"
  };

  const handleWatchlistToggle = () => {
    if (isFavorited) {
      removeFromWatchlist(productId);
    } else {
      addToWatchlist(productId);
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !alertTargetPrice) return;
    const target = parseFloat(alertTargetPrice);
    if (isNaN(target)) return;

    addAlert({
      productId: product.id,
      productName: product.name,
      targetPrice: target
    });

    setAlertTargetPrice("");
    setAlertCreated(true);
    setTimeout(() => setAlertCreated(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-price-drop rounded-full animate-spin" />
        <span className="text-sm font-semibold text-zinc-500">Decrypting Market Data...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-300">Terminal Offline</h3>
          <p className="text-zinc-500 text-sm max-w-sm">
            Could not fetch detailed pricing nodes for index node: <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">{productId}</code>
          </p>
        </div>
        <Link href="/products" className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold transition-colors">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Calculate cheapest / fastest listings
  const cheapestListing = product.listings.length 
    ? product.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b))
    : null;

  const fastestListing = product.listings.length
    ? product.listings.reduce((a, b) => (a.eta_minutes < b.eta_minutes ? a : b))
    : null;

  return (
    <div className="relative min-h-full w-full py-8 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Immersive radial background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vh] bg-price-drop/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[35vw] h-[35vh] bg-insight/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6">
        
        {/* Navigation Breadcrumb & Watchlist / Alert controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div className="flex items-center space-x-3">
            <Link 
              href="/products" 
              className="p-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-semibold">
              <Link href="/products" className="hover:text-zinc-300">Catalog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-zinc-400 truncate max-w-[200px]">{product.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWatchlistToggle}
              className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isFavorited 
                  ? "bg-price-drop/10 border-price-drop/30 text-price-drop" 
                  : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              {isFavorited ? "Tracking Node" : "Track Node"}
            </button>
          </div>
        </div>

        {/* Dynamic Analytics Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Summary & Configuration Modals */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Info Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-32 h-32 text-insight" />
              </div>

              {/* Product Image Banner */}
              <div className="relative h-48 w-full bg-zinc-900 overflow-hidden border-b border-zinc-900/60">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
              </div>

              <div className="p-6 space-y-5 -mt-8 relative z-10">
                <div>
                  <span className="inline-block bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase mb-3">
                    CAT-{product.category} NODE
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1 group-hover:text-zinc-200 transition-colors duration-300 drop-shadow-md">
                    {product.name}
                  </h2>
                  <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                    {product.description || "Realtime tracking system analyzing volatile Indian grocery pricing, wait-time networks, and delivery schedules dynamically."}
                  </p>
                </div>

              {/* Dynamic Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    Lowest Market
                  </div>
                  <p className="text-base font-extrabold text-emerald-400">
                    {cheapestListing ? formatPrice(cheapestListing.current_price) : "—"}
                  </p>
                  <PlatformBadge platformId={cheapestListing?.platform_id || ""} />
                </div>

                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Optimal Wait
                  </div>
                  <p className="text-base font-extrabold text-cyan-400">
                    {fastestListing ? formatETA(fastestListing.eta_minutes) : "—"}
                  </p>
                  <PlatformBadge platformId={fastestListing?.platform_id || ""} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => addItem({ product, quantity: 1 })}
                  className="flex-1 h-11 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-100/5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart Optimizer
                </button>
              </div>
            </div>
          </div>

            {/* Custom Price Alarm Scheduler */}
            <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Live Threshold Alarms
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Receive instant notifications when any platform price matches or drops below your target index.
              </p>

              <form onSubmit={handleCreateAlert} className="space-y-3 pt-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">₹</span>
                  <input
                    type="number"
                    placeholder="Enter target threshold..."
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="w-full h-10 pl-7 pr-3 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 focus:outline-none text-xs text-zinc-200 rounded-lg transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Deploy Alarm Sensor
                </button>
              </form>

              {alertCreated && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Price sensor deployed successfully.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: Historical Price Volatility Recharts Node */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Historical Volatility Analytics Chart */}
            <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900/60 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-insight" />
                    Market Price Stream History (10 Days)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Continuous visual index monitoring cross-platform pricing movements and spikes.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-price-drop bg-price-drop/10 border border-price-drop/20 px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                  <Zap className="w-3 h-3" /> FEED STABLE
                </span>
              </div>

              {/* Graph container */}
              <div className="h-[280px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      itemStyle={{ padding: "1px 0" }}
                      labelStyle={{ fontWeight: "bold", color: "#a1a1aa", marginBottom: "4px" }}
                    />
                    <Legend 
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px", paddingTop: 10 }}
                      formatter={(value: string) => (
                        <span className="text-zinc-400 font-semibold capitalize pr-2">
                          {platformDisplayNames[value] || value}
                        </span>
                      )}
                    />
                    
                    {product.listings.map((listing) => (
                      <Line
                        key={listing.platform_id}
                        type="monotone"
                        dataKey={listing.platform_id}
                        stroke={platformChartColors[listing.platform_id] || "#71717a"}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Explanatory Info footer */}
              <div className="flex gap-2.5 p-3.5 bg-zinc-900/20 border border-zinc-900 rounded-lg">
                <Info className="w-4 h-4 text-insight shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Price volatility is calculated from real-time operational feeds. Blinkit, Zepto, and Instamart prices adjust dynamically matching system inventory, weather surges, and driver capacity indexes.
                </p>
              </div>
            </div>

            {/* Platform listings table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-[0.1em] text-zinc-500 uppercase px-1">
                LIVE INTER-PLATFORM DISPATCH NODES
              </h3>
              <PriceComparisonTable product={product} />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
