#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# ROLLBACK-MIGRATION.sh - Desfaz última migration ou restaura backup
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
echo -e "${CYAN}║   🔄 ROLLBACK MIGRATION - Desfazer última migration                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

BACKUP_DIR="${BACKUP_DIR:-./backups/migrations}"
MODE="${1:-migration}"  # migration ou restore

# ═══════════════════════════════════════════════════════════════════════════════
# DETECTAR TOOL
# ═══════════════════════════════════════════════════════════════════════════════

detect_migration_tool() {
    if [ -f "prisma/schema.prisma" ]; then echo "prisma"
    elif [ -f "package.json" ] && grep -q "typeorm" package.json; then echo "typeorm"
    elif [ -f "package.json" ] && grep -q "sequelize" package.json; then echo "sequelize"
    elif [ -f "manage.py" ]; then echo "django"
    elif [ -f "artisan" ]; then echo "laravel"
    elif [ -f "Gemfile" ] && grep -q "rails" Gemfile; then echo "rails"
    elif [ -f "alembic.ini" ]; then echo "alembic"
    else echo "unknown"
    fi
}

MIGRATION_TOOL=$(detect_migration_tool)
echo -e "🔧 Tool detectada: ${CYAN}$MIGRATION_TOOL${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# MODO 1: ROLLBACK VIA MIGRATION TOOL
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$MODE" = "migration" ]; then
    echo ""
    echo -e "${YELLOW}Modo: Rollback via migration tool${NC}"
    echo ""
    
    case $MIGRATION_TOOL in
        prisma)
            echo "⚠️  Prisma não suporta rollback individual."
            echo "Opções:"
            echo "  1. prisma migrate reset (APAGA TUDO e recria)"
            echo "  2. Restaurar backup (recomendado)"
            echo ""
            read -p "Deseja restaurar backup? (y/n): " choice
            if [[ "$choice" =~ ^[Yy]$ ]]; then
                MODE="restore"
            else
                echo "Execute manualmente: npx prisma migrate reset"
                exit 0
            fi
            ;;
        typeorm)
            echo "Executando: npx typeorm migration:revert"
            npx typeorm migration:revert
            ;;
        sequelize)
            echo "Executando: npx sequelize-cli db:migrate:undo"
            npx sequelize-cli db:migrate:undo
            ;;
        django)
            echo "Para Django, especifique app e migration:"
            echo "  python manage.py migrate <app> <migration_anterior>"
            echo ""
            read -p "App name: " app
            read -p "Migration name: " mig
            python manage.py migrate "$app" "$mig"
            ;;
        laravel)
            echo "Executando: php artisan migrate:rollback"
            php artisan migrate:rollback
            ;;
        rails)
            echo "Executando: rails db:rollback"
            rails db:rollback
            ;;
        alembic)
            echo "Executando: alembic downgrade -1"
            alembic downgrade -1
            ;;
        *)
            echo -e "${RED}Tool não suportada para rollback automático${NC}"
            MODE="restore"
            ;;
    esac
fi

# ═══════════════════════════════════════════════════════════════════════════════
# MODO 2: RESTAURAR BACKUP
# ═══════════════════════════════════════════════════════════════════════════════

if [ "$MODE" = "restore" ]; then
    echo ""
    echo -e "${YELLOW}Modo: Restaurar backup${NC}"
    echo ""
    
    # Listar backups disponíveis
    if [ -d "$BACKUP_DIR" ]; then
        echo "Backups disponíveis:"
        echo ""
        ls -lt "$BACKUP_DIR"/*.sql 2>/dev/null | head -10 | awk '{print NR") "$9" ("$6" "$7" "$8")"}'
        echo ""
        
        read -p "Digite o número do backup ou caminho completo: " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]]; then
            BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | sed -n "${selection}p")
        else
            BACKUP_FILE="$selection"
        fi
        
        if [ ! -f "$BACKUP_FILE" ]; then
            echo -e "${RED}Arquivo não encontrado: $BACKUP_FILE${NC}"
            exit 1
        fi
        
        echo ""
        echo -e "${YELLOW}⚠️  ATENÇÃO: Isso vai SUBSTITUIR o banco atual!${NC}"
        echo -e "Arquivo: ${CYAN}$BACKUP_FILE${NC}"
        echo ""
        read -p "Confirma restauração? (digite 'RESTAURAR'): " confirm
        
        if [ "$confirm" = "RESTAURAR" ]; then
            echo ""
            echo "🔄 Restaurando backup..."
            
            if [ -n "$DATABASE_URL" ]; then
                if [[ "$DATABASE_URL" =~ ^postgres ]]; then
                    psql "$DATABASE_URL" < "$BACKUP_FILE"
                elif [[ "$DATABASE_URL" =~ ^mysql ]]; then
                    mysql "$DATABASE_URL" < "$BACKUP_FILE"
                fi
            else
                echo -e "${RED}DATABASE_URL não configurada${NC}"
                echo "Execute manualmente:"
                echo "  psql \$DATABASE_URL < $BACKUP_FILE"
                echo "  ou"
                echo "  mysql -u user -p database < $BACKUP_FILE"
                exit 1
            fi
            
            echo -e "${GREEN}✅ Backup restaurado com sucesso!${NC}"
        else
            echo "Operação cancelada."
            exit 0
        fi
    else
        echo -e "${RED}Nenhum backup encontrado em: $BACKUP_DIR${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Rollback concluído!${NC}"
