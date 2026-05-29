"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Package,
  Clock,
  ShieldCheck,
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const PLATFORM_COLORS: Record<string, string> = {
  amazon: "#ff9900",
  bigbasket: "#84c225",
  blinkit: "#fbd504",
  zepto: "#5c049c",
  instamart: "#ff6c04",
};

const PLATFORM_NAMES: Record<string, string> = {
  amazon: "Amazon",
  bigbasket: "BigBasket",
  blinkit: "Blinkit",
  zepto: "Zepto",
  instamart: "Instamart",
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<{ results: Product[]; total: number }>({
    queryKey: ["products-all-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/products/?limit=200");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const products = data?.results || [];

  // ========= DERIVED ANALYTICS =========
  const analytics = useMemo(() => {
    if (!products.length) return null;

    const allListings = products.flatMap((p) => p.listings);
    const totalListings = allListings.length;
    const inStockListings = allListings.filter((l) => l.in_stock);
    const outOfStockListings = allListings.filter((l) => !l.in_stock);
    const trendingProducts = products.filter((p) => p.is_trending);

    // Platform distribution
    const platformCounts: Record<string, number> = {};
    const platformTotalPrice: Record<string, number> = {};
    const platformTotalEta: Record<string, number> = {};
    
    allListings.forEach((l) => {
      platformCounts[l.platform_id] = (platformCounts[l.platform_id] || 0) + 1;
      platformTotalPrice[l.platform_id] = (platformTotalPrice[l.platform_id] || 0) + l.current_price;
      platformTotalEta[l.platform_id] = (platformTotalEta[l.platform_id] || 0) + l.eta_minutes;
    });

    const platformDistribution = Object.entries(platformCounts).map(([pid, count]) => ({
      name: PLATFORM_NAMES[pid] || pid,
      value: count,
      color: PLATFORM_COLORS[pid] || "#71717a",
    }));

    // Average prices by platform
    const avgPriceByPlatform = Object.entries(platformCounts).map(([pid, count]) => ({
      platform: PLATFORM_NAMES[pid] || pid,
      avgPrice: Math.round(platformTotalPrice[pid] / count),
      avgEta: Math.round(platformTotalEta[pid] / count),
      color: PLATFORM_COLORS[pid] || "#71717a",
    }));

    // Category breakdown
    const categoryCounts: Record<string, number> = { A: 0, B: 0, C: 0 };
    products.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    const categoryData = [
      { name: "Electronics (A)", value: categoryCounts.A, color: "#8b5cf6" },
      { name: "Fresh (B)", value: categoryCounts.B, color: "#06b6d4" },
      { name: "Essentials (C)", value: categoryCounts.C, color: "#10b981" },
    ];

    // Top movers: products with biggest price drops
    const topMovers = products
      .filter((p) => p.listings.length > 0)
      .map((p) => {
        const cheapest = p.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b));
        const savings = cheapest.original_price - cheapest.current_price;
        const pct = cheapest.original_price > 0 ? Math.round((savings / cheapest.original_price) * 100) : 0;
        return { name: p.name, savings, pct, cheapestPrice: cheapest.current_price, originalPrice: cheapest.original_price, platform: cheapest.platform_id };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);

    // Price volatility mock: simulated per-hour data
    const volatilityData = Array.from({ length: 24 }, (_, i) => {
      const hour = `${i.toString().padStart(2, "0")}:00`;
      return {
        time: hour,
        drops: Math.floor(Math.random() * 15) + 5,
        spikes: Math.floor(Math.random() * 10) + 2,
      };
    });

    return {
      totalProducts: products.length,
      totalListings,
      inStockPct: Math.round((inStockListings.length / totalListings) * 100),
      outOfStock: outOfStockListings.length,
      trendingCount: trendingProducts.length,
      avgPrice: Math.round(allListings.reduce((s, l) => s + l.current_price, 0) / totalListings),
      platformDistribution,
      avgPriceByPlatform,
      categoryData,
      topMovers,
      volatilityData,
    };
  }, [products]);

  if (isLoading || !analytics) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-price-drop rounded-full animate-spin" />
        <span className="text-sm text-zinc-500 font-semibold">Loading Market Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full py-8 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[40vw] h-[40vh] bg-insight/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vh] bg-price-drop/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-insight" />
            Market Analytics
            <span className="text-xs font-semibold px-2 py-0.5 bg-price-drop/10 border border-price-drop/20 text-price-drop rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Feed
            </span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time market intelligence dashboard — aggregated from all platform feeds.
          </p>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Products", value: analytics.totalProducts, icon: Package, color: "text-zinc-100" },
            { label: "Active Listings", value: analytics.totalListings, icon: Activity, color: "text-cyan-400" },
            { label: "In-Stock Rate", value: `${analytics.inStockPct}%`, icon: ShieldCheck, color: "text-emerald-400" },
            { label: "Trending", value: analytics.trendingCount, icon: TrendingUp, color: "text-amber-400" },
            { label: "Avg Price", value: formatPrice(analytics.avgPrice), icon: Zap, color: "text-violet-400" },
            { label: "Out of Stock", value: analytics.outOfStock, icon: AlertTriangle, color: "text-red-400" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
              className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-2 hover:bg-zinc-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">{kpi.label}</span>
              </div>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Distribution Pie */}
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-insight" />
              Platform Coverage Distribution
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.platformDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.platformDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-price-drop" />
              Category Breakdown
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryData} barSize={40}>
                  <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {analytics.categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Price Volatility Chart */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              24hr Price Volatility Index
            </h3>
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
              SIMULATED
            </span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.volatilityData}>
                <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="drops" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="spikes" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Movers Table */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            Top Price Movers — Biggest Discounts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-900/60">
                  {["Product", "Current", "Original", "Savings", "Platform"].map((h) => (
                    <th key={h} className="py-2.5 px-4 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.topMovers.map((m, idx) => (
                  <motion.tr
                    key={m.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-zinc-900/30 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-zinc-200 max-w-[200px] truncate">{m.name}</td>
                    <td className="py-3 px-4 text-sm font-bold text-emerald-400">{formatPrice(m.cheapestPrice)}</td>
                    <td className="py-3 px-4 text-sm text-zinc-500 line-through">{formatPrice(m.originalPrice)}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <ArrowDown className="w-3 h-3" />
                        {m.pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {PLATFORM_NAMES[m.platform] || m.platform}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Avg Price + ETA Comparison */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Platform Average ETA Comparison
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.avgPriceByPlatform} barSize={32}>
                <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                <XAxis dataKey="platform" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Minutes", angle: -90, position: "insideLeft", style: { fill: "#52525b", fontSize: 10 } }} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="avgEta" name="Avg ETA (min)" radius={[6, 6, 0, 0]}>
                  {analytics.avgPriceByPlatform.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
