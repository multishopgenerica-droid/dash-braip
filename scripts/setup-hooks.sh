#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SETUP-HOOKS.sh - Instala os hooks de Git automaticamente
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🔧 SETUP-HOOKS - Instalando Git Hooks                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está em um repositório git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Não é um repositório Git!${NC}"
    echo "   Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se .husky existe
if [ ! -d ".husky" ]; then
    echo -e "${RED}❌ Diretório .husky não encontrado!${NC}"
    echo "   Execute o setup-project primeiro."
    exit 1
fi

# Método 1: Tentar usar Husky (Node.js)
if [ -f "package.json" ]; then
    echo "📦 Detectado projeto Node.js"
    
    # Verificar se husky está instalado
    if ! grep -q "\"husky\"" package.json; then
        echo "   Instalando Husky..."
        npm install --save-dev husky 2>/dev/null || yarn add -D husky 2>/dev/null || pnpm add -D husky 2>/dev/null
    fi
    
    # Inicializar husky
    if command -v npx &> /dev/null; then
        echo "   Inicializando Husky..."
        npx husky install 2>/dev/null || true
        
        # Adicionar script de prepare
        if ! grep -q "\"prepare\":" package.json; then
            npm pkg set scripts.prepare="husky install" 2>/dev/null || true
        fi
    fi
    
    echo -e "${GREEN}✅ Husky configurado${NC}"
else
    # Método 2: Configurar hooks manualmente (sem Node.js)
    echo "📦 Projeto não-Node.js detectado"
    echo "   Configurando hooks manualmente..."
    
    # Configurar git para usar .husky como diretório de hooks
    git config core.hooksPath .husky
    
    echo -e "${GREEN}✅ Git configurado para usar .husky como diretório de hooks${NC}"
fi

# Verificar se hooks estão executáveis
echo ""
echo "🔍 Verificando permissões dos hooks..."

for hook in .husky/pre-commit .husky/commit-msg .husky/pre-push; do
    if [ -f "$hook" ]; then
        chmod +x "$hook"
        echo -e "   ${GREEN}✅ $hook${NC}"
    fi
done

if [ -f ".husky/_/husky.sh" ]; then
    chmod +x .husky/_/husky.sh
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ HOOKS INSTALADOS COM SUCESSO!                                            ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                                               ║${NC}"
echo -e "${GREEN}║   Hooks ativos:                                                               ║${NC}"
echo -e "${GREEN}║   • pre-commit  → Valida código antes do commit                              ║${NC}"
echo -e "${GREEN}║   • commit-msg  → Valida formato da mensagem                                 ║${NC}"
echo -e "${GREEN}║   • pre-push    → Roda testes antes do push                                  ║${NC}"
echo -e "${GREEN}║                                                                               ║${NC}"
echo -e "${GREEN}║   Para desativar temporariamente:                                            ║${NC}"
echo -e "${GREEN}║   • HUSKY=0 git commit ...                                                   ║${NC}"
echo -e "${GREEN}║   • git commit --no-verify                                                   ║${NC}"
echo -e "${GREEN}║                                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
