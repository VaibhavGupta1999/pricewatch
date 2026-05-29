import { NextRequest, NextResponse } from "next/server";
import data from "@/lib/mock-data.json";

const platformsMap = Object.fromEntries(
  data.platforms.map((p) => [p.id, p])
);

interface BasketItem {
  product_id: string;
  quantity: number;
}

interface RequestBody {
  items: BasketItem[];
  strategy: "cheapest" | "fastest" | "balanced";
}

export async function POST(request: NextRequest) {
  const body: RequestBody = await request.json();

  if (!body.items || body.items.length === 0) {
    return NextResponse.json(
      { detail: "Basket is empty" },
      { status: 400 }
    );
  }

  const productsMap = Object.fromEntries(
    data.products.map((p) => [p.id, p])
  );

  const platformSplits: Record<
    string,
    {
      items: {
        product_name: string;
        product_id: string;
        price: number;
        quantity: number;
        total: number;
        eta: number;
      }[];
      subtotal: number;
      maxEta: number;
    }
  > = {};

  let totalOriginal = 0;

  for (const item of body.items) {
    const product = productsMap[item.product_id];
    if (!product || product.listings.length === 0) continue;

    const inStockListings = product.listings.filter((l) => l.in_stock);
    const candidates =
      inStockListings.length > 0 ? inStockListings : product.listings;

    let best;
    if (body.strategy === "cheapest") {
      best = candidates.reduce((a, b) =>
        a.current_price < b.current_price ? a : b
      );
    } else if (body.strategy === "fastest") {
      best = candidates.reduce((a, b) =>
        a.eta_minutes < b.eta_minutes ? a : b
      );
    } else {
      // balanced: 50% price weight, 50% ETA weight
      const prices = candidates.map((l) => l.current_price);
      const etas = candidates.map((l) => l.eta_minutes);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const minE = Math.min(...etas);
      const maxE = Math.max(...etas);
      const pRange = maxP - minP || 1;
      const eRange = maxE - minE || 1;

      best = candidates.reduce((a, b) => {
        const scoreA =
          ((a.current_price - minP) / pRange) * 0.5 +
          ((a.eta_minutes - minE) / eRange) * 0.5;
        const scoreB =
          ((b.current_price - minP) / pRange) * 0.5 +
          ((b.eta_minutes - minE) / eRange) * 0.5;
        return scoreA < scoreB ? a : b;
      });
    }

    const platId = best.platform_id;
    if (!platformSplits[platId]) {
      platformSplits[platId] = { items: [], subtotal: 0, maxEta: 0 };
    }

    const itemCost = best.current_price * item.quantity;
    platformSplits[platId].items.push({
      product_name: product.name,
      product_id: product.id,
      price: best.current_price,
      quantity: item.quantity,
      total: itemCost,
      eta: best.eta_minutes,
    });
    platformSplits[platId].subtotal += itemCost;
    platformSplits[platId].maxEta = Math.max(
      platformSplits[platId].maxEta,
      best.eta_minutes
    );
    totalOriginal += best.original_price * item.quantity;
  }

  const splits = Object.entries(platformSplits).map(([pid, d]) => ({
    platform_id: pid,
    platform_name: platformsMap[pid]?.name || pid,
    items: d.items,
    subtotal: Math.round(d.subtotal * 100) / 100,
    estimated_eta: d.maxEta,
  }));

  const totalCost = splits.reduce((s, sp) => s + sp.subtotal, 0);
  const totalSavings = Math.max(0, Math.round((totalOriginal - totalCost) * 100) / 100);
  const maxEta = Math.max(...splits.map((s) => s.estimated_eta), 0);

  const strategyLabels: Record<string, string> = {
    cheapest: "Optimized for lowest total cost",
    fastest: "Optimized for fastest delivery",
    balanced: "Balanced price-to-delivery optimization",
  };

  return NextResponse.json({
    strategy: body.strategy,
    splits,
    total_cost: Math.round(totalCost * 100) / 100,
    total_savings: totalSavings,
    max_eta_minutes: maxEta,
    recommendation: strategyLabels[body.strategy] || "Custom optimization",
  });
}
