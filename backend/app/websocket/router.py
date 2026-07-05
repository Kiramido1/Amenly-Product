"""
WebSocket Router
Real-time assessment chat endpoints with RAG integration
"""
import json
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessments.conversation import get_orchestrator
from app.assessments.service import AssessmentService
from app.database.session import get_db
from app.models.chat import ChatMessage
from app.models.identity import User
from app.websocket.manager import get_connection_manager

logger = structlog.get_logger(__name__)

router = APIRouter()


async def get_current_user_from_ws_token(
    token: str,
    db: AsyncSession,
) -> User:
    """
    Authenticate user from WebSocket token
    """
    from fastapi import HTTPException, status
    from jose import JWTError, jwt

    from app.auth.schemas import TokenData
    from app.auth.service import AuthService
    from app.core.config import settings

    try:
        # Decode token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenData(**payload)

        if token_data.type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Get user
        auth_service = AuthService(db)
        user = await auth_service.repo.get_user_by_id(token_data.sub)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # SECURITY: honour server-side revocation here too. The HTTP dependency
        # checks the blacklist; without this, a logged-out/revoked (but unexpired)
        # token would retain full WebSocket access until natural expiry.
        from app.auth.token_manager import token_manager

        if await token_manager.is_token_revoked(token, token_data.sub):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )

        return user

    except (JWTError, HTTPException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


@router.websocket("/assessments/{session_id}/chat")
async def assessment_chat_websocket(
    websocket: WebSocket,
    session_id: UUID,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket endpoint for real-time assessment chat
    
    Query params:
        token: JWT access token for authentication
        
    Message format (client -> server):
        {
            "type": "message",
            "content": "User's message text"
        }
        
    Message format (server -> client):
        {
            "type": "message",
            "sender": "user" | "ai",
            "content": "Message text",
            "metadata": {...},
            "timestamp": "ISO timestamp"
        }
    """
    manager = get_connection_manager()
    assessment_service = AssessmentService(db)
    user: User | None = None

    try:
        # Authenticate user
        user = await get_current_user_from_ws_token(token, db)

        # Verify session belongs to user
        session = await assessment_service.get_session_with_messages(
            session_id=session_id,
            user_id=user.id,
        )

        if not session:
            await websocket.close(code=4001, reason="Session not found or access denied")
            return

        # Connect WebSocket
        await manager.connect(websocket, session_id, user.id)

        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "session_id": str(session_id),
            "user_id": str(user.id),
            "message": "Connected to assessment chat",
        })

        # Load chat history
        history_messages = [
            {
                "type": "message",
                "sender": msg.sender_type,
                "content": msg.message_text,
                "metadata": msg.message_metadata,
                "timestamp": msg.created_at.isoformat(),
            }
            for msg in session.chat_messages
        ]

        if history_messages:
            await websocket.send_json({
                "type": "history",
                "messages": history_messages,
            })

        orchestrator = get_orchestrator(db)

        # Track the metadata of the last AI turn (which control is under discussion
        # and how many times it has been probed) so the interview can resume.
        last_ai_meta = None
        for msg in reversed(session.chat_messages):
            if msg.sender_type == "ai" and (msg.message_metadata or {}).get("kind"):
                last_ai_meta = msg.message_metadata
                break

        # If the AI has not asked a question yet, open the interview: the AI leads.
        already_asked = any(
            m.sender_type == "ai" and (m.message_metadata or {}).get("kind") in ("question", "followup")
            for m in session.chat_messages
        )
        if not already_asked:
            opening = await orchestrator.opening_message(session)
            ai_open = ChatMessage(session_id=session_id, sender_type="ai",
                                  message_text=opening.content, message_metadata=opening.metadata)
            db.add(ai_open)
            await db.commit()
            await db.refresh(ai_open)
            last_ai_meta = opening.metadata
            await websocket.send_json({
                "type": "message", "sender": "ai", "content": opening.content,
                "metadata": opening.metadata, "timestamp": ai_open.created_at.isoformat(),
            })

        # Message loop
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)

                # Handle different message types
                if message_data.get("type") == "message":
                    content = message_data.get("content", "")

                    if not content:
                        continue

                    # Save user message to database
                    user_message = ChatMessage(
                        session_id=session_id,
                        sender_type="user",
                        message_text=content,
                        message_metadata=None,
                    )
                    db.add(user_message)
                    await db.commit()
                    await db.refresh(user_message)

                    try:
                        from app.assets.service import AssetExtractionService

                        asset_service = AssetExtractionService(db)
                        await asset_service.extract_assets_from_message(
                            message_text=content,
                            organization_id=user.organization_id,
                            session_id=session_id,
                            message_id=user_message.id,
                        )
                    except Exception as e:
                        logger.warning("asset_extraction_skipped", error=str(e))

                    # Send user message back to client (echo)
                    await websocket.send_json({
                        "type": "message",
                        "sender": "user",
                        "content": content,
                        "metadata": None,
                        "timestamp": user_message.created_at.isoformat(),
                    })

                    # AI-driven interview: judge the answer, then probe or advance.
                    await websocket.send_json({"type": "typing", "sender": "ai", "is_typing": True})

                    result = await orchestrator.handle_answer(session, content, last_ai_meta)

                    ai_message = ChatMessage(
                        session_id=session_id, sender_type="ai",
                        message_text=result.content, message_metadata=result.metadata)
                    db.add(ai_message)
                    await db.commit()
                    await db.refresh(ai_message)
                    last_ai_meta = result.metadata

                    await websocket.send_json({"type": "typing", "sender": "ai", "is_typing": False})
                    await websocket.send_json({
                        "type": "message", "sender": "ai", "content": result.content,
                        "metadata": result.metadata, "timestamp": ai_message.created_at.isoformat(),
                    })

                    if result.done:
                        await assessment_service.complete_session(session_id)
                        await assessment_service.update_assessment_score(session.assessment_id)
                        await websocket.send_json({"type": "complete", "metadata": result.metadata})

                    logger.info(
                        "chat_message_processed",
                        session_id=str(session_id),
                        user_id=str(user.id),
                    )

                elif message_data.get("type") == "typing":
                    # Handle typing indicator
                    await websocket.send_json({
                        "type": "typing",
                        "sender": "ai",
                        "is_typing": False,
                    })

                elif message_data.get("type") == "ping":
                    # Handle ping/pong for connection health
                    await websocket.send_json({
                        "type": "pong",
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                })
            except Exception as e:
                logger.error("message_processing_error", error=str(e))
                await websocket.send_json({
                    "type": "error",
                    "message": "Error processing message",
                })

    except WebSocketDisconnect:
        logger.info("websocket_disconnected", session_id=str(session_id))
    except Exception as e:
        logger.error("websocket_error", session_id=str(session_id), error=str(e))
    finally:
        # Clean up connection
        if user:
            manager.disconnect(session_id, user.id)
