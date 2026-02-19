#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFY-DISCORD.sh - Envia notificações para Discord
# Multi-Agent System v6.1 - Enforcement Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

# Webhook URL (defina via variável de ambiente ou .env)
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# Verificar se webhook está configurado
if [ -z "$WEBHOOK_URL" ]; then
    # Tentar carregar do .env
    if [ -f ".env" ]; then
        source .env 2>/dev/null || true
        WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
    fi
    
    if [ -z "$WEBHOOK_URL" ]; then
        echo "❌ DISCORD_WEBHOOK_URL não configurado!"
        echo "   Configure via: export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FUNÇÕES
# ═══════════════════════════════════════════════════════════════════════════════

send_message() {
    local message="$1"
    curl -s -H "Content-Type: application/json" \
        -d "{\"content\": \"$message\"}" \
        "$WEBHOOK_URL"
}

send_embed() {
    local title="$1"
    local description="$2"
    local color="$3"  # Decimal color
    local fields="$4" # JSON array of fields
    
    local payload="{
        \"embeds\": [{
            \"title\": \"$title\",
            \"description\": \"$description\",
            \"color\": $color,
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            ${fields:+,\"fields\": $fields}
        }]
    }"
    
    curl -s -H "Content-Type: application/json" \
        -d "$payload" \
        "$WEBHOOK_URL"
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATES DE NOTIFICAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

notify_deploy_start() {
    local env="$1"
    local version="$2"
    send_embed \
        "🚀 Deploy Iniciado" \
        "Iniciando deploy para **$env**" \
        "3447003" \
        "[{\"name\":\"Ambiente\",\"value\":\"$env\",\"inline\":true},{\"name\":\"Versão\",\"value\":\"$version\",\"inline\":true}]"
}

notify_deploy_success() {
    local env="$1"
    local version="$2"
    local duration="$3"
    send_embed \
        "✅ Deploy Concluído" \
        "Deploy para **$env** finalizado com sucesso!" \
        "3066993" \
        "[{\"name\":\"Ambiente\",\"value\":\"$env\",\"inline\":true},{\"name\":\"Versão\",\"value\":\"$version\",\"inline\":true},{\"name\":\"Duração\",\"value\":\"$duration\",\"inline\":true}]"
}

notify_deploy_failure() {
    local env="$1"
    local error="$2"
    send_embed \
        "❌ Deploy Falhou" \
        "Deploy para **$env** falhou!" \
        "15158332" \
        "[{\"name\":\"Ambiente\",\"value\":\"$env\",\"inline\":true},{\"name\":\"Erro\",\"value\":\"$error\",\"inline\":false}]"
}

notify_rollback() {
    local env="$1"
    local from_version="$2"
    local to_version="$3"
    send_embed \
        "🔄 Rollback Executado" \
        "Rollback realizado em **$env**" \
        "15105570" \
        "[{\"name\":\"De\",\"value\":\"$from_version\",\"inline\":true},{\"name\":\"Para\",\"value\":\"$to_version\",\"inline\":true}]"
}

notify_alert() {
    local severity="$1"  # critical, warning, info
    local title="$2"
    local message="$3"
    
    local color="3447003"  # blue (info)
    local emoji="ℹ️"
    
    case "$severity" in
        critical)
            color="15158332"  # red
            emoji="🚨"
            ;;
        warning)
            color="15105570"  # orange
            emoji="⚠️"
            ;;
    esac
    
    send_embed "$emoji $title" "$message" "$color"
}

notify_health_check() {
    local status="$1"  # healthy, unhealthy
    local details="$2"
    
    if [ "$status" = "healthy" ]; then
        send_embed "💚 Sistema Saudável" "$details" "3066993"
    else
        send_embed "💔 Sistema com Problemas" "$details" "15158332"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

show_help() {
    echo "Uso: $0 <comando> [argumentos]"
    echo ""
    echo "Comandos:"
    echo "  message <texto>              Envia mensagem simples"
    echo "  deploy-start <env> <version> Notifica início de deploy"
    echo "  deploy-success <env> <ver> <duration> Notifica sucesso"
    echo "  deploy-failure <env> <error> Notifica falha"
    echo "  rollback <env> <from> <to>   Notifica rollback"
    echo "  alert <severity> <title> <msg> Envia alerta"
    echo "  health <status> <details>    Status de saúde"
    echo ""
    echo "Exemplos:"
    echo "  $0 message 'Hello World!'"
    echo "  $0 deploy-start production v1.2.3"
    echo "  $0 alert critical 'CPU Alto' 'CPU em 95%!'"
}

case "$1" in
    message)
        send_message "$2"
        ;;
    deploy-start)
        notify_deploy_start "$2" "$3"
        ;;
    deploy-success)
        notify_deploy_success "$2" "$3" "$4"
        ;;
    deploy-failure)
        notify_deploy_failure "$2" "$3"
        ;;
    rollback)
        notify_rollback "$2" "$3" "$4"
        ;;
    alert)
        notify_alert "$2" "$3" "$4"
        ;;
    health)
        notify_health_check "$2" "$3"
        ;;
    *)
        show_help
        exit 1
        ;;
esac

echo "✅ Notificação enviada!"
