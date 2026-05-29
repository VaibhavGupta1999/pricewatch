"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Command, Activity, Zap, ShieldCheck, ArrowRight, BarChart3 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/products`);
    }
  };
  return (
    <div className="relative min-h-full w-full flex flex-col items-center py-24 px-6 md:px-16 overflow-x-hidden">
      
      {/* Soft Radial Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[45vh] bg-zinc-800/[0.03] blur-[130px] rounded-full" />
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* Sleek SaaS Status Capsule */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-8 inline-flex items-center space-x-2 bg-zinc-900/30 border border-zinc-800/40 px-3.5 py-1 rounded-full backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
            Systems Operational • 14,204 Live Listings
          </span>
        </motion.div>

        {/* Crisp Headline & Minimal Description */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, type: "spring" }}
          className="text-center space-y-5 max-w-3xl"
        >
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Real-time commerce intelligence
            <br />
            <span className="text-zinc-500">
              for high-velocity decisions.
            </span>
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Monitor, compare, and optimize inventory pricing and delivery windows across marketplaces and quick-commerce networks in a unified intelligence workspace.
          </p>
        </motion.div>

        {/* Minimal High-Precision Search Bar (Linear/Vercel style) */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
          className="w-full max-w-2xl mt-10 mb-20 relative group z-20"
        >
          <form 
            onSubmit={handleSearch}
            className="relative h-12 bg-zinc-900/20 backdrop-blur-xl border border-zinc-800/60 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-zinc-700/80 focus-within:border-zinc-600/80 transition-all duration-300 flex items-center px-3.5 overflow-hidden"
          >
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 'Amul Butter', 'iPhone 15', or enter a product URL..." 
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
            />
            <div className="hidden sm:flex items-center gap-1.5 mr-3">
              <kbd className="h-6 items-center gap-0.5 rounded border border-zinc-800/80 bg-zinc-900 px-1.5 font-mono text-[9px] font-medium text-zinc-500 shadow-sm inline-flex">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </div>
            <button 
              type="submit"
              className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              Analyze
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>

        {/* Clean Dashboard Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard 
            delay={0.15}
            title="Real-Time Data Streams"
            value="14.2M"
            trend="+12% activity today"
            icon={Zap}
            color="emerald"
          />
          <MetricCard 
            delay={0.2}
            title="ETA Tracking Precision"
            value="98.4%"
            trend="Sub-minute latency"
            icon={ShieldCheck}
            color="blue"
          />
          <MetricCard 
            delay={0.25}
            title="Market Volatility Index"
            value="Moderate"
            trend="Normal fluctuations"
            icon={BarChart3}
            color="amber"
          />
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color, delay }: any) {
  const accentColors: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring" }}
      className="p-5 rounded-xl border border-zinc-900/60 bg-zinc-950/20 hover:bg-zinc-900/10 hover:border-zinc-800/80 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-zinc-500 tracking-wide">{title}</h3>
        <div className={`p-1.5 rounded-lg border ${accentColors[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</h2>
        <p className="text-[10px] font-medium text-zinc-500">{trend}</p>
      </div>
    </motion.div>
  );
}
