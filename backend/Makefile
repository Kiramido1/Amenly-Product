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
		echo "$(YELLOW)Installing Poetry...$(NC)"; \
		curl -sSL https://install.python-poetry.org | python3 - > /dev/null 2>&1; \
		export PATH="$$HOME/.local/bin:$$PATH"; \
	fi
	@poetry install --no-root > /dev/null 2>&1
	@echo "$(GREEN)✓ Dependencies installed successfully$(NC)"

install-dev: ## Install dependencies including dev tools
	@echo "$(BLUE)Installing all dependencies (including dev)...$(NC)"
	@poetry install --with dev > /dev/null 2>&1
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@poetry update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

run: install ## Run the backend server (production mode)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)🚀 Starting Amenly Backend Services...$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)1/5 Checking GPU Availability...$(NC)"
	@if command -v nvidia-smi > /dev/null 2>&1; then \
		GPU_INFO=$$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -1); \
		if [ -n "$$GPU_INFO" ]; then \
			echo "$(GREEN)✓ GPU Detected: $$GPU_INFO$(NC)"; \
			echo "$(GREEN)✓ Ollama will use GPU acceleration$(NC)"; \
		else \
			echo "$(YELLOW)⚠ nvidia-smi found but no GPU detected$(NC)"; \
			echo "$(YELLOW)  Ollama will use CPU$(NC)"; \
		fi \
	else \
		echo "$(YELLOW)⚠ No NVIDIA GPU detected$(NC)"; \
		echo "$(YELLOW)  Ollama will use CPU$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)2/5 Checking Ollama & Model...$(NC)"
	@if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then \
		echo "$(RED)✗ Ollama is not running!$(NC)"; \
		echo "$(YELLOW)  Please start Ollama first: ollama serve$(NC)"; \
		exit 1; \
	else \
		echo "$(GREEN)✓ Ollama is running$(NC)"; \
		MODEL_NAME="qwen2.5:3b"; \
		if ollama list | grep -q "$$MODEL_NAME"; then \
			echo "$(GREEN)✓ Model $$MODEL_NAME is available$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Model $$MODEL_NAME not found$(NC)"; \
			echo "$(BLUE)  Downloading $$MODEL_NAME (this may take a few minutes)...$(NC)"; \
			ollama pull $$MODEL_NAME; \
			if [ $$? -eq 0 ]; then \
				echo "$(GREEN)✓ Model $$MODEL_NAME downloaded successfully$(NC)"; \
			else \
				echo "$(RED)✗ Failed to download model $$MODEL_NAME$(NC)"; \
				exit 1; \
			fi \
		fi \
	fi
	@echo ""
	@echo "$(YELLOW)3/5 Starting Qdrant...$(NC)"
	@if docker ps | grep -q qdrant; then \
		echo "$(GREEN)✓ Qdrant is already running$(NC)"; \
	elif docker ps -a | grep -q qdrant; then \
		echo "$(BLUE)  Starting existing Qdrant container...$(NC)"; \
		docker start $$(docker ps -a | grep qdrant | awk '{print $$1}') > /dev/null 2>&1; \
		sleep 3; \
		echo "$(GREEN)✓ Qdrant started$(NC)"; \
	else \
		echo "$(BLUE)  Creating new Qdrant container...$(NC)"; \
		docker run -d --name qdrant -p 6333:6333 -p 6334:6334 \
			-v $$(pwd)/qdrant_storage:/qdrant/storage:z \
			qdrant/qdrant:latest > /dev/null 2>&1; \
		sleep 5; \
		echo "$(GREEN)✓ Qdrant created and started$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)4/5 Verifying services...$(NC)"
	@if curl -s http://localhost:6333/collections > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Qdrant is accessible$(NC)"; \
	else \
		echo "$(RED)✗ Qdrant is not accessible$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)5/5 Starting Backend Server...$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	@echo ""
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)✓ All Services Started Successfully!$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BLUE)🌐 API Server:$(NC)      http://localhost:8001"
	@echo "$(BLUE)📚 API Docs:$(NC)        http://localhost:8001/docs"
	@echo "$(BLUE)📖 ReDoc:$(NC)           http://localhost:8001/redoc"
	@echo "$(BLUE)❤️  Health Check:$(NC)   http://localhost:8001/health"
	@echo "$(BLUE)🤖 RAG Health:$(NC)      http://localhost:8001/api/v1/rag/health"
	@echo ""
	@echo "$(BLUE)🔧 Services:$(NC)"
	@echo "   • Ollama:  http://localhost:11434"
	@echo "   • Qdrant:  http://localhost:6333"
	@echo ""
	@if command -v nvidia-smi > /dev/null 2>&1; then \
		GPU_USAGE=$$(nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null | head -1); \
		if [ -n "$$GPU_USAGE" ]; then \
			GPU_UTIL=$$(echo $$GPU_USAGE | cut -d',' -f1); \
			MEM_USED=$$(echo $$GPU_USAGE | cut -d',' -f2); \
			MEM_TOTAL=$$(echo $$GPU_USAGE | cut -d',' -f3); \
			echo "$(BLUE)🎮 GPU Status:$(NC)"; \
			echo "   • Utilization: $$GPU_UTIL%"; \
			echo "   • Memory: $${MEM_USED}MB / $${MEM_TOTAL}MB"; \
			echo ""; \
		fi \
	fi
	@echo "$(YELLOW)💡 Press Ctrl+C to stop the server$(NC)"
	@echo "$(YELLOW)💡 To stop all services: make stop-all$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001 --log-level error 2>&1 | grep -E "ERROR|CRITICAL" || true

dev: install-dev ## Run the backend in development mode with hot reload
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)✓ Amenly Backend Started in Development Mode!$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BLUE)🌐 API Server:$(NC)      http://localhost:8001"
	@echo "$(BLUE)📚 API Docs:$(NC)        http://localhost:8001/docs"
	@echo "$(BLUE)🔄 Hot Reload:$(NC)      Enabled"
	@echo ""
	@echo "$(YELLOW)💡 Press Ctrl+C to stop the server$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null || true
	@sleep 1
	@poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 --log-level error

stop: ## Stop the running backend server
	@echo "$(BLUE)Stopping backend server on port 8001...$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "$(GREEN)✓ Server stopped$(NC)" || echo "$(YELLOW)No server running on port 8001$(NC)"

stop-all: ## Stop all services (Backend + Qdrant)
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)🛑 Stopping All Amenly Services...$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)1/2 Stopping Backend Server...$(NC)"
	@-lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "$(GREEN)✓ Backend stopped$(NC)" || echo "$(YELLOW)  No backend running$(NC)"
	@echo ""
	@echo "$(YELLOW)2/2 Stopping Qdrant...$(NC)"
	@if docker ps | grep -q qdrant; then \
		docker stop $$(docker ps | grep qdrant | awk '{print $$1}') > /dev/null 2>&1; \
		echo "$(GREEN)✓ Qdrant stopped$(NC)"; \
	else \
		echo "$(YELLOW)  Qdrant is not running$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)✓ All Services Stopped$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)💡 Note: Ollama is still running (managed separately)$(NC)"
	@echo "$(YELLOW)   To stop Ollama: pkill ollama$(NC)"

status: ## Check status of all services
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)📊 Amenly Services Status$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Backend Server (Port 8001)$(NC)"
	@if lsof -ti:8001 > /dev/null 2>&1; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
		curl -s http://localhost:8001/health > /dev/null 2>&1 && echo "   $(GREEN)✓ Healthy$(NC)" || echo "   $(RED)✗ Not responding$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)2. Ollama (Port 11434)$(NC)"
	@if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
		echo "   $(GREEN)✓ Models: $$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | wc -l)$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)3. Qdrant (Port 6333)$(NC)"
	@if docker ps | grep -q qdrant; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
		if curl -s http://localhost:6333/collections > /dev/null 2>&1; then \
			echo "   $(GREEN)✓ Accessible$(NC)"; \
			echo "   $(GREEN)✓ Collections: $$(curl -s http://localhost:6333/collections | grep -o '"name":"[^"]*"' | wc -l)$(NC)"; \
		else \
			echo "   $(RED)✗ Not accessible$(NC)"; \
		fi \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

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
