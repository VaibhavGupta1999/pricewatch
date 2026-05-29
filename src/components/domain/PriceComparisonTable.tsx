"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Clock, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { PlatformBadge, ValueScoreBadge } from "@/components/shared/Badges";
import { formatPrice, formatETA, calcSavingsPercent } from "@/lib/utils";
import type { Product, Listing } from "@/types";

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

interface Props {
  product: Product;
}

const TableRow = memo(function TableRow({
  listing,
  allListings,
  isCheapest,
  isFastest,
  index,
}: {
  listing: Listing;
  allListings: Listing[];
  isCheapest: boolean;
  isFastest: boolean;
  index: number;
}) {
  const score = calculateValueScore(listing, allListings);
  const savings = calcSavingsPercent(listing.original_price, listing.current_price);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 26 }}
      className={`group border-b border-zinc-900/40 hover:bg-zinc-900/30 transition-colors ${
        isCheapest && isFastest ? "bg-emerald-500/[0.03]" : ""
      }`}
    >
      {/* Platform */}
      <td className="py-3 px-4">
        <PlatformBadge platformId={listing.platform_id} size="md" />
      </td>

      {/* Price */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isCheapest ? "text-emerald-400" : "text-zinc-200"}`}>
            {formatPrice(listing.current_price)}
          </span>
          {savings > 0 && (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {savings}% off
            </span>
          )}
          {isCheapest && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 border border-emerald-500/20">
              <ArrowDown className="w-2.5 h-2.5" /> LOWEST
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-600 line-through">{formatPrice(listing.original_price)}</span>
      </td>

      {/* ETA */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-3.5 h-3.5 ${isFastest ? "text-cyan-400" : "text-zinc-500"}`} />
          <span className={`text-sm font-semibold ${isFastest ? "text-cyan-400" : "text-zinc-300"}`}>
            {formatETA(listing.eta_minutes)}
          </span>
          {isFastest && (
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 border border-cyan-500/20">
              <Zap className="w-2.5 h-2.5" /> FASTEST
            </span>
          )}
        </div>
      </td>

      {/* Stock */}
      <td className="py-3 px-4">
        {listing.in_stock ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-400">In Stock</span>
            {listing.stock_count && listing.stock_count < 10 && (
              <span className="text-[9px] text-amber-400 font-medium">({listing.stock_count} left)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-medium text-red-400">Out of Stock</span>
          </div>
        )}
      </td>

      {/* Value Score */}
      <td className="py-3 px-4">
        <ValueScoreBadge score={score} />
      </td>
    </motion.tr>
  );
});

export const PriceComparisonTable = memo(function PriceComparisonTable({ product }: Props) {
  const cheapestId = useMemo(() => {
    if (!product.listings.length) return null;
    return product.listings.reduce((a, b) => (a.current_price < b.current_price ? a : b)).id;
  }, [product.listings]);

  const fastestId = useMemo(() => {
    if (!product.listings.length) return null;
    return product.listings.reduce((a, b) => (a.eta_minutes < b.eta_minutes ? a : b)).id;
  }, [product.listings]);

  return (
    <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900/60 bg-zinc-900/20">
              {["Platform", "Price", "Delivery ETA", "Stock", "Value Score"].map((h) => (
                <th key={h} className="py-2.5 px-4 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {product.listings.map((listing, idx) => (
              <TableRow
                key={listing.id}
                listing={listing}
                allListings={product.listings}
                isCheapest={listing.id === cheapestId}
                isFastest={listing.id === fastestId}
                index={idx}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
