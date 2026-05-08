# 🛡️ Amenly - AI-Powered GRC Platform

> Enterprise-grade Governance, Risk, and Compliance platform powered by AI

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)](LICENSE)

## 📋 Overview

Amenly is a comprehensive Governance, Risk, and Compliance (GRC) platform that leverages artificial intelligence to help organizations manage their compliance frameworks, assess risks, and maintain security posture.

### ✨ Key Features

- 🔐 **Advanced Authentication** - JWT-based auth with Redis token revocation
- 📊 **Risk Assessment** - AI-powered risk analysis and scoring
- 📋 **Compliance Management** - Support for ISO 27001, SOC 2, GDPR, and more
- 🤖 **AI Integration** - Ollama-powered intelligent recommendations
- 🔄 **Real-time Updates** - WebSocket support for live notifications
- 🏢 **Multi-tenancy** - Organization-based access control
- 📈 **Analytics & Reporting** - Comprehensive compliance dashboards

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)                │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  FastAPI       │  │  PostgreSQL  │  │     Redis       │
│  Backend       │  │  (Supabase)  │  │   (Caching)     │
└────────────────┘  └──────────────┘  └─────────────────┘
        │
        ├─────────────┬─────────────┐
        │             │             │
┌───────▼────────┐  ┌▼────────┐  ┌─▼──────────┐
│    Ollama      │  │ Qdrant  │  │ WebSocket  │
│   (AI Model)   │  │(Vector) │  │  Server    │
└────────────────┘  └─────────┘  └────────────┘
```

## 📁 Project Structure

```
Amenly_Grad_project/
├── backend/                    # FastAPI Backend Application
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   └── v1/
│   │   │       ├── endpoints/ # Route handlers
│   │   │       └── router.py  # API router
│   │   ├── auth/              # Authentication & Authorization
│   │   │   ├── dependencies.py
│   │   │   ├── router.py
│   │   │   ├── security.py
│   │   │   ├── service.py
│   │   │   └── token_manager.py  # Redis-based token revocation
│   │   ├── core/              # Core configurations
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/          # Database setup
│   │   │   └── session.py     # SQLAlchemy async session
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py            # Application entry point
│   ├── alembic/               # Database migrations
│   ├── requirements/          # Python dependencies
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── tests/                 # Test suite
│   └── Dockerfile
├── docker/                    # Docker configurations
│   └── nginx/
├── docs/                      # Documentation
├── docker-compose.yml         # Docker orchestration
├── Makefile                   # Development shortcuts
├── .env.example              # Environment template
├── .gitignore
└── README.md

```

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **Python 3.12+** (for local development)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kiramido1/Amenly-Product.git
   cd Amenly-Product
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Build and start services**
   ```bash
   make build
   make up
   ```

4. **Verify installation**
   ```bash
   curl http://localhost:8000/health
   ```

### 🔧 Configuration

Edit `backend/.env` with your settings:

```env
# Application
PROJECT_NAME=Amenly
SECRET_KEY=your-secret-key-here
DEBUG=False

# Database (Supabase)
POSTGRES_SERVER=your-supabase-host.supabase.com
POSTGRES_USER=postgres.xxxxx
POSTGRES_PASSWORD=your-password
POSTGRES_DB=postgres
DATABASE_URL=postgresql+psycopg://user:pass@host:6543/postgres

# Redis
REDIS_URL=redis://redis:6379/0

# AI Services
OLLAMA_URL=http://ollama:11434
QDRANT_URL=http://qdrant:6333
```

## 🛠️ Development

### Available Commands

```bash
# Docker Management
make build          # Build Docker images
make up             # Start all services
make down           # Stop all services
make restart        # Restart all services
make logs           # View logs
make clean          # Clean up containers and volumes

# Database
make migrate        # Run database migrations
make migration      # Create new migration

# Testing
make test           # Run test suite
make test-cov       # Run tests with coverage
```

### Running Locally (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

Once the server is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Key Endpoints

```
POST   /api/v1/auth/register      # Register new user
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/refresh       # Refresh access token
POST   /api/v1/auth/logout        # Logout (revoke tokens)
GET    /api/v1/auth/me            # Get current user

GET    /api/v1/users              # List users
GET    /api/v1/organizations      # List organizations
```

## 🔐 Security Features

- ✅ **JWT Authentication** with access & refresh tokens
- ✅ **Token Revocation** using Redis blacklist
- ✅ **Password Hashing** with bcrypt
- ✅ **Role-based Access Control** (RBAC)
- ✅ **CORS Protection**
- ✅ **SQL Injection Prevention** via SQLAlchemy ORM
- ✅ **Environment-based Configuration**

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test file
pytest backend/tests/auth/test_login.py -v
```

## 📊 Database

### Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Schema

See [TEST_RESULTS.md](TEST_RESULTS.md) for detailed database schema and test results.

## 🐳 Docker Services

| Service    | Port | Description                    |
|------------|------|--------------------------------|
| Backend    | 8000 | FastAPI application            |
| Nginx      | 80   | Reverse proxy                  |
| PostgreSQL | 5432 | Database (external - Supabase) |
| Redis      | 6379 | Caching & token management     |
| Qdrant     | 6333 | Vector database for AI         |
| Ollama     | 11434| AI model server                |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Proprietary - © 2026 Amenly. All rights reserved.

## 👥 Team

- **Development Team**: Amenly Engineering
- **Contact**: [GitHub](https://github.com/Kiramido1/Amenly-Product)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Supabase for managed PostgreSQL
- Ollama for local AI capabilities
- The open-source community

---

**Built with ❤️ by the Amenly Team**
