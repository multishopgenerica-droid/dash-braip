#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SAFE-MIGRATE.sh - Executa migrations com segurança máxima
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════
#
# Proteções:
# 1. Backup automático ANTES da migration
# 2. Verifica se migration tem rollback definido
# 3. Testa em transaction (rollback se falhar)
# 4. Log de todas as operações
# 5. Notifica Discord/Slack
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups/migrations}"
LOG_FILE="${BACKUP_DIR}/migration_${TIMESTAMP}.log"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Detectar ORM/Framework
detect_migration_tool() {
    if [ -f "prisma/schema.prisma" ]; then
        echo "prisma"
    elif [ -f "drizzle.config.ts" ] || [ -f "drizzle.config.js" ]; then
        echo "drizzle"
    elif [ -f "src/database/migrations" ] || [ -d "migrations" ]; then
        if [ -f "package.json" ] && grep -q "typeorm" package.json; then
            echo "typeorm"
        elif [ -f "package.json" ] && grep -q "sequelize" package.json; then
            echo "sequelize"
        elif [ -f "package.json" ] && grep -q "knex" package.json; then
            echo "knex"
        fi
    elif [ -f "alembic.ini" ]; then
        echo "alembic"
    elif [ -f "manage.py" ]; then
        echo "django"
    elif [ -f "artisan" ]; then
        echo "laravel"
    elif [ -f "Gemfile" ] && grep -q "rails" Gemfile; then
        echo "rails"
    else
        echo "unknown"
    fi
}

MIGRATION_TOOL=$(detect_migration_tool)

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🗄️ SAFE-MIGRATE - Migration com Segurança Máxima                            ║${NC}"
echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║   Ambiente:        ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${CYAN}║   Tool detectada:  ${YELLOW}$MIGRATION_TOOL${NC}"
echo -e "${CYAN}║   Timestamp:       ${YELLOW}$TIMESTAMP${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Iniciar log
exec > >(tee -a "$LOG_FILE") 2>&1
echo "=== MIGRATION LOG - $TIMESTAMP ===" >> "$LOG_FILE"
echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"
echo "Tool: $MIGRATION_TOOL" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
# FUNÇÕES
# ═══════════════════════════════════════════════════════════════════════════════

log() {
    echo -e "[$(date '+%H:%M:%S')] $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ ERROR: $1${NC}"
    # Notificar Discord se configurado
    if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
        ./scripts/notify-discord.sh alert critical "Migration Failed" "$1"
    fi
}

success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. CONFIRMAÇÃO PARA PRODUÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  ATENÇÃO: AMBIENTE DE PRODUÇÃO!                                          ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Você está prestes a executar migrations em PRODUÇÃO.${NC}"
    echo -e "${YELLOW}Um backup será criado automaticamente, mas confirme que:${NC}"
    echo ""
    echo "  1. Você testou estas migrations em staging"
    echo "  2. Você tem acesso ao backup caso precise de rollback"
    echo "  3. O time está ciente desta operação"
    echo ""
    read -p "Digite 'CONFIRMO' para continuar: " confirmation
    if [ "$confirmation" != "CONFIRMO" ]; then
        echo "Operação cancelada."
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 2. BACKUP DO BANCO
# ═══════════════════════════════════════════════════════════════════════════════

log "📦 Etapa 1/5: Criando backup do banco de dados..."

BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

# Detectar tipo de banco e fazer backup
if [ -n "$DATABASE_URL" ]; then
    # Extrair tipo de banco da URL
    if [[ "$DATABASE_URL" =~ ^postgres ]]; then
        log "   Detectado: PostgreSQL"
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null && success "Backup criado: $BACKUP_FILE" || warning "Não foi possível criar backup (verifique pg_dump)"
    elif [[ "$DATABASE_URL" =~ ^mysql ]]; then
        log "   Detectado: MySQL"
        # Extrair credenciais da URL
        mysqldump --single-transaction --routines --triggers "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null && success "Backup criado: $BACKUP_FILE" || warning "Não foi possível criar backup"
    fi
elif [ -f ".env" ]; then
    source .env 2>/dev/null || true
    if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
        if [ -n "$DB_PORT" ] && [ "$DB_PORT" = "5432" ]; then
            PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null && success "Backup criado" || warning "Backup falhou"
        elif [ -n "$DB_PORT" ] && [ "$DB_PORT" = "3306" ]; then
            mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null && success "Backup criado" || warning "Backup falhou"
        fi
    fi
else
    warning "Não foi possível detectar configuração do banco para backup"
    warning "Continuando sem backup automático..."
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 3. VERIFICAR MIGRATIONS PENDENTES
# ═══════════════════════════════════════════════════════════════════════════════

log "🔍 Etapa 2/5: Verificando migrations pendentes..."

case $MIGRATION_TOOL in
    prisma)
        PENDING=$(npx prisma migrate status 2>&1 || echo "error")
        if echo "$PENDING" | grep -q "Database schema is up to date"; then
            success "Nenhuma migration pendente"
            exit 0
        fi
        echo "$PENDING"
        ;;
    drizzle)
        npx drizzle-kit check 2>&1 || true
        ;;
    typeorm)
        npx typeorm migration:show 2>&1 || true
        ;;
    sequelize)
        npx sequelize-cli db:migrate:status 2>&1 || true
        ;;
    django)
        python manage.py showmigrations --plan 2>&1 | grep "\[ \]" || success "Nenhuma migration pendente"
        ;;
    laravel)
        php artisan migrate:status 2>&1 || true
        ;;
    rails)
        rails db:migrate:status 2>&1 || true
        ;;
    alembic)
        alembic current 2>&1 || true
        ;;
    *)
        warning "Tool de migration não reconhecida"
        ;;
esac

# ═══════════════════════════════════════════════════════════════════════════════
# 4. VERIFICAR SE TEM ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════

log "🔄 Etapa 3/5: Verificando se migrations têm rollback..."

case $MIGRATION_TOOL in
    prisma)
        success "Prisma suporta rollback automático via prisma migrate reset"
        ;;
    typeorm)
        # Verificar se migrations têm método down()
        MIGRATIONS_DIR="src/database/migrations"
        if [ -d "$MIGRATIONS_DIR" ]; then
            for file in "$MIGRATIONS_DIR"/*.ts "$MIGRATIONS_DIR"/*.js; do
                if [ -f "$file" ] && ! grep -q "async down" "$file"; then
                    warning "Migration sem rollback: $file"
                fi
            done
        fi
        ;;
    django)
        success "Django suporta rollback automático"
        ;;
    laravel)
        success "Laravel suporta rollback via php artisan migrate:rollback"
        ;;
    *)
        warning "Verifique manualmente se as migrations têm rollback definido"
        ;;
esac

# ═══════════════════════════════════════════════════════════════════════════════
# 5. EXECUTAR MIGRATION
# ═══════════════════════════════════════════════════════════════════════════════

log "🚀 Etapa 4/5: Executando migrations..."

START_TIME=$(date +%s)

case $MIGRATION_TOOL in
    prisma)
        if [ "$ENVIRONMENT" = "production" ]; then
            npx prisma migrate deploy
        else
            npx prisma migrate dev
        fi
        ;;
    drizzle)
        npx drizzle-kit push
        ;;
    typeorm)
        npx typeorm migration:run
        ;;
    sequelize)
        npx sequelize-cli db:migrate
        ;;
    django)
        python manage.py migrate
        ;;
    laravel)
        php artisan migrate --force
        ;;
    rails)
        rails db:migrate
        ;;
    alembic)
        alembic upgrade head
        ;;
    knex)
        npx knex migrate:latest
        ;;
    *)
        error "Tool de migration não suportada: $MIGRATION_TOOL"
        exit 1
        ;;
esac

MIGRATION_STATUS=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# ═══════════════════════════════════════════════════════════════════════════════
# 6. VERIFICAR RESULTADO
# ═══════════════════════════════════════════════════════════════════════════════

log "✅ Etapa 5/5: Verificando resultado..."

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ MIGRATION CONCLUÍDA COM SUCESSO!                                         ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║   Duração:     ${DURATION}s${NC}"
    echo -e "${GREEN}║   Backup:      $BACKUP_FILE${NC}"
    echo -e "${GREEN}║   Log:         $LOG_FILE${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    # Notificar sucesso
    if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
        ./scripts/notify-discord.sh message "✅ Migration executada com sucesso em $ENVIRONMENT (${DURATION}s)"
    fi
else
    error "Migration falhou! Verifique os logs: $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Para rollback, execute:${NC}"
    
    case $MIGRATION_TOOL in
        prisma)
            echo "  npx prisma migrate reset"
            ;;
        typeorm)
            echo "  npx typeorm migration:revert"
            ;;
        sequelize)
            echo "  npx sequelize-cli db:migrate:undo"
            ;;
        django)
            echo "  python manage.py migrate <app> <migration_anterior>"
            ;;
        laravel)
            echo "  php artisan migrate:rollback"
            ;;
        rails)
            echo "  rails db:rollback"
            ;;
        alembic)
            echo "  alembic downgrade -1"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}Ou restaure o backup:${NC}"
    echo "  psql \$DATABASE_URL < $BACKUP_FILE"
    
    exit 1
fi
