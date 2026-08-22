import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections keyed by user_id."""

    def __init__(self) -> None:
        # user_id -> list of active connections (same user may open multiple tabs)
        self._connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(user_id, []).append(ws)
        logger.info("WS connected: user_id=%s (total sockets=%s)", user_id, len(self._connections[user_id]))

    def disconnect(self, user_id: int, ws: WebSocket) -> None:
        sockets = self._connections.get(user_id, [])
        if ws in sockets:
            sockets.remove(ws)
        if not sockets:
            self._connections.pop(user_id, None)
        logger.info("WS disconnected: user_id=%s", user_id)

    async def send_personal(self, user_id: int, data: dict[str, Any]) -> None:
        """Send a JSON message to all connections of a user. Silently drops if user is offline."""
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                # Connection dropped mid-send — will be cleaned up on disconnect
                pass

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Broadcast a JSON message to all connected users."""
        for sockets in list(self._connections.values()):
            for ws in list(sockets):
                try:
                    await ws.send_text(json.dumps(data))
                except Exception:
                    pass


# Singleton instance used throughout the app
manager = ConnectionManager()
