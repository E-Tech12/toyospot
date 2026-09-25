import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    icon: Mapped[str] = mapped_column(String(8), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    foods: Mapped[list["Food"]] = relationship(back_populates="category")


class Food(Base):
    """A single menu item belonging to Toyo's Pot.

    Inventory rule: `quantity_available` is decremented atomically at order
    time (see services/orders.py). When it reaches 0 the item is treated as
    sold out everywhere (`Food.is_sold_out`) without a separate flag to keep
    the two values from drifting out of sync.
    """

    __tablename__ = "foods"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(150))
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id"), index=True)
    price: Mapped[int] = mapped_column(Integer)  # stored in kobo-free naira integer, matches frontend formatNaira
    daily_quantity: Mapped[int] = mapped_column(Integer, default=0)
    quantity_available: Mapped[int] = mapped_column(Integer, default=0)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, default=15)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    category: Mapped["Category"] = relationship(back_populates="foods")

    @property
    def is_sold_out(self) -> bool:
        return self.quantity_available <= 0

    @property
    def is_low_stock(self) -> bool:
        if self.is_sold_out or self.daily_quantity <= 0:
            return False
        return self.quantity_available <= self.daily_quantity * 0.2


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    food_id: Mapped[str] = mapped_column(String(36), ForeignKey("foods.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="favorites")
    food: Mapped["Food"] = relationship()
