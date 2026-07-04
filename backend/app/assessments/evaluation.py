"""
AI answer-evaluation engine.

Given a member's answer to a compliance question, evaluate it against the
underlying framework control and produce:
  - a compliance score (0-100)
  - an implementation status (ControlStatus)
  - concise feedback on what is right/wrong in the described configuration
  - concrete remediation steps to become compliant
  - a region-specific regulatory note (driven by the organization's region)

The LLM is constrained to return strict JSON; parsing degrades gracefully to a
conservative default if the model misbehaves, so an assessment never breaks.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass

from app.ai.llm import get_ollama_service
from app.models.enums import ControlStatus

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are a senior GRC (Governance, Risk & Compliance) auditor. You evaluate a "
    "person's description of how a device or process is configured against a specific "
    "compliance control. Be rigorous and evidence-driven: reward concrete, verifiable "
    "configurations and penalize vague, missing, or non-compliant ones. You also know "
    "national data-protection and cybersecurity regulations and can tie guidance to a "
    "given region. Always respond with STRICT JSON and nothing else."
)

USER_TEMPLATE = """Evaluate this assessment answer.

FRAMEWORK CONTROL
- Code: {control_code}
- Title: {control_title}
- Description: {control_description}
- Guidance: {control_guidance}

QUESTION ASKED
- {question_text}
- Configuration focus: {config_focus}
- Expected evidence: {expected_evidence}

ORGANIZATION REGION (for regulatory alignment): {region}

USER'S ANSWER
\"\"\"{answer_text}\"\"\"

Return ONLY this JSON object:
{{
  "compliance_score": <integer 0-100>,
  "status": "<one of: not_implemented, partially_implemented, fully_implemented, not_applicable>",
  "feedback": "<2-3 sentences: what is compliant and what is missing/misconfigured>",
  "remediation": "<concrete, ordered steps to make this configuration compliant with the control; empty string if already fully compliant>",
  "regulation_note": "<how this relates to data-protection/cyber regulations relevant to the region; empty string if not applicable>"
}}"""


_STATUS_MAP = {
    "not_implemented": ControlStatus.NOT_IMPLEMENTED,
    "partially_implemented": ControlStatus.PARTIALLY_IMPLEMENTED,
    "fully_implemented": ControlStatus.FULLY_IMPLEMENTED,
    "not_applicable": ControlStatus.NOT_APPLICABLE,
}


@dataclass
class AnswerEvaluation:
    compliance_score: float
    status: ControlStatus
    feedback: str
    remediation: str
    regulation_note: str

    @classmethod
    def default(cls, reason: str = "") -> "AnswerEvaluation":
        # Conservative fallback: needs review, not credited as compliant.
        return cls(
            compliance_score=0.0,
            status=ControlStatus.NOT_IMPLEMENTED,
            feedback=reason or "Answer could not be automatically evaluated; manual review required.",
            remediation="",
            regulation_note="",
        )


def _status_from_score(score: float) -> ControlStatus:
    if score >= 80:
        return ControlStatus.FULLY_IMPLEMENTED
    if score >= 40:
        return ControlStatus.PARTIALLY_IMPLEMENTED
    return ControlStatus.NOT_IMPLEMENTED


def _extract_json(text: str) -> dict | None:
    """Pull the first JSON object out of an LLM response."""
    if not text:
        return None
    # Strip code fences if present.
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else None
    if candidate is None:
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = brace.group(0) if brace else None
    if candidate is None:
        return None
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


class AnswerEvaluationService:
    def __init__(self):
        self.ollama = get_ollama_service()

    async def evaluate(
        self,
        *,
        answer_text: str,
        control_code: str = "",
        control_title: str = "",
        control_description: str = "",
        control_guidance: str = "",
        question_text: str = "",
        config_focus: str = "",
        expected_evidence: str = "",
        region: str = "Global",
    ) -> AnswerEvaluation:
        if not (answer_text or "").strip():
            return AnswerEvaluation.default("No answer was provided.")

        prompt = USER_TEMPLATE.format(
            control_code=control_code or "N/A",
            control_title=control_title or "N/A",
            control_description=(control_description or "N/A")[:800],
            control_guidance=(control_guidance or "N/A")[:800],
            question_text=question_text or "N/A",
            config_focus=config_focus or "N/A",
            expected_evidence=expected_evidence or "N/A",
            region=region or "Global",
            answer_text=answer_text[:2000],
        )

        try:
            resp = await self.ollama.generate(
                prompt=prompt,
                system=SYSTEM_PROMPT,
                temperature=0.2,
                top_p=0.9,
                max_tokens=800,
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("Answer evaluation LLM call failed: %s", e)
            return AnswerEvaluation.default()

        data = _extract_json(resp.response)
        if not data:
            logger.warning("Answer evaluation returned unparseable output")
            return AnswerEvaluation.default()

        # Clamp + normalize the score.
        try:
            score = float(data.get("compliance_score", 0))
        except (TypeError, ValueError):
            score = 0.0
        score = max(0.0, min(100.0, score))

        status_raw = str(data.get("status", "")).strip().lower()
        status = _STATUS_MAP.get(status_raw) or _status_from_score(score)

        return AnswerEvaluation(
            compliance_score=score,
            status=status,
            feedback=str(data.get("feedback", "")).strip(),
            remediation=str(data.get("remediation", "")).strip(),
            regulation_note=str(data.get("regulation_note", "")).strip(),
        )


_evaluation_service: AnswerEvaluationService | None = None


def get_evaluation_service() -> AnswerEvaluationService:
    global _evaluation_service
    if _evaluation_service is None:
        _evaluation_service = AnswerEvaluationService()
    return _evaluation_service
