import React, { memo } from "react";
import { PLATFORM_COLORS, PLATFORM_NAMES } from "@/types";

interface Props {
  platformId: string;
  size?: "sm" | "md";
}

export const PlatformBadge = memo(function PlatformBadge({ platformId, size = "sm" }: Props) {
  const colors = PLATFORM_COLORS[platformId] || PLATFORM_COLORS.amazon;
  const name = PLATFORM_NAMES[platformId] || platformId;

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wider uppercase border rounded ${colors.bg} ${colors.text} ${colors.border} ${
        size === "sm" ? "text-[8px] px-1.5 py-0.5 gap-1" : "text-[9px] px-2 py-0.5 gap-1.5"
      }`}
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {name}
    </span>
  );
});

interface LiveIndicatorProps {
  isLive?: boolean;
  color?: string;
}

export const LiveIndicator = memo(function LiveIndicator({ isLive = true, color = "bg-emerald-500" }: LiveIndicatorProps) {
  if (!isLive) return null;
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color}`} />
    </span>
  );
});

interface ValueScoreBadgeProps {
  score: number; // 0-100
  recommendation?: string;
}

export const ValueScoreBadge = memo(function ValueScoreBadge({ score, recommendation }: ValueScoreBadgeProps) {
  let color = "text-zinc-500 border-zinc-900 bg-zinc-950/20";
  let label = "Fair";

  if (score >= 85) {
    color = "text-emerald-500 border-emerald-500/10 bg-emerald-500/5";
    label = recommendation || "Optimal";
  } else if (score >= 70) {
    color = "text-blue-500 border-blue-500/10 bg-blue-500/5";
    label = recommendation || "Good";
  } else if (score >= 50) {
    color = "text-amber-500 border-amber-500/10 bg-amber-500/5";
    label = recommendation || "Average";
  } else {
    color = "text-zinc-500 border-zinc-900 bg-zinc-950/20";
    label = recommendation || "Poor";
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded border ${color}`}>
      {/* High-Precision SVG Mini Arc */}
      <div className="relative w-5 h-5">
        <svg viewBox="0 0 36 36" className="w-5 h-5 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="2"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">{score}</span>
      </div>
      <span className="text-[9px] font-semibold tracking-wide">{label}</span>
    </div>
  );
});
