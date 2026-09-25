import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Order, PaymentMethod, PaymentStatus, PaymentTransaction, TransactionStatus, User
from app.schemas.order import OrderOut
from app.schemas.payment import InitializePaymentResponse, VerifyPaymentRequest
from app.services.payments import confirm_payment
from app.services import paystack

router = APIRouter(prefix="/orders", tags=["payments"])
settings = get_settings()


def _get_owned_order(db: Session, order_id: str, user: User) -> Order:
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.post("/{order_id}/pay/initialize", response_model=InitializePaymentResponse)
async def initialize_payment(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = _get_owned_order(db, order_id, user)

    if order.payment_method != PaymentMethod.online:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This order isn't set up for online payment.")
    if order.payment_status == PaymentStatus.paid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This order is already paid.")

    reference = f"toyospot-{order.id[:8]}-{uuid.uuid4().hex[:10]}"

    data = await paystack.initialize_transaction(
        email=user.email,
        amount_naira=order.grand_total,
        reference=reference,
        metadata={"order_id": order.id},
    )

    db.add(
        PaymentTransaction(
            order_id=order.id,
            reference=reference,
            amount=order.grand_total,
            status=TransactionStatus.initialized,
        )
    )
    db.commit()

    return InitializePaymentResponse(
        reference=reference,
        access_code=data["access_code"],
        authorization_url=data["authorization_url"],
        public_key=settings.PAYSTACK_PUBLIC_KEY,
        amount=order.grand_total,
    )


@router.post("/{order_id}/pay/verify", response_model=OrderOut)
async def verify_payment(
    order_id: str,
    payload: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Called by the frontend right after Paystack's Inline popup reports
    success, so the customer sees "Paid" immediately rather than waiting on
    the webhook. The webhook (routers/webhooks.py) is still what's
    authoritative if this call never happens (tab closed, network drop) --
    this is a UX shortcut, not the only path to a paid order.
    """
    order = _get_owned_order(db, order_id, user)

    transaction = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.reference == payload.reference, PaymentTransaction.order_id == order.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No matching payment attempt found for this order.")

    data = await paystack.verify_transaction(payload.reference)

    if data.get("status") != "success":
        transaction.status = TransactionStatus.failed
        db.commit()
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "Payment was not successful.")

    if data.get("amount") != transaction.amount * 100:
        # Amount mismatch is a red flag -- don't mark paid on a technicality.
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment amount does not match this order.")

    order = confirm_payment(db, background_tasks, transaction, order)
    return order
