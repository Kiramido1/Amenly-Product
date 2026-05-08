# Amenly - AI-powered Compliance & Cyber Risk Platform

Amenly is an enterprise-grade platform for managing compliance and cyber risk using advanced AI.

## Architecture
- **Monorepo**: Clean, modular structure.
- **Backend**: FastAPI (Python 3.12) with Async SQLAlchemy & PostgreSQL.
- **Database**: PostgreSQL (Supabase compatible).
- **AI Stack**: Ollama, Qdrant (Vector DB), Redis (Caching).
- **Deployment**: Dockerized production-ready environment.

## Project Structure
```text
project-root/
├── backend/            # FastAPI Backend
├── docker/             # Infrastructure configs (Nginx, etc.)
├── docs/               # Project documentation
├── docker-compose.yml  # Local development orchestration
└── Makefile            # Shortcut commands
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)

### Quick Start
1. Clone the repository.
2. Copy `.env.example` to `backend/.env` and fill in the values.
3. Run the project using Docker:
   ```bash
   make build
   make up
   ```
4. Access the API at `http://localhost/api/v1` or directly at `http://localhost:8000`.

### Development Workflow
- **Backend**: Work in `backend/app/`. Use `make logs` to see output.
- **Database**: Managed via Alembic migrations.

## License
Proprietary - Amenly
