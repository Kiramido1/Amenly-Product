.PHONY: build up down restart logs ps shell db-shell test clean run run-frontend run-backend stop-all status

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

run: ## Start full app (Backend + Frontend) - both connected
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)🚀 Starting Amenly Full Stack (Backend + Frontend)$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking Frontend dependencies...$(NC)"
	@if [ ! -d "frontend/node_modules" ]; then \
		echo "$(YELLOW)  Installing frontend dependencies...$(NC)"; \
		cd frontend && npm install; \
	fi
	@echo "$(GREEN)✓ Frontend ready$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting Backend...$(NC)"
	@cd backend && .venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001 --daemon
	@echo "$(BLUE)  Waiting for backend to start...$(NC)"
	@sleep 5
	@for i in 1 2 3 4 5 6; do \
		if curl -s http://localhost:8001/health > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Backend is up on http://localhost:8001$(NC)"; \
			break; \
		fi; \
		if [ $$i -eq 6 ]; then \
			echo "$(RED)✗ Backend failed to start$(NC)"; \
			exit 1; \
		fi; \
		echo "$(YELLOW)  Waiting... ($$i/6)$(NC)"; \
		sleep 3; \
	done
	@echo ""
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)✓ Full Stack is Running!$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(BLUE)🌐 Frontend:$(NC)     http://localhost:5173"
	@echo "$(BLUE)🌐 API Server:$(NC)   http://localhost:8001"
	@echo "$(BLUE)📚 API Docs:$(NC)     http://localhost:8001/docs"
	@echo "$(BLUE)📖 ReDoc:$(NC)        http://localhost:8001/redoc"
	@echo ""
	@echo "$(YELLOW)💡 Press Ctrl+C to stop both services$(NC)"
	@echo "$(YELLOW)💡 To stop all services: make stop-all$(NC)"
	@echo ""
	@cd frontend && npm run dev -- --host

run-backend: ## Start Backend only
	@cd backend && $(MAKE) run

run-frontend: ## Start Frontend only
	@echo "$(BLUE)Starting Frontend...$(NC)"
	@if [ ! -d "frontend/node_modules" ]; then \
		echo "$(YELLOW)Installing frontend dependencies...$(NC)"; \
		cd frontend && npm install; \
	fi
	@cd frontend && npm run dev -- --host

stop-all: ## Stop all running services (Backend + Frontend)
	@echo "$(BLUE)🛑 Stopping all services...$(NC)"
	@cd backend && $(MAKE) stop-all > /dev/null 2>&1 || true
	@-pkill -f "vite" 2>/dev/null || true
	@-lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@echo "$(GREEN)✓ All services stopped$(NC)"

status: ## Check status of all services
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)📊 Amenly Full Stack Status$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Backend (Port 8001)$(NC)"
	@if curl -s http://localhost:8001/health > /dev/null 2>&1; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)2. Frontend (Port 5173)$(NC)"
	@if lsof -ti:5173 > /dev/null 2>&1; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)3. Ollama (Port 11434)$(NC)"
	@if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)4. Qdrant (Port 6333)$(NC)"
	@if docker ps | grep -q qdrant; then \
		echo "   $(GREEN)✓ Running$(NC)"; \
	else \
		echo "   $(RED)✗ Not running$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

shell:
	docker compose exec backend bash

db-shell:
	docker compose exec db psql -U postgres -d amenly

test:
	docker compose exec backend bash -c "PYTHONPATH=. pytest tests/"

test-cov:
	docker compose exec backend bash -c "PYTHONPATH=. pytest --cov=app --cov-report=term-missing --cov-report=html:tests/reports/coverage-html"

clean:
	docker compose down -v
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
