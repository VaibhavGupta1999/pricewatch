"use client";

import { memo, useMemo } from "react";
import { ArrowDown, ArrowUp, Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useTickerItems } from "@/store";

const DEFAULT_ITEMS = [
  { id: "d1", product: "Amul Butter 500g", platform: "Blinkit", event: "PRICE_DROP", value: "-₹5", isPositive: true, timestamp: Date.now() },
  { id: "d2", product: "iPhone 15", platform: "Amazon", event: "PRICE_SPIKE", value: "+₹200", isPositive: false, timestamp: Date.now() },
  { id: "d3", product: "Maggi Noodles", platform: "Zepto", event: "ETA_IMPROVED", value: "3 min faster", isPositive: true, timestamp: Date.now() },
  { id: "d4", product: "Fortune Oil 1L", platform: "BigBasket", event: "PRICE_DROP", value: "-₹12", isPositive: true, timestamp: Date.now() },
  { id: "d5", product: "Oreo Cookies", platform: "Instamart", event: "LOW_STOCK", value: "Only 3 left", isPositive: false, timestamp: Date.now() },
  { id: "d6", product: "Tata Salt 1kg", platform: "Blinkit", event: "BACK_IN_STOCK", value: "Back in stock", isPositive: true, timestamp: Date.now() },
  { id: "d7", product: "Fresh Paneer", platform: "Zepto", event: "PRICE_DROP", value: "-₹8", isPositive: true, timestamp: Date.now() },
  { id: "d8", product: "MacBook Air M3", platform: "Amazon", event: "TRENDING", value: "High Demand", isPositive: true, timestamp: Date.now() },
];

function getEventIcon(event: string) {
  if (event.includes("PRICE_DROP") || event.includes("BACK")) return <ArrowDown className="w-3 h-3" />;
  if (event.includes("SPIKE")) return <ArrowUp className="w-3 h-3" />;
  if (event.includes("ETA")) return <Clock className="w-3 h-3" />;
  if (event.includes("TREND")) return <TrendingUp className="w-3 h-3" />;
  if (event.includes("STOCK")) return <AlertTriangle className="w-3 h-3" />;
  return <Activity className="w-3 h-3" />;
}

export const LiveTicker = memo(function LiveTicker() {
  const storeItems = useTickerItems();
  const items = storeItems.length > 0 ? storeItems : DEFAULT_ITEMS;

  // Duplicate for seamless infinite scroll
  const duplicated = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="w-full bg-[#060608] border-b border-zinc-900/60 overflow-hidden h-7.5 flex items-center relative">
      {/* Gradient Fades for modern visual bounds */}
      <div className="absolute left-0 top-0 h-full w-14 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none" />

      {/* Tiny live status beacon */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
        <span className="relative flex h-1 w-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500" />
        </span>
      </div>

      {/* Crawling Ticker Items */}
      <div className="flex animate-ticker whitespace-nowrap pl-10">
        {duplicated.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center gap-1.5 px-4.5 text-[10px] font-medium whitespace-nowrap"
          >
            <span className={item.isPositive ? "text-emerald-500" : "text-red-500"}>
              {getEventIcon(item.event)}
            </span>
            <span className="text-zinc-400 font-semibold">{item.product}</span>
            <span className="text-zinc-600 font-normal">on</span>
            <span className="text-zinc-500 font-semibold">{item.platform}</span>
            <span className={`font-bold ${item.isPositive ? "text-emerald-500" : "text-red-500"}`}>
              {item.value}
            </span>
            <span className="text-zinc-900 font-light ml-3">•</span>
          </div>
        ))}
      </div>
    </div>
  );
});
