import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class TransactionStatus(str, enum.Enum):
    initialized = "initialized"
    success = "success"
    failed = "failed"


class PaymentTransaction(Base):
    """One row per Paystack charge attempt against an order.

    Kept separate from Order so an order can be retried after a failed or
    abandoned payment without losing the history of earlier attempts, and
    so both the client-triggered verify call and the Paystack webhook have
    a shared, idempotent record to reconcile against (matched by
    `reference`, which is unique per attempt).
    """

    __tablename__ = "payment_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    reference: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(30), default="paystack")
    amount: Mapped[int] = mapped_column(Integer)  # naira, matches Order.grand_total
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), default=TransactionStatus.initialized)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship()
