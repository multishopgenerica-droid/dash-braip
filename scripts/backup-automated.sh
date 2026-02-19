#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# BACKUP-AUTOMATED.sh - Backup automatizado com verificação de integridade
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════
#
# Funcionalidades:
# - Backup de banco de dados (PostgreSQL, MySQL)
# - Backup de arquivos (uploads, configs)
# - Verificação de integridade
# - Rotação automática (mantém últimos N backups)
# - Upload para storage remoto (S3, GCS, iDrive E2)
# - Notificação de status
#
# Uso via cron:
#   0 3 * * * /path/to/backup-automated.sh daily
#   0 4 * * 0 /path/to/backup-automated.sh weekly
#   0 5 1 * * /path/to/backup-automated.sh monthly
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

BACKUP_TYPE="${1:-daily}"  # daily, weekly, monthly
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_TYPE}"
LOG_FILE="${BACKUP_ROOT}/logs/backup_${TIMESTAMP}.log"

# Retenção
DAILY_RETENTION=7
WEEKLY_RETENTION=4
MONTHLY_RETENTION=12

# Remote storage (configure conforme necessário)
REMOTE_ENABLED="${REMOTE_BACKUP_ENABLED:-false}"
REMOTE_BUCKET="${REMOTE_BACKUP_BUCKET:-}"
REMOTE_PROVIDER="${REMOTE_BACKUP_PROVIDER:-s3}"  # s3, gcs, e2

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# PREPARAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

mkdir -p "$BACKUP_DIR"
mkdir -p "${BACKUP_ROOT}/logs"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "  BACKUP AUTOMATIZADO - $BACKUP_TYPE"
echo "  Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
BACKUP_FILES=()

# ═══════════════════════════════════════════════════════════════════════════════
# FUNÇÃO: Notificar
# ═══════════════════════════════════════════════════════════════════════════════

notify() {
    local status="$1"
    local message="$2"
    
    if [ -f "./scripts/notify-discord.sh" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
        if [ "$status" = "success" ]; then
            ./scripts/notify-discord.sh message "✅ $message"
        else
            ./scripts/notify-discord.sh alert critical "Backup Failed" "$message"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. BACKUP DO BANCO DE DADOS
# ═══════════════════════════════════════════════════════════════════════════════

echo "📦 [1/5] Backup do banco de dados..."

DB_BACKUP_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

if [ -n "$DATABASE_URL" ]; then
    if [[ "$DATABASE_URL" =~ ^postgres ]]; then
        echo "   → PostgreSQL detectado"
        if pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP_FILE" 2>/dev/null; then
            BACKUP_FILES+=("$DB_BACKUP_FILE")
            echo -e "   ${GREEN}✅ Backup DB criado: $(du -h "$DB_BACKUP_FILE" | cut -f1)${NC}"
        else
            echo -e "   ${RED}❌ Falha no backup do banco${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    elif [[ "$DATABASE_URL" =~ ^mysql ]]; then
        echo "   → MySQL detectado"
        if mysqldump --single-transaction --routines --triggers \
            $(echo "$DATABASE_URL" | sed 's/mysql:\/\/\([^:]*\):\([^@]*\)@\([^:]*\):\([^\/]*\)\/\(.*\)/-u \1 -p\2 -h \3 -P \4 \5/') \
            | gzip > "$DB_BACKUP_FILE" 2>/dev/null; then
            BACKUP_FILES+=("$DB_BACKUP_FILE")
            echo -e "   ${GREEN}✅ Backup DB criado: $(du -h "$DB_BACKUP_FILE" | cut -f1)${NC}"
        else
            echo -e "   ${RED}❌ Falha no backup do banco${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  DATABASE_URL não configurada${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 2. BACKUP DE ARQUIVOS
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "📁 [2/5] Backup de arquivos..."

FILES_BACKUP_FILE="${BACKUP_DIR}/files_${TIMESTAMP}.tar.gz"

# Diretórios para backup
BACKUP_DIRS=""
[ -d "uploads" ] && BACKUP_DIRS="$BACKUP_DIRS uploads"
[ -d "public/uploads" ] && BACKUP_DIRS="$BACKUP_DIRS public/uploads"
[ -d "storage" ] && BACKUP_DIRS="$BACKUP_DIRS storage"
[ -d ".env" ] && BACKUP_DIRS="$BACKUP_DIRS .env"
[ -f ".env" ] && BACKUP_DIRS="$BACKUP_DIRS .env"
[ -d "config" ] && BACKUP_DIRS="$BACKUP_DIRS config"

if [ -n "$BACKUP_DIRS" ]; then
    if tar -czf "$FILES_BACKUP_FILE" $BACKUP_DIRS 2>/dev/null; then
        BACKUP_FILES+=("$FILES_BACKUP_FILE")
        echo -e "   ${GREEN}✅ Backup arquivos criado: $(du -h "$FILES_BACKUP_FILE" | cut -f1)${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Alguns arquivos não puderam ser incluídos${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Nenhum diretório de arquivos encontrado${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 3. VERIFICAÇÃO DE INTEGRIDADE
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "🔍 [3/5] Verificando integridade dos backups..."

CHECKSUM_FILE="${BACKUP_DIR}/checksums_${TIMESTAMP}.sha256"

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Gerar checksum
        sha256sum "$file" >> "$CHECKSUM_FILE"
        
        # Verificar se arquivo não está corrompido
        if [[ "$file" =~ \.gz$ ]]; then
            if gzip -t "$file" 2>/dev/null; then
                echo -e "   ${GREEN}✅ $file - OK${NC}"
            else
                echo -e "   ${RED}❌ $file - CORROMPIDO!${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        elif [[ "$file" =~ \.tar\.gz$ ]]; then
            if tar -tzf "$file" > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ $file - OK${NC}"
            else
                echo -e "   ${RED}❌ $file - CORROMPIDO!${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
# 4. UPLOAD PARA STORAGE REMOTO
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "☁️  [4/5] Upload para storage remoto..."

if [ "$REMOTE_ENABLED" = "true" ] && [ -n "$REMOTE_BUCKET" ]; then
    for file in "${BACKUP_FILES[@]}"; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            remote_path="$REMOTE_BUCKET/${BACKUP_TYPE}/$filename"
            
            case $REMOTE_PROVIDER in
                s3)
                    if aws s3 cp "$file" "s3://$remote_path" 2>/dev/null; then
                        echo -e "   ${GREEN}✅ Uploaded: $filename → S3${NC}"
                    else
                        echo -e "   ${RED}❌ Falha upload S3: $filename${NC}"
                        ERRORS=$((ERRORS + 1))
                    fi
                    ;;
                gcs)
                    if gsutil cp "$file" "gs://$remote_path" 2>/dev/null; then
                        echo -e "   ${GREEN}✅ Uploaded: $filename → GCS${NC}"
                    else
                        echo -e "   ${RED}❌ Falha upload GCS: $filename${NC}"
                        ERRORS=$((ERRORS + 1))
                    fi
                    ;;
                e2)
                    # iDrive E2 (compatível com S3)
                    if aws s3 cp "$file" "s3://$remote_path" --endpoint-url "$IDRIVE_E2_ENDPOINT" 2>/dev/null; then
                        echo -e "   ${GREEN}✅ Uploaded: $filename → iDrive E2${NC}"
                    else
                        echo -e "   ${RED}❌ Falha upload E2: $filename${NC}"
                        ERRORS=$((ERRORS + 1))
                    fi
                    ;;
            esac
        fi
    done
else
    echo -e "   ${YELLOW}⚠️  Upload remoto desabilitado${NC}"
    echo "   Configure: REMOTE_BACKUP_ENABLED=true REMOTE_BACKUP_BUCKET=bucket-name"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# 5. ROTAÇÃO DE BACKUPS ANTIGOS
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "🔄 [5/5] Rotação de backups antigos..."

case $BACKUP_TYPE in
    daily)
        RETENTION=$DAILY_RETENTION
        ;;
    weekly)
        RETENTION=$WEEKLY_RETENTION
        ;;
    monthly)
        RETENTION=$MONTHLY_RETENTION
        ;;
esac

# Contar backups atuais
CURRENT_COUNT=$(ls -1 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)

if [ "$CURRENT_COUNT" -gt "$RETENTION" ]; then
    DELETE_COUNT=$((CURRENT_COUNT - RETENTION))
    echo "   Removendo $DELETE_COUNT backup(s) antigo(s)..."
    
    # Remover mais antigos
    ls -1t "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -n "$DELETE_COUNT" | xargs rm -f
    ls -1t "$BACKUP_DIR"/files_*.tar.gz 2>/dev/null | tail -n "$DELETE_COUNT" | xargs rm -f 2>/dev/null || true
    ls -1t "$BACKUP_DIR"/checksums_*.sha256 2>/dev/null | tail -n "$DELETE_COUNT" | xargs rm -f 2>/dev/null || true
    
    echo -e "   ${GREEN}✅ Rotação concluída${NC}"
else
    echo -e "   ${GREEN}✅ Nenhuma rotação necessária ($CURRENT_COUNT/$RETENTION)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"

# Calcular tamanho total
TOTAL_SIZE=$(du -ch "${BACKUP_FILES[@]}" 2>/dev/null | grep total | cut -f1)

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ BACKUP CONCLUÍDO COM SUCESSO!${NC}"
    echo ""
    echo "   Tipo:     $BACKUP_TYPE"
    echo "   Arquivos: ${#BACKUP_FILES[@]}"
    echo "   Tamanho:  $TOTAL_SIZE"
    echo "   Local:    $BACKUP_DIR"
    
    notify "success" "Backup $BACKUP_TYPE concluído ($TOTAL_SIZE)"
else
    echo -e "${RED}❌ BACKUP CONCLUÍDO COM $ERRORS ERRO(S)!${NC}"
    echo "   Verifique o log: $LOG_FILE"
    
    notify "error" "Backup $BACKUP_TYPE falhou com $ERRORS erro(s)"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════════════════════"
