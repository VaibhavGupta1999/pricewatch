"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X, TrendingUp, Clock, Package, Sparkles } from "lucide-react";
import { useUIStore } from "@/store";
import Link from "next/link";

const QUICK_LINKS = [
  { label: "Amul Butter", href: "/products?q=butter" },
  { label: "iPhone 15", href: "/products?q=iphone" },
  { label: "Fresh Vegetables", href: "/products?category=B" },
  { label: "Trending Now", href: "/products?trending=true" },
  { label: "Electronics", href: "/products?category=A" },
];

interface SearchResult {
  id: string;
  name: string;
  category: string;
  is_trending: boolean;
}

export function CommandPalette() {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      setOpen(false);
      window.location.href = `/products/${results[selectedIndex].id}`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[95vw] max-w-2xl"
          >
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-900">
                <Search className="w-5 h-5 text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, categories, tags..."
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 font-mono text-[10px] text-zinc-500">
                  ESC
                </kbd>
                <button onClick={() => setOpen(false)} className="p-1 text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {loading && (
                  <div className="px-5 py-8 flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <div className="w-4 h-4 border-2 border-zinc-700 border-t-price-drop rounded-full animate-spin" />
                    Searching intelligence nodes...
                  </div>
                )}

                {!loading && query && results.length === 0 && (
                  <div className="px-5 py-8 text-center text-zinc-500 text-sm">
                    No products found for &quot;{query}&quot;
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-600 tracking-widest uppercase">
                      Products
                    </div>
                    {results.map((r, idx) => (
                      <Link
                        key={r.id}
                        href={`/products/${r.id}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between gap-3 px-5 py-3 transition-colors ${
                          idx === selectedIndex ? "bg-zinc-900/80" : "hover:bg-zinc-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Package className="w-4 h-4 text-zinc-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-zinc-200 truncate block">{r.name}</span>
                            <span className="text-[10px] text-zinc-600">Category {r.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.is_trending && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              HOT
                            </span>
                          )}
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {!query && (
                  <div className="py-3">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-600 tracking-widest uppercase">
                      Quick Actions
                    </div>
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm font-medium text-zinc-300">{link.label}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-900 bg-zinc-950/50">
                <span className="text-[10px] text-zinc-600">
                  PriceWatch Command Palette v1.0
                </span>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">↵</kbd>
                    Open
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
