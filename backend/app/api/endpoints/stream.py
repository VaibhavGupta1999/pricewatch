import asyncio
import json
import random
import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from app.core.database import async_session
from app.models.product import Listing, Product, PriceHistory

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

async def simulator_task():
    """Background task to simulate real-time price and ETA changes.
    
    Uses a fresh session per iteration to avoid the greenlet_spawn error
    that occurs when accessing lazy-loaded relationships outside async context.
    """
    while True:
        try:
            async with async_session() as db:
                # Eagerly load product relationship to avoid lazy-load issues
                result = await db.execute(
                    select(Listing).join(Product)
                )
                listings = result.scalars().all()
                if not listings:
                    await asyncio.sleep(5)
                    continue
                    
                listing = random.choice(listings)
                
                event_type = random.choice(["price_change", "price_change", "eta_change", "beep"])
                
                if event_type == "price_change":
                    old_price = listing.current_price
                    change = random.uniform(-5.0, 5.0)
                    new_price = round(max(10, listing.current_price + change), 2)
                    listing.current_price = new_price
                    
                    # Record price history snapshot
                    history = PriceHistory(
                        product_id=listing.product_id,
                        platform_id=listing.platform_id,
                        price=new_price,
                        eta_minutes=listing.eta_minutes,
                        recorded_at=datetime.datetime.utcnow()
                    )
                    db.add(history)
                    await db.commit()
                    
                    await manager.broadcast({
                        "type": "PRICE_UPDATE",
                        "listing_id": listing.id,
                        "product_id": listing.product_id,
                        "platform_id": listing.platform_id,
                        "new_price": new_price,
                        "old_price": old_price,
                        "message": f"Price {'dropped' if change < 0 else 'increased'} by ₹{abs(change):.0f} on {listing.platform_id}"
                    })
                    
                elif event_type == "eta_change":
                    old_eta = listing.eta_minutes
                    change = random.randint(-5, 5)
                    new_eta = max(5, listing.eta_minutes + change)
                    listing.eta_minutes = new_eta
                    await db.commit()
                    
                    await manager.broadcast({
                        "type": "ETA_UPDATE",
                        "listing_id": listing.id,
                        "product_id": listing.product_id,
                        "platform_id": listing.platform_id,
                        "new_eta": new_eta,
                        "old_eta": old_eta,
                        "message": f"ETA {'improved' if change < 0 else 'surged'} by {abs(change)} min on {listing.platform_id}"
                    })
                    
                elif event_type == "beep":
                    # Load product name in same async context
                    prod_result = await db.execute(
                        select(Product).filter(Product.id == listing.product_id)
                    )
                    product = prod_result.scalars().first()
                    product_name = product.name if product else "Unknown Product"
                    
                    await manager.broadcast({
                        "type": "BEEP",
                        "message": f"Trending alert! {product_name} is hot on {listing.platform_id.capitalize()} right now.",
                        "product_id": listing.product_id,
                        "platform_id": listing.platform_id
                    })
                    
        except Exception as e:
            print(f"Simulator error: {e}")
            
        await asyncio.sleep(random.uniform(2.0, 5.0))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Can handle incoming client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
