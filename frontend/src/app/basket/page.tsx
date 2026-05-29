"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Zap,
  ArrowDown,
  Clock,
  ShieldCheck,
  Package,
  Sparkles,
  RefreshCw,
  Eye
} from "lucide-react";
import { useBasketStore } from "@/store";
import { formatPrice, formatETA } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/Badges";
import { useToast } from "@/components/shared/ToastProvider";
import Link from "next/link";

type Strategy = "cheapest" | "fastest" | "balanced";

interface OptimizedResult {
  strategy: string;
  splits: {
    platform_id: string;
    platform_name: string;
    items: { product_name: string; price: number; quantity: number; total: number; eta: number }[];
    subtotal: number;
    estimated_eta: number;
  }[];
  total_cost: number;
  total_savings: number;
  max_eta_minutes: number;
  recommendation: string;
}

export default function BasketPage() {
  const items = useBasketStore((s) => s.items);
  const removeItem = useBasketStore((s) => s.removeItem);
  const updateQuantity = useBasketStore((s) => s.updateQuantity);
  const clearBasket = useBasketStore((s) => s.clearBasket);
  const { addToast } = useToast();

  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const rawTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const cheapest = item.product.listings.length
        ? Math.min(...item.product.listings.map((l) => l.current_price))
        : 0;
      return sum + cheapest * item.quantity;
    }, 0);
  }, [items]);

  const handleOptimize = async () => {
    if (!items.length) return;
    setOptimizing(true);
    try {
      const res = await fetch("/api/products/basket/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          strategy,
        }),
      });
      if (res.ok) {
        const data: OptimizedResult = await res.json();
        setOptimizedResult(data);
        addToast("success", `Basket optimized with ${strategy} strategy — saving ${formatPrice(data.total_savings)}!`);
      } else {
        addToast("error", "Optimization failed. Backend may be offline.");
      }
    } catch {
      addToast("error", "Network error. Ensure the backend is running.");
    } finally {
      setOptimizing(false);
    }
  };

  const activeStyles: Record<Strategy, string> = {
    cheapest: "bg-emerald-500/5 border-emerald-500/20 text-emerald-500",
    fastest: "bg-blue-500/5 border-blue-500/20 text-blue-500",
    balanced: "bg-indigo-500/5 border-indigo-500/20 text-indigo-500",
  };

  return (
    <div className="relative min-h-full w-full py-12 px-6 md:px-12 max-w-6xl mx-auto space-y-10">
      
      {/* Page Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-zinc-400" />
            Smart Basket Optimizer
          </h1>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
            Multi-platform split compiler — finding the cheapest, fastest, or most balanced distribution routes.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              clearBasket();
              setOptimizedResult(null);
              addToast("info", "Basket cleared.");
            }}
            className="px-3 py-1.5 bg-zinc-900/10 hover:bg-red-500/[0.03] border border-zinc-900 hover:border-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg text-[10px] font-semibold tracking-wide transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            Clear Catalog Items
          </button>
        )}
      </div>

      <div className="relative z-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/20 border border-zinc-900 rounded-2xl text-center p-6 space-y-4 max-w-lg mx-auto">
            <Package className="w-8 h-8 text-zinc-700" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-400">Basket is Empty</h3>
              <p className="text-zinc-650 text-xs max-w-xs leading-relaxed">
                Add products from the catalog intelligence view to initialize order optimization checks.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-1">
                Selected Products ({items.length})
              </h3>
              
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const cheapest = item.product.listings.length
                    ? item.product.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b))
                    : null;

                  return (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-4 rounded-xl border border-zinc-900/60 bg-zinc-950/20 flex items-center gap-4 hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Link href={`/products/${item.product.id}`} className="text-xs font-bold text-zinc-300 hover:text-white transition-colors truncate block">
                          {item.product.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[9px] text-zinc-555">
                          <span className="font-medium">Best option: {cheapest ? formatPrice(cheapest.current_price) : "—"}</span>
                          {cheapest && <PlatformBadge platformId={cheapest.platform_id} />}
                        </div>
                      </div>

                      {/* Quantity Incrementor */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 bg-zinc-900 border border-zinc-900 hover:border-zinc-850 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-zinc-300">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 bg-zinc-900 border border-zinc-900 hover:border-zinc-850 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total cost for item */}
                      <div className="text-right shrink-0 min-w-[60px]">
                        <p className="text-xs font-bold text-zinc-200">
                          {cheapest ? formatPrice(cheapest.current_price * item.quantity) : "—"}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          removeItem(item.product.id);
                          addToast("info", `${item.product.name} removed from basket.`);
                        }}
                        className="p-1 text-zinc-750 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right: Optimization Setup */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Strategy Selector Panel */}
              <div className="p-5 rounded-xl border border-zinc-900/60 bg-zinc-950/20 space-y-5">
                <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-zinc-400" />
                  Select Strategy
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "cheapest" as Strategy, label: "Cheapest", icon: ArrowDown },
                    { key: "fastest" as Strategy, label: "Fastest", icon: Clock },
                    { key: "balanced" as Strategy, label: "Balanced", icon: ShieldCheck },
                  ]).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { setStrategy(s.key); setOptimizedResult(null); }}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        strategy === s.key
                          ? activeStyles[s.key]
                          : "bg-zinc-950/20 border-zinc-900/60 text-zinc-555 hover:text-zinc-300"
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5 mx-auto mb-1.5" />
                      <span className="text-[10px] font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Subtotal Summary */}
                <div className="pt-4 border-t border-zinc-900 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Estimated cost</span>
                    <span className="font-bold text-zinc-300">{formatPrice(rawTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Units selected</span>
                    <span className="font-bold text-zinc-300">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="w-full h-9 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-[11px] rounded transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {optimizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Compile Optimal Splitting
                    </>
                  )}
                </button>
              </div>

              {/* Optimization Result Display */}
              {optimizedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/20 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Optimized Solution
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800/40 px-2 py-0.5 rounded uppercase tracking-wider">
                      {optimizedResult.strategy}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-relaxed italic">{optimizedResult.recommendation}</p>

                  {/* Pricing metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-900/10 border border-zinc-900/60 rounded-lg">
                      <p className="text-[9px] text-zinc-500 font-semibold tracking-wide uppercase">Total Charge</p>
                      <p className="text-base font-bold text-zinc-200 mt-0.5">{formatPrice(optimizedResult.total_cost)}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/10 border border-zinc-900/60 rounded-lg">
                      <p className="text-[9px] text-zinc-500 font-semibold tracking-wide uppercase">Computed Savings</p>
                      <p className="text-base font-bold text-emerald-500 mt-0.5">{formatPrice(optimizedResult.total_savings)}</p>
                    </div>
                  </div>

                  {/* Splitting Distribution Cards */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[9px] font-semibold text-zinc-650 tracking-wider uppercase">Fulfillment splits</p>
                    
                    {optimizedResult.splits.map((split) => (
                      <div key={split.platform_id} className="p-3 bg-zinc-900/10 border border-zinc-900/60 rounded-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <PlatformBadge platformId={split.platform_id} size="md" />
                          <div className="text-right">
                            <p className="text-xs font-bold text-zinc-300">{formatPrice(split.subtotal)}</p>
                            <p className="text-[9px] text-zinc-555 font-medium">{formatETA(split.estimated_eta)} delivery</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 pl-2 border-l border-zinc-850">
                          {split.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[10px] text-zinc-400">
                              <span className="truncate max-w-[170px]">{item.product_name} ×{item.quantity}</span>
                              <span className="font-semibold text-zinc-300">{formatPrice(item.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-[9px] text-zinc-555 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    MAX ARRIVAL WINDOW: {formatETA(optimizedResult.max_eta_minutes)}
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
