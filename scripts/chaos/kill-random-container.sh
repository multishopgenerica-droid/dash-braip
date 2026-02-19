#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# KILL-RANDOM-CONTAINER.sh - Mata container aleatório para testar resiliência
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════
#
# ⚠️  USAR APENAS EM AMBIENTES DE TESTE/STAGING
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Proteção
ENVIRONMENT="${ENVIRONMENT:-development}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⛔ BLOQUEADO: Chaos engineering não permitido em produção!${NC}"
    exit 1
fi

# Containers para excluir do chaos
EXCLUDE_CONTAINERS="${EXCLUDE_CONTAINERS:-db,redis,postgres,mysql,prometheus,grafana}"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🌪️ CHAOS ENGINEERING - KILL RANDOM CONTAINER                ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  Ambiente: $ENVIRONMENT${NC}"
echo ""

# Listar containers elegíveis
CONTAINERS=$(docker ps --format '{{.Names}}' | grep -Ev "$(echo $EXCLUDE_CONTAINERS | tr ',' '|')" || true)

if [ -z "$CONTAINERS" ]; then
    echo "Nenhum container elegível encontrado."
    exit 0
fi

echo "Containers elegíveis:"
echo "$CONTAINERS" | while read c; do echo "  - $c"; done
echo ""

# Selecionar aleatório
RANDOM_CONTAINER=$(echo "$CONTAINERS" | shuf -n 1)

echo -e "${RED}🎯 Container selecionado: $RANDOM_CONTAINER${NC}"
echo ""

read -p "Confirma matar container? (y/N) " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelado."
    exit 0
fi

# Matar
echo "💀 Matando container..."
docker kill "$RANDOM_CONTAINER"

echo ""
echo -e "${GREEN}✅ Container $RANDOM_CONTAINER morto${NC}"
echo ""
echo "Verifique:"
echo "  1. Se o orquestrador recriou o container"
echo "  2. Se os health checks detectaram a falha"
echo "  3. Se os alertas foram disparados"
echo "  4. Se o tráfego foi redirecionado"
