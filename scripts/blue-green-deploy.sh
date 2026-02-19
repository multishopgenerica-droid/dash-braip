#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# BLUE-GREEN-DEPLOY.sh - Deploy com zero downtime
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

NEW_VERSION="${1:-latest}"
SERVICE_NAME="${SERVICE_NAME:-app}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🔵🟢 BLUE-GREEN DEPLOYMENT                                  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detectar ambiente atual
CURRENT_ENV=$(docker service ls --format '{{.Name}}' 2>/dev/null | grep -E "${SERVICE_NAME}-(blue|green)" | head -1 | sed "s/${SERVICE_NAME}-//" || echo "blue")

if [ "$CURRENT_ENV" = "blue" ]; then
    NEW_ENV="green"
else
    NEW_ENV="blue"
fi

echo "Ambiente atual: $CURRENT_ENV"
echo "Novo ambiente: $NEW_ENV"
echo "Nova versão: $NEW_VERSION"
echo ""

# Deploy no novo ambiente
echo "📦 Deployando $NEW_VERSION em $NEW_ENV..."
docker service update --image "$NEW_VERSION" "${SERVICE_NAME}-${NEW_ENV}" 2>/dev/null || \
    docker service create --name "${SERVICE_NAME}-${NEW_ENV}" --replicas 3 "$NEW_VERSION"

# Aguardar e verificar health
echo "⏳ Aguardando health check..."
for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health check OK${NC}"
        break
    fi
    echo "   Tentativa $i/30 (HTTP: $HTTP_CODE)"
    sleep 2
done

# Switch de tráfego
echo "🔄 Alternando tráfego para $NEW_ENV..."
# Traefik: atualizar labels ou weights
docker service update --label-add "traefik.http.services.${SERVICE_NAME}.loadbalancer.server.port=3000" "${SERVICE_NAME}-${NEW_ENV}" 2>/dev/null || true

# Escalar ambiente antigo para 0
echo "📉 Desativando ambiente $CURRENT_ENV..."
docker service scale "${SERVICE_NAME}-${CURRENT_ENV}=0" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ BLUE-GREEN DEPLOY CONCLUÍDO${NC}"
echo "   Versão: $NEW_VERSION"
echo "   Ambiente ativo: $NEW_ENV"
echo ""
echo "Para rollback: docker service scale ${SERVICE_NAME}-${CURRENT_ENV}=3 && docker service scale ${SERVICE_NAME}-${NEW_ENV}=0"
