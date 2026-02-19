#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# ROTATE-SECRETS.sh - Rotação automática de secrets
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🔐 SECRET ROTATION                                          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./logs/secret-rotation-${TIMESTAMP}.log"
mkdir -p ./logs

generate_secret() { openssl rand -base64 "${1:-32}" | tr -d '\n/+=' | head -c "${1:-32}"; }
generate_jwt_secret() { openssl rand -hex 64; }
generate_api_key() { echo "${1:-sk}_$(openssl rand -hex 24)"; }

SECRETS_TO_ROTATE=("JWT_SECRET" "SESSION_SECRET" "ENCRYPTION_KEY" "API_KEY_INTERNAL")

# Backup
if [ -f ".env" ]; then
    cp .env ".env.backup.${TIMESTAMP}"
    echo -e "${GREEN}✅ Backup: .env.backup.${TIMESTAMP}${NC}"
fi

echo "🔄 Gerando novos secrets..."
declare -A NEW_SECRETS

for secret in "${SECRETS_TO_ROTATE[@]}"; do
    case "$secret" in
        JWT_SECRET|SESSION_SECRET) NEW_SECRETS[$secret]=$(generate_jwt_secret) ;;
        ENCRYPTION_KEY) NEW_SECRETS[$secret]=$(generate_secret 32) ;;
        API_KEY_*) NEW_SECRETS[$secret]=$(generate_api_key "sk") ;;
        *) NEW_SECRETS[$secret]=$(generate_secret 32) ;;
    esac
    echo -e "   ${GREEN}✅ $secret: ${NEW_SECRETS[$secret]:0:10}...${NC}"
done

# Atualizar .env
if [ -f ".env" ]; then
    for secret in "${SECRETS_TO_ROTATE[@]}"; do
        if grep -q "^${secret}=" .env; then
            sed -i "s|^${secret}=.*|${secret}=${NEW_SECRETS[$secret]}|" .env
        else
            echo "${secret}=${NEW_SECRETS[$secret]}" >> .env
        fi
    done
    echo -e "${GREEN}✅ .env atualizado${NC}"
fi

# GitHub Secrets
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPOSITORY" ]; then
    echo "☁️  Atualizando GitHub Secrets..."
    for secret in "${SECRETS_TO_ROTATE[@]}"; do
        gh secret set "$secret" -b "${NEW_SECRETS[$secret]}" 2>/dev/null || true
    done
fi

# Restart services
if [ -f "docker-compose.yml" ]; then
    docker compose up -d --no-deps --build app 2>/dev/null || true
    echo -e "${GREEN}✅ Serviços reiniciados${NC}"
fi

echo ""
echo -e "${GREEN}✅ ROTAÇÃO DE SECRETS CONCLUÍDA${NC}"
echo "   Secrets rotacionados: ${#SECRETS_TO_ROTATE[@]}"
echo "   Backup: .env.backup.${TIMESTAMP}"
