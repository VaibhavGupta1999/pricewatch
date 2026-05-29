import asyncio
import uuid
import datetime
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Platform, Product, Listing, PriceHistory, PlatformType, ProductCategory
from app.core.database import engine, async_session, init_db

PLATFORMS = [
    {"id": "amazon", "name": "Amazon", "type": PlatformType.ECOMMERCE, "logo_url": "https://ui-avatars.com/api/?name=Amazon&background=ff9900&color=fff&rounded=true&bold=true"},
    {"id": "bigbasket", "name": "BigBasket", "type": PlatformType.ECOMMERCE, "logo_url": "https://ui-avatars.com/api/?name=BigBasket&background=84c225&color=fff&rounded=true&bold=true"},
    {"id": "blinkit", "name": "Blinkit", "type": PlatformType.QUICK_COMMERCE, "logo_url": "https://ui-avatars.com/api/?name=Blinkit&background=fbd504&color=000&rounded=true&bold=true"},
    {"id": "zepto", "name": "Zepto", "type": PlatformType.QUICK_COMMERCE, "logo_url": "https://ui-avatars.com/api/?name=Zepto&background=5c049c&color=fff&rounded=true&bold=true"},
    {"id": "instamart", "name": "Swiggy Instamart", "type": PlatformType.QUICK_COMMERCE, "logo_url": "https://ui-avatars.com/api/?name=Instamart&background=ff6c04&color=fff&rounded=true&bold=true"},
]

PRODUCTS = [
    # ===================== CATEGORY C — Cross-listed Essentials =====================
    {
        "id": "p_amul_butter_500", "name": "Amul Pasteurised Butter 500g",
        "description": "India's favourite butter, rich and creamy.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80",
        "tags": "dairy,butter,breakfast,amul", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 280, "original_price": 290, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 275, "original_price": 290, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 290, "original_price": 290, "eta_minutes": 10, "in_stock": True, "stock_count": 5},
            {"platform_id": "zepto", "current_price": 285, "original_price": 290, "eta_minutes": 12, "in_stock": True, "stock_count": 8},
            {"platform_id": "instamart", "current_price": 288, "original_price": 290, "eta_minutes": 15, "in_stock": True, "stock_count": 12},
        ]
    },
    {
        "id": "p_aashirvaad_atta_5kg", "name": "Aashirvaad Shudh Chakki Atta 5kg",
        "description": "100% pure whole wheat atta for soft rotis.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
        "tags": "grocery,flour,wheat,staples", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 220, "original_price": 260, "eta_minutes": 4320, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 235, "original_price": 260, "eta_minutes": 1440, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 260, "original_price": 260, "eta_minutes": 15, "in_stock": True, "stock_count": 3},
            {"platform_id": "zepto", "current_price": 255, "original_price": 260, "eta_minutes": 18, "in_stock": True, "stock_count": 2},
        ]
    },
    {
        "id": "p_tata_salt_1kg", "name": "Tata Salt 1kg",
        "description": "Vacuum evaporated iodised salt.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1629853381665-274e1e360f0f?w=500&q=80",
        "tags": "grocery,salt,staples,tata", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 24, "original_price": 28, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 25, "original_price": 28, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 28, "original_price": 28, "eta_minutes": 8, "in_stock": True, "stock_count": 30},
            {"platform_id": "zepto", "current_price": 27, "original_price": 28, "eta_minutes": 10, "in_stock": True, "stock_count": 22},
            {"platform_id": "instamart", "current_price": 26, "original_price": 28, "eta_minutes": 12, "in_stock": True, "stock_count": 18},
        ]
    },
    {
        "id": "p_fortune_oil_1l", "name": "Fortune Sunflower Oil 1L",
        "description": "Heart-healthy refined sunflower oil.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80",
        "tags": "grocery,oil,cooking,fortune", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 155, "original_price": 180, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 160, "original_price": 180, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 175, "original_price": 180, "eta_minutes": 10, "in_stock": True, "stock_count": 7},
            {"platform_id": "zepto", "current_price": 170, "original_price": 180, "eta_minutes": 12, "in_stock": True, "stock_count": 5},
            {"platform_id": "instamart", "current_price": 168, "original_price": 180, "eta_minutes": 14, "in_stock": True, "stock_count": 9},
        ]
    },
    {
        "id": "p_maggi_noodles", "name": "Maggi 2-Minute Masala Noodles (Pack of 12)",
        "description": "India's favourite instant noodles, masala flavour.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=80",
        "tags": "noodles,instant,snacks,maggi,nestle", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 144, "original_price": 168, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 152, "original_price": 168, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 164, "original_price": 168, "eta_minutes": 10, "in_stock": True, "stock_count": 15},
            {"platform_id": "zepto", "current_price": 160, "original_price": 168, "eta_minutes": 11, "in_stock": True, "stock_count": 10},
            {"platform_id": "instamart", "current_price": 158, "original_price": 168, "eta_minutes": 13, "in_stock": True, "stock_count": 8},
        ]
    },
    {
        "id": "p_britannia_bread", "name": "Britannia White Bread 400g",
        "description": "Soft and fresh white bread.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=500&q=80",
        "tags": "bread,bakery,breakfast,britannia", "is_trending": False,
        "listings": [
            {"platform_id": "bigbasket", "current_price": 45, "original_price": 50, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 50, "original_price": 50, "eta_minutes": 8, "in_stock": True, "stock_count": 12},
            {"platform_id": "zepto", "current_price": 48, "original_price": 50, "eta_minutes": 9, "in_stock": True, "stock_count": 7},
            {"platform_id": "instamart", "current_price": 49, "original_price": 50, "eta_minutes": 11, "in_stock": True, "stock_count": 6},
        ]
    },
    {
        "id": "p_parle_g", "name": "Parle-G Gold Biscuits 1kg",
        "description": "India's iconic glucose biscuit, premium variant.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80",
        "tags": "biscuits,snacks,parle,glucose", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 120, "original_price": 140, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 125, "original_price": 140, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 138, "original_price": 140, "eta_minutes": 10, "in_stock": True, "stock_count": 20},
            {"platform_id": "zepto", "current_price": 135, "original_price": 140, "eta_minutes": 12, "in_stock": True, "stock_count": 14},
        ]
    },
    {
        "id": "p_milk_amul_1l", "name": "Amul Taaza Toned Milk 1L",
        "description": "Homogenized toned milk, fresh and pasteurised.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
        "tags": "dairy,milk,amul,fresh", "is_trending": False,
        "listings": [
            {"platform_id": "bigbasket", "current_price": 60, "original_price": 66, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 66, "original_price": 66, "eta_minutes": 8, "in_stock": True, "stock_count": 25},
            {"platform_id": "zepto", "current_price": 64, "original_price": 66, "eta_minutes": 10, "in_stock": True, "stock_count": 30},
            {"platform_id": "instamart", "current_price": 62, "original_price": 66, "eta_minutes": 12, "in_stock": True, "stock_count": 20},
        ]
    },
    {
        "id": "p_surf_excel", "name": "Surf Excel Easy Wash 1.5kg",
        "description": "Superior stain removal detergent powder.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1583947581924-860bda6a5a83?w=500&q=80",
        "tags": "detergent,cleaning,laundry,surf", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 180, "original_price": 210, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 195, "original_price": 210, "eta_minutes": 1440, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 210, "original_price": 210, "eta_minutes": 12, "in_stock": True, "stock_count": 6},
            {"platform_id": "zepto", "current_price": 205, "original_price": 210, "eta_minutes": 15, "in_stock": True, "stock_count": 4},
        ]
    },
    {
        "id": "p_oreo_cookies", "name": "Oreo Original Cream Biscuits 300g",
        "description": "Chocolatey sandwich cookies with vanilla cream.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80",
        "tags": "biscuits,cookies,snacks,oreo,chocolate", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 30, "original_price": 40, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 35, "original_price": 40, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 38, "original_price": 40, "eta_minutes": 8, "in_stock": True, "stock_count": 30},
            {"platform_id": "zepto", "current_price": 36, "original_price": 40, "eta_minutes": 10, "in_stock": True, "stock_count": 25},
            {"platform_id": "instamart", "current_price": 37, "original_price": 40, "eta_minutes": 11, "in_stock": True, "stock_count": 18},
        ]
    },
    {
        "id": "p_sugar_1kg", "name": "India Gate Sugar 1kg",
        "description": "Pure refined sugar crystals.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1622484211148-71329c21eb6b?w=500&q=80",
        "tags": "grocery,sugar,staples", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 42, "original_price": 48, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 44, "original_price": 48, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 47, "original_price": 48, "eta_minutes": 10, "in_stock": True, "stock_count": 18},
            {"platform_id": "zepto", "current_price": 46, "original_price": 48, "eta_minutes": 12, "in_stock": True, "stock_count": 12},
        ]
    },
    {
        "id": "p_tea_tata_500g", "name": "Tata Tea Premium 500g",
        "description": "India's No.1 tea brand, strong and flavorful.",
        "category": ProductCategory.C, "image_url": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&q=80",
        "tags": "tea,beverages,tata,breakfast", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 225, "original_price": 260, "eta_minutes": 2880, "in_stock": True},
            {"platform_id": "bigbasket", "current_price": 240, "original_price": 260, "eta_minutes": 720, "in_stock": True},
            {"platform_id": "blinkit", "current_price": 255, "original_price": 260, "eta_minutes": 12, "in_stock": True, "stock_count": 5},
            {"platform_id": "zepto", "current_price": 250, "original_price": 260, "eta_minutes": 14, "in_stock": True, "stock_count": 7},
            {"platform_id": "instamart", "current_price": 248, "original_price": 260, "eta_minutes": 15, "in_stock": True, "stock_count": 4},
        ]
    },

    # ===================== CATEGORY B — Quick-commerce / Fresh =====================
    {
        "id": "p_coriander_leaves", "name": "Fresh Coriander Leaves 100g",
        "description": "Farm fresh coriander leaves, hand-picked.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1558222629-8739ed1fb2b7?w=500&q=80",
        "tags": "fresh,vegetables,herbs,coriander", "is_trending": False,
        "listings": [
            {"platform_id": "blinkit", "current_price": 15, "original_price": 20, "eta_minutes": 8, "in_stock": True, "stock_count": 25},
            {"platform_id": "zepto", "current_price": 12, "original_price": 25, "eta_minutes": 11, "in_stock": True, "stock_count": 40},
            {"platform_id": "instamart", "current_price": 18, "original_price": 20, "eta_minutes": 14, "in_stock": True, "stock_count": 15},
        ]
    },
    {
        "id": "p_onion_1kg", "name": "Fresh Onion 1kg",
        "description": "Premium quality red onions.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80",
        "tags": "fresh,vegetables,onion", "is_trending": True,
        "listings": [
            {"platform_id": "blinkit", "current_price": 35, "original_price": 45, "eta_minutes": 10, "in_stock": True, "stock_count": 50},
            {"platform_id": "zepto", "current_price": 38, "original_price": 45, "eta_minutes": 12, "in_stock": True, "stock_count": 35},
            {"platform_id": "instamart", "current_price": 32, "original_price": 45, "eta_minutes": 14, "in_stock": True, "stock_count": 28},
            {"platform_id": "bigbasket", "current_price": 30, "original_price": 45, "eta_minutes": 720, "in_stock": True},
        ]
    },
    {
        "id": "p_potato_1kg", "name": "Fresh Potato 1kg",
        "description": "Premium quality potatoes for daily cooking.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80",
        "tags": "fresh,vegetables,potato", "is_trending": False,
        "listings": [
            {"platform_id": "blinkit", "current_price": 28, "original_price": 35, "eta_minutes": 10, "in_stock": True, "stock_count": 60},
            {"platform_id": "zepto", "current_price": 30, "original_price": 35, "eta_minutes": 11, "in_stock": True, "stock_count": 45},
            {"platform_id": "instamart", "current_price": 26, "original_price": 35, "eta_minutes": 13, "in_stock": True, "stock_count": 38},
        ]
    },
    {
        "id": "p_tomato_1kg", "name": "Fresh Tomato 1kg",
        "description": "Firm, ripe tomatoes for curries and salads.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
        "tags": "fresh,vegetables,tomato", "is_trending": True,
        "listings": [
            {"platform_id": "blinkit", "current_price": 40, "original_price": 50, "eta_minutes": 8, "in_stock": True, "stock_count": 40},
            {"platform_id": "zepto", "current_price": 42, "original_price": 50, "eta_minutes": 10, "in_stock": True, "stock_count": 30},
            {"platform_id": "instamart", "current_price": 38, "original_price": 50, "eta_minutes": 12, "in_stock": True, "stock_count": 25},
            {"platform_id": "bigbasket", "current_price": 35, "original_price": 50, "eta_minutes": 720, "in_stock": True},
        ]
    },
    {
        "id": "p_banana_dozen", "name": "Fresh Banana (Dozen)",
        "description": "Sweet, ripe bananas, perfect as a healthy snack.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80",
        "tags": "fresh,fruits,banana", "is_trending": False,
        "listings": [
            {"platform_id": "blinkit", "current_price": 45, "original_price": 55, "eta_minutes": 10, "in_stock": True, "stock_count": 20},
            {"platform_id": "zepto", "current_price": 48, "original_price": 55, "eta_minutes": 12, "in_stock": True, "stock_count": 15},
            {"platform_id": "instamart", "current_price": 42, "original_price": 55, "eta_minutes": 14, "in_stock": True, "stock_count": 18},
        ]
    },
    {
        "id": "p_eggs_12", "name": "Farm Fresh Eggs (Pack of 12)",
        "description": "White-shelled farm fresh eggs.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&q=80",
        "tags": "fresh,eggs,protein,breakfast", "is_trending": False,
        "listings": [
            {"platform_id": "blinkit", "current_price": 84, "original_price": 96, "eta_minutes": 10, "in_stock": True, "stock_count": 25},
            {"platform_id": "zepto", "current_price": 80, "original_price": 96, "eta_minutes": 11, "in_stock": True, "stock_count": 20},
            {"platform_id": "instamart", "current_price": 82, "original_price": 96, "eta_minutes": 13, "in_stock": True, "stock_count": 18},
            {"platform_id": "bigbasket", "current_price": 78, "original_price": 96, "eta_minutes": 720, "in_stock": True},
        ]
    },
    {
        "id": "p_paneer_200g", "name": "Fresh Paneer 200g",
        "description": "Soft and fresh cottage cheese, ideal for curries.",
        "category": ProductCategory.B, "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80",
        "tags": "dairy,paneer,fresh,protein", "is_trending": True,
        "listings": [
            {"platform_id": "blinkit", "current_price": 90, "original_price": 100, "eta_minutes": 8, "in_stock": True, "stock_count": 10},
            {"platform_id": "zepto", "current_price": 85, "original_price": 100, "eta_minutes": 10, "in_stock": True, "stock_count": 8},
            {"platform_id": "instamart", "current_price": 88, "original_price": 100, "eta_minutes": 12, "in_stock": True, "stock_count": 6},
            {"platform_id": "bigbasket", "current_price": 80, "original_price": 100, "eta_minutes": 720, "in_stock": True},
        ]
    },

    # ===================== CATEGORY A — E-commerce (Electronics) =====================
    {
        "id": "p_iphone_15", "name": "Apple iPhone 15 (128 GB)",
        "description": "Dynamic Island. 48MP Main camera. USB-C. A16 Bionic.",
        "category": ProductCategory.A, "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80",
        "tags": "electronics,smartphone,apple,iphone", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 65999, "original_price": 79900, "eta_minutes": 2880, "in_stock": True},
        ]
    },
    {
        "id": "p_samsung_s24", "name": "Samsung Galaxy S24 Ultra 256GB",
        "description": "Galaxy AI. 200MP camera. Titanium frame. S Pen.",
        "category": ProductCategory.A, "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80",
        "tags": "electronics,smartphone,samsung,galaxy", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 129999, "original_price": 144999, "eta_minutes": 2880, "in_stock": True},
        ]
    },
    {
        "id": "p_oneplus_buds", "name": "OnePlus Buds Pro 2",
        "description": "Adaptive noise cancellation, 48-hour battery life.",
        "category": ProductCategory.A, "image_url": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&q=80",
        "tags": "electronics,earbuds,oneplus,audio", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 8999, "original_price": 11999, "eta_minutes": 2880, "in_stock": True},
        ]
    },
    {
        "id": "p_macbook_air_m3", "name": "Apple MacBook Air M3 (8GB/256GB)",
        "description": "Supercharged by M3 chip. 18-hour battery. Fanless design.",
        "category": ProductCategory.A, "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
        "tags": "electronics,laptop,apple,macbook", "is_trending": True,
        "listings": [
            {"platform_id": "amazon", "current_price": 104900, "original_price": 114900, "eta_minutes": 4320, "in_stock": True},
        ]
    },
    {
        "id": "p_fire_tv_stick", "name": "Amazon Fire TV Stick 4K Max",
        "description": "Streaming media player with Alexa Voice Remote.",
        "category": ProductCategory.A, "image_url": "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=500&q=80",
        "tags": "electronics,streaming,amazon,tv", "is_trending": False,
        "listings": [
            {"platform_id": "amazon", "current_price": 4499, "original_price": 6999, "eta_minutes": 2880, "in_stock": True},
        ]
    },
]


async def seed_data():
    await init_db()
    async with async_session() as session:
        # Check if already seeded
        res = await session.execute(select(Platform))
        if res.scalars().first() is not None:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")
        # Add platforms
        for p_data in PLATFORMS:
            platform = Platform(**p_data)
            session.add(platform)
            
        # Add products and listings
        for prod_data in PRODUCTS:
            listings_data = prod_data.pop("listings")
            product = Product(**prod_data)
            session.add(product)
            
            for l_data in listings_data:
                l_data["id"] = f"l_{uuid.uuid4().hex[:8]}"
                l_data["product_id"] = product.id
                listing = Listing(**l_data)
                session.add(listing)

        await session.commit()
        print("Database seeded successfully with", len(PRODUCTS), "products.")

        # Seed initial price history (10 days of mock data)
        print("Generating 10-day price history...")
        # Re-query to get all listings
        from sqlalchemy.orm import selectinload
        result = await session.execute(
            select(Listing).options(selectinload(Listing.platform))
        )
        all_listings = result.scalars().all()

        now = datetime.datetime.utcnow()
        history_records = []
        for listing in all_listings:
            base_price = listing.current_price
            base_eta = listing.eta_minutes
            for day_offset in range(10, -1, -1):
                # Create 2-3 data points per day
                for hour_offset in [8, 14, 20]:
                    ts = now - datetime.timedelta(days=day_offset, hours=random.randint(0, 3))
                    ts = ts.replace(hour=hour_offset, minute=random.randint(0, 59))
                    
                    # Simulate price variation (±5%)
                    price_variation = random.uniform(-0.05, 0.05)
                    simulated_price = round(base_price * (1 + price_variation), 2)
                    
                    # Simulate ETA variation (±20%)
                    eta_variation = random.uniform(-0.20, 0.20)
                    simulated_eta = max(5, int(base_eta * (1 + eta_variation)))
                    
                    history_records.append(PriceHistory(
                        product_id=listing.product_id,
                        platform_id=listing.platform_id,
                        price=simulated_price,
                        eta_minutes=simulated_eta,
                        recorded_at=ts
                    ))

        session.add_all(history_records)
        await session.commit()
        print(f"Price history seeded with {len(history_records)} records.")


if __name__ == "__main__":
    asyncio.run(seed_data())
