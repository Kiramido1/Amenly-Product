# 🛡️ Amenly Backend - FastAPI Application

> Enterprise-grade GRC Platform Backend powered by FastAPI and Poetry

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://www.python.org)
[![Poetry](https://img.shields.io/badge/Poetry-2.4.0-60A5FA?style=flat&logo=poetry)](https://python-poetry.org)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## 🚀 Quick Start

### Prerequisites

- **Python 3.13+**
- **Poetry** (will be installed automatically if not present)
- **PostgreSQL** (Supabase)
- **Redis**

### Installation & Running

```bash
# Clone and navigate to backend
cd backend

# Run the application (installs dependencies automatically)
make run
```

That's it! The backend will be available at `http://localhost:8000`

## 📋 Available Commands

### Development

```bash
make dev              # Run in development mode with hot reload
make run              # Run in production mode
make install          # Install dependencies
make install-dev      # Install with dev dependencies
```

### Code Quality

```bash
make format           # Format code with black and isort
make lint             # Run linting checks
make type-check       # Run type checking with mypy
make check            # Run all checks (format, lint, test)
```

### Testing

```bash
make test             # Run tests with coverage
make test-unit        # Run unit tests only
make test-integration # Run integration tests only
make test-watch       # Run tests in watch mode
```

### Database

```bash
make migrate          # Apply database migrations
make makemigrations   # Create new migration
make downgrade        # Rollback last migration
make seed             # Seed database with initial data
```

### Docker

```bash
make docker           # Build and run with Docker
make docker-build     # Build Docker image
make docker-up        # Start containers
make down             # Stop containers
make logs             # Show logs
make restart          # Restart containers
```

### Utilities

```bash
make shell            # Open Python shell with app context
make clean            # Clean cache and temporary files
make health           # Check backend health
make docs             # Show API documentation URLs
make help             # Show all available commands
```

### Setup

```bash
make setup            # Complete setup for new developers
                      # (install deps, pre-commit, migrations)
```

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   └── v1/
│   │       ├── endpoints/      # Route handlers
│   │       └── router.py
│   ├── auth/                   # Authentication & Authorization
│   │   ├── dependencies.py
│   │   ├── router.py
│   │   ├── security.py
│   │   ├── service.py
│   │   └── token_manager.py   # Redis-based token revocation
│   ├── core/                   # Core configurations
│   │   ├── config.py
│   │   ├── logging.py         # Structured logging
│   │   └── security.py
│   ├── database/               # Database setup
│   │   └── session.py
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic
│   └── main.py                 # Application entry point
├── alembic/                    # Database migrations
├── tests/                      # Test suite
├── logs/                       # Application logs
├── pyproject.toml              # Poetry configuration
├── Makefile                    # Development commands
├── Dockerfile                  # Production Docker image
└── .env                        # Environment variables
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Application
PROJECT_NAME=Amenly
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (Supabase)
POSTGRES_SERVER=your-project.pooler.supabase.com
POSTGRES_USER=postgres.xxxxx
POSTGRES_PASSWORD=your-password
POSTGRES_DB=postgres
DATABASE_URL=postgresql+psycopg://...

# Redis
REDIS_URL=redis://redis:6379/0

# AI Services
OLLAMA_URL=http://ollama:11434
QDRANT_URL=http://qdrant:6333
```

### Poetry Configuration

Poetry is configured to create virtual environments in the project directory (`.venv/`).

To manually configure:

```bash
poetry config virtualenvs.in-project true
poetry config virtualenvs.create true
```

## 🧪 Testing

### Run All Tests

```bash
make test
```

### Run Specific Tests

```bash
# Unit tests only
make test-unit

# Integration tests only
make test-integration

# Specific test file
poetry run pytest tests/auth/test_login.py -v

# With coverage report
poetry run pytest --cov=app --cov-report=html
```

### Test Coverage

After running tests, open `htmlcov/index.html` to view the coverage report.

## 📝 Code Quality

### Formatting

```bash
# Format code
make format

# Check formatting without changes
make format-check
```

### Linting

```bash
# Run all linters
make lint

# Individual linters
poetry run ruff check app tests
poetry run flake8 app tests
poetry run mypy app
```

### Pre-commit Hooks

Install pre-commit hooks to automatically check code before commits:

```bash
make pre-commit-install

# Run manually on all files
make pre-commit-run
```

## 🐳 Docker

### Build and Run

```bash
# Build and start
make docker

# Or step by step
make docker-build
make docker-up
```

### Docker Compose

The application uses Docker Compose with the following services:

- **backend**: FastAPI application
- **postgres**: PostgreSQL database (Supabase)
- **redis**: Redis cache
- **qdrant**: Vector database
- **ollama**: AI model server

## 📚 API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 🔐 Security Features

- ✅ JWT Authentication with Redis-based token revocation
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ CORS protection
- ✅ SQL injection prevention via SQLAlchemy ORM
- ✅ Environment-based configuration
- ✅ Secure Docker image (non-root user)

## 🚀 Deployment

### Production Build

```bash
# Build production Docker image
docker build -t amenly-backend:latest .

# Run production container
docker run -p 8000:8000 --env-file .env amenly-backend:latest
```

### Environment Variables for Production

Ensure these are set in production:

- `DEBUG=False`
- `SECRET_KEY=<strong-random-key>`
- `DATABASE_URL=<production-database-url>`
- `REDIS_URL=<production-redis-url>`

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

### Logs

```bash
# Docker logs
make logs

# Application logs
tail -f logs/app.log
```

### Metrics

Prometheus metrics available at `/metrics` (if enabled)

## 🛠️ Development Workflow

### 1. Setup Development Environment

```bash
make setup
```

### 2. Start Development Server

```bash
make dev
```

### 3. Make Changes

- Code is automatically formatted on save (if pre-commit is installed)
- Tests run automatically (if using test-watch)

### 4. Run Checks Before Commit

```bash
make check
```

### 5. Create Migration (if database changes)

```bash
make makemigrations
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: your feature description"
```

## 🐛 Troubleshooting

### Poetry Not Found

```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
```

### Virtual Environment Issues

```bash
# Remove existing venv
rm -rf .venv

# Reinstall
make install-dev
```

### Database Connection Issues

```bash
# Check database URL
poetry run python -c "from app.core.config import settings; print(settings.DATABASE_URL)"

# Test connection
poetry run python -c "from app.database.session import engine; import asyncio; asyncio.run(engine.connect())"
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org)
- [Alembic Documentation](https://alembic.sqlalchemy.org)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `make check` to ensure quality
4. Submit a pull request

## 📝 License

Proprietary - © 2026 Amenly. All rights reserved.

---

**Built with ❤️ using Poetry and FastAPI**
