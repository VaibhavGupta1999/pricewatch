import { NextRequest, NextResponse } from "next/server";
import data from "@/lib/mock-data.json";

const platformsMap = Object.fromEntries(
  data.platforms.map((p) => [p.id, p])
);

function hydrateProduct(product: (typeof data.products)[0]) {
  return {
    ...product,
    listings: product.listings.map((l) => ({
      ...l,
      platform: platformsMap[l.platform_id] || null,
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = data.products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json(
      { detail: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(hydrateProduct(product));
}
