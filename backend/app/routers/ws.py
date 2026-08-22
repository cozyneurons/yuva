from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from app.core.security import decode_token
from app.ws.manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    user_id: int,
    ws: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint. Clients must pass ?token=<access_token> in the query string.
    The server validates the token and ensures user_id matches before accepting.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != "access" or int(payload["sub"]) != user_id:
            await ws.close(code=4001)
            return
    except (JWTError, KeyError, ValueError):
        await ws.close(code=4001)
        return

    await manager.connect(user_id, ws)
    try:
        while True:
            # Keep connection alive; we don't expect client messages for now
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)
