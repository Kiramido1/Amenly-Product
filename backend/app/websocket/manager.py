"""
WebSocket Connection Manager
Manages WebSocket connections for real-time assessment chat
"""
from uuid import UUID

import structlog
from fastapi import WebSocket

logger = structlog.get_logger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for assessment sessions
    """

    def __init__(self):
        # Map session_id to WebSocket connection
        self.active_connections: dict[UUID, WebSocket] = {}
        # Map user_id to list of session_ids
        self.user_sessions: dict[UUID, list[UUID]] = {}

    async def connect(self, websocket: WebSocket, session_id: UUID, user_id: UUID):
        """
        Accept WebSocket connection and register it
        """
        await websocket.accept()

        # Store connection
        self.active_connections[session_id] = websocket

        # Track user sessions
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = []
        if session_id not in self.user_sessions[user_id]:
            self.user_sessions[user_id].append(session_id)

        logger.info(
            "websocket_connected",
            session_id=str(session_id),
            user_id=str(user_id),
            active_connections=len(self.active_connections),
        )

    def disconnect(self, session_id: UUID, user_id: UUID):
        """
        Remove WebSocket connection
        """
        if session_id in self.active_connections:
            del self.active_connections[session_id]

        # Remove session from user's sessions
        if user_id in self.user_sessions:
            if session_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(session_id)

        logger.info(
            "websocket_disconnected",
            session_id=str(session_id),
            user_id=str(user_id),
            active_connections=len(self.active_connections),
        )

    async def send_personal_message(self, message: dict, session_id: UUID):
        """
        Send message to specific session
        """
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_json(message)
                logger.debug("message_sent", session_id=str(session_id))
            except Exception as e:
                logger.error("send_message_failed", session_id=str(session_id), error=str(e))
                # Remove broken connection
                self.disconnect(session_id, None)

    async def broadcast_to_user(self, message: dict, user_id: UUID):
        """
        Broadcast message to all sessions belonging to a user
        """
        if user_id in self.user_sessions:
            for session_id in self.user_sessions[user_id]:
                await self.send_personal_message(message, session_id)

    def is_connected(self, session_id: UUID) -> bool:
        """
        Check if session has active WebSocket connection
        """
        return session_id in self.active_connections

    def get_user_sessions(self, user_id: UUID) -> list[UUID]:
        """
        Get all session IDs for a user
        """
        return self.user_sessions.get(user_id, [])


# Global connection manager instance
manager = ConnectionManager()


def get_connection_manager() -> ConnectionManager:
    """Get global connection manager instance"""
    return manager
