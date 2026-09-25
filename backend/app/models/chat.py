import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MessageSender(str, enum.Enum):
    customer = "customer"
    admin = "admin"


class OrderMessage(Base):
    """A single message in an order's own conversation thread.

    Deliberately scoped to one order (not a general support inbox) per the
    brief — every row is tied to order_id and shown only on that order's
    detail page.
    """

    __tablename__ = "order_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    sender: Mapped[MessageSender] = mapped_column(SAEnum(MessageSender))
    sender_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    order: Mapped["Order"] = relationship(back_populates="messages")
