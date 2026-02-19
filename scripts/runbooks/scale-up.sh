#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RUNBOOK: scale-up.sh - Escala serviço para mais instâncias
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SERVICE="${1:-app}"
REPLICAS="${2:-3}"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║   📈 RUNBOOK: Scale Up                                                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Service: $SERVICE"
echo "Replicas: $REPLICAS"
echo ""

# Detectar plataforma
if [ -f "docker-compose.yml" ]; then
    echo "📦 Método: Docker Compose"
    docker compose up -d --scale "$SERVICE=$REPLICAS"
    
elif command -v docker &> /dev/null && docker service ls 2>/dev/null | grep -q "$SERVICE"; then
    echo "📦 Método: Docker Swarm"
    docker service scale "${SERVICE}=${REPLICAS}"
    
elif command -v kubectl &> /dev/null; then
    echo "📦 Método: Kubernetes"
    kubectl scale deployment/"$SERVICE" --replicas="$REPLICAS"
    
elif command -v pm2 &> /dev/null; then
    echo "📦 Método: PM2"
    pm2 scale "$SERVICE" "$REPLICAS"
    
else
    echo "❌ Plataforma não suportada"
    exit 1
fi

echo ""
echo "✅ Scale concluído!"

# Verificar status
sleep 5
echo ""
echo "📊 Status atual:"

if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$SERVICE" || true
fi
