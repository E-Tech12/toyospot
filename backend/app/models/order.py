import enum
import uuid
import random
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def generate_order_number() -> str:
    # Human-friendly order number shown to customers ("#1042"), distinct
    # from the internal UUID primary key.
    return f"#{random.randint(1000, 999999)}"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    preparing = "preparing"
    ready = "ready"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"


# The order a status is expected to move through. Used to validate admin
# status transitions and to drive the customer-facing timeline UI.
ORDER_STATUS_FLOW = [
    OrderStatus.pending,
    OrderStatus.accepted,
    OrderStatus.preparing,
    OrderStatus.ready,
    OrderStatus.out_for_delivery,
    OrderStatus.delivered,
]


class PaymentStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    online = "online"
    on_delivery = "on_delivery"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, default=generate_order_number)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)

    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.pending, index=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus), default=PaymentStatus.unpaid)
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod), default=PaymentMethod.on_delivery)

    # Snapshotted at checkout so later edits to a user's saved address don't
    # rewrite the record of what was actually delivered where.
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str] = mapped_column(String(30))
    address_line: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str] = mapped_column(Text, default="")

    item_total: Mapped[int] = mapped_column(Integer)
    delivery_fee: Mapped[int] = mapped_column(Integer)
    grand_total: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    messages: Mapped[list["OrderMessage"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderMessage.created_at"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    food_id: Mapped[str] = mapped_column(String(36), ForeignKey("foods.id"))

    # Snapshotted so historical orders still show correct name/price/image
    # even if the food is later renamed, repriced, or removed from the menu.
    name: Mapped[str] = mapped_column(String(150))
    price: Mapped[int] = mapped_column(Integer)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    quantity: Mapped[int] = mapped_column(Integer)

    order: Mapped["Order"] = relationship(back_populates="items")
