"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useMockRealtimeEngine } from "@/hooks/useMockRealtimeEngine";
import { ToastProvider } from "@/components/shared/ToastProvider";

function RealtimeBootstrap() {
  // WebSocket disabled for standalone Vercel deployment.
  // The mock realtime engine provides all live ticker/activity data.
  useMockRealtimeEngine();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // Data stays fresh for 60s — no redundant fetches
            gcTime: 5 * 60_000, // Keep unused cache for 5 min
            refetchOnWindowFocus: false, // Prevents data flashing when switching tabs
            refetchInterval: false, // Disable polling — mock engine handles live updates
            retry: 1, // Single retry to keep UI snappy
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RealtimeBootstrap />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
