#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 DEPLOY_SAFE.sh - Sistema Dash Braip
# ═══════════════════════════════════════════════════════════════════════════════
# Deploy Enterprise com 7 etapas de segurança
# 
# USO: 
#   ./DEPLOY_SAFE.sh              # Deploy completo
#   ./DEPLOY_SAFE.sh --skip-backup # Pular backup (não recomendado)
#   ./DEPLOY_SAFE.sh --rollback    # Executar rollback
#
# REQUISITOS:
#   - Docker e Docker Compose instalados
#   - Acesso ao banco de dados (para backup)
#   - ./AUTOMATED_REVIEW.sh deve passar primeiro
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

# Configurações
PROJECT_NAME="Sistema Dash Braip"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="./deploy_${TIMESTAMP}.log"

# Flags
SKIP_BACKUP=false
ROLLBACK_MODE=false

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --rollback)
            ROLLBACK_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Argumento desconhecido: $1${NC}"
            exit 1
            ;;
    esac
done

# Função de log
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Função para verificar se comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        log "${RED}❌ Comando '$1' não encontrado${NC}"
        return 1
    fi
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODO ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════
if [ "$ROLLBACK_MODE" = true ]; then
    echo ""
    log "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    log "${RED}║   🔙 MODO ROLLBACK ATIVADO                                                    ║${NC}"
    log "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Verificar se há backup
    if [ -d "$BACKUP_DIR" ]; then
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            log "${YELLOW}Último backup encontrado: $LATEST_BACKUP${NC}"
        fi
    fi
    
    log ""
    log "${YELLOW}Opções de rollback:${NC}"
    log ""
    log "1. Docker Swarm (se aplicável):"
    log "   ${CYAN}docker service ls${NC}"
    log "   ${CYAN}docker service update --rollback NOME_SERVICO${NC}"
    log ""
    log "2. Docker Compose:"
    log "   ${CYAN}docker compose down${NC}"
    log "   ${CYAN}git checkout HEAD~1${NC}"
    log "   ${CYAN}docker compose up -d --build${NC}"
    log ""
    log "3. Restaurar banco de dados:"
    log "   ${CYAN}gunzip -c $LATEST_BACKUP | psql -h localhost -U postgres -d DATABASE${NC}"
    log ""
    
    read -p "Executar rollback do Docker Swarm? (s/N): " CONFIRM_ROLLBACK
    if [ "$CONFIRM_ROLLBACK" = "s" ] || [ "$CONFIRM_ROLLBACK" = "S" ]; then
        SERVICES=$(docker service ls --format "{{.Name}}" 2>/dev/null | grep -i "Sistema Dash Braip" || true)
        if [ -n "$SERVICES" ]; then
            for SERVICE in $SERVICES; do
                log "${YELLOW}Fazendo rollback de: $SERVICE${NC}"
                docker service update --rollback "$SERVICE" 2>&1 | tee -a "$LOG_FILE"
            done
            log "${GREEN}✅ Rollback executado${NC}"
        else
            log "${YELLOW}Nenhum serviço encontrado para rollback${NC}"
        fi
    fi
    
    exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# INÍCIO DO DEPLOY
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${PURPLE}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
log "${PURPLE}║   🚀 DEPLOY SAFE - ENTERPRISE v5.0                                            ║${NC}"
log "${PURPLE}║   Sistema Dash Braip                                                               ║${NC}"
log "${PURPLE}║   Timestamp: $TIMESTAMP                                                       ║${NC}"
log "${PURPLE}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 0: PRÉ-REQUISITOS
# ═══════════════════════════════════════════════════════════════════════════════
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [0/7] VERIFICANDO PRÉ-REQUISITOS${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar comandos necessários
PREREQ_OK=true

log "${YELLOW}Verificando Docker...${NC}"
if check_command docker; then
    log "${GREEN}   ✅ Docker instalado${NC}"
else
    PREREQ_OK=false
fi

log "${YELLOW}Verificando Docker Compose...${NC}"
if docker compose version &> /dev/null; then
    log "${GREEN}   ✅ Docker Compose instalado${NC}"
else
    log "${YELLOW}   ⚠️ Docker Compose não encontrado (tentando docker-compose)${NC}"
fi

log "${YELLOW}Verificando Git...${NC}"
if check_command git; then
    log "${GREEN}   ✅ Git instalado${NC}"
else
    log "${YELLOW}   ⚠️ Git não encontrado${NC}"
fi

if [ "$PREREQ_OK" = false ]; then
    log "${RED}❌ Pré-requisitos não atendidos. Abortando.${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 1: AUTOMATED REVIEW
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [1/7] EXECUTANDO AUTOMATED REVIEW${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -f "./AUTOMATED_REVIEW.sh" ]; then
    log "${YELLOW}Executando ./AUTOMATED_REVIEW.sh...${NC}"
    if ./AUTOMATED_REVIEW.sh 2>&1 | tee -a "$LOG_FILE"; then
        log "${GREEN}   ✅ Review passou${NC}"
    else
        log "${RED}   ❌ Review FALHOU - Deploy BLOQUEADO${NC}"
        log "${RED}   Corrija os erros e tente novamente${NC}"
        exit 1
    fi
else
    log "${YELLOW}   ⚠️ AUTOMATED_REVIEW.sh não encontrado - pulando${NC}"
    read -p "Continuar mesmo assim? (s/N): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        log "${RED}Deploy cancelado pelo usuário${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 2: BACKUP DO BANCO
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [2/7] BACKUP DO BANCO DE DADOS${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$SKIP_BACKUP" = true ]; then
    log "${YELLOW}   ⚠️ Backup pulado (--skip-backup)${NC}"
else
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"
    
    # Detectar configuração do banco
    DB_HOST=""
    DB_USER=""
    DB_NAME=""
    DB_PASSWORD=""
    
    # Tentar ler do .env
    if [ -f ".env" ]; then
        DB_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$DB_URL" ]; then
            # Extrair partes da URL postgresql://user:pass@host:port/database
            DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
            DB_PASSWORD=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
            DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
            DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
        fi
    fi
    
    # Tentar backup via docker
    BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"
    
    log "${YELLOW}Tentando backup do PostgreSQL...${NC}"
    
    # Método 1: Via container postgres
    PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "postgres\|db" | head -1 || true)
    
    if [ -n "$PG_CONTAINER" ]; then
        log "${CYAN}   Container encontrado: $PG_CONTAINER${NC}"
        
        if docker exec "$PG_CONTAINER" pg_dump -U postgres 2>/dev/null | gzip > "$BACKUP_FILE"; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "${GREEN}   ✅ Backup criado: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
        else
            log "${YELLOW}   ⚠️ Falha no backup via container${NC}"
            rm -f "$BACKUP_FILE"
        fi
    else
        log "${YELLOW}   ⚠️ Container PostgreSQL não encontrado${NC}"
        log "${YELLOW}   Tentando backup local...${NC}"
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
            if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"; then
                BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
                log "${GREEN}   ✅ Backup criado: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
            else
                log "${YELLOW}   ⚠️ Falha no backup local${NC}"
                rm -f "$BACKUP_FILE"
            fi
        else
            log "${YELLOW}   ⚠️ Configuração do banco não encontrada${NC}"
        fi
    fi
    
    # Verificar se backup foi criado
    if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
        log "${YELLOW}   ⚠️ Backup não foi criado${NC}"
        read -p "Continuar sem backup? (s/N): " CONTINUE_NO_BACKUP
        if [ "$CONTINUE_NO_BACKUP" != "s" ] && [ "$CONTINUE_NO_BACKUP" != "S" ]; then
            log "${RED}Deploy cancelado - backup obrigatório${NC}"
            exit 1
        fi
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 3: BACKUP DE ARQUIVOS DE CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [3/7] BACKUP DE CONFIGURAÇÕES${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

CONFIG_BACKUP="$BACKUP_DIR/config_${TIMESTAMP}.tar.gz"

log "${YELLOW}Criando backup de configurações...${NC}"

# Lista de arquivos para backup
CONFIG_FILES=""
[ -f ".env" ] && CONFIG_FILES="$CONFIG_FILES .env"
[ -f ".env.production" ] && CONFIG_FILES="$CONFIG_FILES .env.production"
[ -f "docker-compose.yml" ] && CONFIG_FILES="$CONFIG_FILES docker-compose.yml"
[ -f "docker-compose.yaml" ] && CONFIG_FILES="$CONFIG_FILES docker-compose.yaml"
[ -f "docker-compose.prod.yml" ] && CONFIG_FILES="$CONFIG_FILES docker-compose.prod.yml"

if [ -n "$CONFIG_FILES" ]; then
    tar -czvf "$CONFIG_BACKUP" $CONFIG_FILES 2>/dev/null || true
    if [ -f "$CONFIG_BACKUP" ]; then
        log "${GREEN}   ✅ Configurações salvas: $CONFIG_BACKUP${NC}"
    fi
else
    log "${YELLOW}   ⚠️ Nenhum arquivo de configuração encontrado${NC}"
fi

# Git stash como backup adicional
if [ -d ".git" ]; then
    log "${YELLOW}Criando Git stash como backup...${NC}"
    STASH_MSG="deploy_backup_${TIMESTAMP}"
    git stash push -m "$STASH_MSG" --include-untracked 2>/dev/null || true
    git stash pop 2>/dev/null || true
    log "${GREEN}   ✅ Estado do Git preservado${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 4: BUILD
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [4/7] BUILD DA APLICAÇÃO${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

BUILD_SUCCESS=false

# Método 1: Docker Compose
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    log "${YELLOW}Executando docker compose build...${NC}"
    
    if docker compose build --no-cache 2>&1 | tee -a "$LOG_FILE"; then
        log "${GREEN}   ✅ Build Docker concluído${NC}"
        BUILD_SUCCESS=true
    else
        log "${RED}   ❌ Build Docker falhou${NC}"
    fi
fi

# Método 2: npm build (se não usar Docker ou como complemento)
if [ -f "package.json" ]; then
    if grep -q "\"build\"" package.json; then
        log "${YELLOW}Executando npm run build...${NC}"
        if npm run build 2>&1 | tee -a "$LOG_FILE"; then
            log "${GREEN}   ✅ Build npm concluído${NC}"
            BUILD_SUCCESS=true
        else
            log "${RED}   ❌ Build npm falhou${NC}"
        fi
    fi
fi

# Verificar build em subdiretórios
for DIR in backend frontend; do
    if [ -d "$DIR" ] && [ -f "$DIR/package.json" ]; then
        if grep -q "\"build\"" "$DIR/package.json"; then
            log "${YELLOW}Executando build no $DIR...${NC}"
            cd "$DIR"
            if npm run build 2>&1 | tee -a "../$LOG_FILE"; then
                log "${GREEN}   ✅ Build $DIR concluído${NC}"
                BUILD_SUCCESS=true
            else
                log "${RED}   ❌ Build $DIR falhou${NC}"
            fi
            cd ..
        fi
    fi
done

if [ "$BUILD_SUCCESS" = false ]; then
    log "${RED}❌ Nenhum build foi executado com sucesso${NC}"
    read -p "Continuar mesmo assim? (s/N): " CONTINUE_NO_BUILD
    if [ "$CONTINUE_NO_BUILD" != "s" ] && [ "$CONTINUE_NO_BUILD" != "S" ]; then
        log "${RED}Deploy cancelado${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 5: DEPLOY
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [5/7] DEPLOY${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

DEPLOY_SUCCESS=false

# Detectar método de deploy
DEPLOY_METHOD=""

# Verificar Docker Swarm
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    DEPLOY_METHOD="swarm"
    log "${CYAN}   Método detectado: Docker Swarm${NC}"
# Verificar Docker Compose
elif [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    DEPLOY_METHOD="compose"
    log "${CYAN}   Método detectado: Docker Compose${NC}"
else
    log "${YELLOW}   ⚠️ Método de deploy não detectado${NC}"
fi

case $DEPLOY_METHOD in
    "swarm")
        log "${YELLOW}Executando deploy no Docker Swarm...${NC}"
        
        # Procurar arquivo de stack
        STACK_FILE=""
        [ -f "docker-stack.yml" ] && STACK_FILE="docker-stack.yml"
        [ -f "docker-compose.prod.yml" ] && STACK_FILE="docker-compose.prod.yml"
        [ -f "docker-compose.yml" ] && STACK_FILE="docker-compose.yml"
        
        if [ -n "$STACK_FILE" ]; then
            STACK_NAME=$(echo "Sistema Dash Braip" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
            
            log "${CYAN}   Stack: $STACK_NAME${NC}"
            log "${CYAN}   Arquivo: $STACK_FILE${NC}"
            
            if docker stack deploy -c "$STACK_FILE" "$STACK_NAME" 2>&1 | tee -a "$LOG_FILE"; then
                log "${GREEN}   ✅ Deploy Swarm concluído${NC}"
                DEPLOY_SUCCESS=true
            else
                log "${RED}   ❌ Deploy Swarm falhou${NC}"
            fi
        else
            log "${RED}   ❌ Arquivo de stack não encontrado${NC}"
        fi
        ;;
        
    "compose")
        log "${YELLOW}Executando docker compose up...${NC}"
        
        if docker compose up -d --force-recreate 2>&1 | tee -a "$LOG_FILE"; then
            log "${GREEN}   ✅ Deploy Compose concluído${NC}"
            DEPLOY_SUCCESS=true
        else
            log "${RED}   ❌ Deploy Compose falhou${NC}"
        fi
        ;;
        
    *)
        log "${YELLOW}Tentando deploy manual...${NC}"
        
        # Tentar PM2 se disponível
        if command -v pm2 &> /dev/null; then
            if pm2 restart all 2>&1 | tee -a "$LOG_FILE"; then
                log "${GREEN}   ✅ Deploy PM2 concluído${NC}"
                DEPLOY_SUCCESS=true
            fi
        fi
        ;;
esac

if [ "$DEPLOY_SUCCESS" = false ]; then
    log "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    log "${RED}║   ❌ DEPLOY FALHOU                                                            ║${NC}"
    log "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log "${YELLOW}Para fazer rollback, execute:${NC}"
    log "${CYAN}   ./DEPLOY_SAFE.sh --rollback${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 6: HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [6/7] HEALTH CHECK${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

log "${YELLOW}Aguardando containers iniciarem (30s)...${NC}"
sleep 30

HEALTH_OK=true

# Verificar containers rodando
log "${YELLOW}Verificando containers...${NC}"
RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | wc -l)
log "${CYAN}   Containers rodando: $RUNNING_CONTAINERS${NC}"

# Verificar logs por erros
log "${YELLOW}Verificando logs por erros críticos...${NC}"
ERROR_COUNT=0

for CONTAINER in $(docker ps --format "{{.Names}}" | head -5); do
    ERRORS=$(docker logs "$CONTAINER" --tail 50 2>&1 | grep -i "error\|fatal\|exception" | wc -l)
    if [ "$ERRORS" -gt 0 ]; then
        log "${RED}   ⚠️ $CONTAINER: $ERRORS erros nos logs${NC}"
        ((ERROR_COUNT += ERRORS))
    else
        log "${GREEN}   ✅ $CONTAINER: Sem erros críticos${NC}"
    fi
done

# Health check de endpoints
log ""
log "${YELLOW}Testando endpoints...${NC}"

# Tentar detectar porta
PORT=""
if [ -f ".env" ]; then
    PORT=$(grep -E "^PORT=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi
[ -z "$PORT" ] && PORT="3000"

ENDPOINTS=("/health" "/api/health" "/" "/api")

for ENDPOINT in "${ENDPOINTS[@]}"; do
    URL="http://localhost:${PORT}${ENDPOINT}"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --max-time 10 2>/dev/null || echo "000")
    
    if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ]; then
        log "${GREEN}   ✅ $ENDPOINT → $STATUS${NC}"
    elif [ "$STATUS" = "000" ]; then
        log "${YELLOW}   ⚠️ $ENDPOINT → Timeout/Não respondeu${NC}"
    else
        log "${RED}   ❌ $ENDPOINT → $STATUS${NC}"
        HEALTH_OK=false
    fi
done

# Verificar data do container (deve ser recente)
log ""
log "${YELLOW}Verificando data dos containers...${NC}"

for CONTAINER in $(docker ps --format "{{.Names}}" | head -3); do
    CREATED=$(docker inspect --format='{{.Created}}' "$CONTAINER" 2>/dev/null | cut -d'T' -f1)
    TODAY=$(date +%Y-%m-%d)
    
    if [ "$CREATED" = "$TODAY" ]; then
        log "${GREEN}   ✅ $CONTAINER criado hoje ($CREATED)${NC}"
    else
        log "${YELLOW}   ⚠️ $CONTAINER criado em $CREATED${NC}"
    fi
done

# Decisão baseada no health check
if [ "$HEALTH_OK" = false ] || [ "$ERROR_COUNT" -gt 5 ]; then
    log ""
    log "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    log "${RED}║   ⚠️ HEALTH CHECK FALHOU - CONSIDERE ROLLBACK!                               ║${NC}"
    log "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    
    read -p "Executar rollback automático? (S/n): " DO_ROLLBACK
    if [ "$DO_ROLLBACK" != "n" ] && [ "$DO_ROLLBACK" != "N" ]; then
        log "${YELLOW}Executando rollback...${NC}"
        ./DEPLOY_SAFE.sh --rollback
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ETAPA 7: FINALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
log "${BLUE}   [7/7] FINALIZAÇÃO${NC}"
log "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Registrar deploy no CHANGELOG
if [ -f "CHANGELOG.md" ]; then
    log "${YELLOW}Registrando deploy no CHANGELOG.md...${NC}"
    DEPLOY_ENTRY="- [$(date '+%Y-%m-%d %H:%M')] Deploy realizado via DEPLOY_SAFE.sh"
    sed -i "/^## /a $DEPLOY_ENTRY" CHANGELOG.md 2>/dev/null || true
fi

# Limpar backups antigos (manter últimos 10)
log "${YELLOW}Limpando backups antigos...${NC}"
if [ -d "$BACKUP_DIR" ]; then
    ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    log "${GREEN}   ✅ Backups antigos removidos (mantidos últimos 10)${NC}"
fi

# Resultado final
echo ""
log "${GREEN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
log "${GREEN}║                                                                               ║${NC}"
log "${GREEN}║   🎉 DEPLOY CONCLUÍDO COM SUCESSO!                                            ║${NC}"
log "${GREEN}║                                                                               ║${NC}"
log "${GREEN}╠═══════════════════════════════════════════════════════════════════════════════╣${NC}"
log "${GREEN}║                                                                               ║${NC}"
log "${GREEN}║   📋 Resumo:                                                                  ║${NC}"
log "${GREEN}║      • Projeto: Sistema Dash Braip${NC}"
log "${GREEN}║      • Timestamp: $TIMESTAMP${NC}"
log "${GREEN}║      • Método: $DEPLOY_METHOD${NC}"
log "${GREEN}║      • Backup: $BACKUP_DIR${NC}"
log "${GREEN}║      • Log: $LOG_FILE${NC}"
log "${GREEN}║                                                                               ║${NC}"
log "${GREEN}║   🔙 Para rollback:                                                           ║${NC}"
log "${GREEN}║      ./DEPLOY_SAFE.sh --rollback                                              ║${NC}"
log "${GREEN}║                                                                               ║${NC}"
log "${GREEN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log "${CYAN}📊 Monitorar nos próximos 5 minutos para garantir estabilidade${NC}"
echo ""

exit 0
