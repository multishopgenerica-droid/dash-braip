#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🔍 AUTOMATED_REVIEW.sh - Sistema Dash Braip
# ═══════════════════════════════════════════════════════════════════════════════
# Executa TODAS as validações automaticamente
# USO: ./AUTOMATED_REVIEW.sh [--fix]
# 
# Opções:
#   --fix    Tenta corrigir problemas automaticamente (lint, prettier)
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contadores
ERRORS=0
WARNINGS=0
PASSED=0

# Opção --fix
FIX_MODE=false
if [ "$1" == "--fix" ]; then
    FIX_MODE=true
    echo -e "${CYAN}🔧 Modo FIX ativado - tentando corrigir automaticamente${NC}"
    echo ""
fi

# Detectar diretórios
BACKEND_DIR=""
FRONTEND_DIR=""

if [ -d "backend" ]; then
    BACKEND_DIR="backend"
elif [ -f "package.json" ] && grep -q "express\|nestjs\|fastify" package.json 2>/dev/null; then
    BACKEND_DIR="."
fi

if [ -d "frontend" ]; then
    FRONTEND_DIR="frontend"
elif [ -f "package.json" ] && grep -q "react\|vue\|angular" package.json 2>/dev/null; then
    FRONTEND_DIR="."
fi

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   🔍 AUTOMATED REVIEW - ENTERPRISE v5.0                                       ║${NC}"
echo -e "${PURPLE}║   Sistema Dash Braip                                                               ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📁 Backend: ${BACKEND_DIR:-Não detectado}${NC}"
echo -e "${CYAN}🎨 Frontend: ${FRONTEND_DIR:-Não detectado}${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# NÍVEL 1: SINTAXE
# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔵 NÍVEL 1: VALIDAÇÃO DE SINTAXE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 1.1 ESLint
echo -e "${YELLOW}[1.1] ESLint...${NC}"
ESLINT_FAILED=false

run_eslint() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/package.json" ]; then
        cd "$dir"
        if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc" ] || grep -q "eslintConfig" package.json 2>/dev/null; then
            if $FIX_MODE; then
                if npx eslint . --fix --ext .ts,.tsx,.js,.jsx 2>/dev/null; then
                    echo -e "${GREEN}   ✅ $name ESLint passou (com correções)${NC}"
                    ((PASSED++))
                else
                    echo -e "${RED}   ❌ $name ESLint falhou (mesmo após --fix)${NC}"
                    ESLINT_FAILED=true
                    ((ERRORS++))
                fi
            else
                if npx eslint . --ext .ts,.tsx,.js,.jsx 2>/dev/null; then
                    echo -e "${GREEN}   ✅ $name ESLint passou${NC}"
                    ((PASSED++))
                else
                    echo -e "${RED}   ❌ $name ESLint falhou${NC}"
                    ESLINT_FAILED=true
                    ((ERRORS++))
                fi
            fi
        else
            echo -e "${YELLOW}   ⚠️ $name ESLint não configurado${NC}"
            ((WARNINGS++))
        fi
        cd - > /dev/null
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_eslint "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_eslint "$FRONTEND_DIR" "Frontend"
fi

# 1.2 TypeScript
echo ""
echo -e "${YELLOW}[1.2] TypeScript...${NC}"

run_typescript() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/tsconfig.json" ]; then
        cd "$dir"
        if npx tsc --noEmit 2>/dev/null; then
            echo -e "${GREEN}   ✅ $name TypeScript compilou sem erros${NC}"
            ((PASSED++))
        else
            echo -e "${RED}   ❌ $name TypeScript tem erros de compilação${NC}"
            ((ERRORS++))
        fi
        cd - > /dev/null
    else
        if [ -n "$dir" ]; then
            echo -e "${YELLOW}   ⚠️ $name TypeScript não configurado${NC}"
        fi
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_typescript "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_typescript "$FRONTEND_DIR" "Frontend"
fi

# 1.3 Prettier (não bloqueante)
echo ""
echo -e "${YELLOW}[1.3] Prettier...${NC}"

run_prettier() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/package.json" ]; then
        cd "$dir"
        if [ -f ".prettierrc" ] || [ -f ".prettierrc.js" ] || [ -f ".prettierrc.json" ]; then
            if $FIX_MODE; then
                npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}" 2>/dev/null || true
                echo -e "${GREEN}   ✅ $name Prettier aplicado${NC}"
            else
                if npx prettier --check "**/*.{ts,tsx,js,jsx}" 2>/dev/null; then
                    echo -e "${GREEN}   ✅ $name Prettier OK${NC}"
                else
                    echo -e "${YELLOW}   ⚠️ $name Prettier: arquivos não formatados (use --fix)${NC}"
                    ((WARNINGS++))
                fi
            fi
        else
            echo -e "${YELLOW}   ⚠️ $name Prettier não configurado${NC}"
        fi
        cd - > /dev/null
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_prettier "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_prettier "$FRONTEND_DIR" "Frontend"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# NÍVEL 2: LÓGICA (TESTES)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🟢 NÍVEL 2: VALIDAÇÃO DE LÓGICA (TESTES)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 2.1 Testes Unitários
echo -e "${YELLOW}[2.1] Testes Unitários...${NC}"

run_tests() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/package.json" ]; then
        cd "$dir"
        if grep -q "\"test\"" package.json; then
            TEST_SCRIPT=$(grep "\"test\"" package.json | head -1)
            if [[ ! "$TEST_SCRIPT" =~ "no test" ]] && [[ ! "$TEST_SCRIPT" =~ "echo" ]]; then
                if npm test 2>/dev/null; then
                    echo -e "${GREEN}   ✅ $name Testes passaram${NC}"
                    ((PASSED++))
                else
                    echo -e "${RED}   ❌ $name Testes falharam${NC}"
                    ((ERRORS++))
                fi
            else
                echo -e "${YELLOW}   ⚠️ $name Nenhum teste configurado${NC}"
                ((WARNINGS++))
            fi
        else
            echo -e "${YELLOW}   ⚠️ $name Script de teste não encontrado${NC}"
            ((WARNINGS++))
        fi
        cd - > /dev/null
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_tests "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_tests "$FRONTEND_DIR" "Frontend"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# NÍVEL 3: SEGURANÇA
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🟡 NÍVEL 3: VALIDAÇÃO DE SEGURANÇA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 3.1 npm audit
echo -e "${YELLOW}[3.1] npm audit...${NC}"

run_audit() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/package.json" ]; then
        cd "$dir"
        AUDIT_RESULT=$(npm audit --audit-level=high 2>&1) || true
        if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
            echo -e "${GREEN}   ✅ $name Nenhuma vulnerabilidade encontrada${NC}"
            ((PASSED++))
        elif echo "$AUDIT_RESULT" | grep -q "high\|critical"; then
            echo -e "${RED}   ❌ $name Vulnerabilidades HIGH/CRITICAL encontradas${NC}"
            ((ERRORS++))
        else
            echo -e "${YELLOW}   ⚠️ $name Vulnerabilidades de baixa severidade${NC}"
            ((WARNINGS++))
        fi
        cd - > /dev/null
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_audit "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_audit "$FRONTEND_DIR" "Frontend"
fi

# 3.2 Secrets hardcoded
echo ""
echo -e "${YELLOW}[3.2] Verificando secrets hardcoded...${NC}"

SECRETS_FOUND=0
SEARCH_DIR="${BACKEND_DIR:-.}"

# Buscar padrões suspeitos
if grep -rn "password\s*=\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" "$SEARCH_DIR" 2>/dev/null | grep -v "\.env\|example\|test\|spec\|mock" | head -5; then
    ((SECRETS_FOUND++))
fi

if grep -rn "api_key\s*=\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" "$SEARCH_DIR" 2>/dev/null | grep -v "\.env\|example\|test\|spec\|mock" | head -5; then
    ((SECRETS_FOUND++))
fi

if grep -rn "secret\s*=\s*['\"][a-zA-Z0-9]\{20,\}['\"]" --include="*.ts" --include="*.js" "$SEARCH_DIR" 2>/dev/null | grep -v "\.env\|example\|test\|spec\|mock" | head -5; then
    ((SECRETS_FOUND++))
fi

if [ $SECRETS_FOUND -gt 0 ]; then
    echo -e "${RED}   ❌ Possíveis secrets hardcoded encontrados!${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}   ✅ Nenhum secret hardcoded detectado${NC}"
    ((PASSED++))
fi

# 3.3 .env no git
echo ""
echo -e "${YELLOW}[3.3] Verificando .env no git...${NC}"

if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo -e "${GREEN}   ✅ .env está no .gitignore${NC}"
        ((PASSED++))
    else
        echo -e "${RED}   ❌ .env NÃO está no .gitignore!${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}   ⚠️ .gitignore não encontrado${NC}"
    ((WARNINGS++))
fi

# ═══════════════════════════════════════════════════════════════════════════════
# NÍVEL 4: BUILD
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🟠 NÍVEL 4: VALIDAÇÃO DE BUILD${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 4.1 Build
echo -e "${YELLOW}[4.1] Build...${NC}"

run_build() {
    local dir=$1
    local name=$2
    
    if [ -n "$dir" ] && [ -f "$dir/package.json" ]; then
        cd "$dir"
        if grep -q "\"build\"" package.json; then
            if npm run build 2>/dev/null; then
                echo -e "${GREEN}   ✅ $name Build passou${NC}"
                ((PASSED++))
            else
                echo -e "${RED}   ❌ $name Build falhou${NC}"
                ((ERRORS++))
            fi
        else
            echo -e "${YELLOW}   ⚠️ $name Script de build não encontrado${NC}"
        fi
        cd - > /dev/null
    fi
}

if [ -n "$BACKEND_DIR" ]; then
    run_build "$BACKEND_DIR" "Backend"
fi

if [ -n "$FRONTEND_DIR" ] && [ "$FRONTEND_DIR" != "$BACKEND_DIR" ]; then
    run_build "$FRONTEND_DIR" "Frontend"
fi

# 4.2 Docker compose validate
echo ""
echo -e "${YELLOW}[4.2] Docker Compose...${NC}"

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    if docker compose config > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ docker-compose.yml válido${NC}"
        ((PASSED++))
    else
        echo -e "${RED}   ❌ docker-compose.yml inválido${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}   ⚠️ docker-compose.yml não encontrado${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# NÍVEL 5: VERIFICAÇÕES EXTRAS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔴 NÍVEL 5: VERIFICAÇÕES EXTRAS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# 5.1 Arquivos grandes
echo -e "${YELLOW}[5.1] Arquivos grandes (>1MB)...${NC}"
LARGE_FILES=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs ls -la 2>/dev/null | awk '$5 > 1000000 {print $9}')

if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}   ⚠️ Arquivos grandes encontrados:${NC}"
    echo "$LARGE_FILES" | head -5
    ((WARNINGS++))
else
    echo -e "${GREEN}   ✅ Nenhum arquivo muito grande${NC}"
fi

# 5.2 TODOs e FIXMEs
echo ""
echo -e "${YELLOW}[5.2] TODOs e FIXMEs...${NC}"
TODO_COUNT=$(grep -rn "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | wc -l)

if [ "$TODO_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}   ⚠️ $TODO_COUNT TODOs/FIXMEs encontrados (considere resolver)${NC}"
    ((WARNINGS++))
elif [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️ $TODO_COUNT TODOs/FIXMEs encontrados${NC}"
else
    echo -e "${GREEN}   ✅ Nenhum TODO/FIXME pendente${NC}"
fi

# 5.3 Console.log (em produção é ruim)
echo ""
echo -e "${YELLOW}[5.3] console.log em código...${NC}"
CONSOLE_COUNT=$(grep -rn "console\.log\|console\.error\|console\.warn" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v "node_modules\|test\|spec\|\.test\.\|\.spec\." | wc -l)

if [ "$CONSOLE_COUNT" -gt 5 ]; then
    echo -e "${YELLOW}   ⚠️ $CONSOLE_COUNT console.log encontrados (remover antes de produção)${NC}"
    ((WARNINGS++))
elif [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️ $CONSOLE_COUNT console.log encontrados${NC}"
else
    echo -e "${GREEN}   ✅ Nenhum console.log encontrado${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}   📊 RESULTADO FINAL${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "   ✅ Passou:   $PASSED"
echo -e "   ⚠️ Warnings: $WARNINGS"
echo -e "   ❌ Erros:    $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}║   ✅ REVIEW APROVADO - PODE FAZER DEPLOY!                                     ║${NC}"
    echo -e "${GREEN}║                                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️ Existem $WARNINGS warnings - considere corrigir quando possível${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}   Próximo passo: ./DEPLOY_SAFE.sh${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}║   ❌ REVIEW REPROVADO - NÃO FAZER DEPLOY!                                     ║${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}║   $ERRORS ERRO(S) ENCONTRADO(S) - CORRIGIR ANTES DE CONTINUAR                  ║${NC}"
    echo -e "${RED}║                                                                               ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}   Dica: Execute './AUTOMATED_REVIEW.sh --fix' para tentar corrigir automaticamente${NC}"
    echo ""
    exit 1
fi
