"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLiveStore, useIsLiveMode } from "@/store";
import { uid } from "@/lib/utils";
import type { RealtimeEvent, TickerItem, ActivityEvent } from "@/types";

const WS_URL = "ws://127.0.0.1:8000/api/stream/ws";
const RECONNECT_DELAY = 3000;
const BATCH_INTERVAL_MS = 150; // batch incoming events every 150ms

/**
 * Central WebSocket hook with:
 * - Auto-reconnection
 * - Event batching (prevents state spam)
 * - Selective dispatch to stores
 */
export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const batchRef = useRef<RealtimeEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLiveMode = useIsLiveMode();

  const processBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.length === 0) return;
    batchRef.current = [];

    const pushEvent = useLiveStore.getState().pushEvent;
    const pushTicker = useLiveStore.getState().pushTicker;
    const pushActivity = useLiveStore.getState().pushActivity;

    for (const event of batch) {
      pushEvent(event);

      // Derive ticker item
      if (event.type === "PRICE_UPDATE" && event.new_price != null) {
        const diff = event.old_price
          ? event.new_price - event.old_price
          : 0;
        pushTicker({
          id: event.id,
          product: event.product_id || "Unknown",
          platform: event.platform_id || "",
          event: diff < 0 ? "PRICE_DROP" : "PRICE_SPIKE",
          value: diff < 0 ? `-₹${Math.abs(diff).toFixed(0)}` : `+₹${diff.toFixed(0)}`,
          isPositive: diff < 0,
          timestamp: event.timestamp,
        });
      }

      if (event.type === "ETA_UPDATE" && event.new_eta != null) {
        const diff = event.old_eta
          ? event.new_eta - event.old_eta
          : 0;
        pushTicker({
          id: event.id,
          product: event.product_id || "Unknown",
          platform: event.platform_id || "",
          event: diff < 0 ? "ETA_IMPROVED" : "ETA_SURGED",
          value: diff < 0 ? `${Math.abs(diff)} min faster` : `+${diff} min`,
          isPositive: diff < 0,
          timestamp: event.timestamp,
        });
      }

      // Derive activity feed item
      if (event.message) {
        pushActivity({
          id: event.id,
          type: event.type === "PRICE_UPDATE" ? "price" : event.type === "ETA_UPDATE" ? "eta" : "trend",
          message: event.message,
          time: "Just now",
          timestamp: event.timestamp,
        });
      }
    }
  }, []);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[PriceWatch WS] Connected");
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const event: RealtimeEvent = {
            ...data,
            id: uid(),
            timestamp: Date.now(),
          };
          batchRef.current.push(event);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        console.log("[PriceWatch WS] Disconnected, reconnecting...");
        setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Batch processing interval
    timerRef.current = setInterval(processBatch, BATCH_INTERVAL_MS);

    return () => {
      wsRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [processBatch]);

  return null; // This hook is for side-effects only
}
