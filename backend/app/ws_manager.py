import logging

from fastapi import WebSocket

logger = logging.getLogger("toyospot.ws")


class OrderChatConnectionManager:
    """Keeps a list of live WebSocket connections per order_id, so a new
    chat message can be broadcast to everyone currently watching that
    order's chat (the customer's open tab(s) and the admin dashboard) the
    instant it's created, instead of everyone polling for it.
    """

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, order_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(order_id, []).append(websocket)

    def disconnect(self, order_id: str, websocket: WebSocket) -> None:
        conns = self._connections.get(order_id)
        if not conns:
            return
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(order_id, None)

    async def broadcast(self, order_id: str, message: dict) -> None:
        for ws in list(self._connections.get(order_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                logger.info("Dropping dead websocket for order %s", order_id)
                self.disconnect(order_id, ws)


manager = OrderChatConnectionManager()
