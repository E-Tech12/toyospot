import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import joinedload

from app.database import SessionLocal
from app.models import MessageSender, Order, OrderMessage, User, UserRole
from app.security import decode_access_token
from app.services.notifications import notify_new_chat_message
from app.ws_manager import manager

router = APIRouter(tags=["chat-ws"])
logger = logging.getLogger("toyospot.ws")


class _ImmediateBackgroundTasks:
    """A stand-in for FastAPI's BackgroundTasks (which only exists for the
    HTTP request/response cycle) so notify_new_chat_message -- shared with
    the REST chat endpoints -- works unmodified from a WebSocket handler
    too. Each queued call runs in a thread so a blocking call (SMTP, the
    push HTTP request) never stalls the event loop that's serving every
    other open chat socket.
    """

    def add_task(self, func, *args, **kwargs):
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, lambda: func(*args, **kwargs))


def _serialize(message: OrderMessage) -> dict:
    return {
        "id": message.id,
        "sender": message.sender.value,
        "text": message.text,
        "created_at": message.created_at.isoformat(),
    }


@router.websocket("/ws/orders/{order_id}/chat")
async def order_chat_socket(websocket: WebSocket, order_id: str):
    token = websocket.query_params.get("token")
    payload = decode_access_token(token) if token else None
    if not payload:
        await websocket.close(code=4401)
        return

    db = SessionLocal()
    try:
        user = db.get(User, payload.get("sub"))
        if not user or not user.is_active:
            await websocket.close(code=4401)
            return

        order = db.query(Order).options(joinedload(Order.user)).filter(Order.id == order_id).first()
        if not order:
            await websocket.close(code=4404)
            return

        is_owner = order.user_id == user.id
        is_admin = user.role == UserRole.admin
        if not (is_owner or is_admin):
            await websocket.close(code=4403)
            return

        await manager.connect(order_id, websocket)

        try:
            while True:
                payload = await websocket.receive_json()
                text = (payload.get("text") or "").strip()
                if not text:
                    continue

                message = OrderMessage(
                    order_id=order.id,
                    sender=MessageSender.admin if is_admin else MessageSender.customer,
                    sender_user_id=user.id,
                    text=text[:1000],
                )
                db.add(message)
                db.commit()
                db.refresh(message)

                await manager.broadcast(order_id, _serialize(message))

                if is_admin:
                    notify_new_chat_message(db, _ImmediateBackgroundTasks(), order, text[:120])
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(order_id, websocket)
    finally:
        db.close()
