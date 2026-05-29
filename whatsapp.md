# PriceWatch Architecture & Implementation Guide
*Analysis based on Architecture Blueprint v2.0*

## 1. Core Vision & Concept
PriceWatch is a real-time price intelligence platform built specifically for the Indian market, solving a unique problem: the split between **traditional E-Commerce** (Amazon, BigBasket) and **Quick-Commerce** (Blinkit, Zepto, Swiggy Instamart). 

The platform doesn't just compare prices; it compares **Price vs. Delivery Time** (Rate vs. Time). It allows users to make split-second decisions on whether to save money (wait 2 days) or pay a premium for instant delivery (wait 10 minutes).

## 2. The Three-Category Model (Commodity Types)
The blueprint strictly divides products into three categories based on where they are available. This dictates how the UI is presented:
*   **Category A (E-Com Only):** Electronics, appliances, bulk items. (Amazon, BigBasket). Focus is on *Rate* comparison.
*   **Category B (Quick-Com Only):** Fresh produce, 10-minute exclusives. (Blinkit, Zepto, Instamart). Focus is on *Time* comparison.
*   **Category C (Cross-Listed):** Daily essentials (e.g., Maggi, Amul Butter). Available on both. The UI *must* show a side-by-side matrix of Price vs. Speed.

## 3. Complete System Architecture
The system is heavily distributed to handle the intense scale of web scraping without getting blocked.

### A. Frontend (Next.js 15)
*   **Key Modules:** Search with autocomplete, Product Details (Dual-axis charts), Global Focus Ticker (Top 10 Beeps), Watchlist/Alerts Dashboard, and a Basket Optimizer (smart cart splitting).
*   **State:** Zustand with shallow rendering for extreme performance.

### B. Backend API (FastAPI)
*   **Cache-First:** Public endpoints (search, products, top-10) hit **Redis** first.
*   **Database:** PostgreSQL (with Prisma/SQLAlchemy) stores products, listings, users, and alerts. OpenSearch is used for fast text searching.
*   **Live Updates:** WebSockets stream live price changes directly to the frontend.

### C. The Crawler Engine (Two Fleets)
Because Quick-Commerce platforms are location-gated mobile apps, standard scraping fails. The blueprint requires two separate crawler fleets:
1.  **E-Commerce Track (Scrapy):** Uses HTTP requests, Amazon PA-API, and rotating proxies. (Runs every 6 hours).
2.  **Quick-Commerce Track (Playwright):** Uses headless browsers emulating Android devices at specific pin codes to bypass location-gating. Uses BrightData residential proxies. (Runs every 4 hours).

### D. Adaptive Frequency & Anti-Block
*   **Adaptive Crawling:** If a product changes price often, it gets crawled more (up to every 2 hours). If it never changes, it drops to every 24 hours to save server costs.
*   **Anti-Block:** Requires proxy rotation, browser fingerprint spoofing (WebGL, canvas hashing), human-mimicry delays, and CAPTCHA solvers.

### E. Alert & Notification System
*   When a crawler updates a price in Postgres, it fires an event to Redis.
*   An Alert Service checks if the new price hits any user thresholds.
*   If true, it queues an AWS SQS message, which triggers a Lambda function to send a **WhatsApp**, Email (SES), or Push Notification.

---

## 4. What You Need to Implement
Based on the repository's current state versus the blueprint, here is your exact to-do list:

### 🚀 Immediate Priorities (Frontend/Product)
1.  **The Embed Widget:** Section 1 of the blueprint mentions an embeddable JS snippet for blogs to show live prices. This is completely missing.
2.  **Notification Worker:** The UI has a Watchlist, but the actual backend worker (Celery/Redis) that dispatches the WhatsApp/Email alerts is not built.

### ⚙️ Backend & Infrastructure
3.  **Real Postgres Migration:** Move away from the local `pricewatch.db` SQLite file to a real Dockerized PostgreSQL + Prisma setup.
4.  **Full Authentication:** The frontend has the UI (`AuthModal`), but it needs to be wired up to NextAuth or FastAPI JWTs to persist user sessions in the database.
5.  **Docker Compose Ecosystem:** Containerize the Next.js app, FastAPI app, Redis, and Postgres so they spin up together perfectly.

### 🕷️ The Hard Part (Data Ingestion)
6.  **Build the Crawlers:** The current app uses a mock data generator. You need to build the actual Playwright scripts (for Blinkit/Zepto) and Scrapy spiders (for Amazon).
7.  **Anti-Block Layer:** Integrate a proxy provider (like BrightData) and Playwright-stealth to ensure your crawlers don't get banned on day one.
8.  **Data Normalizer:** Build an admin tool or LLM pipeline to match "Amul Butter" on Zepto with "Amul Pasteurised Butter" on Amazon so they link to the same product ID.
