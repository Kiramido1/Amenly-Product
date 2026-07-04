"""Unit tests for the AI answer-evaluation helpers (no LLM/DB)."""
import pytest

from app.assessments.evaluation import (
    AnswerEvaluation,
    _extract_json,
    _status_from_score,
)
from app.models.enums import ControlStatus


class TestExtractJson:
    def test_plain_json(self):
        assert _extract_json('{"a": 1}') == {"a": 1}

    def test_fenced_json(self):
        assert _extract_json('```json\n{"a": 2}\n```') == {"a": 2}

    def test_embedded_json_with_prose(self):
        assert _extract_json('Sure! {"score": 5} hope that helps') == {"score": 5}

    def test_garbage_returns_none(self):
        assert _extract_json("no json here") is None

    def test_empty_returns_none(self):
        assert _extract_json("") is None


class TestStatusFromScore:
    @pytest.mark.parametrize("score,expected", [
        (95, ControlStatus.FULLY_IMPLEMENTED),
        (80, ControlStatus.FULLY_IMPLEMENTED),
        (50, ControlStatus.PARTIALLY_IMPLEMENTED),
        (40, ControlStatus.PARTIALLY_IMPLEMENTED),
        (10, ControlStatus.NOT_IMPLEMENTED),
        (0, ControlStatus.NOT_IMPLEMENTED),
    ])
    def test_thresholds(self, score, expected):
        assert _status_from_score(score) == expected


class TestDefaultEvaluation:
    def test_default_is_conservative(self):
        d = AnswerEvaluation.default("boom")
        assert d.compliance_score == 0.0
        assert d.status == ControlStatus.NOT_IMPLEMENTED
        assert "boom" in d.feedback

    def test_default_reason_optional(self):
        d = AnswerEvaluation.default()
        assert d.compliance_score == 0.0 and d.feedback
