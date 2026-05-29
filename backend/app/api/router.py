from fastapi import APIRouter
from app.api.endpoints import products, stream

api_router = APIRouter()
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(stream.router, prefix="/stream", tags=["stream"])
