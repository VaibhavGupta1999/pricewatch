from enum import Enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
import datetime

class PlatformType(str, Enum):
    ECOMMERCE = "ecommerce"
    QUICK_COMMERCE = "quick_commerce"

class ProductCategory(str, Enum):
    A = "A" # E-commerce only
    B = "B" # Quick-commerce only
    C = "C" # Cross-listed

class Platform(Base):
    __tablename__ = "platforms"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    type = Column(SQLEnum(PlatformType))
    logo_url = Column(String)
    
    # Relationships
    listings = relationship("Listing", back_populates="platform")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    category = Column(SQLEnum(ProductCategory))
    image_url = Column(String)
    tags = Column(String) # Comma separated
    is_trending = Column(Boolean, default=False)
    
    # Relationships
    listings = relationship("Listing", back_populates="product")
    price_history = relationship("PriceHistory", back_populates="product")

class Listing(Base):
    __tablename__ = "listings"
    
    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"))
    platform_id = Column(String, ForeignKey("platforms.id"))
    
    # Real-time changing fields
    current_price = Column(Float)
    original_price = Column(Float)
    eta_minutes = Column(Integer)
    in_stock = Column(Boolean, default=True)
    stock_count = Column(Integer, nullable=True) # for quick commerce urgency
    
    # Relationships
    product = relationship("Product", back_populates="listings")
    platform = relationship("Platform", back_populates="listings")

class PriceHistory(Base):
    """Stores historical price snapshots for charting."""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), index=True)
    platform_id = Column(String, ForeignKey("platforms.id"), index=True)
    price = Column(Float)
    eta_minutes = Column(Integer)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    product = relationship("Product", back_populates="price_history")
