from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    MessageSender,
    Order,
    OrderMessage,
    OrderStatus,
    PaymentStatus,
    User,
)
from app.database import get_db
from app.deps import get_current_admin
from app.schemas.misc import OrderMessageIn, OrderMessageOut
from app.schemas.order import OrderOut, UpdateOrderStatusRequest, UpdatePaymentStatusRequest
from app.services.notifications import notify_new_chat_message, notify_order_status

router = APIRouter(prefix="/admin/orders", tags=["admin: orders"])

# Which status transitions an admin is allowed to make. Forward progress
# through the normal flow, plus cancellation from any non-terminal state.
_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.pending: {OrderStatus.accepted, OrderStatus.cancelled},
    OrderStatus.accepted: {OrderStatus.preparing, OrderStatus.cancelled},
    OrderStatus.preparing: {OrderStatus.ready, OrderStatus.cancelled},
    OrderStatus.ready: {OrderStatus.out_for_delivery, OrderStatus.cancelled},
    OrderStatus.out_for_delivery: {OrderStatus.delivered, OrderStatus.cancelled},
    OrderStatus.delivered: set(),
    OrderStatus.cancelled: set(),
}


def _get_order_or_404(db: Session, order_id: str) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.get("", response_model=list[OrderOut])
def list_all_orders(
    status_filter: str | None = None,
    customer_id: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    query = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())
    if status_filter:
        try:
            query = query.filter(Order.status == OrderStatus(status_filter))
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status filter")
    if customer_id:
        query = query.filter(Order.user_id == customer_id)
    return query.all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return _get_order_or_404(db, order_id)


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    payload: UpdateOrderStatusRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    order = _get_order_or_404(db, order_id)
    try:
        new_status = OrderStatus(payload.status)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid order status")

    if new_status not in _ALLOWED_TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot move an order from '{order.status.value}' to '{new_status.value}'.",
        )

    if new_status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        _restock_cancelled_order(db, order)

    order.status = new_status
    db.commit()
    db.refresh(order)

    notify_order_status(db, background_tasks, order, new_status.value)
    return order


def _restock_cancelled_order(db: Session, order: Order) -> None:
    """Cancelling an order returns its items to available stock."""
    from app.models import Food

    for item in order.items:
        food = db.get(Food, item.food_id)
        if food:
            food.quantity_available += item.quantity


@router.patch("/{order_id}/payment-status", response_model=OrderOut)
def update_payment_status(
    order_id: str,
    payload: UpdatePaymentStatusRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    order = _get_order_or_404(db, order_id)
    try:
        order.payment_status = PaymentStatus(payload.payment_status)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid payment status")
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/messages", response_model=list[OrderMessageOut])
def get_order_messages(order_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    order = _get_order_or_404(db, order_id)
    return order.messages


@router.post("/{order_id}/messages", response_model=OrderMessageOut, status_code=status.HTTP_201_CREATED)
def reply_to_order(
    order_id: str,
    payload: OrderMessageIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    order = _get_order_or_404(db, order_id)
    message = OrderMessage(order_id=order.id, sender=MessageSender.admin, sender_user_id=admin.id, text=payload.text)
    db.add(message)
    db.commit()
    db.refresh(message)

    notify_new_chat_message(db, background_tasks, order, payload.text[:120])
    return message
