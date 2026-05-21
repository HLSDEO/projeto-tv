from fastapi import WebSocket
from typing import List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"🔌 WebSocket connection accepted. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"🔌 WebSocket connection closed. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        logger.info(f"📡 Broadcasting to {len(self.active_connections)} connection(s): {message}")
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"❌ Failed to send message to websocket connection: {e}")
                # We do not remove here to prevent modifying list during iteration,
                # disconnection will be handled by the websocket loop context manager.

manager = ConnectionManager()
