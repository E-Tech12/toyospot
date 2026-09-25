import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app import models  # noqa: F401 - ensures every model is registered on Base before create_all
from app.routers import (
    addresses,
    admin_analytics,
    admin_announcements,
    admin_categories,
    admin_customers,
    admin_foods,
    admin_orders,
    admin_uploads,
    auth,
    categories,
    favorites,
    foods,
    notifications,
    orders,
    payments,
    push,
    webhooks,
    ws_chat,
)

settings = get_settings()
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Toyo's Pot API",
    description="Backend for Toyo's Pot -- a single-vendor food ordering platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Convenience for local dev / first deploy: creates any missing tables.
    # For schema changes after go-live, use Alembic migrations instead of
    # relying on this (see README "Migrations").
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(foods.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(addresses.router)
app.include_router(favorites.router)
app.include_router(notifications.router)
app.include_router(push.router)
app.include_router(webhooks.router)
app.include_router(ws_chat.router)

app.include_router(admin_foods.router)
app.include_router(admin_uploads.router)
app.include_router(admin_categories.router)
app.include_router(admin_orders.router)
app.include_router(admin_customers.router)
app.include_router(admin_analytics.router)
app.include_router(admin_announcements.router)
