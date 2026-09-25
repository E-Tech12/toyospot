from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.models import Notification, NotificationType, User, Order
from app.services.push import send_push_to_user
from app.services.email import send_order_status_email, ORDER_STATUS_COPY

_STATUS_TO_TYPE = {
    "pending": NotificationType.order_received,
    "accepted": NotificationType.order_accepted,
    "preparing": NotificationType.order_preparing,
    "ready": NotificationType.order_ready,
    "out_for_delivery": NotificationType.order_out_for_delivery,
    "delivered": NotificationType.order_delivered,
    "cancelled": NotificationType.order_cancelled,
}


def _create_notification(
    db: Session,
    background_tasks: BackgroundTasks,
    user: User,
    type: NotificationType,
    title: str,
    body: str,
    order_id: str | None,
) -> Notification:
    notification = Notification(user_id=user.id, type=type, title=title, body=body, order_id=order_id)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    background_tasks.add_task(
        send_push_to_user, db, user.id, title, body, f"/dashboard/orders/{order_id}" if order_id else "/dashboard"
    )
    return notification


def notify_order_status(db: Session, background_tasks: BackgroundTasks, order: Order, status_key: str) -> Notification:
    """Creates the in-app notification, queues a push, and (for the statuses
    customers care about) queues the matching branded email -- all three from
    one call site so a status transition can never update one channel and
    forget another.
    """
    heading, message = ORDER_STATUS_COPY.get(status_key, ("Order update", "Your order status has changed."))
    notif_type = _STATUS_TO_TYPE.get(status_key, NotificationType.order_received)

    notification = _create_notification(
        db, background_tasks, order.user, notif_type, f"{heading} - {order.order_number}", message, order.id
    )
    background_tasks.add_task(
        send_order_status_email, order.user.email, order.user.first_name, order.order_number, status_key
    )
    return notification


def notify_new_chat_message(db: Session, background_tasks: BackgroundTasks, order: Order, preview: str) -> Notification:
    return _create_notification(
        db,
        background_tasks,
        order.user,
        NotificationType.new_chat_message,
        f"New message on order {order.order_number}",
        preview,
        order.id,
    )


def notify_announcement(db: Session, background_tasks: BackgroundTasks, user: User, title: str, body: str) -> Notification:
    return _create_notification(db, background_tasks, user, NotificationType.announcement, title, body, None)
