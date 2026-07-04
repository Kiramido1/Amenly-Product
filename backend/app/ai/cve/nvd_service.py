"""
NVD (NIST National Vulnerability Database) CVE lookup service.

Given a product/technology keyword (derived from an infrastructure asset's
description), query the public NVD CVE API 2.0 and return normalized
vulnerability records. No API key is required (the free tier is rate-limited to
~5 requests / 30s, which this client respects with retry/backoff).

Docs: https://nvd.nist.gov/developers/vulnerabilities
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

import httpx

from app.models.enums import RiskSeverity

logger = logging.getLogger(__name__)

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


@dataclass
class CVERecord:
    """Normalized CVE result, ready to map onto a Vulnerability row."""
    cve_id: str
    title: str
    description: str
    cvss_score: float | None
    severity: RiskSeverity
    reference_url: str | None = None

    def to_vulnerability_kwargs(self) -> dict:
        return {
            "cve_id": self.cve_id,
            "title": self.title,
            "description": self.description,
            "cvss_score": self.cvss_score,
            "severity": self.severity,
            "reference_url": self.reference_url,
        }


def cvss_to_severity(score: float | None, base_severity: str | None = None) -> RiskSeverity:
    """Map a CVSS base score (or textual severity) to our RiskSeverity enum."""
    if base_severity:
        key = base_severity.strip().upper()
        mapping = {
            "CRITICAL": RiskSeverity.CRITICAL,
            "HIGH": RiskSeverity.HIGH,
            "MEDIUM": RiskSeverity.MEDIUM,
            "LOW": RiskSeverity.LOW,
        }
        if key in mapping:
            return mapping[key]
    if score is None:
        return RiskSeverity.MEDIUM
    if score >= 9.0:
        return RiskSeverity.CRITICAL
    if score >= 7.0:
        return RiskSeverity.HIGH
    if score >= 4.0:
        return RiskSeverity.MEDIUM
    return RiskSeverity.LOW


def _extract_cvss(cve: dict) -> tuple[float | None, str | None]:
    """Pull the best available CVSS base score + severity across metric versions."""
    metrics = cve.get("metrics", {}) or {}
    # Prefer newer CVSS versions when present.
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key)
        if entries:
            data = entries[0].get("cvssData", {}) or {}
            score = data.get("baseScore")
            # V3 carries baseSeverity inside cvssData; V2 carries it on the entry.
            severity = data.get("baseSeverity") or entries[0].get("baseSeverity")
            return score, severity
    return None, None


def _english_description(cve: dict) -> str:
    for d in cve.get("descriptions", []) or []:
        if d.get("lang") == "en":
            return d.get("value", "")
    descs = cve.get("descriptions") or []
    return descs[0].get("value", "") if descs else ""


def _reference_url(cve: dict) -> str | None:
    refs = cve.get("references") or []
    if refs:
        return refs[0].get("url")
    return f"https://nvd.nist.gov/vuln/detail/{cve.get('id')}" if cve.get("id") else None


class NVDService:
    """Async client for the NVD CVE API 2.0."""

    def __init__(self, api_url: str = NVD_API_URL, timeout: float = 20.0, max_retries: int = 2):
        self.api_url = api_url
        self.timeout = timeout
        self.max_retries = max_retries

    async def search_cves(self, keyword: str, limit: int = 5) -> list[CVERecord]:
        """Search CVEs by keyword. Returns [] on any failure (graceful degrade)."""
        keyword = (keyword or "").strip()
        if not keyword:
            return []

        params = {
            "keywordSearch": keyword,
            "resultsPerPage": max(1, min(limit, 20)),
        }

        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(self.api_url, params=params)
                if resp.status_code == 200:
                    return self._parse(resp.json(), limit)
                # 403/429 => rate limited; back off and retry.
                if resp.status_code in (403, 429) and attempt < self.max_retries:
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                logger.warning("NVD search for %r returned HTTP %s", keyword, resp.status_code)
                return []
            except Exception as e:  # noqa: BLE001 - network robustness
                last_error = e
                if attempt < self.max_retries:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue
        logger.warning("NVD search for %r failed: %s", keyword, last_error)
        return []

    def _parse(self, payload: dict, limit: int) -> list[CVERecord]:
        out: list[CVERecord] = []
        for item in (payload.get("vulnerabilities") or [])[:limit]:
            cve = item.get("cve", {}) or {}
            cve_id = cve.get("id")
            if not cve_id:
                continue
            score, base_sev = _extract_cvss(cve)
            desc = _english_description(cve)
            out.append(
                CVERecord(
                    cve_id=cve_id,
                    title=f"{cve_id}: {desc[:120]}" if desc else cve_id,
                    description=desc,
                    cvss_score=score,
                    severity=cvss_to_severity(score, base_sev),
                    reference_url=_reference_url(cve),
                )
            )
        # Highest severity / score first.
        out.sort(key=lambda r: (r.cvss_score or 0.0), reverse=True)
        return out


# Module-level singleton
_nvd_service: NVDService | None = None


def get_nvd_service() -> NVDService:
    global _nvd_service
    if _nvd_service is None:
        _nvd_service = NVDService()
    return _nvd_service
