# Amenly Backend

FastAPI-based backend for the Amenly GRC platform.

## Features
- **Modular Clean Architecture**: Domain-driven organization.
- **Async Implementation**: Fully asynchronous database and AI service calls.
- **AI Integration**: RAG engine with Qdrant and Ollama.
- **Enterprise-ready**: Structured logging, health checks, and production gunicorn setup.

## Structure
- `app/api/`: API routers and endpoints.
- `app/core/`: Configuration and security.
- `app/database/`: Session and base model.
- `app/auth/`: Authentication module.
- `app/ai/`: AI services, RAG, and embeddings.
- `app/organizations/`: Multi-tenant organization management.

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements/dev.txt
   ```
3. Run locally:
   ```bash
   uvicorn app.main:app --reload
   ```

## Migrations
Use Alembic for database migrations:
```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```
