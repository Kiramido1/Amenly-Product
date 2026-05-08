.PHONY: build up down restart logs ps shell db-shell test clean

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
	docker compose exec backend pytest

clean:
	docker compose down -v
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
