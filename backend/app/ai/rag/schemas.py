"""
RAG System Schemas
Request/Response models for RAG operations
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class FrameworkType(str, Enum):
    """Supported compliance frameworks"""
    ISO27001 = "ISO27001"
    NIST = "NIST"
    SOC2 = "SOC2"
    GDPR = "GDPR"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI_DSS"
    COBIT = "COBIT"
    TISAX = "TISAX"
    ALL = "ALL"


class RetrievedChunk(BaseModel):
    """Retrieved document chunk with metadata"""
    text: str = Field(..., description="Chunk text content")
    score: float = Field(..., description="Similarity score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")
    
    # Common metadata fields
    framework: Optional[str] = None
    source_file: Optional[str] = None
    section: Optional[str] = None
    control_id: Optional[str] = None
    page_number: Optional[int] = None
    
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
    section: Optional[str] = None
    control_id: Optional[str] = None
    source_file: str
    page_number: Optional[int] = None
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
    framework: Optional[FrameworkType] = Field(
        FrameworkType.ALL,
        description="Filter by specific framework"
    )
    top_k: int = Field(5, ge=1, le=20, description="Number of chunks to retrieve")
    score_threshold: float = Field(0.5, ge=0.0, le=1.0, description="Minimum similarity score")
    include_metadata: bool = Field(True, description="Include chunk metadata in response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What does ISO 27001 require for MFA?",
                "framework": "ISO27001",
                "top_k": 5,
                "score_threshold": 0.5,
                "include_metadata": True
            }
        }


class RAGQueryResponse(BaseModel):
    """Response for RAG query"""
    success: bool = Field(..., description="Query success status")
    message: str = Field(..., description="Status message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Query processed successfully",
                "data": {
                    "answer": "ISO 27001 requires multi-factor authentication...",
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
                    "processing_time_ms": 1250
                }
            }
        }


class RAGSearchRequest(BaseModel):
    """Request for semantic search only (no LLM generation)"""
    query: str = Field(..., min_length=3, max_length=500, description="Search query")
    framework: Optional[FrameworkType] = Field(
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
    data: Optional[Dict[str, Any]] = None
    
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


class RAGAnswer(BaseModel):
    """Structured RAG answer"""
    answer: str = Field(..., description="Generated answer")
    sources: List[SourceReference] = Field(default_factory=list, description="Source references")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Answer confidence")
    retrieved_chunks: int = Field(..., description="Number of chunks retrieved")
    processing_time_ms: int = Field(..., description="Total processing time")
    framework_filter: Optional[str] = Field(None, description="Framework filter applied")
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "ISO 27001 requires multi-factor authentication for remote access...",
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
                "framework_filter": "ISO27001"
            }
        }
