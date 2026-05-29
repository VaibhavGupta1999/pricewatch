"use client";

import { Zap } from "lucide-react";
import { useUIStore } from "@/store";

export function LiveModeToggle() {
  const isLiveMode = useUIStore((s) => s.isLiveMode);
  const toggleLiveMode = useUIStore((s) => s.toggleLiveMode);

  return (
    <button
      onClick={toggleLiveMode}
      className="flex items-center gap-2 group cursor-pointer"
    >
      <span className={`text-[10px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 ${isLiveMode ? "text-emerald-400" : "text-zinc-600"}`}>
        Live
      </span>

      <div
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
          isLiveMode
            ? "bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : "bg-zinc-800 border border-zinc-700"
        }`}
      >
        <span
          className={`inline-flex items-center justify-center h-3.5 w-3.5 transform rounded-full transition-all duration-300 ${
            isLiveMode ? "translate-x-[18px] bg-emerald-400" : "translate-x-[3px] bg-zinc-500"
          }`}
        >
          {isLiveMode && <Zap className="w-2 h-2 text-zinc-950 fill-zinc-950" />}
        </span>
      </div>
    </button>
  );
}
