"""
WebSocket Router
Real-time assessment chat endpoints with RAG integration
"""
import json
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.context_retrieval import DynamicContextRetrieval
from app.ai.rag.rag_service import get_rag_service
from app.ai.rag.schemas import RAGQueryRequest
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

                    # Send typing indicator
                    await websocket.send_json({
                        "type": "typing",
                        "sender": "ai",
                        "is_typing": True,
                    })

                    # Generate AI response using RAG with dynamic context retrieval
                    try:
                        # Get user's position and framework
                        if user.position_id and session.assessment:
                            # Use dynamic context retrieval for position-specific queries
                            context_retrieval = DynamicContextRetrieval(db)

                            # Retrieve chunks with position-specific context
                            chunks, control_summary = await context_retrieval.retrieve_with_control_context(
                                query=content,
                                position_id=user.position_id,
                                framework_id=session.assessment.framework_id,
                                org_id=str(user.organization_id),
                                top_k=5,
                                score_threshold=0.5,
                            )

                            # Build enhanced prompt with control context
                            enhanced_query = f"{content}\n\nContext: {control_summary}" if control_summary else content

                            # Use RAG service with retrieved chunks
                            rag_service = get_rag_service()
                            rag_request = RAGQueryRequest(
                                question=enhanced_query,
                                framework=None,
                                top_k=len(chunks),
                                score_threshold=0.5,
                                include_metadata=True,
                            )

                            rag_answer = await rag_service.query(
                                request=rag_request,
                                org_id=str(user.organization_id),
                            )

                            # Extract AI response text
                            ai_response_text = rag_answer.full_text if rag_answer.full_text else rag_answer.summary

                            # Build metadata with sources
                            metadata = {
                                "source": "rag_dynamic",
                                "confidence": rag_answer.confidence_score,
                                "sources_count": len(rag_answer.sources),
                                "retrieved_chunks": rag_answer.retrieved_chunks,
                                "processing_time_ms": rag_answer.processing_time_ms,
                                "position_specific": True,
                                "control_context_used": len(control_summary) > 0,
                            }

                            # Include source references
                            if rag_answer.sources:
                                metadata["sources"] = [
                                    {
                                        "framework": source.framework,
                                        "section": source.section,
                                        "control_id": source.control_id,
                                        "relevance": source.relevance_score,
                                    }
                                    for source in rag_answer.sources[:3]
                                ]
                        else:
                            # Fallback to generic RAG if no position assigned
                            rag_service = get_rag_service()
                            rag_request = RAGQueryRequest(
                                question=content,
                                framework=None,
                                top_k=5,
                                score_threshold=0.5,
                                include_metadata=True,
                            )

                            rag_answer = await rag_service.query(
                                request=rag_request,
                                org_id=str(user.organization_id),
                            )

                            ai_response_text = rag_answer.full_text if rag_answer.full_text else rag_answer.summary

                            metadata = {
                                "source": "rag_generic",
                                "confidence": rag_answer.confidence_score,
                                "sources_count": len(rag_answer.sources),
                                "retrieved_chunks": rag_answer.retrieved_chunks,
                                "processing_time_ms": rag_answer.processing_time_ms,
                                "position_specific": False,
                            }

                            if rag_answer.sources:
                                metadata["sources"] = [
                                    {
                                        "framework": source.framework,
                                        "section": source.section,
                                        "control_id": source.control_id,
                                        "relevance": source.relevance_score,
                                    }
                                    for source in rag_answer.sources[:3]
                                ]

                    except Exception as e:
                        logger.error("rag_query_failed", error=str(e))
                        # Fallback response if RAG fails
                        ai_response_text = "I apologize, but I encountered an error processing your question. Please try again."
                        metadata = {"source": "error", "error": str(e)}

                    # Save AI message to database
                    ai_message = ChatMessage(
                        session_id=session_id,
                        sender_type="ai",
                        message_text=ai_response_text,
                        message_metadata=metadata,
                    )
                    db.add(ai_message)
                    await db.commit()
                    await db.refresh(ai_message)

                    # Send typing indicator stopped
                    await websocket.send_json({
                        "type": "typing",
                        "sender": "ai",
                        "is_typing": False,
                    })

                    # Send AI response to client
                    await websocket.send_json({
                        "type": "message",
                        "sender": "ai",
                        "content": ai_response_text,
                        "metadata": metadata,
                        "timestamp": ai_message.created_at.isoformat(),
                    })

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
