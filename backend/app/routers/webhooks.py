import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PaymentTransaction, TransactionStatus
from app.services.payments import confirm_payment
from app.services.paystack import verify_webhook_signature

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger("toyospot.webhooks")


@router.post("/paystack", status_code=status.HTTP_200_OK)
async def paystack_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """The authoritative source of truth for payment confirmation -- unlike
    /orders/{id}/pay/verify (which the frontend calls right after the
    Inline popup closes), this fires from Paystack's own servers even if
    the customer's browser closes, loses network, or the JS verify call
    never happens. Always returns 200 (even on a no-op) because Paystack
    retries webhooks that don't get one, and duplicate delivery of the
    same event is expected and handled idempotently by confirm_payment.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature")

    if not verify_webhook_signature(raw_body, signature):
        logger.warning("Rejected Paystack webhook with invalid signature")
        return {"status": "ignored"}

    payload = await request.json()
    event = payload.get("event")

    if event != "charge.success":
        return {"status": "ignored"}

    data = payload.get("data", {})
    reference = data.get("reference")

    transaction = db.query(PaymentTransaction).filter(PaymentTransaction.reference == reference).first()
    if not transaction:
        logger.info("Webhook for unknown reference %s (ignored)", reference)
        return {"status": "ignored"}

    if data.get("amount") != transaction.amount * 100:
        logger.warning("Webhook amount mismatch for reference %s", reference)
        return {"status": "ignored"}

    if transaction.status != TransactionStatus.success:
        confirm_payment(db, background_tasks, transaction, transaction.order)

    return {"status": "ok"}
