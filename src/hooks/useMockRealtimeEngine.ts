"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLiveStore, useIsLiveMode } from "@/store";
import { uid } from "@/lib/utils";
import type { TickerItem, ActivityEvent } from "@/types";

const PRODUCT_NAMES = [
  "Amul Butter 500g", "Aashirvaad Atta 5kg", "Tata Salt 1kg",
  "Fortune Oil 1L", "Britannia Bread", "Parle-G Biscuits",
  "Milk 1L", "Fresh Coriander", "Onion 1kg", "Potato 1kg",
  "Maggi Noodles", "Oreo Cookies", "iPhone 15",
];
const PLATFORMS = ["Amazon", "BigBasket", "Blinkit", "Zepto", "Instamart", "Country Delight"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Client-side mock realtime event generator.
 * Produces realistic-feeling ticker and activity events
 * even when the backend WebSocket isn't connected.
 */
export function useMockRealtimeEngine() {
  const isLiveMode = useIsLiveMode();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateEvent = useCallback(() => {
    const pushTicker = useLiveStore.getState().pushTicker;
    const pushActivity = useLiveStore.getState().pushActivity;

    const eventTypes = [
      "PRICE_DROP", "PRICE_SPIKE", "ETA_IMPROVED", "ETA_SURGED",
      "TRENDING", "LOW_STOCK", "BACK_IN_STOCK",
    ];
    const type = pick(eventTypes);
    const product = pick(PRODUCT_NAMES);
    const platform = pick(PLATFORMS);
    const now = Date.now();

    let value = "";
    let isPositive = true;
    let actMessage = "";
    let actType: ActivityEvent["type"] = "price";

    switch (type) {
      case "PRICE_DROP": {
        const drop = rand(3, 25);
        value = `-₹${drop}`;
        isPositive = true;
        actMessage = `${product} price dropped ₹${drop} on ${platform}`;
        actType = "price";
        break;
      }
      case "PRICE_SPIKE": {
        const spike = rand(2, 12);
        value = `+₹${spike}`;
        isPositive = false;
        actMessage = `${product} price increased ₹${spike} on ${platform}`;
        actType = "price";
        break;
      }
      case "ETA_IMPROVED": {
        const mins = rand(2, 15);
        value = `${mins} min faster`;
        isPositive = true;
        actMessage = `${platform} ETA improved by ${mins} min for ${product}`;
        actType = "eta";
        break;
      }
      case "ETA_SURGED": {
        const mins = rand(3, 20);
        value = `+${mins} min`;
        isPositive = false;
        actMessage = `${platform} ETA surged by ${mins} min in your area`;
        actType = "eta";
        break;
      }
      case "TRENDING": {
        value = "High Demand";
        isPositive = true;
        actMessage = `${product} is trending on ${platform} right now`;
        actType = "trend";
        break;
      }
      case "LOW_STOCK": {
        const count = rand(2, 8);
        value = `Only ${count} left`;
        isPositive = false;
        actMessage = `Low stock alert: ${product} on ${platform} (${count} remaining)`;
        actType = "stock";
        break;
      }
      case "BACK_IN_STOCK": {
        value = "Back in stock";
        isPositive = true;
        actMessage = `${product} is back in stock on ${platform}`;
        actType = "stock";
        break;
      }
    }

    pushTicker({
      id: uid(),
      product,
      platform,
      event: type,
      value,
      isPositive,
      timestamp: now,
    });

    pushActivity({
      id: uid(),
      type: actType,
      message: actMessage,
      time: "Just now",
      timestamp: now,
    });
  }, []);

  useEffect(() => {
    // Seed initial events
    for (let i = 0; i < 8; i++) {
      generateEvent();
    }

    const interval = isLiveMode ? rand(1500, 3500) : rand(5000, 10000);
    intervalRef.current = setInterval(generateEvent, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLiveMode, generateEvent]);
}
