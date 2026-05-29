from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.product import Product, Listing, PriceHistory, Platform
from app.schemas.product import (
    ProductSchema, ProductSearchResponse, 
    ProductPriceHistoryResponse, PlatformPriceHistory, PriceHistoryPoint,
    BasketOptimizeRequest, BasketOptimizeResponse, OptimizedSplit
)

router = APIRouter()

@router.get("/", response_model=ProductSearchResponse)
async def get_products(
    q: str = None,
    category: str = None,
    trending: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).options(selectinload(Product.listings).selectinload(Listing.platform))
    
    if q:
        stmt = stmt.filter(Product.name.ilike(f"%{q}%") | Product.tags.ilike(f"%{q}%"))
    if category:
        stmt = stmt.filter(Product.category == category)
    if trending:
        stmt = stmt.filter(Product.is_trending == True)
    
    # Count total before pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    return ProductSearchResponse(results=products, total=total)

@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).options(selectinload(Product.listings).selectinload(Listing.platform)).filter(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    return product

@router.get("/{product_id}/history", response_model=ProductPriceHistoryResponse)
async def get_product_price_history(
    product_id: str,
    days: int = Query(10, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get historical price data for a product across all platforms."""
    # Verify product exists
    prod_result = await db.execute(select(Product).filter(Product.id == product_id))
    product = prod_result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    since = datetime.utcnow() - timedelta(days=days)
    
    # Get history records
    stmt = (
        select(PriceHistory)
        .filter(PriceHistory.product_id == product_id)
        .filter(PriceHistory.recorded_at >= since)
        .order_by(PriceHistory.recorded_at.asc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    # Get platform names
    plat_result = await db.execute(select(Platform))
    platforms_map = {p.id: p.name for p in plat_result.scalars().all()}

    # Group by platform
    platform_data: dict[str, list] = {}
    for rec in records:
        if rec.platform_id not in platform_data:
            platform_data[rec.platform_id] = []
        platform_data[rec.platform_id].append(PriceHistoryPoint(
            price=rec.price,
            eta_minutes=rec.eta_minutes,
            recorded_at=rec.recorded_at
        ))

    platforms_list = [
        PlatformPriceHistory(
            platform_id=pid,
            platform_name=platforms_map.get(pid, pid),
            data_points=points
        )
        for pid, points in platform_data.items()
    ]

    return ProductPriceHistoryResponse(
        product_id=product_id,
        product_name=product.name,
        platforms=platforms_list
    )

@router.post("/basket/optimize", response_model=BasketOptimizeResponse)
async def optimize_basket(
    request: BasketOptimizeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Optimize a basket of items across platforms.
    Strategies: cheapest, fastest, balanced
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="Basket is empty")

    # Load all requested products with their listings
    product_ids = [item.product_id for item in request.items]
    stmt = (
        select(Product)
        .options(selectinload(Product.listings).selectinload(Listing.platform))
        .filter(Product.id.in_(product_ids))
    )
    result = await db.execute(stmt)
    products = {p.id: p for p in result.scalars().all()}

    # Get platform names
    plat_result = await db.execute(select(Platform))
    platforms_map = {p.id: p.name for p in plat_result.scalars().all()}

    # Build quantity map
    qty_map = {item.product_id: item.quantity for item in request.items}

    # For each product, pick the best listing according to strategy
    platform_splits: dict[str, dict] = {}  # platform_id -> { items: [], subtotal, max_eta }
    total_original = 0.0
    
    for pid, qty in qty_map.items():
        product = products.get(pid)
        if not product or not product.listings:
            continue
        
        in_stock_listings = [l for l in product.listings if l.in_stock]
        if not in_stock_listings:
            in_stock_listings = product.listings  # fallback

        if request.strategy == "cheapest":
            best = min(in_stock_listings, key=lambda l: l.current_price)
        elif request.strategy == "fastest":
            best = min(in_stock_listings, key=lambda l: l.eta_minutes)
        else:  # balanced
            # Score: 50% price weight, 50% ETA weight
            prices = [l.current_price for l in in_stock_listings]
            etas = [l.eta_minutes for l in in_stock_listings]
            min_p, max_p = min(prices), max(prices)
            min_e, max_e = min(etas), max(etas)
            p_range = max_p - min_p or 1
            e_range = max_e - min_e or 1
            
            def balanced_score(l):
                ps = (l.current_price - min_p) / p_range
                es = (l.eta_minutes - min_e) / e_range
                return ps * 0.5 + es * 0.5

            best = min(in_stock_listings, key=balanced_score)

        plat_id = best.platform_id
        if plat_id not in platform_splits:
            platform_splits[plat_id] = {"items": [], "subtotal": 0.0, "max_eta": 0}

        item_cost = best.current_price * qty
        platform_splits[plat_id]["items"].append({
            "product_name": product.name,
            "product_id": product.id,
            "price": best.current_price,
            "quantity": qty,
            "total": item_cost,
            "eta": best.eta_minutes
        })
        platform_splits[plat_id]["subtotal"] += item_cost
        platform_splits[plat_id]["max_eta"] = max(platform_splits[plat_id]["max_eta"], best.eta_minutes)
        total_original += best.original_price * qty

    splits = [
        OptimizedSplit(
            platform_id=pid,
            platform_name=platforms_map.get(pid, pid),
            items=data["items"],
            subtotal=round(data["subtotal"], 2),
            estimated_eta=data["max_eta"]
        )
        for pid, data in platform_splits.items()
    ]

    total_cost = sum(s.subtotal for s in splits)
    total_savings = round(total_original - total_cost, 2)
    max_eta = max((s.estimated_eta for s in splits), default=0)
    
    strategy_labels = {
        "cheapest": "Optimized for lowest total cost",
        "fastest": "Optimized for fastest delivery",
        "balanced": "Balanced price-to-delivery optimization"
    }

    return BasketOptimizeResponse(
        strategy=request.strategy,
        splits=splits,
        total_cost=round(total_cost, 2),
        total_savings=max(0, total_savings),
        max_eta_minutes=max_eta,
        recommendation=strategy_labels.get(request.strategy, "Custom optimization")
    )
