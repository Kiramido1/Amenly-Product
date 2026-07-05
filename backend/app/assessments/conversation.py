"""
AI-driven assessment interview orchestrator.

Instead of showing a fixed list of questions, the AI *conducts* the interview:
for each control mapped to the member's position it asks a question, judges
whether the answer is complete, and — if not — probes with a targeted follow-up
until it has the information it needs, then moves to the next control. It does
not let the member finish until every control has been covered.

State is derived from the database (which controls already have a saved answer)
plus the last AI message's metadata (the control currently under discussion and
how many times it has been probed), so it survives reconnects.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from app.ai.llm import get_ollama_service
from app.assessments.evaluation import get_evaluation_service
from app.models.assessments import AssessmentAnswer, AssessmentSession
from app.models.compliance import AIQuestion, ControlPosition, Framework, FrameworkControl
from app.models.enums import AssessmentPhase
from app.models.identity import Organization, Position, User

logger = logging.getLogger(__name__)

# How many follow-up probes per control before we accept the answer and move on.
MAX_PROBES = 2
# An answer scoring at/above this is considered complete enough to advance.
SUFFICIENT_SCORE = 60.0

INTERVIEWER_SYSTEM = (
    "You are Amenly, a senior GRC compliance auditor conducting a live, spoken "
    "interview with one employee. You lead the conversation: ask ONE clear, "
    "specific question at a time about how a control is implemented, and keep it "
    "conversational and encouraging. Never answer for them and never lecture — "
    "your job is to extract concrete, verifiable details from the person."
)


@dataclass
class TurnResult:
    content: str
    metadata: dict
    done: bool = False


class ConversationOrchestrator:
    def __init__(self, db):
        self.db = db
        self.ollama = get_ollama_service()
        self.evaluator = get_evaluation_service()

    # ---- context loading ------------------------------------------------

    async def _load_context(self, session: AssessmentSession):
        """Return (user, position, framework, region, ordered [ (question, control) ])."""
        res = await self.db.execute(
            select(User, Position, Framework, Organization.region)
            .join(Position, User.position_id == Position.id)
            .join(AssessmentSession, AssessmentSession.user_id == User.id)
            .join(Framework, Framework.id == session.assessment.framework_id)
            .join(Organization, Organization.id == User.organization_id)
            .where(AssessmentSession.id == session.id)
        )
        row = res.first()
        if not row:
            return None, None, None, "Global", []
        user, position, framework, region = row

        q = await self.db.execute(
            select(AIQuestion)
            .join(FrameworkControl, AIQuestion.control_id == FrameworkControl.id)
            .join(ControlPosition, FrameworkControl.id == ControlPosition.control_id)
            .where(
                and_(
                    FrameworkControl.framework_id == framework.id,
                    ControlPosition.position_id == position.id,
                )
            )
            .options(selectinload(AIQuestion.control))
            .order_by(AIQuestion.order_index.asc())
        )
        questions = q.scalars().all()
        # De-dup by control (a control can be mapped multiple times).
        seen, ordered = set(), []
        for qq in questions:
            if qq.control_id in seen:
                continue
            seen.add(qq.control_id)
            ordered.append(qq)
        return user, position, framework, region or "Global", ordered

    async def _answered_control_ids(self, session_id) -> set:
        res = await self.db.execute(
            select(AssessmentAnswer.question_id).where(
                and_(
                    AssessmentAnswer.session_id == session_id,
                    AssessmentAnswer.phase == AssessmentPhase.BASELINE,
                )
            )
        )
        return set(res.scalars().all())

    async def _progress(self, session_id, done_count, total):
        # Running compliance score = average of the answers scored so far.
        res = await self.db.execute(
            select(AssessmentAnswer.compliance_score).where(
                and_(AssessmentAnswer.session_id == session_id,
                     AssessmentAnswer.phase == AssessmentPhase.BASELINE,
                     AssessmentAnswer.compliance_score.isnot(None))))
        scores = [s for s in res.scalars().all() if s is not None]
        avg = round(sum(scores) / len(scores)) if scores else None
        if avg is None:
            risk = "unknown"
        elif avg >= 70:
            risk = "low"
        elif avg >= 40:
            risk = "medium"
        else:
            risk = "high"
        return {
            "controls_done": done_count,
            "controls_total": total,
            "percent": round(done_count / total * 100) if total else 100,
            "score": avg,
            "risk_level": risk,
        }

    # ---- message phrasing (LLM) ----------------------------------------

    async def _phrase(self, prompt: str, *, temperature=0.6, max_tokens=220) -> str:
        try:
            resp = await self.ollama.generate(
                prompt=prompt, system=INTERVIEWER_SYSTEM,
                temperature=temperature, max_tokens=max_tokens)
            return resp.response.strip()
        except Exception as e:  # noqa: BLE001
            logger.warning("interviewer phrasing failed: %s", e)
            return ""

    async def _ask_question(self, question, framework, position, first: bool) -> str:
        ctrl = question.control
        lead = (f"You are starting the interview with a {position.name}. Greet them warmly "
                f"in one short sentence, say you'll walk through {framework.name} together, "
                f"then ask your first question. "
                if first else "Ask the next question. ")
        text = await self._phrase(
            f"{lead}The control is '{ctrl.code} {ctrl.title}'. "
            f"What to probe: {question.config_focus or ctrl.guidance or ctrl.title}. "
            f"Write only your spoken message to the employee (2-4 sentences max).")
        if not text:
            text = (f"Let's talk about **{ctrl.title}**. "
                    f"Can you describe how your team implements this — {question.config_focus or 'the key details'}?")
        return text

    async def _followup(self, question, answer_text, feedback) -> str:
        ctrl = question.control
        text = await self._phrase(
            f"The employee just answered about '{ctrl.title}' but details are missing. "
            f"What's still unclear: {feedback or 'concrete configuration and evidence'}. "
            f"Their answer was: \"{answer_text[:400]}\". "
            f"Acknowledge briefly, then ask ONE focused follow-up to get the missing specifics. "
            f"Write only your spoken message (1-3 sentences).")
        if not text:
            text = ("Thanks — could you go a bit deeper? Specifically, what exact settings or "
                    "evidence can you point to for this?")
        return text

    async def _ack_and_next(self, done_ctrl, next_question, framework, position) -> str:
        text = await self._phrase(
            f"The employee has now fully covered '{done_ctrl.title}'. Acknowledge it in one short "
            f"sentence, then move on and ask about the next control '{next_question.control.title}' "
            f"(probe: {next_question.config_focus or next_question.control.title}). "
            f"Write only your spoken message (2-3 sentences).")
        if not text:
            text = (f"Got it — that covers {done_ctrl.title}. Now, about **{next_question.control.title}**: "
                    f"how do you handle {next_question.config_focus or 'this'}?")
        return text

    async def _closing(self, framework, done_count) -> str:
        text = await self._phrase(
            f"The interview is complete — the employee covered all {done_count} controls for "
            f"{framework.name}. Thank them warmly and tell them their responses have been recorded "
            f"for the compliance report. Write only your spoken message (1-2 sentences).",
            temperature=0.7)
        return text or ("That's everything I needed — thank you! Your responses have been recorded "
                        "for the compliance report.")

    # ---- public API -----------------------------------------------------

    async def opening_message(self, session: AssessmentSession) -> TurnResult:
        user, position, framework, region, questions = await self._load_context(session)
        if not questions:
            return TurnResult(
                content="Welcome! There are no assessment questions assigned to your position yet. "
                        "Please check back with your administrator.",
                metadata={"kind": "no_questions"}, done=True)
        answered_q = await self._answered_question_ids(session.id)
        remaining = [q for q in questions if q.id not in answered_q]
        if not remaining:
            return TurnResult(content=await self._closing(framework, len(questions)),
                              metadata={"kind": "complete", **await self._progress(session.id, len(questions), len(questions))},
                              done=True)
        q = remaining[0]
        content = await self._ask_question(q, framework, position, first=(len(answered_q) == 0))
        return TurnResult(content=content, metadata={
            "kind": "question", "control_id": str(q.control_id), "question_id": str(q.id),
            "probe_count": 0, **await self._progress(session.id, len(questions) - len(remaining), len(questions))})

    async def _answered_question_ids(self, session_id) -> set:
        res = await self.db.execute(
            select(AssessmentAnswer.question_id).where(
                and_(AssessmentAnswer.session_id == session_id,
                     AssessmentAnswer.phase == AssessmentPhase.BASELINE)))
        return set(res.scalars().all())

    async def handle_answer(self, session: AssessmentSession, text: str, last_meta: dict | None) -> TurnResult:
        user, position, framework, region, questions = await self._load_context(session)
        if not questions:
            return TurnResult(content="No questions are assigned to your position.",
                              metadata={"kind": "no_questions"}, done=True)

        answered_q = await self._answered_question_ids(session.id)
        remaining = [q for q in questions if q.id not in answered_q]
        if not remaining:
            return TurnResult(content=await self._closing(framework, len(questions)),
                              metadata={"kind": "complete", **await self._progress(session.id, len(questions), len(questions))},
                              done=True)

        last_meta = last_meta or {}
        current_qid = last_meta.get("question_id")
        current = next((q for q in remaining if str(q.id) == str(current_qid)), remaining[0])
        probe_count = int(last_meta.get("probe_count", 0) or 0)

        # Judge the answer against the current control.
        ctrl = current.control
        evaluation = await self.evaluator.evaluate(
            answer_text=text, control_code=ctrl.code or "", control_title=ctrl.title or "",
            control_description=ctrl.description or "", control_guidance=ctrl.guidance or "",
            question_text=current.question_text or "", config_focus=current.config_focus or "",
            expected_evidence=current.expected_evidence or "", region=region)

        sufficient = (evaluation.compliance_score >= SUFFICIENT_SCORE) or (probe_count >= MAX_PROBES)

        if not sufficient:
            content = await self._followup(current, text, evaluation.feedback)
            return TurnResult(content=content, metadata={
                "kind": "followup", "control_id": str(current.control_id),
                "question_id": str(current.id), "probe_count": probe_count + 1,
                **await self._progress(session.id, len(answered_q), len(questions))})

        # Accept: persist the answer for this control.
        self.db.add(AssessmentAnswer(
            session_id=session.id, question_id=current.id, position_id=position.id,
            phase=AssessmentPhase.BASELINE, answer_text=text,
            compliance_score=evaluation.compliance_score, ai_feedback=evaluation.feedback,
            remediation=evaluation.remediation, regulation_note=evaluation.regulation_note,
            status=evaluation.status))
        await self.db.commit()

        answered_q.add(current.id)
        still = [q for q in questions if q.id not in answered_q]
        if not still:
            return TurnResult(content=await self._closing(framework, len(questions)),
                              metadata={"kind": "complete", **await self._progress(session.id, len(questions), len(questions))},
                              done=True)
        nxt = still[0]
        content = await self._ack_and_next(ctrl, nxt, framework, position)
        return TurnResult(content=content, metadata={
            "kind": "question", "control_id": str(nxt.control_id), "question_id": str(nxt.id),
            "probe_count": 0, **await self._progress(session.id, len(answered_q), len(questions))})


def get_orchestrator(db) -> ConversationOrchestrator:
    return ConversationOrchestrator(db)
