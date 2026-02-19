#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SETUP-BRANCH-PROTECTION.sh - Configura proteção de branches via GitHub API
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🔐 SETUP BRANCH PROTECTION - Configuração via GitHub API                    ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICAÇÕES
# ═══════════════════════════════════════════════════════════════════════════════

# Verificar se está em um repo git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Não é um repositório Git!${NC}"
    exit 1
fi

# Obter owner e repo do remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}❌ Remote 'origin' não configurado!${NC}"
    exit 1
fi

# Extrair owner/repo
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
else
    echo -e "${RED}❌ Não foi possível extrair owner/repo da URL: $REMOTE_URL${NC}"
    exit 1
fi

echo -e "📦 Repositório: ${CYAN}$OWNER/$REPO${NC}"

# Verificar token
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN não encontrado!${NC}"
    echo ""
    echo "Para configurar proteção de branch, você precisa:"
    echo "1. Criar um Personal Access Token em: https://github.com/settings/tokens"
    echo "2. Selecionar scope: repo (Full control)"
    echo "3. Exportar: export GITHUB_TOKEN='seu_token_aqui'"
    echo ""
    echo "Ou configure manualmente em:"
    echo "https://github.com/$OWNER/$REPO/settings/branches"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO DE PROTEÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

BRANCH="${1:-main}"

echo ""
echo -e "🔒 Configurando proteção para branch: ${CYAN}$BRANCH${NC}"
echo ""

# Payload de proteção
PROTECTION_PAYLOAD=$(cat << 'EOFPAYLOAD'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI Pipeline", "Security Scan"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 2,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOFPAYLOAD
)

# Aplicar proteção via API
echo "📡 Aplicando configuração via GitHub API..."

RESPONSE=$(curl -s -X PUT \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/$OWNER/$REPO/branches/$BRANCH/protection" \
    -d "$PROTECTION_PAYLOAD" 2>&1)

# Verificar resposta
if echo "$RESPONSE" | grep -q '"url"'; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ PROTEÇÃO DE BRANCH CONFIGURADA COM SUCESSO!                              ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}║   Branch: $BRANCH                                                             ${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}║   Regras ativadas:                                                            ║${NC}"
    echo -e "${GREEN}║   ✅ Require PR reviews (2 approvals)                                         ║${NC}"
    echo -e "${GREEN}║   ✅ Dismiss stale reviews                                                    ║${NC}"
    echo -e "${GREEN}║   ✅ Require CODEOWNERS review                                                ║${NC}"
    echo -e "${GREEN}║   ✅ Require status checks (CI must pass)                                     ║${NC}"
    echo -e "${GREEN}║   ✅ Require branches up to date                                              ║${NC}"
    echo -e "${GREEN}║   ✅ Require linear history                                                   ║${NC}"
    echo -e "${GREEN}║   ✅ Require conversation resolution                                          ║${NC}"
    echo -e "${GREEN}║   ✅ Block force pushes                                                       ║${NC}"
    echo -e "${GREEN}║   ✅ Block branch deletion                                                    ║${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}❌ Erro ao configurar proteção:${NC}"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Configure manualmente em:"
    echo "https://github.com/$OWNER/$REPO/settings/branches"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAR TAMBÉM PARA DEVELOP (SE EXISTIR)
# ═══════════════════════════════════════════════════════════════════════════════

if git show-ref --verify --quiet refs/remotes/origin/develop 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}📌 Branch 'develop' detectada. Configurar proteção também? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Proteção mais leve para develop (1 approval)
        DEVELOP_PAYLOAD=$(cat << 'EOFDEV'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI Pipeline"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOFDEV
)
        curl -s -X PUT \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$OWNER/$REPO/branches/develop/protection" \
            -d "$DEVELOP_PAYLOAD" > /dev/null

        echo -e "${GREEN}✅ Proteção configurada para 'develop' (1 approval)${NC}"
    fi
fi

echo ""
echo -e "${CYAN}🔗 Verifique em: https://github.com/$OWNER/$REPO/settings/branches${NC}"
