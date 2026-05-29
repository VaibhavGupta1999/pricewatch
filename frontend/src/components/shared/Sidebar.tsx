"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  BarChart3, 
  ShoppingCart, 
  Eye, 
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useBasketCount, useWatchlistCount } from "@/store";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/products", label: "Catalog Intelligence", icon: Package },
  { href: "/analytics", label: "Market Analytics", icon: BarChart3 },
  { href: "/basket", label: "Smart Basket", icon: ShoppingCart, showBadge: "basket" },
  { href: "/watchlist", label: "Watchlist", icon: Eye, showBadge: "watchlist" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const basketCount = useBasketCount();
  const watchlistCount = useWatchlistCount();

  const getBadge = (type?: string) => {
    if (type === "basket" && basketCount > 0) return basketCount;
    if (type === "watchlist" && watchlistCount > 0) return watchlistCount;
    return null;
  };

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 h-full border-r border-zinc-900/60 bg-zinc-950/20 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand Logo Header */}
      <div className={`flex items-center h-14 px-5 border-b border-zinc-900/60 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">PRICEWATCH</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Modern Navigation Menu */}
      <nav className="flex-1 flex flex-col gap-1.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const badge = getBadge(item.showBadge);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg transition-all duration-200 ${
                collapsed ? "justify-center p-2.5" : "px-3 py-2"
              } ${
                isActive
                  ? "bg-zinc-900/40 text-white border border-zinc-800/20 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10 border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : ""}`} />
              {!collapsed && (
                <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
              )}
              {badge !== null && (
                <span className={`absolute ${collapsed ? "top-1 right-1" : "right-3 top-1/2 -translate-y-1/2"} min-w-[16px] h-4 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 text-[9px] font-semibold border border-zinc-700/30 px-1`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Compact Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-900/60">
          <div className="px-1 text-[9px] text-zinc-600 font-semibold tracking-wider uppercase">
            v1.0 • Stable Engine
          </div>
        </div>
      )}
    </aside>
  );
}
