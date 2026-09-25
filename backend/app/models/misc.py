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


class NotificationType(str, enum.Enum):
    order_received = "order_received"
    order_accepted = "order_accepted"
    order_preparing = "order_preparing"
    order_ready = "order_ready"
    order_out_for_delivery = "order_out_for_delivery"
    order_delivered = "order_delivered"
    order_cancelled = "order_cancelled"
    new_chat_message = "new_chat_message"
    announcement = "announcement"


class Notification(Base):
    """Per-user notification, also used as the durable record behind a push
    notification: every push we attempt to send is written here first, so
    the in-app Notifications page never depends on push having succeeded.
    """

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType))
    title: Mapped[str] = mapped_column(String(150))
    body: Mapped[str] = mapped_column(Text)
    order_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("orders.id"), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)


class Announcement(Base):
    """Admin broadcast ('We are closed today.'). Fans out to a Notification
    row per active customer at creation time.
    """

    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(150))
    body: Mapped[str] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
