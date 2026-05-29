"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Bell,
  Trash2,
  ExternalLink,
  Package,
  AlertTriangle,
  Sparkles,
  Clock,
  TrendingDown,
} from "lucide-react";
import { useAlertStore } from "@/store";
import { formatPrice, timeAgo } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/Badges";
import { useToast } from "@/components/shared/ToastProvider";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";

export default function WatchlistPage() {
  const watchlist = useAlertStore((s) => s.watchlist);
  const alerts = useAlertStore((s) => s.alerts);
  const removeFromWatchlist = useAlertStore((s) => s.removeFromWatchlist);
  const removeAlert = useAlertStore((s) => s.removeAlert);
  const { addToast } = useToast();

  // Fetch all products, then filter by watchlist IDs
  const { data, isLoading } = useQuery<{ results: Product[]; total: number }>({
    queryKey: ["products-watchlist"],
    queryFn: async () => {
      const res = await fetch("/api/products/?limit=200");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
  });

  const watchedProducts = (data?.results || []).filter((p) => watchlist.includes(p.id));

  return (
    <div className="relative min-h-full w-full py-8 px-4 md:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vh] bg-insight/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Eye className="w-7 h-7 text-insight" />
            Watchlist & Alerts
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track your favourite products and get notified when prices drop below your target threshold.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Watched Products */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold tracking-[0.1em] text-zinc-500 uppercase px-1">
              TRACKED NODES ({watchlist.length})
            </h3>

            {watchlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center p-6 space-y-3">
                <Eye className="w-12 h-12 text-zinc-700" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-400">No Tracked Products</h3>
                  <p className="text-zinc-600 text-xs max-w-xs">
                    Visit a product detail page and click &quot;Track Node&quot; to start monitoring prices.
                  </p>
                </div>
                <Link href="/products" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors">
                  Browse Catalog
                </Link>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {watchedProducts.map((product) => {
                  const cheapest = product.listings.length
                    ? product.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b))
                    : null;
                  const fastest = product.listings.length
                    ? product.listings.reduce((a, b) => (a.eta_minutes < b.eta_minutes ? a : b))
                    : null;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex items-center gap-4 group hover:border-zinc-800 transition-colors"
                    >
                      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                        <Image 
                          src={product.image_url} 
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link href={`/products/${product.id}`} className="text-sm font-semibold text-zinc-200 hover:text-white transition-colors truncate block">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          {cheapest && (
                            <span className="flex items-center gap-1">
                              <TrendingDown className="w-3 h-3 text-emerald-400" />
                              {formatPrice(cheapest.current_price)}
                              <PlatformBadge platformId={cheapest.platform_id} />
                            </span>
                          )}
                          {fastest && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {fastest.eta_minutes} min
                              <PlatformBadge platformId={fastest.platform_id} />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            removeFromWatchlist(product.id);
                            addToast("info", `${product.name} removed from watchlist.`);
                          }}
                          className="p-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Right: Active Alerts */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold tracking-[0.1em] text-zinc-500 uppercase px-1">
              PRICE THRESHOLD ALERTS ({alerts.length})
            </h3>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center p-6 space-y-3">
                <Bell className="w-10 h-10 text-zinc-700" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-400">No Active Alerts</h3>
                  <p className="text-zinc-600 text-xs max-w-xs">
                    Set a target price on any product detail page to deploy a price sensor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-zinc-200 truncate max-w-[200px]">
                          {alert.productName}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          removeAlert(alert.id);
                          addToast("info", "Alert removed.");
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500">Target threshold</span>
                      <span className="font-bold text-amber-400">
                        {alert.targetPrice ? formatPrice(alert.targetPrice) : "Any drop"}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      Created {timeAgo(alert.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
