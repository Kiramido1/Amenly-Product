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

from app.assessments.evaluation import get_evaluation_service
from app.assessments.question_generator import QuestionGenerator
from app.models.assessments import Assessment, AssessmentAnswer, AssessmentSession
from app.models.chat import ChatMessage
from app.models.compliance import AIQuestion, ControlPosition, Framework, FrameworkControl
from app.models.enums import AssessmentPhase, AssessmentStatus, ControlStatus
from app.models.identity import Department, Organization, Position, User

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
        # A user can accumulate several sessions for one assessment (e.g. a
        # completed baseline plus a remediation run), so return the most recent
        # one — scalar_one_or_none() would raise MultipleResultsFound here.
        return result.scalars().first()

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

    async def submit_answer(
        self,
        session: AssessmentSession,
        question_id: UUID,
        position_id: UUID,
        answer_text: str,
        evidence_urls: list[str] | None = None,
    ) -> AssessmentAnswer:
        """Save an answer AND evaluate it with the AI engine.

        Loads the question's control and the org region, runs the evaluation,
        and persists the score/feedback/remediation/regulation note along with
        the session's current phase (for before/after comparison).
        """
        # Load the question with its control (+ framework) for evaluation context.
        result = await self.db.execute(
            select(AIQuestion)
            .where(AIQuestion.id == question_id)
            .options(selectinload(AIQuestion.control).selectinload(FrameworkControl.framework))
        )
        question = result.scalar_one_or_none()
        if question is None:
            raise HTTPException(status_code=404, detail="Question not found for this assessment.")

        control = question.control

        # Resolve the organization's region for regulatory alignment.
        region = "Global"
        assessment = getattr(session, "assessment", None)
        org_id = assessment.organization_id if assessment else None
        if org_id is not None:
            org_res = await self.db.execute(
                select(Organization.region).where(Organization.id == org_id)
            )
            region = org_res.scalar_one_or_none() or "Global"

        evaluation = await get_evaluation_service().evaluate(
            answer_text=answer_text,
            control_code=getattr(control, "code", "") or "",
            control_title=getattr(control, "title", "") or "",
            control_description=getattr(control, "description", "") or "",
            control_guidance=getattr(control, "guidance", "") or "",
            question_text=question.question_text or "",
            config_focus=getattr(question, "config_focus", "") or "",
            expected_evidence=question.expected_evidence or "",
            region=region,
        )

        answer = AssessmentAnswer(
            session_id=session.id,
            question_id=question_id,
            position_id=position_id,
            phase=getattr(session, "phase", AssessmentPhase.BASELINE),
            answer_text=answer_text,
            compliance_score=evaluation.compliance_score,
            regulation_score=evaluation.regulation_score,
            evidence_urls=evidence_urls,
            ai_feedback=evaluation.feedback,
            remediation=evaluation.remediation,
            regulation_note=evaluation.regulation_note,
            status=evaluation.status,
        )
        self.db.add(answer)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(status_code=404, detail="Invalid reference (question or position) for this answer.")
        await self.db.refresh(answer)

        logger.info(
            "assessment_answer_evaluated",
            answer_id=str(answer.id),
            session_id=str(session.id),
            score=evaluation.compliance_score,
            status=evaluation.status.value,
        )
        return answer

    # --- Campaign lifecycle (admin-driven) ---

    async def launch_campaign(self, assessment: Assessment, admin_user_id: UUID) -> Assessment:
        """Launch a campaign: only the org admin does this. Opens the baseline phase."""
        assessment.status = AssessmentStatus.IN_PROGRESS
        assessment.current_phase = AssessmentPhase.BASELINE
        assessment.launched_by_id = admin_user_id
        assessment.launched_at = datetime.utcnow()
        assessment.closed_at = None
        await self.db.commit()
        await self.db.refresh(assessment)
        logger.info("assessment_campaign_launched", assessment_id=str(assessment.id))
        return assessment

    async def advance_to_remediation(self, assessment: Assessment) -> Assessment:
        """Snapshot the baseline score and open the remediation (second) pass."""
        assessment.baseline_score = await self.calculate_phase_score(
            assessment.id, AssessmentPhase.BASELINE
        )
        assessment.regulation_score = await self.calculate_phase_score(
            assessment.id, AssessmentPhase.BASELINE, AssessmentAnswer.regulation_score
        )
        assessment.current_phase = AssessmentPhase.REMEDIATION
        assessment.status = AssessmentStatus.IN_PROGRESS
        # Reopen sessions so members can re-answer for the remediation pass.
        await self.db.execute(
            AssessmentSession.__table__.update()
            .where(AssessmentSession.assessment_id == assessment.id)
            .values(status=AssessmentStatus.IN_PROGRESS, phase=AssessmentPhase.REMEDIATION, completed_at=None)
        )
        await self.db.commit()
        await self.db.refresh(assessment)
        logger.info("assessment_advanced_to_remediation", assessment_id=str(assessment.id),
                    baseline_score=assessment.baseline_score)
        return assessment

    async def close_campaign(self, assessment: Assessment) -> Assessment:
        """Close the campaign, snapshotting the score for the current phase."""
        phase_score = await self.calculate_phase_score(assessment.id, assessment.current_phase)
        if assessment.current_phase == AssessmentPhase.REMEDIATION:
            assessment.remediation_score = phase_score
        elif assessment.baseline_score is None:
            assessment.baseline_score = phase_score
        # Regulation-alignment score for the phase just closed.
        assessment.regulation_score = await self.calculate_phase_score(
            assessment.id, assessment.current_phase, AssessmentAnswer.regulation_score
        )
        assessment.overall_score = assessment.remediation_score or phase_score
        assessment.current_phase = AssessmentPhase.COMPLETED
        assessment.status = AssessmentStatus.COMPLETED
        assessment.closed_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(assessment)
        logger.info("assessment_campaign_closed", assessment_id=str(assessment.id),
                    overall_score=assessment.overall_score)
        return assessment

    async def calculate_phase_score(
        self, assessment_id: UUID, phase: AssessmentPhase, column=None
    ) -> float | None:
        """Weighted average of a score column for a phase, using ControlPosition weights.

        Defaults to the compliance score; pass ``AssessmentAnswer.regulation_score``
        to aggregate the regulation-alignment score instead.
        """
        score_col = column if column is not None else AssessmentAnswer.compliance_score
        result = await self.db.execute(
            select(
                score_col,
                ControlPosition.importance_weight,
            )
            .join(AssessmentSession, AssessmentAnswer.session_id == AssessmentSession.id)
            .join(AIQuestion, AssessmentAnswer.question_id == AIQuestion.id)
            .outerjoin(
                ControlPosition,
                and_(
                    ControlPosition.control_id == AIQuestion.control_id,
                    ControlPosition.position_id == AssessmentAnswer.position_id,
                ),
            )
            .where(
                and_(
                    AssessmentSession.assessment_id == assessment_id,
                    AssessmentAnswer.phase == phase,
                    score_col.isnot(None),
                )
            )
        )
        rows = result.all()
        if not rows:
            return None
        total_w = 0.0
        acc = 0.0
        for score, weight in rows:
            w = float(weight) if weight is not None else 1.0
            acc += float(score) * w
            total_w += w
        return round(acc / total_w, 2) if total_w else None

    async def list_all_sessions(self, assessment_id: UUID) -> list[dict]:
        """Admin view: every member's session with user/position and score summary."""
        result = await self.db.execute(
            select(AssessmentSession, User, Position, Department)
            .join(User, AssessmentSession.user_id == User.id)
            .outerjoin(Position, User.position_id == Position.id)
            .outerjoin(Department, Position.department_id == Department.id)
            .where(AssessmentSession.assessment_id == assessment_id)
            .order_by(AssessmentSession.created_at.desc())
        )
        rows = result.all()

        summaries: list[dict] = []
        for session, user, position, department in rows:
            score_res = await self.db.execute(
                select(AssessmentAnswer.compliance_score).where(
                    and_(
                        AssessmentAnswer.session_id == session.id,
                        AssessmentAnswer.compliance_score.isnot(None),
                    )
                )
            )
            scores = score_res.scalars().all()
            avg = round(sum(scores) / len(scores), 2) if scores else None
            summaries.append(
                {
                    "session_id": session.id,
                    "user_id": user.id,
                    "user_email": user.email,
                    "user_full_name": getattr(user, "full_name", None),
                    "position_name": position.name if position else None,
                    "department_name": department.name if department else None,
                    "status": str(session.status.value if hasattr(session.status, "value") else session.status),
                    "phase": str(session.phase.value if hasattr(session.phase, "value") else session.phase),
                    "answers_count": len(scores),
                    "avg_score": avg,
                }
            )
        return summaries

    async def count_participants(self, organization_id: UUID) -> int:
        """Members eligible to participate (active users with a position)."""
        result = await self.db.execute(
            select(User.id).where(
                and_(
                    User.organization_id == organization_id,
                    User.position_id.isnot(None),
                    User.is_active.is_(True),
                )
            )
        )
        return len(result.scalars().all())

    async def maybe_autoclose(self, assessment: Assessment) -> Assessment:
        """Auto-finalize the current phase once every participant's session is completed."""
        participants = await self.count_participants(assessment.organization_id)
        if participants == 0:
            return assessment
        completed_res = await self.db.execute(
            select(AssessmentSession.id).where(
                and_(
                    AssessmentSession.assessment_id == assessment.id,
                    AssessmentSession.status == AssessmentStatus.COMPLETED,
                )
            )
        )
        completed = len(completed_res.scalars().all())
        if completed >= participants:
            # Snapshot the phase score; keep the campaign open for the admin to
            # either advance to remediation or close it explicitly.
            phase_score = await self.calculate_phase_score(assessment.id, assessment.current_phase)
            if assessment.current_phase == AssessmentPhase.BASELINE:
                assessment.baseline_score = phase_score
            elif assessment.current_phase == AssessmentPhase.REMEDIATION:
                assessment.remediation_score = phase_score
            assessment.regulation_score = await self.calculate_phase_score(
                assessment.id, assessment.current_phase, AssessmentAnswer.regulation_score
            )
            assessment.overall_score = phase_score
            await self.db.commit()
            await self.db.refresh(assessment)
            logger.info("assessment_phase_autoscored", assessment_id=str(assessment.id),
                        phase=assessment.current_phase.value, score=phase_score)
        return assessment

    async def get_campaign_overview(self, assessment: Assessment) -> dict:
        """Before/after + participation summary for the admin dashboard."""
        participants = await self.count_participants(assessment.organization_id)
        # Fetch the framework name directly to avoid a lazy relationship load
        # (the relationship may be expired after a refresh in async context).
        fw_res = await self.db.execute(
            select(Framework.name).where(Framework.id == assessment.framework_id)
        )
        framework_name = fw_res.scalar_one_or_none()
        region = (await self.db.execute(
            select(Organization.region).where(Organization.id == assessment.organization_id)
        )).scalar_one_or_none()
        sessions = await self.db.execute(
            select(AssessmentSession.status).where(
                AssessmentSession.assessment_id == assessment.id
            )
        )
        statuses = [str(s.value if hasattr(s, "value") else s) for s in sessions.scalars().all()]
        total = len(statuses)
        completed = sum(1 for s in statuses if s == "completed")
        improvement = None
        if assessment.baseline_score is not None and assessment.remediation_score is not None:
            improvement = round(assessment.remediation_score - assessment.baseline_score, 2)
        return {
            "assessment_id": assessment.id,
            "name": assessment.name,
            "framework_name": framework_name,
            "status": str(assessment.status.value if hasattr(assessment.status, "value") else assessment.status),
            "current_phase": str(assessment.current_phase.value if hasattr(assessment.current_phase, "value") else assessment.current_phase),
            "launched_at": assessment.launched_at,
            "closed_at": assessment.closed_at,
            "baseline_score": assessment.baseline_score,
            "remediation_score": assessment.remediation_score,
            "regulation_score": assessment.regulation_score,
            "region": region,
            "overall_score": assessment.overall_score,
            "total_sessions": total,
            "completed_sessions": completed,
            "participants_total": participants,
            "completion_rate": round(completed / participants * 100, 1) if participants else 0.0,
            "improvement": improvement,
        }

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
