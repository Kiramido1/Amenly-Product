"""
Vulnerability detection: turn an infrastructure asset's description into CVE
lookups against the NVD feed.

Keyword strategy (best-effort, no external NLP dependency):
1. Prefer explicit product/version hints from the asset metadata.
2. Otherwise scan the name/description for known technology tokens.
3. Fall back to the most specific noun-ish phrase available.
"""
from __future__ import annotations

import re

from app.ai.cve.nvd_service import CVERecord, get_nvd_service

# Common infrastructure technologies worth matching in free text.
# Ordered by priority: a running application/service/DB/appliance is a more
# useful CVE keyword than the underlying OS, so those are matched first. Within
# each group, multi-word (more specific) entries precede their shorter forms.
KNOWN_TECH = [
    # Applications & services
    "microsoft exchange", "exchange", "sharepoint", "active directory",
    "apache tomcat", "tomcat", "apache", "nginx", "iis", "log4j", "openssh",
    "wordpress", "drupal", "joomla", "jenkins", "gitlab", "jira", "confluence",
    "elasticsearch", "grafana", "samba", "bind", "postfix", "openssl", "php", "sap", "veeam",
    # Databases
    "oracle database", "mysql", "mariadb", "postgresql", "postgres", "mongodb", "redis",
    # Network / security appliances
    "cisco ios", "cisco asa", "fortigate", "fortinet", "palo alto", "pfsense", "sonicwall",
    # Virtualization / platforms
    "vmware esxi", "vmware", "citrix", "kubernetes", "docker",
    # Operating systems (lowest priority — matched only if nothing else hits)
    "windows server", "windows", "ubuntu", "debian", "centos", "red hat", "rhel",
]

_VERSION_RE = re.compile(r"\b(\d+\.[\dx]+(?:\.[\dx]+)?)\b")


def build_keywords(asset_type: str | None, asset_name: str | None,
                   description: str | None, metadata: dict | None) -> str | None:
    """Produce the single best NVD keyword search string for an asset."""
    metadata = metadata or {}

    # 1) Explicit metadata product/version.
    product = (metadata.get("product") or metadata.get("software") or
               metadata.get("os") or metadata.get("vendor"))
    version = metadata.get("version")
    if product:
        kw = str(product).strip()
        if version:
            kw = f"{kw} {version}"
        return kw

    haystack = " ".join(filter(None, [asset_name, description])).lower()

    # 2) Known technology tokens, matched in priority order (apps/db/appliances
    #    before OS) so the most CVE-relevant technology wins.
    for tech in KNOWN_TECH:
        if tech in haystack:
            m = _VERSION_RE.search(haystack)
            return f"{tech} {m.group(1)}" if m else tech

    # 3) Fall back to the asset name if it looks product-like.
    if asset_name and len(asset_name.strip()) >= 3:
        return asset_name.strip()

    return None


class VulnerabilityDetectionService:
    """Detect candidate CVEs for infrastructure assets via the NVD feed."""

    def __init__(self):
        self.nvd = get_nvd_service()

    async def detect_for_asset(
        self,
        *,
        asset_type: str | None = None,
        asset_name: str | None = None,
        description: str | None = None,
        metadata: dict | None = None,
        limit: int = 5,
    ) -> list[CVERecord]:
        keyword = build_keywords(asset_type, asset_name, description, metadata)
        if not keyword:
            return []
        return await self.nvd.search_cves(keyword, limit=limit)


_detection_service: VulnerabilityDetectionService | None = None


def get_detection_service() -> VulnerabilityDetectionService:
    global _detection_service
    if _detection_service is None:
        _detection_service = VulnerabilityDetectionService()
    return _detection_service
