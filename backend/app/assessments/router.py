"""
Assessment Router
API endpoints for assessment management with permission checks
"""
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessments.schemas import (
    AssessmentAnswerCreate,
    AssessmentAnswerResponse,
    AssessmentCreate,
    AssessmentDetailResponse,
    AssessmentResponse,
    AssessmentSessionDetailResponse,
    AssessmentSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    QuestionWithControlResponse,
)
from app.assessments.service import AssessmentService
from app.auth.dependencies import get_current_active_user
from app.auth.permissions import require_any_permission, require_permission
from app.auth.schemas import GenericResponse
from app.database.session import get_db
from app.models.enums import Permission
from app.models.identity import User

logger = structlog.get_logger(__name__)

router = APIRouter()


def _require_completed_profile(current_user: User) -> None:
    """Block assessment actions until an admin has completed the company profile."""
    org = getattr(current_user, "organization", None)
    if org is None or not getattr(org, "profile_completed", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The organization profile must be completed by an admin before starting an assessment.",
        )


# --- Assessment Endpoints (Admin Only) ---


@router.post(
    "",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.START_ASSESSMENT))],
)
async def create_assessment(
    assessment_in: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new assessment (Admin only).
    
    Requires: START_ASSESSMENT permission
    """
    assessment_service = AssessmentService(db)

    # Verify user belongs to the organization
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    _require_completed_profile(current_user)

    assessment = await assessment_service.create_assessment(
        organization_id=current_user.organization_id,
        framework_id=assessment_in.framework_id,
        name=assessment_in.name,
    )

    return {
        "success": True,
        "message": "Assessment created successfully",
        "data": {"assessment": AssessmentResponse.model_validate(assessment)},
    }


@router.get(
    "",
    response_model=GenericResponse,
    dependencies=[Depends(require_any_permission(
        Permission.VIEW_ALL_SESSIONS,
        Permission.VIEW_OWN_SESSIONS
    ))],
)
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List all assessments for the organization.
    
    Requires: VIEW_ALL_SESSIONS or VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    assessments = await assessment_service.list_assessments(
        organization_id=current_user.organization_id,
    )

    return {
        "success": True,
        "message": "Assessments retrieved successfully",
        "data": {
            "assessments": [AssessmentDetailResponse.model_validate(a) for a in assessments]
        },
    }


@router.get(
    "/{assessment_id}",
    response_model=GenericResponse,
    dependencies=[Depends(require_any_permission(
        Permission.VIEW_ALL_SESSIONS,
        Permission.VIEW_OWN_SESSIONS
    ))],
)
async def get_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get assessment details.
    
    Requires: VIEW_ALL_SESSIONS or VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization",
        )

    assessment = await assessment_service.get_assessment(
        assessment_id=assessment_id,
        organization_id=current_user.organization_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return {
        "success": True,
        "message": "Assessment retrieved successfully",
        "data": {"assessment": AssessmentDetailResponse.model_validate(assessment)},
    }


# --- Assessment Session Endpoints ---


@router.post(
    "/{assessment_id}/sessions/start",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def start_assessment_session(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Start a new assessment session for the current user.
    
    Requires: VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    # Members cannot start until an admin has completed the company profile.
    _require_completed_profile(current_user)

    # Check if user has a position
    if current_user.position_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a position assigned to participate in assessments",
        )

    # SECURITY: verify the assessment belongs to the caller's organization BEFORE
    # creating any session/greeting rows. This check previously ran AFTER those
    # writes, letting a user spin up a session against another org's assessment
    # (cross-tenant IDOR), pollute its data, and leak its framework greeting.
    assessment = await assessment_service.get_assessment(
        assessment_id=assessment_id,
        organization_id=current_user.organization_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    # Start session
    session = await assessment_service.get_user_session(
        assessment_id=assessment_id,
        user_id=current_user.id,
    )

    if not session or session.status == "completed":
        session = await assessment_service.start_assessment_session(
            assessment_id=assessment_id,
            user_id=current_user.id,
        )

    greeting = await assessment_service.ensure_session_greeting(session)

    # Refresh session with messages after greeting creation
    session = await assessment_service.get_session_with_messages(
        session_id=session.id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found after creation",
        )

    questions = await assessment_service.get_questions_for_position(
        framework_id=assessment.framework_id,
        position_id=current_user.position_id,
    )

    question_responses = []
    for q in questions:
        question_responses.append(
            QuestionWithControlResponse(
                id=q.id,
                control_id=q.control_id,
                question_text=q.question_text,
                logic_type=q.logic_type,
                expected_evidence=q.expected_evidence,
                created_at=q.created_at,
                updated_at=q.updated_at,
                control_code=q.control.code if q.control else None,
                control_title=q.control.title if q.control else None,
            )
        )

    return {
        "success": True,
        "message": "Assessment session started successfully",
        "data": {
            "session": AssessmentSessionResponse.model_validate(session),
            "questions": question_responses,
            "greeting": greeting,
        },
    }


@router.get(
    "/sessions/{session_id}",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def get_assessment_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get assessment session details.
    
    Requires: VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    session = await assessment_service.get_session_with_messages(
        session_id=session_id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    return {
        "success": True,
        "message": "Session retrieved successfully",
        "data": {"session": AssessmentSessionDetailResponse.model_validate(session)},
    }


@router.post(
    "/sessions/{session_id}/complete",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def complete_assessment_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Complete an assessment session.
    
    Requires: VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    session = await assessment_service.get_session_with_messages(
        session_id=session_id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    # M-3: completion is a one-way transition. Re-completing would reset completed_at
    # and re-run scoring, so treat an already-completed session as idempotent.
    if str(session.status) == "completed":
        return {
            "success": True,
            "message": "Assessment session already completed",
            "data": {"session": AssessmentSessionResponse.model_validate(session)},
        }

    completed_session = await assessment_service.complete_session(session_id=session_id)

    # Update assessment score
    await assessment_service.update_assessment_score(assessment_id=session.assessment_id)

    # Auto-finalize the current phase once every participant has completed.
    assessment = await assessment_service.get_assessment(
        assessment_id=session.assessment_id,
        organization_id=current_user.organization_id,
    )
    if assessment is not None:
        await assessment_service.maybe_autoclose(assessment)

    return {
        "success": True,
        "message": "Assessment session completed successfully",
        "data": {"session": AssessmentSessionResponse.model_validate(completed_session)},
    }


# --- Campaign Lifecycle Endpoints (Admin only) ---


async def _get_admin_assessment(assessment_service, assessment_id, current_user):
    """Load an assessment scoped to the admin's org or raise 404."""
    if current_user.organization_id is None:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
    assessment = await assessment_service.get_assessment(
        assessment_id=assessment_id,
        organization_id=current_user.organization_id,
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.post(
    "/{assessment_id}/launch",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.LAUNCH_ASSESSMENT))],
)
async def launch_campaign(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Launch the assessment campaign (Admin only). Opens the baseline phase."""
    assessment_service = AssessmentService(db)
    _require_completed_profile(current_user)
    assessment = await _get_admin_assessment(assessment_service, assessment_id, current_user)
    assessment = await assessment_service.launch_campaign(assessment, current_user.id)
    return {
        "success": True,
        "message": "Assessment campaign launched",
        "data": {"assessment": AssessmentResponse.model_validate(assessment)},
    }


@router.post(
    "/{assessment_id}/advance-phase",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.LAUNCH_ASSESSMENT))],
)
async def advance_phase(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Snapshot the baseline score and open the remediation (second) pass (Admin only)."""
    assessment_service = AssessmentService(db)
    assessment = await _get_admin_assessment(assessment_service, assessment_id, current_user)
    assessment = await assessment_service.advance_to_remediation(assessment)
    return {
        "success": True,
        "message": "Advanced to remediation phase",
        "data": {"assessment": AssessmentResponse.model_validate(assessment)},
    }


@router.post(
    "/{assessment_id}/close",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.CLOSE_ASSESSMENT))],
)
async def close_campaign(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Close the campaign and lock in the final score (Admin only)."""
    assessment_service = AssessmentService(db)
    assessment = await _get_admin_assessment(assessment_service, assessment_id, current_user)
    assessment = await assessment_service.close_campaign(assessment)
    return {
        "success": True,
        "message": "Assessment campaign closed",
        "data": {"assessment": AssessmentResponse.model_validate(assessment)},
    }


@router.get(
    "/{assessment_id}/sessions",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ALL_SESSIONS))],
)
async def list_campaign_sessions(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List every member's session for the assessment (Admin only)."""
    assessment_service = AssessmentService(db)
    await _get_admin_assessment(assessment_service, assessment_id, current_user)
    sessions = await assessment_service.list_all_sessions(assessment_id)
    return {
        "success": True,
        "message": "Sessions retrieved successfully",
        "data": {"sessions": sessions},
    }


@router.get(
    "/{assessment_id}/sessions/{session_id}/chat",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_ALL_SESSIONS))],
)
async def get_member_session_chat(
    assessment_id: UUID,
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Read a member's full interview transcript for the assessment (Admin only)."""
    assessment_service = AssessmentService(db)
    await _get_admin_assessment(assessment_service, assessment_id, current_user)
    session = await assessment_service.get_session_for_org(
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    member = session.user
    position = getattr(member, "position", None)
    messages = [ChatMessageResponse.model_validate(m) for m in session.chat_messages]
    return {
        "success": True,
        "message": "Transcript retrieved successfully",
        "data": {
            "session_id": session_id,
            "member": {
                "id": member.id,
                "full_name": getattr(member, "full_name", None),
                "email": member.email,
                "position_name": position.name if position else None,
            },
            "status": str(session.status.value if hasattr(session.status, "value") else session.status),
            "messages": messages,
        },
    }


@router.get(
    "/{assessment_id}/overview",
    response_model=GenericResponse,
    dependencies=[Depends(require_any_permission(
        Permission.VIEW_ALL_SCORES,
        Permission.VIEW_ORG_TOTAL_SCORE,
    ))],
)
async def campaign_overview(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Before/after scores + participation summary for the admin dashboard."""
    assessment_service = AssessmentService(db)
    assessment = await _get_admin_assessment(assessment_service, assessment_id, current_user)
    overview = await assessment_service.get_campaign_overview(assessment)
    return {
        "success": True,
        "message": "Overview retrieved successfully",
        "data": {"overview": overview},
    }


# --- Assessment Answer Endpoints ---


@router.post(
    "/answers",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def save_assessment_answer(
    answer_in: AssessmentAnswerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Save an assessment answer.
    
    Requires: VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    # Verify session belongs to user
    session = await assessment_service.get_session_with_messages(
        session_id=answer_in.session_id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    # M-2: answers may only be saved while the session is in progress.
    if str(session.status) == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assessment session is already completed and cannot be modified.",
        )

    # Evaluate the answer with the AI engine and persist score + remediation.
    answer = await assessment_service.submit_answer(
        session=session,
        question_id=answer_in.question_id,
        # H-8: always derive the position from the authenticated user. A client-supplied
        # position_id let users attribute answers to positions outside their scope.
        position_id=current_user.position_id,
        answer_text=answer_in.answer_text,
        evidence_urls=answer_in.evidence_urls,
    )

    return {
        "success": True,
        "message": "Answer submitted and evaluated successfully",
        "data": {"answer": AssessmentAnswerResponse.model_validate(answer)},
    }


# --- Chat Message Endpoints ---


@router.post(
    "/sessions/{session_id}/chat",
    response_model=GenericResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def send_chat_message(
    message_in: ChatMessageCreate,
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Send a chat message in assessment session.
    
    Requires: VIEW_OWN_SESSIONS permission
    
    Note: This endpoint saves the message. AI response will be handled by WebSocket.
    """
    from app.models.chat import ChatMessage

    assessment_service = AssessmentService(db)

    # Verify session belongs to user
    session = await assessment_service.get_session_with_messages(
        session_id=session_id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    # Save user message
    message = ChatMessage(
        session_id=session_id,
        sender_type="user",
        message_text=message_in.message_text,
        message_metadata=None,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    logger.info(
        "chat_message_sent",
        message_id=str(message.id),
        session_id=str(session_id),
        user_id=str(current_user.id),
    )

    return {
        "success": True,
        "message": "Chat message sent successfully",
        "data": {"message": ChatMessageResponse.model_validate(message)},
    }


@router.get(
    "/sessions/{session_id}/chat",
    response_model=GenericResponse,
    dependencies=[Depends(require_permission(Permission.VIEW_OWN_SESSIONS))],
)
async def get_chat_history(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get chat history for an assessment session.
    
    Requires: VIEW_OWN_SESSIONS permission
    """
    assessment_service = AssessmentService(db)

    session = await assessment_service.get_session_with_messages(
        session_id=session_id,
        user_id=current_user.id,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    messages = [
        ChatMessageResponse.model_validate(msg)
        for msg in session.chat_messages
    ]

    return {
        "success": True,
        "message": "Chat history retrieved successfully",
        "data": {
            "session_id": session_id,
            "messages": messages,
        },
    }
