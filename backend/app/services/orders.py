from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Food, Order, OrderItem, PaymentMethod, PaymentStatus, User
from app.services.email import send_admin_new_order_email
from app.services.notifications import notify_order_status

settings = get_settings()


class OrderItemRequest:
    def __init__(self, food_id: str, quantity: int):
        self.food_id = food_id
        self.quantity = quantity


def place_order(
    db: Session,
    background_tasks: BackgroundTasks,
    user: User,
    items: list[OrderItemRequest],
    full_name: str,
    phone: str,
    address_line: str,
    notes: str,
    payment_method: PaymentMethod,
) -> Order:
    """Creates an order, snapshotting prices server-side (never trusting the
    client's cart total) and decrementing inventory atomically in the same
    transaction as the order write, so a stock check and the decrement can
    never race against a second concurrent order for the last portion.
    """
    if not items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your cart is empty.")

    order_items: list[OrderItem] = []
    item_total = 0

    # Lock the rows we're about to sell against for the duration of this
    # transaction (SELECT ... FOR UPDATE) so two simultaneous checkouts for
    # the last two portions of a dish can't both succeed.
    for req in items:
        food = db.query(Food).filter(Food.id == req.food_id).with_for_update().first()
        if not food or food.is_archived:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"A menu item in your cart is no longer available.")
        if req.quantity < 1:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid quantity for {food.name}.")
        if food.quantity_available < req.quantity:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Only {food.quantity_available} of {food.name} left -- please update your cart.",
            )

        food.quantity_available -= req.quantity
        item_total += food.price * req.quantity
        order_items.append(
            OrderItem(
                food_id=food.id,
                name=food.name,
                price=food.price,
                image_url=food.image_url,
                quantity=req.quantity,
            )
        )

    delivery_fee = settings.DELIVERY_FEE
    order = Order(
        user_id=user.id,
        full_name=full_name,
        phone=phone,
        address_line=address_line,
        notes=notes,
        payment_method=payment_method,
        payment_status=PaymentStatus.unpaid,
        item_total=item_total,
        delivery_fee=delivery_fee,
        grand_total=item_total + delivery_fee,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    notify_order_status(db, background_tasks, order, "pending")
    background_tasks.add_task(
        send_admin_new_order_email,
        settings.ADMIN_NOTIFICATION_EMAIL,
        order.order_number,
        full_name,
        f"\u20a6{order.grand_total:,}",
    )

    return order
