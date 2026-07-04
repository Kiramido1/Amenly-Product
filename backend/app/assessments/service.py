"""
Assessment Service
Business logic for assessment management
"""
from datetime import datetime
from uuid import UUID

import structlog
from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.assessments.question_generator import QuestionGenerator
from app.models.assessments import Assessment, AssessmentAnswer, AssessmentSession
from app.models.chat import ChatMessage
from app.models.compliance import AIQuestion, ControlPosition, Framework, FrameworkControl
from app.models.enums import AssessmentStatus, ControlStatus
from app.models.identity import Department, Position, User

logger = structlog.get_logger(__name__)


class AssessmentService:
    """Service for assessment operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_assessment(
        self,
        organization_id: UUID,
        framework_id: UUID,
        name: str,
    ) -> Assessment:
        """Create a new assessment for an organization"""
        assessment = Assessment(
            organization_id=organization_id,
            framework_id=framework_id,
            name=name,
            status=AssessmentStatus.PENDING,
        )
        self.db.add(assessment)
        await self.db.commit()
        await self.db.refresh(assessment)

        logger.info(
            "assessment_created",
            assessment_id=str(assessment.id),
            organization_id=str(organization_id),
            framework_id=str(framework_id),
        )
        return assessment

    async def get_assessment(
        self,
        assessment_id: UUID,
        organization_id: UUID,
    ) -> Assessment | None:
        """Get assessment by ID with organization check"""
        result = await self.db.execute(
            select(Assessment)
            .where(
                and_(
                    Assessment.id == assessment_id,
                    Assessment.organization_id == organization_id,
                )
            )
            .options(selectinload(Assessment.framework))
        )
        return result.scalar_one_or_none()

    async def list_assessments(
        self,
        organization_id: UUID,
    ) -> list[Assessment]:
        """List all assessments for an organization"""
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.organization_id == organization_id)
            .options(selectinload(Assessment.framework))
            .order_by(Assessment.created_at.desc())
        )
        return result.scalars().all()

    async def start_assessment_session(
        self,
        assessment_id: UUID,
        user_id: UUID,
    ) -> AssessmentSession:
        """Start a new assessment session for a user"""
        session = AssessmentSession(
            assessment_id=assessment_id,
            user_id=user_id,
            status=AssessmentStatus.IN_PROGRESS,
            started_at=datetime.utcnow(),
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        logger.info(
            "assessment_session_started",
            session_id=str(session.id),
            assessment_id=str(assessment_id),
            user_id=str(user_id),
        )
        return session

    async def generate_session_greeting(
        self,
        session: AssessmentSession,
    ) -> str:
        """
        Generate initial AI greeting for assessment session
        """
        # Get user's position and department
        result = await self.db.execute(
            select(User, Position, Department, Assessment, Framework)
            .join(Position, User.position_id == Position.id)
            .join(Department, Position.department_id == Department.id)
            # Join the session's assessment by its known id (AssessmentSession is not
            # part of this query's FROM clause, so we must not reference its columns).
            .join(Assessment, Assessment.id == session.assessment_id)
            .join(Framework, Framework.id == Assessment.framework_id)
            .where(User.id == session.user_id)
        )
        user_data = result.first()

        if not user_data:
            return "Welcome to your compliance assessment. Let's get started."

        user, position, department, assessment, framework = user_data

        # Generate greeting using question generator
        generator = QuestionGenerator(self.db)
        greeting = await generator.generate_initial_greeting(
            position=position,
            department=department,
            framework=framework,
        )

        return greeting

    async def ensure_session_greeting(self, session: AssessmentSession) -> str:
        """Create one persisted AI greeting for a session if it does not exist."""
        result = await self.db.execute(
            select(ChatMessage)
            .where(
                and_(
                    ChatMessage.session_id == session.id,
                    ChatMessage.sender_type == "ai",
                )
            )
            .order_by(ChatMessage.created_at.asc())
            .limit(1)
        )
        existing = result.scalar_one_or_none()

        if existing:
            return existing.message_text

        greeting = await self.generate_session_greeting(session)
        message = ChatMessage(
            session_id=session.id,
            sender_type="ai",
            message_text=greeting,
            message_metadata={"source": "assessment_greeting"},
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)

        return greeting

    async def generate_dynamic_questions_for_session(
        self,
        session: AssessmentSession,
        conversation_context: str | None = None,
        num_questions: int = 3,
    ) -> list[dict]:
        """
        Generate dynamic questions for assessment session based on user's position
        """
        # Get user's position and framework
        result = await self.db.execute(
            select(User, Position, Assessment, Framework)
            .join(Position, User.position_id == Position.id)
            .join(Assessment, AssessmentSession.assessment_id == Assessment.id)
            .join(Framework, Assessment.framework_id == Framework.id)
            .where(User.id == session.user_id)
        )
        user_data = result.first()

        if not user_data:
            return []

        user, position, assessment, framework = user_data

        # Generate questions using question generator
        generator = QuestionGenerator(self.db)
        questions = await generator.generate_dynamic_questions(
            position=position,
            framework=framework,
            conversation_context=conversation_context,
            num_questions=num_questions,
        )

        return questions

    async def get_user_session(
        self,
        assessment_id: UUID,
        user_id: UUID,
    ) -> AssessmentSession | None:
        """Get user's active session for an assessment"""
        result = await self.db.execute(
            select(AssessmentSession)
            .where(
                and_(
                    AssessmentSession.assessment_id == assessment_id,
                    AssessmentSession.user_id == user_id,
                )
            )
            .options(selectinload(AssessmentSession.assessment))
            .order_by(AssessmentSession.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def get_session_with_messages(
        self,
        session_id: UUID,
        user_id: UUID,
    ) -> AssessmentSession | None:
        """Get session with chat messages"""
        result = await self.db.execute(
            select(AssessmentSession)
            .where(AssessmentSession.id == session_id)
            .options(
                selectinload(AssessmentSession.chat_messages),
                selectinload(AssessmentSession.assessment),
            )
        )
        session = result.scalar_one_or_none()

        # Verify user has access
        if session and session.user_id != user_id:
            return None

        return session

    async def get_questions_for_position(
        self,
        framework_id: UUID,
        position_id: UUID | None,
    ) -> list[AIQuestion]:
        """Get AI questions relevant to a specific position"""
        # Get controls mapped to this position
        result = await self.db.execute(
            select(AIQuestion)
            .join(FrameworkControl, AIQuestion.control_id == FrameworkControl.id)
            .join(ControlPosition, FrameworkControl.id == ControlPosition.control_id)
            .where(
                and_(
                    FrameworkControl.framework_id == framework_id,
                    ControlPosition.position_id == position_id,
                )
            )
            .options(selectinload(AIQuestion.control))
        )
        return result.scalars().all()

    async def save_answer(
        self,
        session_id: UUID,
        question_id: UUID,
        position_id: UUID,
        answer_text: str,
        compliance_score: float | None = None,
        evidence_urls: list[str] | None = None,
        ai_feedback: str | None = None,
        status: ControlStatus = ControlStatus.NOT_IMPLEMENTED,
    ) -> AssessmentAnswer:
        """Save an assessment answer"""
        # NOTE: the `status` parameter (ControlStatus) shadows fastapi.status here,
        # so use integer HTTP codes directly.
        if position_id is None:
            raise HTTPException(status_code=400, detail="position_id is required to save an assessment answer")

        # Validate the question exists before insert, so a bad question_id returns a
        # clean 404 instead of an unhandled DB foreign-key error (HTTP 500).
        question = await self.db.execute(
            select(AIQuestion.id).where(AIQuestion.id == question_id)
        )
        if question.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Question not found for this assessment.")

        answer = AssessmentAnswer(
            session_id=session_id,
            question_id=question_id,
            position_id=position_id,
            answer_text=answer_text,
            compliance_score=compliance_score,
            evidence_urls=evidence_urls,
            ai_feedback=ai_feedback,
            status=status,
        )
        self.db.add(answer)
        try:
            await self.db.commit()
        except IntegrityError:
            # Safety net for any other invalid reference (e.g. position_id).
            await self.db.rollback()
            raise HTTPException(status_code=404, detail="Invalid reference (question or position) for this answer.")
        await self.db.refresh(answer)

        logger.info(
            "assessment_answer_saved",
            answer_id=str(answer.id),
            session_id=str(session_id),
            question_id=str(question_id),
        )
        return answer

    async def complete_session(
        self,
        session_id: UUID,
    ) -> AssessmentSession:
        """Mark assessment session as completed"""
        result = await self.db.execute(
            select(AssessmentSession).where(AssessmentSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if session:
            session.status = AssessmentStatus.COMPLETED
            session.completed_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(session)

            logger.info(
                "assessment_session_completed",
                session_id=str(session_id),
            )

        return session

    async def calculate_assessment_score(
        self,
        assessment_id: UUID,
    ) -> float | None:
        """Calculate overall assessment score based on all answers"""
        result = await self.db.execute(
            select(AssessmentAnswer.compliance_score)
            .join(AssessmentSession, AssessmentAnswer.session_id == AssessmentSession.id)
            .where(
                and_(
                    AssessmentSession.assessment_id == assessment_id,
                    AssessmentAnswer.compliance_score.isnot(None),
                )
            )
        )
        scores = result.scalars().all()

        if not scores:
            return None

        return sum(scores) / len(scores)

    async def update_assessment_score(
        self,
        assessment_id: UUID,
    ) -> Assessment:
        """Update assessment with calculated score"""
        score = await self.calculate_assessment_score(assessment_id)

        result = await self.db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one_or_none()

        if assessment:
            assessment.overall_score = score
            await self.db.commit()
            await self.db.refresh(assessment)

        return assessment
