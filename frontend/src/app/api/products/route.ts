import { NextRequest, NextResponse } from "next/server";
import data from "@/lib/mock-data.json";

const platformsMap = Object.fromEntries(
  data.platforms.map((p) => [p.id, p])
);

// Attach platform object to each listing
function hydrateProduct(product: (typeof data.products)[0]) {
  return {
    ...product,
    listings: product.listings.map((l) => ({
      ...l,
      platform: platformsMap[l.platform_id] || null,
    })),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const trending = searchParams.get("trending") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");

  let filtered = [...data.products];

  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.tags.toLowerCase().includes(lower)
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (trending) {
    filtered = filtered.filter((p) => p.is_trending);
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);
  const results = paginated.map(hydrateProduct);

  return NextResponse.json({ results, total });
}
