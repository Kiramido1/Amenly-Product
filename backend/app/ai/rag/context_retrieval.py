"""
Dynamic Context Retrieval Service
Retrieves context based on framework, controls, and user position
"""
from uuid import UUID

import structlog
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.retrieval_service import get_retrieval_service
from app.ai.rag.schemas import RetrievedChunk
from app.models.compliance import ControlPosition, Framework, FrameworkControl

logger = structlog.get_logger(__name__)


class DynamicContextRetrieval:
    """
    Retrieves context dynamically based on:
    - Framework being assessed
    - Controls assigned to user's position
    - User's conversation context
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.retrieval = get_retrieval_service()

    async def get_position_controls(
        self,
        position_id: UUID,
        framework_id: UUID,
    ) -> list[FrameworkControl]:
        """
        Get controls assigned to a specific position within a framework
        """
        result = await self.db.execute(
            select(FrameworkControl)
            .join(ControlPosition, FrameworkControl.id == ControlPosition.control_id)
            .where(
                and_(
                    FrameworkControl.framework_id == framework_id,
                    ControlPosition.position_id == position_id,
                )
            )
            .order_by(ControlPosition.importance_weight.desc())
        )
        return result.scalars().all()

    async def retrieve_context_for_assessment(
        self,
        query: str,
        position_id: UUID,
        framework_id: UUID,
        org_id: str | None = None,
        top_k: int = 5,
        score_threshold: float = 0.5,
    ) -> list[RetrievedChunk]:
        """
        Retrieve context chunks for assessment chat
        
        This combines:
        1. Framework-wide context
        2. Position-specific control context
        3. General compliance context
        
        Returns ranked chunks with metadata
        """
        # Get position-specific controls
        position_controls = await self.get_position_controls(
            position_id=position_id,
            framework_id=framework_id,
        )

        if not position_controls:
            # Fallback: retrieve framework-wide context
            logger.warning(
                "no_position_controls_found",
                position_id=str(position_id),
                framework_id=str(framework_id),
            )
            return await self._retrieve_framework_context(
                query=query,
                framework_id=framework_id,
                org_id=org_id,
                top_k=top_k,
                score_threshold=score_threshold,
            )

        # Build control IDs for filtering
        control_ids = [c.id for c in position_controls]
        control_codes = [c.code for c in position_controls]

        logger.info(
            "retrieving_position_context",
            position_id=str(position_id),
            framework_id=str(framework_id),
            control_count=len(control_ids),
        )

        # Retrieve chunks with control-specific filtering
        chunks = await self.retrieval.retrieve(
            query=query,
            top_k=top_k,
            score_threshold=score_threshold,
            framework=None,  # We'll filter manually for better control
            org_id=org_id,
        )

        # Filter and rank chunks by relevance to position controls
        filtered_chunks = self._filter_by_controls(
            chunks=chunks,
            control_codes=control_codes,
        )

        # If we don't have enough chunks from position controls,
        # supplement with framework-wide context
        if len(filtered_chunks) < top_k:
            framework_chunks = await self._retrieve_framework_context(
                query=query,
                framework_id=framework_id,
                org_id=org_id,
                top_k=top_k - len(filtered_chunks),
                score_threshold=score_threshold,
            )
            filtered_chunks.extend(framework_chunks)

        # Deduplicate and re-rank
        unique_chunks = self._deduplicate_chunks(filtered_chunks)

        return unique_chunks[:top_k]

    async def _retrieve_framework_context(
        self,
        query: str,
        framework_id: UUID,
        org_id: str | None,
        top_k: int,
        score_threshold: float,
    ) -> list[RetrievedChunk]:
        """
        Retrieve framework-wide context (not position-specific)
        """
        # Get framework info
        result = await self.db.execute(
            select(Framework).where(Framework.id == framework_id)
        )
        framework = result.scalar_one_or_none()

        if not framework:
            return []

        # Map database framework names to RAG framework filters
        from app.ai.rag.schemas import FrameworkType
        framework_type = None
        normalized_name = (framework.name or "").lower()
        if "iso" in normalized_name and "27001" in normalized_name:
            framework_type = FrameworkType.ISO27001
        elif "nist" in normalized_name:
            framework_type = FrameworkType.NIST
        elif "soc" in normalized_name:
            framework_type = FrameworkType.SOC2
        elif "gdpr" in normalized_name:
            framework_type = FrameworkType.GDPR
        elif "hipaa" in normalized_name:
            framework_type = FrameworkType.HIPAA
        elif "pci" in normalized_name:
            framework_type = FrameworkType.PCI_DSS
        elif "cobit" in normalized_name:
            framework_type = FrameworkType.COBIT
        elif "tisax" in normalized_name:
            framework_type = FrameworkType.TISAX

        chunks = await self.retrieval.retrieve(
            query=query,
            top_k=top_k,
            score_threshold=score_threshold,
            framework=framework_type,
            org_id=org_id,
        )

        return chunks

    def _filter_by_controls(
        self,
        chunks: list[RetrievedChunk],
        control_codes: list[str],
    ) -> list[RetrievedChunk]:
        """
        Filter chunks by relevance to position controls
        """
        filtered = []

        for chunk in chunks:
            # Check if chunk metadata contains relevant control codes
            chunk_controls = chunk.metadata.get("control_ids", []) if chunk.metadata else []

            # Check for any overlap
            if any(code in control_codes for code in chunk_controls):
                filtered.append(chunk)
            # Also check if control code is in the chunk text
            elif any(code in chunk.text for code in control_codes):
                filtered.append(chunk)

        return filtered

    def _deduplicate_chunks(
        self,
        chunks: list[RetrievedChunk],
    ) -> list[RetrievedChunk]:
        """
        Remove duplicate chunks based on content
        """
        seen = set()
        unique = []

        for chunk in chunks:
            # Use chunk ID or text hash as deduplication key
            chunk_key = chunk.metadata.get("chunk_id") if chunk.metadata else None
            if not chunk_key:
                chunk_key = hash(chunk.text)

            if chunk_key not in seen:
                seen.add(chunk_key)
                unique.append(chunk)

        return unique

    async def get_control_context_summary(
        self,
        position_id: UUID,
        framework_id: UUID,
    ) -> str:
        """
        Generate a summary of controls for context building
        """
        controls = await self.get_position_controls(
            position_id=position_id,
            framework_id=framework_id,
        )

        if not controls:
            return ""

        summary_parts = []
        for control in controls:
            summary_parts.append(
                f"Control {control.code}: {control.title}\n"
                f"Description: {control.description or 'N/A'}"
            )

        return "\n\n".join(summary_parts)

    async def retrieve_with_control_context(
        self,
        query: str,
        position_id: UUID,
        framework_id: UUID,
        org_id: str | None = None,
        top_k: int = 5,
        score_threshold: float = 0.5,
    ) -> tuple[list[RetrievedChunk], str]:
        """
        Retrieve chunks and also return control context summary
        
        Returns:
            (chunks, control_context_summary)
        """
        chunks = await self.retrieve_context_for_assessment(
            query=query,
            position_id=position_id,
            framework_id=framework_id,
            org_id=org_id,
            top_k=top_k,
            score_threshold=score_threshold,
        )

        control_summary = await self.get_control_context_summary(
            position_id=position_id,
            framework_id=framework_id,
        )

        return chunks, control_summary
