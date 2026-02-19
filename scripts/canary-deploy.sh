#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CANARY-DEPLOY.sh - Deploy gradual com verificação de métricas
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

NEW_VERSION="${1:-latest}"
SERVICE_NAME="${SERVICE_NAME:-app}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}"
LATENCY_THRESHOLD="${LATENCY_THRESHOLD:-1000}"

# Fases: percentual:duração_segundos
declare -a PHASES=("5:300" "25:600" "50:600" "100:0")

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   🐦 CANARY DEPLOYMENT                                        ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Versão: $NEW_VERSION"
echo "Error threshold: ${ERROR_THRESHOLD}%"
echo "Latency threshold: ${LATENCY_THRESHOLD}ms"

check_metrics() {
    local duration=$1
    echo "  ⏳ Verificando métricas por ${duration}s..."
    sleep "$duration"
    
    ERROR_RATE=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
        --data-urlencode "query=rate(http_requests_total{service=\"${SERVICE_NAME}\",status=~\"5..\"}[5m]) / rate(http_requests_total{service=\"${SERVICE_NAME}\"}[5m]) * 100" \
        | jq -r '.data.result[0].value[1] // 0' 2>/dev/null || echo "0")
    
    LATENCY=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
        --data-urlencode "query=histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service=\"${SERVICE_NAME}\"}[5m])) * 1000" \
        | jq -r '.data.result[0].value[1] // 0' 2>/dev/null || echo "0")
    
    echo "  📊 Error rate: ${ERROR_RATE}% | Latency P99: ${LATENCY}ms"
    
    if (( $(echo "$ERROR_RATE > $ERROR_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
        return 1
    fi
    if (( $(echo "$LATENCY > $LATENCY_THRESHOLD" | bc -l 2>/dev/null || echo 0) )); then
        return 1
    fi
    echo -e "  ${GREEN}✅ Métricas OK${NC}"
    return 0
}

scale_canary() {
    local percentage=$1
    echo "  🔄 Escalando para ${percentage}%..."
    
    if docker service ls 2>/dev/null | grep -q "$SERVICE_NAME"; then
        TOTAL=10
        CANARY=$((TOTAL * percentage / 100))
        STABLE=$((TOTAL - CANARY))
        docker service scale "${SERVICE_NAME}-canary=${CANARY}" "${SERVICE_NAME}=${STABLE}" 2>/dev/null || true
    fi
    
    echo -e "  ${GREEN}✅ Tráfego: ${percentage}%${NC}"
}

rollback() {
    echo -e "${RED}⚠️  ROLLBACK - Problemas detectados!${NC}"
    scale_canary 0
    docker service update --image "${SERVICE_NAME}:previous" "${SERVICE_NAME}" 2>/dev/null || true
    [ -f "./scripts/notify-discord.sh" ] && ./scripts/notify-discord.sh alert critical "Canary Rollback" "Deploy de $NEW_VERSION falhou"
    exit 1
}

# Deploy inicial
echo "📦 Deploy inicial..."
if docker service ls 2>/dev/null | grep -q "${SERVICE_NAME}-canary"; then
    docker service update --image "$NEW_VERSION" "${SERVICE_NAME}-canary" 2>/dev/null || true
fi

# Fases
PHASE_NUM=1
for phase in "${PHASES[@]}"; do
    IFS=':' read -r percentage duration <<< "$phase"
    echo ""
    echo -e "${CYAN}📊 FASE $PHASE_NUM: ${percentage}%${NC}"
    scale_canary "$percentage"
    
    if [ "$duration" -gt 0 ]; then
        if ! check_metrics "$duration"; then
            rollback
        fi
    fi
    PHASE_NUM=$((PHASE_NUM + 1))
done

echo ""
echo -e "${GREEN}✅ CANARY DEPLOY CONCLUÍDO - $NEW_VERSION em 100%${NC}"
docker service update --image "$NEW_VERSION" "$SERVICE_NAME" 2>/dev/null || true
docker service scale "${SERVICE_NAME}-canary=0" 2>/dev/null || true
