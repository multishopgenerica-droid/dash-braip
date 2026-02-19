#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RUNBOOK: check-disk-space.sh - Verifica e limpa espaço em disco
# Multi-Agent System v6.2 - Bulletproof Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

THRESHOLD="${1:-80}"  # Limite em %
AUTO_CLEAN="${2:-false}"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║   💾 RUNBOOK: Check Disk Space                                                ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar uso atual
echo "📊 Uso de disco atual:"
df -h | grep -E '^/dev|Filesystem'

# Verificar partição principal
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')

echo ""
echo "Uso da partição principal: ${USAGE}%"
echo "Threshold configurado: ${THRESHOLD}%"
echo ""

if [ "$USAGE" -ge "$THRESHOLD" ]; then
    echo "⚠️  ATENÇÃO: Disco acima do threshold!"
    echo ""
    
    # Mostrar maiores consumidores
    echo "📦 Maiores consumidores de espaço:"
    du -sh /* 2>/dev/null | sort -rh | head -10
    
    echo ""
    echo "🐳 Espaço usado pelo Docker:"
    docker system df 2>/dev/null || echo "Docker não disponível"
    
    if [ "$AUTO_CLEAN" = "true" ]; then
        echo ""
        echo "🧹 Executando limpeza automática..."
        
        # Limpar logs antigos
        find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
        echo "   ✅ Logs antigos removidos"
        
        # Limpar cache de pacotes
        apt-get clean 2>/dev/null || yum clean all 2>/dev/null || true
        echo "   ✅ Cache de pacotes limpo"
        
        # Limpar Docker
        if command -v docker &> /dev/null; then
            docker system prune -f --volumes 2>/dev/null || true
            docker image prune -a -f --filter "until=168h" 2>/dev/null || true
            echo "   ✅ Docker limpo"
        fi
        
        # Limpar temp
        find /tmp -type f -atime +7 -delete 2>/dev/null || true
        echo "   ✅ Arquivos temporários removidos"
        
        echo ""
        echo "📊 Uso após limpeza:"
        df -h /
    else
        echo "Para executar limpeza automática:"
        echo "  $0 $THRESHOLD true"
    fi
else
    echo "✅ Disco OK - abaixo do threshold"
fi
