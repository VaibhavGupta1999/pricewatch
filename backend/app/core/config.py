"""
PriceWatch Backend — Core Configuration
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR / 'pricewatch.db'}"

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# WebSocket simulation settings
PRICE_UPDATE_INTERVAL = 5  # seconds between price fluctuations
ETA_UPDATE_INTERVAL = 8    # seconds between ETA fluctuations
BEEP_INTERVAL = 12         # seconds between new beeps
TICKER_INTERVAL = 4        # seconds between ticker events
