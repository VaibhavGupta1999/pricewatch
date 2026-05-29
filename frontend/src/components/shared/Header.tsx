"use client";

import { useState } from "react";
import { Search, Command, ShoppingCart, Zap, User } from "lucide-react";
import { LiveModeToggle } from "./LiveModeToggle";
import { LiveIndicator } from "./Badges";
import { useUIStore, useBasketCount } from "@/store";
import Link from "next/link";
import { AuthModal } from "./AuthModal";

export function Header() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const basketCount = useBasketCount();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900/60 bg-zinc-950/20 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-5">
          {/* Left: Brand / Logo & Search */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mr-2">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase hidden sm:inline">
                PRICEWATCH
              </span>
            </Link>

            {/* Minimal Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-3.5 h-8.5 w-64 bg-zinc-900/10 hover:bg-zinc-900/30 border border-zinc-800/40 hover:border-zinc-700/60 rounded-lg px-3 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[11px] text-zinc-500 flex-1 text-left">Search products...</span>
              <kbd className="h-5 items-center gap-0.5 rounded border border-zinc-850 bg-zinc-900 px-1.5 font-mono text-[9px] text-zinc-500 inline-flex">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>
          </div>

          {/* Right: Controls & Engine Status */}
          <div className="flex items-center gap-4">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Cart Icon Badge */}
            <Link
              href="/basket"
              className="relative p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {basketCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 text-[8px] font-semibold border border-zinc-700/30 px-0.5">
                  {basketCount}
                </span>
              )}
            </Link>

            {/* User Auth Trigger */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center justify-center p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-zinc-900" />

            {/* Calming Engine Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-zinc-900/10 rounded border border-zinc-850">
              <LiveIndicator />
              <span className="text-[9px] font-medium text-zinc-400 tracking-wide">
                ENGINE ONLINE
              </span>
            </div>

            <LiveModeToggle />
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
