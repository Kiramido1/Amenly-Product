# RAG Ingestion Pipeline - Implementation Plan

## 🎯 Overview
Building enterprise-grade RAG ingestion pipeline for Amenly AI Compliance Platform

## 📁 Architecture

```
app/ai/
├── ingestion/
│   ├── __init__.py
│   ├── validators/
│   │   ├── __init__.py
│   │   ├── file_validator.py ✅ DONE
│   │   └── content_validator.py
│   ├── loaders/
│   │   ├── __init__.py
│   │   ├── base_loader.py
│   │   ├── pdf_loader.py
│   │   ├── docx_loader.py
│   │   └── text_loader.py
│   ├── cleaners/
│   │   ├── __init__.py
│   │   ├── text_cleaner.py
│   │   └── compliance_cleaner.py
│   ├── chunkers/
│   │   ├── __init__.py
│   │   ├── semantic_chunker.py
│   │   └── compliance_chunker.py
│   ├── metadata/
│   │   ├── __init__.py
│   │   └── extractor.py
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   └── processor.py
│   └── models.py
├── embeddings/
│   ├── __init__.py
│   ├── ollama_embeddings.py
│   └── batch_processor.py
├── vectorstores/
│   ├── __init__.py
│   ├── qdrant_store.py
│   └── collection_manager.py
├── rag/
│   ├── __init__.py
│   ├── retrieval/
│   │   ├── __init__.py
│   │   ├── retriever.py
│   │   └── hybrid_search.py
│   ├── ranking/
│   │   ├── __init__.py
│   │   └── reranker.py
│   └── pipeline.py
└── services/
    ├── __init__.py
    └── framework_service.py

app/frameworks/
├── __init__.py
├── models.py
├── schemas.py
├── repository.py
├── service.py
└── router.py
```

## 🔄 Pipeline Flow

```
1. Upload → 2. Validate → 3. Load → 4. Clean → 5. Extract Metadata
    ↓
6. Chunk → 7. Embed → 8. Store → 9. Index → 10. Ready for Retrieval
```

## ✅ Implementation Status

### Phase 1: Core Infrastructure
- [x] File Validator
- [ ] Content Validator
- [ ] Document Loaders (PDF, DOCX, TXT, MD)
- [ ] Text Cleaners
- [ ] Metadata Extractor

### Phase 2: Chunking & Embeddings
- [ ] Semantic Chunker
- [ ] Compliance-Aware Chunker
- [ ] Ollama Embeddings Integration
- [ ] Batch Embedding Processor

### Phase 3: Vector Storage
- [ ] Qdrant Client Setup
- [ ] Collection Manager
- [ ] Vector Store Operations

### Phase 4: RAG Retrieval
- [ ] Basic Retriever
- [ ] Hybrid Search
- [ ] Reranker
- [ ] RAG Pipeline

### Phase 5: APIs & Services
- [ ] Framework Models & Schemas
- [ ] Framework Repository
- [ ] Framework Service
- [ ] Upload API
- [ ] Process API
- [ ] Search API

### Phase 6: Background Processing
- [ ] Celery Setup
- [ ] Task Definitions
- [ ] Queue Management

### Phase 7: Testing & Documentation
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] API Documentation
- [ ] Usage Examples

## 🚀 Next Steps

1. Complete validators
2. Build loaders
3. Implement cleaners
4. Create chunkers
5. Setup embeddings
6. Configure Qdrant
7. Build retrieval
8. Create APIs
9. Add background tasks
10. Write tests

## 📊 Quality Metrics

- File validation rate: > 95%
- Chunk quality score: > 0.8
- Embedding success rate: > 99%
- Retrieval accuracy: > 0.85
- Processing speed: < 5 min per framework

## 🔧 Dependencies to Add

```toml
# Add to pyproject.toml
pymupdf = "^1.24.0"
python-docx = "^1.1.0"
chardet = "^5.2.0"
python-magic = "^0.4.27"
tiktoken = "^0.7.0"
langchain-text-splitters = "^0.3.0"
celery = {extras = ["redis"], version = "^5.4.0"}
```

## 📝 Configuration

```env
# Add to .env
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=nomic-embed-text
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=compliance_frameworks
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```
