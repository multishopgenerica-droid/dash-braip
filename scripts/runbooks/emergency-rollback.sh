#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RUNBOOK: emergency-rollback.sh - Rollback de emergência em 1 comando
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════
#
# USO: ./emergency-rollback.sh [versão_anterior]
#
# Este script executa:
# 1. Para o deploy atual
# 2. Restaura a versão anterior
# 3. Verifica health
# 4. Notifica o time
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

PREVIOUS_VERSION="${1:-}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║   🚨 EMERGENCY ROLLBACK                                                       ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

START_TIME=$(date +%s)

# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICAR INÍCIO
# ═══════════════════════════════════════════════════════════════════════════════

if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
    ./scripts/notify-discord.sh alert critical "Emergency Rollback" "🚨 Rollback de emergência iniciado por $(whoami)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# DETECTAR VERSÃO ANTERIOR
# ═══════════════════════════════════════════════════════════════════════════════

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "🔍 Detectando versão anterior..."
    
    # Tentar detectar de diferentes fontes
    if [ -f ".version.backup" ]; then
        PREVIOUS_VERSION=$(cat .version.backup)
    elif [ -f "CHANGELOG.md" ]; then
        PREVIOUS_VERSION=$(grep -oP '## \[\K[^\]]+' CHANGELOG.md | sed -n '2p')
    elif command -v git &> /dev/null; then
        PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "")
    fi
    
    if [ -z "$PREVIOUS_VERSION" ]; then
        echo -e "${RED}❌ Não foi possível detectar versão anterior!${NC}"
        echo "   Use: $0 <versão_anterior>"
        exit 1
    fi
fi

echo "📦 Versão para rollback: $PREVIOUS_VERSION"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# EXECUTAR ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔄 Executando rollback..."

# Detectar método de deploy e executar rollback
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    # Docker Compose
    echo "   Método: Docker Compose"
    
    # Se tiver imagem com tag
    if [ -n "$DOCKER_REGISTRY" ]; then
        export IMAGE_TAG="$PREVIOUS_VERSION"
        docker compose pull
        docker compose up -d
    else
        # Git checkout e rebuild
        git checkout "$PREVIOUS_VERSION" -- .
        docker compose build
        docker compose up -d
    fi
    
elif command -v docker &> /dev/null && docker service ls 2>/dev/null | grep -q "app"; then
    # Docker Swarm
    echo "   Método: Docker Swarm"
    
    SERVICE_NAME=$(docker service ls --format "{{.Name}}" | head -1)
    PREVIOUS_IMAGE="${DOCKER_REGISTRY:-}:${PREVIOUS_VERSION}"
    
    docker service update --image "$PREVIOUS_IMAGE" "$SERVICE_NAME"
    
elif command -v kubectl &> /dev/null; then
    # Kubernetes
    echo "   Método: Kubernetes"
    kubectl rollout undo deployment/app
    
elif command -v pm2 &> /dev/null; then
    # PM2 com Git
    echo "   Método: PM2"
    git checkout "$PREVIOUS_VERSION"
    npm install
    npm run build 2>/dev/null || true
    pm2 reload all
    
else
    echo -e "${RED}❌ Método de deploy não detectado!${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICAR HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "⏳ Verificando health..."

sleep 10  # Aguardar containers iniciarem

HEALTHY=false
for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        HEALTHY=true
        break
    fi
    
    sleep 2
done

# ═══════════════════════════════════════════════════════════════════════════════
# RESULTADO
# ═══════════════════════════════════════════════════════════════════════════════

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ROLLBACK CONCLUÍDO COM SUCESSO!                                          ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║   Versão:   $PREVIOUS_VERSION${NC}"
    echo -e "${GREEN}║   Duração:  ${DURATION}s${NC}"
    echo -e "${GREEN}║   Status:   HEALTHY${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
        ./scripts/notify-discord.sh rollback "production" "current" "$PREVIOUS_VERSION"
    fi
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  ROLLBACK EXECUTADO MAS SISTEMA NÃO ESTÁ HEALTHY!                        ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    echo ""
    echo "Próximos passos:"
    echo "1. Verificar logs: docker logs <container>"
    echo "2. Verificar recursos: docker stats"
    echo "3. Considerar restaurar backup do banco"
    
    if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
        ./scripts/notify-discord.sh alert critical "Rollback Issue" "Rollback para $PREVIOUS_VERSION executado mas sistema não está healthy"
    fi
    
    exit 1
fi
