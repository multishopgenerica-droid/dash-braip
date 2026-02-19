#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# NETWORK-LATENCY.sh - Injeta latência de rede para testar timeouts
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CONTAINER="${1:-app}"
LATENCY_MS="${2:-500}"
DURATION="${3:-60}"

ENVIRONMENT="${ENVIRONMENT:-development}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⛔ BLOQUEADO: Chaos engineering não permitido em produção!${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🌪️ CHAOS ENGINEERING - NETWORK LATENCY                      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Container: $CONTAINER"
echo "Latência: ${LATENCY_MS}ms"
echo "Duração: ${DURATION}s"
echo ""

read -p "Confirma injetar latência? (y/N) " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelado."
    exit 0
fi

# Injetar latência usando tc (traffic control)
echo "📡 Injetando ${LATENCY_MS}ms de latência..."
docker exec "$CONTAINER" tc qdisc add dev eth0 root netem delay ${LATENCY_MS}ms 2>/dev/null || \
    docker exec "$CONTAINER" apt-get update && docker exec "$CONTAINER" apt-get install -y iproute2 && \
    docker exec "$CONTAINER" tc qdisc add dev eth0 root netem delay ${LATENCY_MS}ms

echo -e "${YELLOW}⏳ Aguardando ${DURATION}s...${NC}"
sleep "$DURATION"

# Remover latência
echo "🔄 Removendo latência..."
docker exec "$CONTAINER" tc qdisc del dev eth0 root 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Teste de latência concluído${NC}"
