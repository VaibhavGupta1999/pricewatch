from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.product import PlatformType, ProductCategory

class PlatformBase(BaseModel):
    id: str
    name: str
    type: PlatformType
    logo_url: str

class PlatformSchema(PlatformBase):
    model_config = ConfigDict(from_attributes=True)

class ListingBase(BaseModel):
    id: str
    product_id: str
    platform_id: str
    current_price: float
    original_price: float
    eta_minutes: int
    in_stock: bool
    stock_count: Optional[int] = None

class ListingSchema(ListingBase):
    platform: PlatformSchema
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    id: str
    name: str
    description: str
    category: ProductCategory
    image_url: str
    tags: str
    is_trending: bool

class ProductSchema(ProductBase):
    listings: List[ListingSchema] = []
    
    model_config = ConfigDict(from_attributes=True)

class ProductSearchResponse(BaseModel):
    results: List[ProductSchema]
    total: int

# ============================================
# Price History Schemas
# ============================================

class PriceHistoryPoint(BaseModel):
    price: float
    eta_minutes: int
    recorded_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PlatformPriceHistory(BaseModel):
    platform_id: str
    platform_name: str
    data_points: List[PriceHistoryPoint]

class ProductPriceHistoryResponse(BaseModel):
    product_id: str
    product_name: str
    platforms: List[PlatformPriceHistory]

# ============================================
# Basket Optimization Schemas
# ============================================

class BasketItemRequest(BaseModel):
    product_id: str
    quantity: int = 1

class BasketOptimizeRequest(BaseModel):
    items: List[BasketItemRequest]
    strategy: str = "balanced"  # "cheapest", "fastest", "balanced"

class OptimizedSplit(BaseModel):
    platform_id: str
    platform_name: str
    items: List[dict]
    subtotal: float
    estimated_eta: int

class BasketOptimizeResponse(BaseModel):
    strategy: str
    splits: List[OptimizedSplit]
    total_cost: float
    total_savings: float
    max_eta_minutes: int
    recommendation: str
