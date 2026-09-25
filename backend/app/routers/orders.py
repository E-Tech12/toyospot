from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import MessageSender, Order, OrderMessage, PaymentMethod, User
from app.schemas.misc import OrderMessageIn, OrderMessageOut
from app.schemas.order import CheckoutRequest, OrderOut, OrderSummaryOut
from app.services.orders import OrderItemRequest, place_order

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_owned_order(db: Session, order_id: str, user: User) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        method = PaymentMethod(payload.payment_method)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid payment method")

    order = place_order(
        db,
        background_tasks,
        user,
        items=[OrderItemRequest(i.food_id, i.quantity) for i in payload.items],
        full_name=payload.full_name,
        phone=payload.phone,
        address_line=payload.address_line,
        notes=payload.notes,
        payment_method=method,
    )
    return order


@router.get("", response_model=list[OrderSummaryOut])
def list_my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        OrderSummaryOut(
            id=o.id,
            order_number=o.order_number,
            status=o.status.value,
            payment_status=o.payment_status.value,
            grand_total=o.grand_total,
            created_at=o.created_at,
            item_count=sum(i.quantity for i in o.items),
            first_item_name=o.items[0].name if o.items else "",
            first_item_image=o.items[0].image_url if o.items else "",
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_owned_order(db, order_id, user)


@router.get("/{order_id}/messages", response_model=list[OrderMessageOut])
def list_order_messages(order_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = _get_owned_order(db, order_id, user)
    return order.messages


@router.post("/{order_id}/messages", response_model=OrderMessageOut, status_code=status.HTTP_201_CREATED)
def send_order_message(
    order_id: str,
    payload: OrderMessageIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = _get_owned_order(db, order_id, user)
    message = OrderMessage(order_id=order.id, sender=MessageSender.customer, sender_user_id=user.id, text=payload.text)
    db.add(message)
    db.commit()
    db.refresh(message)
    # Admins are notified through the admin dashboard's live order/chat feed
    # (see routers/admin_orders.py) rather than a push notification, since
    # there's a single admin account watching the dashboard directly.
    return message
