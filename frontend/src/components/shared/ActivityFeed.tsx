"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, TrendingUp, Bell, AlertTriangle, Package } from "lucide-react";
import { useActivityFeed, useActivityFeedCount } from "@/store";
import { timeAgo } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  price: <Zap className="w-3 h-3 text-emerald-500" />,
  eta: <Clock className="w-3 h-3 text-blue-500" />,
  trend: <TrendingUp className="w-3 h-3 text-amber-500" />,
  alert: <Bell className="w-3 h-3 text-indigo-500" />,
  stock: <AlertTriangle className="w-3 h-3 text-red-500" />,
  insight: <Package className="w-3 h-3 text-zinc-400" />,
};

const TYPE_COLORS: Record<string, string> = {
  price: "border-l-emerald-500/30 bg-emerald-500/[0.01]",
  eta: "border-l-blue-500/30 bg-blue-500/[0.01]",
  trend: "border-l-amber-500/30 bg-amber-500/[0.01]",
  alert: "border-l-indigo-500/30 bg-indigo-500/[0.01]",
  stock: "border-l-red-500/30 bg-red-500/[0.01]",
  insight: "border-l-zinc-500/30 bg-zinc-500/[0.01]",
};

export const ActivityFeed = memo(function ActivityFeed() {
  const activityFeed = useActivityFeed();
  const feedCount = useActivityFeedCount();

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 h-full border-l border-zinc-900/60 bg-zinc-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
            Live Stream
          </span>
        </div>
        <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800/40 px-1.5 py-0.5 rounded">
          {feedCount}
        </span>
      </div>

      {/* Feed List Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
        {activityFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <Zap className="w-6 h-6 text-zinc-800 animate-pulse" />
            <p className="text-[10px] text-zinc-600 font-medium">
              Waiting for live signals...
            </p>
          </div>
        ) : (
          <div className="py-1">
            <AnimatePresence initial={false}>
              {activityFeed.slice(0, 30).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className={`px-4.5 py-3.5 border-b border-zinc-900/40 border-l-2 ${TYPE_COLORS[event.type] || "border-l-zinc-850"} hover:bg-zinc-900/10 transition-colors`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5 shrink-0">
                      {TYPE_ICONS[event.type] || TYPE_ICONS.insight}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[11px] text-zinc-300 font-medium leading-relaxed line-clamp-2">
                        {event.message}
                      </p>
                      <p className="text-[9px] text-zinc-650 font-medium">
                        {timeAgo(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  );
});
