from datetime import datetime, timezone

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Order, PaymentStatus, PaymentTransaction, TransactionStatus
from app.services.email import send_admin_new_order_email

settings = get_settings()


def confirm_payment(db: Session, background_tasks: BackgroundTasks, transaction: PaymentTransaction, order: Order) -> Order:
    """Marks a transaction and its order as paid. Idempotent -- safe to call
    twice for the same transaction (e.g. once from the client's verify call
    and again from the webhook, whichever arrives second is a no-op) since
    it only ever transitions unpaid -> paid, never repeats a side effect
    like the admin email for a transaction already marked success.
    """
    if transaction.status == TransactionStatus.success:
        return order

    transaction.status = TransactionStatus.success
    transaction.verified_at = datetime.now(timezone.utc)
    order.payment_status = PaymentStatus.paid
    db.commit()
    db.refresh(order)

    background_tasks.add_task(
        send_admin_new_order_email,
        settings.ADMIN_NOTIFICATION_EMAIL,
        f"{order.order_number} (payment received)",
        order.full_name,
        f"\u20a6{order.grand_total:,}",
    )

    return order
