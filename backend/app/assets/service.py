"""
Asset Extraction Service
Automatically extracts infrastructure assets from AI conversations
"""
import json
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import get_ollama_service
from app.models.assets_risks import Asset, AssetType, RiskSeverity
from app.models.chat import InfrastructureAsset

logger = structlog.get_logger(__name__)


class AssetExtractionService:
    """
    Service for extracting infrastructure assets from conversation text
    using AI/LLM analysis
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ollama = get_ollama_service()

    async def extract_assets_from_message(
        self,
        message_text: str,
        organization_id: UUID,
        session_id: UUID | None = None,
        message_id: UUID | None = None,
    ) -> list[InfrastructureAsset]:
        """
        Extract infrastructure assets from a chat message using AI

        Args:
            message_text: The conversation message to analyze
            organization_id: Organization ID
            session_id: Assessment session ID (optional)
            message_id: Chat message ID (optional)

        Returns:
            List of extracted infrastructure assets
        """
        try:
            # Use LLM to extract structured asset information
            extraction_prompt = self._build_extraction_prompt(message_text)

            response = await self.ollama.generate(
                prompt=extraction_prompt,
                system=self._get_system_prompt(),
                temperature=0.3,  # Low temperature for consistent extraction
                max_tokens=1024,
            )

            # Parse the JSON response
            extracted_data = self._parse_extraction_response(response.response)

            # Store extracted assets
            assets = []
            for asset_data in extracted_data.get("assets", []):
                asset = await self._create_infrastructure_asset(
                    asset_data=asset_data,
                    organization_id=organization_id,
                    session_id=session_id,
                    message_id=message_id,
                )
                if asset:
                    assets.append(asset)

            logger.info(
                "assets_extracted",
                count=len(assets),
                organization_id=str(organization_id),
                session_id=str(session_id) if session_id else None,
            )

            return assets

        except Exception as e:
            logger.error("asset_extraction_failed", error=str(e))
            return []

    def _get_system_prompt(self) -> str:
        """System prompt for asset extraction"""
        return """You are an expert cybersecurity infrastructure analyst. Your task is to extract infrastructure assets from conversation text.

Extract ONLY infrastructure assets that are mentioned. Do not invent or hallucinate assets.

COUNTS: if a quantity is mentioned (e.g. "3 DNS servers", "two firewalls", "a couple of
domain controllers"), output a SEPARATE asset entry for EACH instance and number them
(e.g. "DNS Server 1", "DNS Server 2", "DNS Server 3"). Capture any OS/product/version.

Asset types to look for:
- server: Physical or virtual servers, incl. DNS, DHCP, mail, web, domain controllers, file servers (e.g., "web server", "DNS server", "database server", "application server")
- database: Database systems (e.g., "PostgreSQL", "MySQL", "MongoDB", "Redis")
- firewall: Network firewalls (e.g., "Cisco ASA", "Palo Alto", "AWS WAF")
- api: API endpoints or services (e.g., "REST API", "GraphQL API", "internal API")
- cloud_service: Cloud services (e.g., "AWS S3", "Azure Blob", "Google Cloud Storage")
- siem: Security Information and Event Management systems (e.g., "Splunk", "ELK Stack")
- laptop: End-user laptops or workstations
- mobile_device: Mobile devices (e.g., "iPhone", "Android device")
- network_device: Network equipment (e.g., "router", "switch", "load balancer")
- storage: Storage systems (e.g., "NAS", "SAN", "file server")
- application: Software applications (e.g., "CRM system", "ERP", "web application")

Return ONLY valid JSON in this exact format:
{
    "assets": [
        {
            "asset_type": "server",
            "asset_name": "Web Server 01",
            "description": "Production web server hosting the main application",
            "metadata": {
                "ip_address": "192.168.1.10",
                "os": "Ubuntu 20.04",
                "location": "AWS us-east-1"
            }
        }
    ]
}

If no assets are found, return:
{
    "assets": []
}"""

    def _build_extraction_prompt(self, message_text: str) -> str:
        """Build prompt for asset extraction"""
        return f"""Extract infrastructure assets from the following conversation:

{message_text}

Return the extracted assets as JSON."""

    def _parse_extraction_response(self, response_text: str) -> dict[str, Any]:
        """Parse LLM response and extract JSON"""
        try:
            # Try to extract JSON from response
            # Handle cases where LLM might add extra text
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)

            # Fallback: try parsing entire response
            return json.loads(response_text)

        except json.JSONDecodeError as e:
            logger.error("json_parse_error", error=str(e), response=response_text[:200])
            return {"assets": []}

    async def _create_infrastructure_asset(
        self,
        asset_data: dict[str, Any],
        organization_id: UUID,
        session_id: UUID | None,
        message_id: UUID | None,
    ) -> InfrastructureAsset | None:
        """Create infrastructure asset record"""
        try:
            asset_type = asset_data.get("asset_type", "unknown").lower()
            asset_name = asset_data.get("asset_name", "Unknown Asset")
            description = asset_data.get("description")
            metadata = asset_data.get("metadata", {})

            # Validate asset type
            valid_types = [
                "server", "database", "firewall", "api", "cloud_service",
                "siem", "laptop", "mobile_device", "network_device",
                "storage", "application"
            ]

            if asset_type not in valid_types:
                logger.warning("invalid_asset_type", asset_type=asset_type)
                asset_type = "application"  # Default fallback

            # Dedupe: the same device is often mentioned across several answers.
            # If one with the same org + name + type already exists, reuse it
            # (refresh its metadata/description) instead of creating a duplicate.
            from sqlalchemy import and_, func, select as _select
            existing = (await self.db.execute(
                _select(InfrastructureAsset).where(and_(
                    InfrastructureAsset.organization_id == organization_id,
                    func.lower(InfrastructureAsset.asset_name) == asset_name.lower(),
                    InfrastructureAsset.asset_type == asset_type,
                )))).scalar_one_or_none()
            if existing is not None:
                if description:
                    existing.description = description
                if metadata:
                    existing.asset_metadata = {**(existing.asset_metadata or {}), **metadata}
                await self.db.commit()
                await self.db.refresh(existing)
                return existing

            # Create infrastructure asset record
            infra_asset = InfrastructureAsset(
                organization_id=organization_id,
                assessment_session_id=session_id,
                asset_type=asset_type,
                asset_name=asset_name,
                description=description,
                extracted_from_message_id=message_id,
                asset_metadata=metadata,
            )

            self.db.add(infra_asset)
            await self.db.commit()
            await self.db.refresh(infra_asset)

            # Also create or update the main Asset record
            await self._sync_main_asset(
                infra_asset=infra_asset,
                organization_id=organization_id,
            )

            return infra_asset

        except Exception as e:
            logger.error("create_infrastructure_asset_failed", error=str(e))
            return None

    async def _sync_main_asset(
        self,
        infra_asset: InfrastructureAsset,
        organization_id: UUID,
    ) -> Asset | None:
        """
        Sync infrastructure asset to main Asset table
        Creates or updates the main asset record
        """
        try:
            # Check if asset already exists by name and type
            result = await self.db.execute(
                select(Asset).where(
                    and_(
                        Asset.organization_id == organization_id,
                        Asset.name == infra_asset.asset_name,
                    )
                )
            )
            existing_asset = result.scalar_one_or_none()

            if existing_asset:
                # Update existing asset
                existing_asset.properties = infra_asset.asset_metadata
                await self.db.commit()
                return existing_asset
            else:
                # Create new asset
                # Map infrastructure asset type to AssetType enum
                asset_type_mapping = {
                    "server": AssetType.HARDWARE,
                    "laptop": AssetType.HARDWARE,
                    "mobile_device": AssetType.HARDWARE,
                    "network_device": AssetType.HARDWARE,
                    "storage": AssetType.HARDWARE,
                    "database": AssetType.SOFTWARE,
                    "api": AssetType.SOFTWARE,
                    "application": AssetType.SOFTWARE,
                    "cloud_service": AssetType.SERVICE,
                    "firewall": AssetType.SOFTWARE,
                    "siem": AssetType.SOFTWARE,
                }

                asset_type = asset_type_mapping.get(
                    infra_asset.asset_type,
                    AssetType.SOFTWARE
                )

                new_asset = Asset(
                    organization_id=organization_id,
                    name=infra_asset.asset_name,
                    type=asset_type,
                    criticality=RiskSeverity.MEDIUM,  # Default
                    properties=infra_asset.asset_metadata,
                )

                self.db.add(new_asset)
                await self.db.commit()
                await self.db.refresh(new_asset)

                return new_asset

        except Exception as e:
            logger.error("sync_main_asset_failed", error=str(e))
            return None

    async def get_infrastructure_assets(
        self,
        organization_id: UUID,
        asset_type: str | None = None,
    ) -> list[InfrastructureAsset]:
        """
        Get infrastructure assets for an organization

        Args:
            organization_id: Organization ID
            asset_type: Filter by asset type (optional)

        Returns:
            List of infrastructure assets
        """
        query = select(InfrastructureAsset).where(
            InfrastructureAsset.organization_id == organization_id
        )

        if asset_type:
            query = query.where(InfrastructureAsset.asset_type == asset_type)

        result = await self.db.execute(
            query.order_by(InfrastructureAsset.created_at.desc())
        )
        return result.scalars().all()

    async def get_asset_statistics(
        self,
        organization_id: UUID,
    ) -> dict[str, Any]:
        """
        Get statistics about infrastructure assets

        Args:
            organization_id: Organization ID

        Returns:
            Dictionary with asset statistics
        """
        assets = await self.get_infrastructure_assets(organization_id)

        # Count by type
        by_type = {}
        for asset in assets:
            asset_type = asset.asset_type
            by_type[asset_type] = by_type.get(asset_type, 0) + 1

        return {
            "total_assets": len(assets),
            "by_type": by_type,
            "recent_assets": [
                {
                    "id": str(a.id),
                    "type": a.asset_type,
                    "name": a.asset_name,
                    "description": a.description,
                    "created_at": a.created_at.isoformat(),
                }
                for a in assets[:10]  # Last 10 assets
            ],
        }
