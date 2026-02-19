# MAKEFILE - Multi-Agent System v7.0 - Enterprise Complete Edition
# Uso: make <comando>  |  Lista: make help

.PHONY: help setup dev build test lint format clean deploy docker db migrate logs

CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Mostra este help
	@echo ""
	@echo "$(CYAN)════════════════════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)  Comandos disponíveis - Multi-Agent System v7.0                $(NC)"
	@echo "$(CYAN)════════════════════════════════════════════════════════════════$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP & INSTALL
# ═══════════════════════════════════════════════════════════════════════════════

setup: ## Setup inicial do projeto
	@echo "$(CYAN)🔧 Configurando projeto...$(NC)"
	@if [ -f "package.json" ]; then npm install; fi
	@if [ -f "requirements.txt" ]; then pip install -r requirements.txt; fi
	@if [ -f "go.mod" ]; then go mod download; fi
	@cp -n .env.example .env 2>/dev/null || true
	@echo "$(GREEN)✅ Setup concluído!$(NC)"

install: setup ## Alias para setup

# ═══════════════════════════════════════════════════════════════════════════════
# DESENVOLVIMENTO
# ═══════════════════════════════════════════════════════════════════════════════

dev: ## Inicia servidor de desenvolvimento
	@if [ -f "package.json" ]; then npm run dev; \
	elif [ -f "manage.py" ]; then python manage.py runserver; \
	elif [ -f "main.go" ]; then go run .; \
	elif [ -f "artisan" ]; then php artisan serve; \
	else echo "Não detectado como iniciar"; fi

start: dev ## Alias para dev

build: ## Build do projeto
	@echo "$(CYAN)🔨 Building...$(NC)"
	@if [ -f "package.json" ]; then npm run build; \
	elif [ -f "main.go" ]; then go build -o bin/app .; \
	fi
	@echo "$(GREEN)✅ Build concluído!$(NC)"

# ═══════════════════════════════════════════════════════════════════════════════
# TESTES
# ═══════════════════════════════════════════════════════════════════════════════

test: ## Roda todos os testes
	@if [ -f "package.json" ]; then npm test; \
	elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then pytest; \
	elif [ -f "go.mod" ]; then go test ./...; \
	fi

test-watch: ## Roda testes em modo watch
	@if [ -f "package.json" ]; then npm run test:watch; else make test; fi

test-coverage: ## Roda testes com coverage
	@if [ -f "package.json" ]; then npm run test -- --coverage; \
	elif [ -f "pytest.ini" ]; then pytest --cov=. --cov-report=html; \
	elif [ -f "go.mod" ]; then go test -coverprofile=coverage.out ./...; \
	fi

# ═══════════════════════════════════════════════════════════════════════════════
# LINT & FORMAT
# ═══════════════════════════════════════════════════════════════════════════════

lint: ## Roda linter
	@if [ -f "package.json" ]; then npm run lint 2>/dev/null || npx eslint .; \
	elif [ -f "pyproject.toml" ]; then ruff check . || flake8; \
	elif [ -f "go.mod" ]; then golangci-lint run; \
	fi

format: ## Formata código
	@if [ -f "package.json" ]; then npx prettier --write .; \
	elif [ -f "pyproject.toml" ]; then black . && isort .; \
	elif [ -f "go.mod" ]; then gofmt -w .; \
	fi
	@echo "$(GREEN)✅ Formatação concluída!$(NC)"

check: lint test ## Roda lint + test

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

db-up: ## Sobe banco de dados
	@docker compose up -d db redis
	@echo "$(GREEN)✅ Banco de dados rodando$(NC)"

db-down: ## Para banco de dados
	@docker compose stop db redis

migrate: ## Roda migrations com backup
	@./scripts/db/safe-migrate.sh

migrate-rollback: ## Rollback última migration
	@./scripts/db/rollback-migration.sh

seed: ## Roda seeds/fixtures
	@if [ -f "package.json" ] && grep -q "prisma" package.json; then npx prisma db seed; \
	elif [ -f "manage.py" ]; then python manage.py loaddata fixtures/*.json; \
	elif [ -f "artisan" ]; then php artisan db:seed; \
	fi

# ═══════════════════════════════════════════════════════════════════════════════
# DOCKER
# ═══════════════════════════════════════════════════════════════════════════════

docker-build: ## Build da imagem Docker
	@docker compose build

docker-up: ## Sobe todos os containers
	@docker compose up -d
	@docker compose ps

docker-down: ## Para todos os containers
	@docker compose down

docker-logs: ## Mostra logs dos containers
	@docker compose logs -f

docker-ps: ## Lista containers rodando
	@docker compose ps

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY
# ═══════════════════════════════════════════════════════════════════════════════

deploy-staging: ## Deploy para staging
	@./scripts/DEPLOY_SAFE.sh staging

deploy-production: ## Deploy para production (DANGER!)
	@echo "$(YELLOW)⚠️  Deploy para PRODUCTION!$(NC)"
	@read -p "Confirma? (y/N) " confirm && [ "$$confirm" = "y" ]
	@./scripts/DEPLOY_SAFE.sh production

deploy-canary: ## Deploy canary (gradual)
	@./scripts/canary-deploy.sh

rollback: ## Rollback de emergência
	@./scripts/runbooks/emergency-rollback.sh

# ═══════════════════════════════════════════════════════════════════════════════
# MONITORING
# ═══════════════════════════════════════════════════════════════════════════════

monitoring-up: ## Sobe stack de monitoramento
	@cd monitoring && docker compose -f docker-compose.monitoring.yml up -d
	@echo "$(GREEN)✅ Prometheus: http://localhost:9090$(NC)"
	@echo "$(GREEN)✅ Grafana: http://localhost:3001$(NC)"

monitoring-down: ## Para monitoramento
	@cd monitoring && docker compose -f docker-compose.monitoring.yml down

observability-up: ## Sobe stack de observabilidade
	@cd observability && docker compose -f docker-compose.observability.yml up -d
	@echo "$(GREEN)✅ Jaeger: http://localhost:16686$(NC)"
	@echo "$(GREEN)✅ Grafana: http://localhost:3002$(NC)"

# ═══════════════════════════════════════════════════════════════════════════════
# GENERATORS
# ═══════════════════════════════════════════════════════════════════════════════

gen-test: ## Gera esqueleto de teste
	@./scripts/generators/generate-test.sh

gen-component: ## Gera componente React
	@./scripts/generators/generate-component.sh

gen-api: ## Gera endpoint de API
	@./scripts/generators/generate-api.sh

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

clean: ## Limpa arquivos temporários
	@rm -rf node_modules/.cache .next/cache .pytest_cache __pycache__ .coverage coverage dist build
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

update: ## Atualiza dependências
	@if [ -f "package.json" ]; then npm update; fi
	@if [ -f "requirements.txt" ]; then pip install --upgrade -r requirements.txt; fi

audit: ## Audit de segurança
	@if [ -f "package.json" ]; then npm audit; fi
	@if [ -f "requirements.txt" ]; then pip-audit 2>/dev/null || safety check; fi

backup: ## Cria backup
	@./scripts/backup-automated.sh daily

load-test: ## Roda testes de carga
	@./scripts/load-testing/run-load-test.sh

chaos: ## Roda teste de chaos
	@./scripts/chaos/chaos-test.sh
