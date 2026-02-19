#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# TEST-RESTORE.sh - Testa restauração de backup automaticamente
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════
#
# Executa restauração em banco de teste para validar integridade
# Recomendado rodar mensalmente via cron
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║   🧪 TEST-RESTORE - Validação de Backup                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
TEST_DB_NAME="${TEST_DB_NAME:-backup_test_db}"

# Encontrar backup mais recente
LATEST_BACKUP=$(ls -t "$BACKUP_ROOT"/*/db_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ Nenhum backup encontrado!${NC}"
    exit 1
fi

echo "📦 Backup mais recente: $LATEST_BACKUP"
echo "🗄️  Banco de teste: $TEST_DB_NAME"
echo ""

# Verificar integridade do arquivo
echo "🔍 Verificando integridade..."
if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✅ Arquivo íntegro${NC}"
else
    echo -e "${RED}❌ Arquivo corrompido!${NC}"
    exit 1
fi

# Testar restauração (PostgreSQL)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" =~ ^postgres ]]; then
    echo ""
    echo "🔄 Testando restauração..."
    
    # Criar banco de teste
    psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null || true
    psql "$DATABASE_URL" -c "CREATE DATABASE $TEST_DB_NAME;" 2>/dev/null
    
    # Restaurar
    TEST_URL=$(echo "$DATABASE_URL" | sed "s|/[^/]*$|/$TEST_DB_NAME|")
    if gunzip -c "$LATEST_BACKUP" | psql "$TEST_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Restauração bem-sucedida!${NC}"
        
        # Verificar tabelas
        TABLE_COUNT=$(psql "$TEST_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        echo "   Tabelas restauradas: $TABLE_COUNT"
        
        # Limpar
        psql "$DATABASE_URL" -c "DROP DATABASE $TEST_DB_NAME;" 2>/dev/null || true
    else
        echo -e "${RED}❌ Restauração falhou!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Teste de restauração requer DATABASE_URL (PostgreSQL)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Teste de restore concluído com sucesso!${NC}"
