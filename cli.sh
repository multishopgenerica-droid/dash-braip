#!/bin/bash
# PROJECT CLI - Multi-Agent System v7.0 - Enterprise Complete Edition
# Uso: ./cli.sh <comando> [opções]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

[ -f ".env" ] && source .env

show_banner() {
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║   🚀 PROJECT CLI - Multi-Agent System v7.0                    ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_help() {
    show_banner
    echo -e "${CYAN}Comandos disponíveis:${NC}"
    echo ""
    echo -e "  ${GREEN}Desenvolvimento:${NC}"
    echo "    dev             Inicia servidor de desenvolvimento"
    echo "    build           Build do projeto"
    echo "    test            Roda testes"
    echo "    lint            Roda linter"
    echo "    format          Formata código"
    echo ""
    echo -e "  ${GREEN}Database:${NC}"
    echo "    db:migrate      Roda migrations (com backup)"
    echo "    db:rollback     Rollback de migration"
    echo "    db:seed         Roda seeds"
    echo "    db:backup       Cria backup do banco"
    echo ""
    echo -e "  ${GREEN}Docker:${NC}"
    echo "    up              Sobe containers"
    echo "    down            Para containers"
    echo "    logs [service]  Mostra logs"
    echo "    shell [service] Acessa shell do container"
    echo ""
    echo -e "  ${GREEN}Deploy:${NC}"
    echo "    deploy:staging    Deploy para staging"
    echo "    deploy:production Deploy para production"
    echo "    deploy:canary     Deploy canary (gradual)"
    echo "    rollback          Rollback de emergência"
    echo ""
    echo -e "  ${GREEN}Monitoring:${NC}"
    echo "    mon:up          Sobe monitoramento"
    echo "    obs:up          Sobe observabilidade"
    echo ""
    echo -e "  ${GREEN}Generators:${NC}"
    echo "    gen:test        Gera esqueleto de teste"
    echo "    gen:component   Gera componente React"
    echo "    gen:api         Gera endpoint de API"
    echo ""
    echo -e "  ${GREEN}Testing:${NC}"
    echo "    load-test       Roda testes de carga"
    echo "    chaos           Roda teste de chaos"
    echo ""
    echo -e "  ${GREEN}Utilities:${NC}"
    echo "    clean           Limpa arquivos temporários"
    echo "    audit           Audit de segurança"
    echo "    info            Mostra informações do projeto"
    echo ""
}

case "${1:-}" in
    dev|start)          make dev ;;
    build)              make build ;;
    test)               make test ;;
    lint)               make lint ;;
    format|fmt)         make format ;;
    
    db:migrate|migrate) ./scripts/db/safe-migrate.sh ;;
    db:rollback)        ./scripts/db/rollback-migration.sh ;;
    db:seed|seed)       make seed ;;
    db:backup)          ./scripts/backup-automated.sh daily ;;
    
    up)                 docker compose up -d && docker compose ps ;;
    down)               docker compose down ;;
    logs)               docker compose logs -f ${2:-} ;;
    shell)              docker compose exec ${2:-app} /bin/bash || docker compose exec ${2:-app} /bin/sh ;;
    
    deploy:staging)     ./scripts/DEPLOY_SAFE.sh staging ;;
    deploy:production)  echo -e "${RED}⚠️  Deploy para PRODUCTION!${NC}"; read -p "Confirma? (y/N) " c && [ "$c" = "y" ] && ./scripts/DEPLOY_SAFE.sh production ;;
    deploy:canary)      ./scripts/canary-deploy.sh ;;
    rollback)           ./scripts/runbooks/emergency-rollback.sh ;;
    
    mon:up)             make monitoring-up ;;
    obs:up)             make observability-up ;;
    
    gen:test)           ./scripts/generators/generate-test.sh "${@:2}" ;;
    gen:component)      ./scripts/generators/generate-component.sh "${@:2}" ;;
    gen:api)            ./scripts/generators/generate-api.sh "${@:2}" ;;
    
    load-test)          ./scripts/load-testing/run-load-test.sh ;;
    chaos)              ./scripts/chaos/chaos-test.sh ;;
    
    clean)              make clean ;;
    audit)              make audit ;;
    info)               show_banner && echo "Branch: $(git branch --show-current 2>/dev/null)" && echo "Commit: $(git rev-parse --short HEAD 2>/dev/null)" ;;
    
    help|--help|-h|"")  show_help ;;
    *)                  echo -e "${RED}Comando desconhecido: $1${NC}"; echo "Use: ./cli.sh help"; exit 1 ;;
esac
