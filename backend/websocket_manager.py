"""WebSocket connection manager for real-time price updates."""

import json
import asyncio
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for broadcasting price updates."""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._price_update_task: asyncio.Task | None = None
    
    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("WebSocket connected", total_connections=len(self.active_connections))
    
    async def disconnect(self, websocket: WebSocket) -> None:
        """Unregister and remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        logger.info("WebSocket disconnected", total_connections=len(self.active_connections))
    
    async def broadcast(self, message: dict) -> None:
        """Broadcast a message to all connected clients."""
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error("Failed to send message to client", error=str(e))
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def broadcast_price_update(self, tao_price: float, timestamp: str) -> None:
        """Broadcast price update to all clients."""
        message = {
            "type": "price_update",
            "tao_price": tao_price,
            "timestamp": timestamp,
        }
        await self.broadcast(message)


# Global connection manager instance
price_ticker_manager = ConnectionManager()
