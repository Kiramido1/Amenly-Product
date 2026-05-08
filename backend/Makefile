.PHONY: help install run dev test lint format clean migrate makemigrations shell docker down logs build

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(BLUE)Amenly Backend - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install dependencies using Poetry
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@if ! command -v poetry &> /dev/null; then \
		echo "$(RED)Poetry not found. Installing Poetry...$(NC)"; \
		curl -sSL https://install.python-poetry.org | python3 -; \
		export PATH="$$HOME/.local/bin:$$PATH"; \
		echo "$$PATH"; \
	fi
	@echo "$(YELLOW)Note: First installation may take 5-10 minutes...$(NC)"
	@poetry install --no-root
	@echo "$(GREEN)✓ Dependencies installed successfully$(NC)"

install-dev: ## Install dependencies including dev tools
	@echo "$(BLUE)Installing all dependencies (including dev)...$(NC)"
	@poetry install --with dev
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@poetry update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

run: install ## Run the backend server (production mode)
	@echo "$(BLUE)Starting Amenly Backend Server...$(NC)"
	@echo "$(YELLOW)Note: Using port 8001$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	@poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

dev: install-dev ## Run the backend in development mode with hot reload
	@echo "$(BLUE)Starting Amenly Backend in Development Mode...$(NC)"
	@echo "$(YELLOW)Note: Using port 8001$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	@poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

stop: ## Stop the running backend server
	@echo "$(BLUE)Stopping backend server on port 8001...$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "$(GREEN)✓ Server stopped$(NC)" || echo "$(YELLOW)No server running on port 8001$(NC)"

test: install-dev ## Run tests with coverage
	@echo "$(BLUE)Running tests...$(NC)"
	@poetry run pytest -v --cov=app --cov-report=term-missing --cov-report=html
	@echo "$(GREEN)✓ Tests completed. Coverage report: htmlcov/index.html$(NC)"

test-unit: install-dev ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	@poetry run pytest -v -m unit

test-integration: install-dev ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	@poetry run pytest -v -m integration

test-watch: install-dev ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@poetry run pytest-watch

lint: install-dev ## Run linting checks
	@echo "$(BLUE)Running linting checks...$(NC)"
	@poetry run ruff check app tests
	@poetry run flake8 app tests
	@poetry run mypy app
	@echo "$(GREEN)✓ Linting completed$(NC)"

format: install-dev ## Format code with black and isort
	@echo "$(BLUE)Formatting code...$(NC)"
	@poetry run black app tests
	@poetry run isort app tests
	@poetry run ruff check --fix app tests
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-check: install-dev ## Check code formatting without making changes
	@echo "$(BLUE)Checking code formatting...$(NC)"
	@poetry run black --check app tests
	@poetry run isort --check-only app tests

type-check: install-dev ## Run type checking with mypy
	@echo "$(BLUE)Running type checks...$(NC)"
	@poetry run mypy app

clean: ## Clean up cache and temporary files
	@echo "$(BLUE)Cleaning up...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name ".coverage" -delete 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@rm -rf dist/ build/ *.egg-info .eggs/
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

migrate: install ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@poetry run alembic upgrade head
	@echo "$(GREEN)✓ Migrations applied$(NC)"

makemigrations: install ## Create new database migration
	@echo "$(BLUE)Creating new migration...$(NC)"
	@read -p "Enter migration message: " msg; \
	poetry run alembic revision --autogenerate -m "$$msg"
	@echo "$(GREEN)✓ Migration created$(NC)"

downgrade: install ## Rollback last migration
	@echo "$(YELLOW)Rolling back last migration...$(NC)"
	@poetry run alembic downgrade -1
	@echo "$(GREEN)✓ Migration rolled back$(NC)"

migration-history: install ## Show migration history
	@echo "$(BLUE)Migration history:$(NC)"
	@poetry run alembic history

shell: install ## Open Python shell with app context
	@echo "$(BLUE)Opening Python shell...$(NC)"
	@poetry run ipython

seed: install ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	@poetry run python seed_first_org.py
	@echo "$(GREEN)✓ Database seeded$(NC)"

docker: ## Build and run with Docker
	@echo "$(BLUE)Building and starting Docker containers...$(NC)"
	@docker-compose up --build -d
	@echo "$(GREEN)✓ Docker containers started$(NC)"

docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✓ Docker image built$(NC)"

docker-up: ## Start Docker containers
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Docker containers started$(NC)"

down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Docker containers stopped$(NC)"

logs: ## Show Docker logs
	@docker-compose logs -f

ps: ## Show running containers
	@docker-compose ps

restart: ## Restart Docker containers
	@echo "$(BLUE)Restarting Docker containers...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ Docker containers restarted$(NC)"

pre-commit-install: install-dev ## Install pre-commit hooks
	@echo "$(BLUE)Installing pre-commit hooks...$(NC)"
	@poetry run pre-commit install
	@echo "$(GREEN)✓ Pre-commit hooks installed$(NC)"

pre-commit-run: install-dev ## Run pre-commit on all files
	@echo "$(BLUE)Running pre-commit checks...$(NC)"
	@poetry run pre-commit run --all-files

check: format-check lint test ## Run all checks (format, lint, test)
	@echo "$(GREEN)✓ All checks passed$(NC)"

ci: install-dev format-check lint test ## Run CI pipeline locally
	@echo "$(GREEN)✓ CI pipeline completed successfully$(NC)"

requirements: ## Export requirements.txt from Poetry
	@echo "$(BLUE)Exporting requirements...$(NC)"
	@poetry export -f requirements.txt --output requirements.txt --without-hashes
	@poetry export -f requirements.txt --output requirements-dev.txt --with dev --without-hashes
	@echo "$(GREEN)✓ Requirements exported$(NC)"

lock: ## Update poetry.lock file
	@echo "$(BLUE)Updating poetry.lock...$(NC)"
	@poetry lock --no-update
	@echo "$(GREEN)✓ poetry.lock updated$(NC)"

show: ## Show installed packages
	@poetry show

info: ## Show Poetry environment info
	@poetry env info

check-install: ## Check installation status
	@echo "$(BLUE)Checking installation...$(NC)"
	@./scripts/check_installation.sh

version: ## Show current version
	@echo "$(BLUE)Amenly Backend Version:$(NC)"
	@poetry version

bump-patch: ## Bump patch version (1.0.0 -> 1.0.1)
	@poetry version patch
	@echo "$(GREEN)✓ Version bumped$(NC)"

bump-minor: ## Bump minor version (1.0.0 -> 1.1.0)
	@poetry version minor
	@echo "$(GREEN)✓ Version bumped$(NC)"

bump-major: ## Bump major version (1.0.0 -> 2.0.0)
	@poetry version major
	@echo "$(GREEN)✓ Version bumped$(NC)"

health: ## Check backend health
	@echo "$(BLUE)Checking backend health...$(NC)"
	@curl -s http://localhost:8000/health | python -m json.tool || echo "$(RED)Backend is not running$(NC)"

docs: ## Generate API documentation
	@echo "$(BLUE)API Documentation available at:$(NC)"
	@echo "  Swagger UI: http://localhost:8000/docs"
	@echo "  ReDoc: http://localhost:8000/redoc"

setup: install-dev pre-commit-install migrate ## Complete setup for new developers
	@echo "$(GREEN)✓ Setup completed! You can now run 'make dev' to start development$(NC)"

.PHONY: all
all: clean install-dev format lint test ## Run complete workflow
	@echo "$(GREEN)✓ All tasks completed successfully$(NC)"
