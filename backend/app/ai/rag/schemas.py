"""
RAG System Schemas
Request/Response models for RAG operations
"""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class FrameworkType(str, Enum):
    """Supported compliance frameworks and national data-protection regulations"""
    # Global standards / frameworks
    ISO27001 = "ISO27001"
    NIST = "NIST"
    SOC2 = "SOC2"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI_DSS"
    COBIT = "COBIT"
    TISAX = "TISAX"
    # National / regional data-protection regulations
    CCPA = "CCPA"            # USA - California (CCPA/CPRA)
    LGPD = "LGPD"            # Brazil
    PIPEDA = "PIPEDA"        # Canada
    UK_GDPR = "UK_GDPR"      # United Kingdom (DPA 2018)
    PIPL = "PIPL"            # China
    DPDP = "DPDP"            # India (DPDP Act 2023)
    POPIA = "POPIA"          # South Africa
    PDPA_SG = "PDPA_SG"      # Singapore
    APPI = "APPI"            # Japan
    AU_PRIVACY = "AU_PRIVACY"  # Australia (Privacy Act / APPs)
    EGYPT_PDPL = "EGYPT_PDPL"  # Egypt (Law 151/2020)
    KSA_PDPL = "KSA_PDPL"      # Saudi Arabia
    UAE_PDPL = "UAE_PDPL"      # UAE (Federal Decree-Law 45/2021)
    ALL = "ALL"


class RetrievedChunk(BaseModel):
    """Retrieved document chunk with metadata"""
    text: str = Field(..., description="Chunk text content")
    score: float = Field(..., description="Similarity score")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")

    # Common metadata fields
    framework: str | None = None
    source_file: str | None = None
    section: str | None = None
    control_id: str | None = None
    page_number: int | str | None = None  # Can be int or string like "Front Sheet"

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Multi-factor authentication must be implemented...",
                "score": 0.92,
                "metadata": {
                    "framework": "ISO27001",
                    "section": "A.9.4.2",
                    "control_id": "A.9.4.2",
                    "source_file": "iso27001_2022.pdf",
                    "page_number": 45
                }
            }
        }


class SourceReference(BaseModel):
    """Source document reference"""
    framework: str
    section: str | None = None
    control_id: str | None = None
    source_file: str
    page_number: int | str | None = None  # Can be int or string
    relevance_score: float

    class Config:
        json_schema_extra = {
            "example": {
                "framework": "ISO27001",
                "section": "A.9.4.2",
                "control_id": "A.9.4.2",
                "source_file": "iso27001_2022.pdf",
                "page_number": 45,
                "relevance_score": 0.92
            }
        }


class RAGQueryRequest(BaseModel):
    """Request for RAG query"""
    question: str = Field(..., min_length=3, max_length=1000, description="User question")
    framework: FrameworkType | None = Field(
        FrameworkType.ALL,
        description="Filter by specific framework"
    )
    top_k: int = Field(10, ge=1, le=20, description="Number of chunks to retrieve")
    score_threshold: float = Field(0.5, ge=0.0, le=1.0, description="Minimum similarity score")
    include_metadata: bool = Field(True, description="Include chunk metadata in response")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What does ISO 27001 require for MFA?",
                "framework": "ISO27001",
                "top_k": 10,
                "score_threshold": 0.5,
                "include_metadata": True
            }
        }


class AnswerSection(BaseModel):
    """A single structured section of the answer"""
    title: str = Field(..., description="Section title (e.g., Overview, Detailed Requirements)")
    content: str = Field(..., description="Section body text")
    order: int = Field(..., description="Section display order")


class AnswerMetadata(BaseModel):
    """Answer metadata and statistics"""
    word_count: int = Field(..., description="Total word count in the answer")
    char_count: int = Field(..., description="Total character count")
    estimated_reading_time_seconds: int = Field(..., description="Estimated reading time in seconds (~200 wpm)")
    sections_count: int = Field(..., description="Number of structured sections")
    sources_count: int = Field(..., description="Number of cited sources")


class RAGAnswer(BaseModel):
    """Structured RAG answer with rich formatting"""
    summary: str = Field(..., description="Concise 2-3 sentence summary of the answer")
    sections: list[AnswerSection] = Field(default_factory=list, description="Structured answer sections")
    full_text: str = Field(..., description="Complete raw answer text")
    sources: list[SourceReference] = Field(default_factory=list, description="Source references")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Answer confidence")
    retrieved_chunks: int = Field(..., description="Number of chunks retrieved")
    processing_time_ms: int = Field(..., description="Total processing time")
    framework_filter: str | None = Field(None, description="Framework filter applied")
    metadata: AnswerMetadata = Field(..., description="Answer metadata and statistics")

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "ISO 27001 requires MFA for all critical systems to enhance authentication security and reduce unauthorized access risks.",
                "sections": [
                    {
                        "title": "Overview",
                        "content": "ISO 27001 is an international standard...",
                        "order": 1
                    },
                    {
                        "title": "Detailed Requirements",
                        "content": "Control Objective 12.2.11 mandates MFA...",
                        "order": 2
                    }
                ],
                "full_text": "### Overview\n\nISO 27001 is...",
                "sources": [
                    {
                        "framework": "ISO27001",
                        "section": "A.9.4.2",
                        "control_id": "A.9.4.2",
                        "source_file": "iso27001_2022.pdf",
                        "page_number": 45,
                        "relevance_score": 0.92
                    }
                ],
                "confidence_score": 0.89,
                "retrieved_chunks": 5,
                "processing_time_ms": 1250,
                "framework_filter": "ISO27001",
                "metadata": {
                    "word_count": 850,
                    "char_count": 5200,
                    "estimated_reading_time_seconds": 255,
                    "sections_count": 5,
                    "sources_count": 1
                }
            }
        }


class RAGQueryResponse(BaseModel):
    """Response for RAG query"""
    success: bool = Field(..., description="Query success status")
    message: str = Field(..., description="Status message")
    data: RAGAnswer | None = Field(None, description="Structured answer with sections, summary, and metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Query processed successfully",
                "data": {
                    "summary": "ISO 27001 requires multi-factor authentication...",
                    "sections": [
                        {"title": "Overview", "content": "...", "order": 1}
                    ],
                    "full_text": "### Overview\n\nISO 27001 is...",
                    "sources": [
                        {
                            "framework": "ISO27001",
                            "section": "A.9.4.2",
                            "control_id": "A.9.4.2",
                            "source_file": "iso27001_2022.pdf",
                            "page_number": 45,
                            "relevance_score": 0.92
                        }
                    ],
                    "confidence_score": 0.89,
                    "retrieved_chunks": 5,
                    "processing_time_ms": 1250,
                    "framework_filter": "ISO27001",
                    "metadata": {
                        "word_count": 850,
                        "char_count": 5200,
                        "estimated_reading_time_seconds": 255,
                        "sections_count": 5,
                        "sources_count": 1
                    }
                }
            }
        }


class RAGSearchRequest(BaseModel):
    """Request for semantic search only (no LLM generation)"""
    query: str = Field(..., min_length=3, max_length=500, description="Search query")
    framework: FrameworkType | None = Field(
        FrameworkType.ALL,
        description="Filter by framework"
    )
    top_k: int = Field(10, ge=1, le=50, description="Number of results")
    score_threshold: float = Field(0.3, ge=0.0, le=1.0, description="Minimum score")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "access control requirements",
                "framework": "ISO27001",
                "top_k": 10,
                "score_threshold": 0.3
            }
        }


class RAGSearchResponse(BaseModel):
    """Response for semantic search"""
    success: bool
    message: str
    data: dict[str, Any] | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Search completed successfully",
                "data": {
                    "results": [
                        {
                            "text": "Access control requirements...",
                            "score": 0.92,
                            "metadata": {
                                "framework": "ISO27001",
                                "section": "A.9"
                            }
                        }
                    ],
                    "total_results": 10,
                    "query_time_ms": 45
                }
            }
        }
