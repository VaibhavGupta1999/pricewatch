import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import ALLOWED_ORIGINS
from app.api.endpoints.stream import simulator_task

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background simulator task
    task = asyncio.create_task(simulator_task())
    yield
    # Cleanup task on shutdown
    task.cancel()

app = FastAPI(
    title="PriceWatch API",
    description="Real-time Commerce Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

@app.get("/")
async def root():
    return {"message": "Welcome to PriceWatch API"}
