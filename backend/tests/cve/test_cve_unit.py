"""Unit tests for the CVE detection logic (pure functions, no network/DB)."""
from types import SimpleNamespace

import pytest

from app.ai.cve.detection import build_keywords, KNOWN_TECH
from app.ai.cve.nvd_service import cvss_to_severity, _extract_cvss, NVDService
from app.assets.vulnerability_service import VulnerabilityService, _status_from_risk
from app.models.enums import RiskSeverity


class TestKeywordExtraction:
    def test_metadata_product_and_version_win(self):
        kw = build_keywords("server", "DB1", "some db", {"product": "mysql", "version": "5.7"})
        assert kw == "mysql 5.7"

    def test_application_beats_os(self):
        # Apache (app) should win over Ubuntu (OS) for a web server.
        kw = build_keywords("server", "Web", "Runs Apache httpd 2.4 on Ubuntu", None)
        assert kw.startswith("apache")

    def test_version_appended_from_text(self):
        kw = build_keywords("server", "Web", "Apache 2.4 box", None)
        assert kw == "apache 2.4"

    def test_appliance_detected(self):
        assert build_keywords("firewall", "FW", "Fortigate at the edge", None) == "fortigate"

    def test_fallback_to_asset_name(self):
        assert build_keywords("thing", "SomeAppliance", "no known tech here", None) == "SomeAppliance"

    def test_returns_none_when_nothing_useful(self):
        assert build_keywords("x", "", "", None) is None

    def test_known_tech_list_nonempty(self):
        assert "apache" in KNOWN_TECH and "mysql" in KNOWN_TECH


class TestCvssMapping:
    @pytest.mark.parametrize("score,expected", [
        (9.8, RiskSeverity.CRITICAL),
        (7.5, RiskSeverity.HIGH),
        (5.0, RiskSeverity.MEDIUM),
        (2.0, RiskSeverity.LOW),
        (None, RiskSeverity.MEDIUM),
    ])
    def test_score_thresholds(self, score, expected):
        assert cvss_to_severity(score) == expected

    def test_textual_severity_wins(self):
        assert cvss_to_severity(1.0, "CRITICAL") == RiskSeverity.CRITICAL
        assert cvss_to_severity(9.9, "low") == RiskSeverity.LOW


class TestCvssExtraction:
    def test_prefers_v31(self):
        cve = {"metrics": {"cvssMetricV31": [{"cvssData": {"baseScore": 9.1, "baseSeverity": "CRITICAL"}}],
                           "cvssMetricV2": [{"cvssData": {"baseScore": 5.0}}]}}
        score, sev = _extract_cvss(cve)
        assert score == 9.1 and sev == "CRITICAL"

    def test_v2_severity_on_entry(self):
        cve = {"metrics": {"cvssMetricV2": [{"cvssData": {"baseScore": 6.5}, "baseSeverity": "MEDIUM"}]}}
        score, sev = _extract_cvss(cve)
        assert score == 6.5 and sev == "MEDIUM"

    def test_no_metrics(self):
        assert _extract_cvss({}) == (None, None)


class TestNvdParse:
    def test_parse_and_sort_desc(self):
        payload = {"vulnerabilities": [
            {"cve": {"id": "CVE-1", "descriptions": [{"lang": "en", "value": "low one"}],
                     "metrics": {"cvssMetricV31": [{"cvssData": {"baseScore": 4.0}}]}}},
            {"cve": {"id": "CVE-2", "descriptions": [{"lang": "en", "value": "high one"}],
                     "metrics": {"cvssMetricV31": [{"cvssData": {"baseScore": 9.0, "baseSeverity": "CRITICAL"}}]}}},
        ]}
        recs = NVDService()._parse(payload, limit=5)
        assert [r.cve_id for r in recs] == ["CVE-2", "CVE-1"]  # highest score first
        assert recs[0].severity == RiskSeverity.CRITICAL
        assert recs[0].reference_url  # always populated


class TestAssetRiskScoring:
    def _svc(self):
        return VulnerabilityService.__new__(VulnerabilityService)  # no DB needed for _score_asset

    def test_no_vulns_is_secure(self):
        risk, comp, status = self._svc()._score_asset([])
        assert (risk, comp, status) == (0.0, 100.0, "secure")

    def test_critical_drives_high_risk(self):
        vulns = [SimpleNamespace(severity=RiskSeverity.CRITICAL)]
        risk, comp, status = self._svc()._score_asset(vulns)
        assert risk >= 70 and status == "critical" and comp == round(100 - risk, 1)

    def test_volume_bumps_risk(self):
        one = self._svc()._score_asset([SimpleNamespace(severity=RiskSeverity.MEDIUM)])[0]
        many = self._svc()._score_asset([SimpleNamespace(severity=RiskSeverity.MEDIUM)] * 4)[0]
        assert many > one

    @pytest.mark.parametrize("risk,vulns,expected", [
        (0, 0, "secure"), (75, 3, "critical"), (50, 2, "warning"), (10, 1, "secure"),
    ])
    def test_status_from_risk(self, risk, vulns, expected):
        assert _status_from_risk(risk, vulns) == expected
