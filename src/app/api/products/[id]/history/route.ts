import { NextRequest, NextResponse } from "next/server";
import data from "@/lib/mock-data.json";

/**
 * Generates realistic-looking price history data points for a product.
 * This runs server-side in the API route, producing deterministic results
 * based on the product's current listings.
 */
function generateHistory(productId: string, days: number) {
  const product = data.products.find((p) => p.id === productId);
  if (!product) return null;

  const platformsMap = Object.fromEntries(
    data.platforms.map((p) => [p.id, p])
  );

  const now = Date.now();
  const platforms: {
    platform_id: string;
    platform_name: string;
    data_points: { price: number; eta_minutes: number; recorded_at: string }[];
  }[] = [];

  for (const listing of product.listings) {
    const points: { price: number; eta_minutes: number; recorded_at: string }[] = [];
    const basePrice = listing.current_price;
    const baseEta = listing.eta_minutes;

    // Seed a simple deterministic pseudo-random based on listing id
    let seed = 0;
    for (let i = 0; i < listing.id.length; i++) {
      seed = ((seed << 5) - seed + listing.id.charCodeAt(i)) | 0;
    }
    const seededRandom = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };

    for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
      for (const hour of [8, 14, 20]) {
        const ts = new Date(now - dayOffset * 86400000);
        ts.setHours(hour, Math.floor(seededRandom() * 60), 0, 0);

        const priceVar = (seededRandom() - 0.5) * 0.1; // ±5%
        const etaVar = (seededRandom() - 0.5) * 0.4; // ±20%

        points.push({
          price: Math.round(basePrice * (1 + priceVar) * 100) / 100,
          eta_minutes: Math.max(5, Math.round(baseEta * (1 + etaVar))),
          recorded_at: ts.toISOString(),
        });
      }
    }

    platforms.push({
      platform_id: listing.platform_id,
      platform_name: platformsMap[listing.platform_id]?.name || listing.platform_id,
      data_points: points,
    });
  }

  return {
    product_id: productId,
    product_name: product.name,
    platforms,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "10"), 90);

  const history = generateHistory(id, days);

  if (!history) {
    return NextResponse.json(
      { detail: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(history);
}
