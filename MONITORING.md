# 📊 MONITORING.md - Sistema Dash Braip

> **MONITORAMENTO CONTÍNUO - CAMADA 7 DO SISTEMA ENTERPRISE**
> Detectar problemas ANTES que os usuários percebam.

---

## 🎯 FILOSOFIA DE MONITORAMENTO

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   "Se não está sendo monitorado, não está em produção"                        ║
║                                                                               ║
║   • Detectar problemas em SEGUNDOS, não em horas                              ║
║   • Alertar as pessoas CERTAS no momento CERTO                                ║
║   • Ter DADOS para entender o que aconteceu                                   ║
║   • Prevenir é melhor que remediar                                            ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📈 MÉTRICAS ESSENCIAIS

### 🔴 MÉTRICAS CRÍTICAS (Alertar imediatamente)

| Métrica | Limite OK | Warning | Crítico | Ação |
|---------|-----------|---------|---------|------|
| **Uptime** | 100% | < 99.9% | < 99% | Investigar AGORA |
| **Error Rate** | < 0.1% | > 1% | > 5% | Verificar logs |
| **Response Time (P95)** | < 200ms | > 500ms | > 2s | Otimizar |
| **CPU** | < 50% | > 70% | > 90% | Escalar |
| **Memory** | < 60% | > 80% | > 95% | Investigar leak |
| **Disk** | < 70% | > 85% | > 95% | Limpar/Expandir |
| **Database Connections** | < 50% | > 70% | > 90% | Pool/Escalar |

### 🟡 MÉTRICAS DE NEGÓCIO (Monitorar tendências)

| Métrica | O que indica |
|---------|--------------|
| Requests/min | Volume de uso |
| Usuários ativos | Engajamento |
| Taxa de conversão | Saúde do funil |
| Erros de pagamento | Problemas financeiros |
| Tempo de sessão | Experiência do usuário |

---

## 🔔 CONFIGURAÇÃO DE ALERTAS

### Discord Webhook (Recomendado)

```bash
# Configurar no .env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXX/YYY

# Canais sugeridos:
# #alertas-criticos  → Erros graves, downtime
# #alertas-warning   → Warnings, degradação
# #deploys           → Notificações de deploy
# #logs              → Logs importantes
```

### Script de Alerta Discord

```bash
#!/bin/bash
# alert-discord.sh

WEBHOOK_URL="$DISCORD_WEBHOOK_URL"
LEVEL="$1"      # info, warning, error, critical
MESSAGE="$2"
PROJECT="Sistema Dash Braip"

# Cores por nível
case $LEVEL in
    "info")     COLOR=3447003 ;;    # Azul
    "warning")  COLOR=16776960 ;;   # Amarelo
    "error")    COLOR=15158332 ;;   # Vermelho
    "critical") COLOR=10038562 ;;   # Vermelho escuro
    *)          COLOR=9807270 ;;    # Cinza
esac

# Emoji por nível
case $LEVEL in
    "info")     EMOJI="ℹ️" ;;
    "warning")  EMOJI="⚠️" ;;
    "error")    EMOJI="❌" ;;
    "critical") EMOJI="🚨" ;;
    *)          EMOJI="📢" ;;
esac

# Enviar para Discord
curl -H "Content-Type: application/json" \
     -d "{
       \"embeds\": [{
         \"title\": \"$EMOJI [$LEVEL] $PROJECT\",
         \"description\": \"$MESSAGE\",
         \"color\": $COLOR,
         \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
         \"footer\": {\"text\": \"Enterprise Monitoring v5.0\"}
       }]
     }" \
     "$WEBHOOK_URL"
```

### Uso do Alerta

```bash
# Exemplos de uso
./alert-discord.sh "info" "Deploy iniciado"
./alert-discord.sh "warning" "CPU em 75%"
./alert-discord.sh "error" "5 erros de pagamento nos últimos 5min"
./alert-discord.sh "critical" "Sistema FORA DO AR!"
```

---

## 🖥️ SCRIPT DE MONITORAMENTO CONTÍNUO

```bash
#!/bin/bash
# monitor.sh - Executar via cron a cada minuto

PROJECT="Sistema Dash Braip"
LOG_FILE="/var/log/monitor_${PROJECT}.log"
ALERT_SCRIPT="./alert-discord.sh"

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 1. Verificar se containers estão rodando
CONTAINERS_DOWN=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | wc -l)
if [ "$CONTAINERS_DOWN" -gt 0 ]; then
    log "CRITICAL: $CONTAINERS_DOWN containers parados"
    $ALERT_SCRIPT "critical" "$CONTAINERS_DOWN containers estão parados!"
fi

# 2. Verificar CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    log "CRITICAL: CPU em ${CPU_USAGE}%"
    $ALERT_SCRIPT "critical" "CPU em ${CPU_USAGE}%"
elif (( $(echo "$CPU_USAGE > 70" | bc -l) )); then
    log "WARNING: CPU em ${CPU_USAGE}%"
    $ALERT_SCRIPT "warning" "CPU em ${CPU_USAGE}%"
fi

# 3. Verificar Memória
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
if (( $(echo "$MEM_USAGE > 95" | bc -l) )); then
    log "CRITICAL: Memória em ${MEM_USAGE}%"
    $ALERT_SCRIPT "critical" "Memória em ${MEM_USAGE}%"
elif (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    log "WARNING: Memória em ${MEM_USAGE}%"
    $ALERT_SCRIPT "warning" "Memória em ${MEM_USAGE}%"
fi

# 4. Verificar Disco
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 95 ]; then
    log "CRITICAL: Disco em ${DISK_USAGE}%"
    $ALERT_SCRIPT "critical" "Disco em ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 85 ]; then
    log "WARNING: Disco em ${DISK_USAGE}%"
    $ALERT_SCRIPT "warning" "Disco em ${DISK_USAGE}%"
fi

# 5. Verificar endpoint de saúde
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health --max-time 10)
if [ "$HEALTH_STATUS" != "200" ]; then
    log "CRITICAL: Health check falhou (status: $HEALTH_STATUS)"
    $ALERT_SCRIPT "critical" "Health check falhou! Status: $HEALTH_STATUS"
fi

# 6. Verificar erros nos logs (últimos 5 min)
ERROR_COUNT=$(docker logs $(docker ps -q | head -1) --since 5m 2>&1 | grep -ci "error" || echo "0")
if [ "$ERROR_COUNT" -gt 10 ]; then
    log "ERROR: $ERROR_COUNT erros nos últimos 5 minutos"
    $ALERT_SCRIPT "error" "$ERROR_COUNT erros nos últimos 5 minutos"
fi

log "Check completo - CPU:${CPU_USAGE}% MEM:${MEM_USAGE}% DISK:${DISK_USAGE}%"
```

### Configurar Cron

```bash
# Editar crontab
crontab -e

# Adicionar (executar a cada minuto)
* * * * * /path/to/monitor.sh

# Ou a cada 5 minutos (menos agressivo)
*/5 * * * * /path/to/monitor.sh
```

---

## 📋 DASHBOARD DE STATUS

### Template de Status Page

```markdown
# 🟢 Status - Sistema Dash Braip

**Última atualização:** [timestamp]

## Serviços

| Serviço | Status | Uptime 24h | Response Time |
|---------|--------|------------|---------------|
| API Backend | 🟢 Operacional | 99.99% | 45ms |
| Frontend | 🟢 Operacional | 100% | 120ms |
| Database | 🟢 Operacional | 99.99% | 5ms |
| Cache Redis | 🟢 Operacional | 100% | 2ms |

## Incidentes Recentes

| Data | Descrição | Duração | Status |
|------|-----------|---------|--------|
| - | Nenhum incidente recente | - | ✅ |

## Manutenções Programadas

| Data | Descrição | Duração Estimada |
|------|-----------|------------------|
| - | Nenhuma manutenção programada | - |
```

---

## 🔍 LOGS CENTRALIZADOS

### Estrutura de Logs Recomendada

```javascript
// Padrão de log estruturado
const log = {
  timestamp: "2024-01-26T10:30:00Z",
  level: "error",           // debug, info, warn, error, fatal
  service: "backend",
  module: "auth",
  action: "login",
  userId: "user_123",
  requestId: "req_abc",
  duration: 150,            // ms
  status: 401,
  message: "Login failed - invalid password",
  metadata: {
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0..."
  }
};
```

### Comandos Úteis de Log

```bash
# Ver logs em tempo real
docker logs -f CONTAINER_NAME

# Logs dos últimos 30 minutos
docker logs --since 30m CONTAINER_NAME

# Filtrar apenas erros
docker logs CONTAINER_NAME 2>&1 | grep -i error

# Contar erros por hora
docker logs CONTAINER_NAME 2>&1 | grep -i error | cut -d'T' -f1-2 | uniq -c

# Salvar logs para análise
docker logs CONTAINER_NAME > logs_$(date +%Y%m%d).txt 2>&1
```

---

## 📊 CHECKLIST DE MONITORAMENTO

### Setup Inicial
- [ ] Discord Webhook configurado
- [ ] Script monitor.sh criado
- [ ] Cron configurado
- [ ] Endpoints de health check implementados
- [ ] Logs estruturados configurados

### Diário
- [ ] Verificar dashboard de status
- [ ] Revisar alertas das últimas 24h
- [ ] Verificar uso de recursos

### Semanal
- [ ] Analisar tendências de métricas
- [ ] Revisar logs de erro
- [ ] Atualizar INCIDENT_LOG.md se necessário
- [ ] Limpar logs antigos

### Mensal
- [ ] Revisar thresholds de alertas
- [ ] Analisar performance histórica
- [ ] Planejar melhorias de infraestrutura

---

## 🚨 RESPOSTA A INCIDENTES

### Severidade dos Incidentes

| Severidade | Descrição | Tempo de Resposta | Exemplo |
|------------|-----------|-------------------|---------|
| **SEV1** | Sistema totalmente fora | < 15 min | Site down |
| **SEV2** | Funcionalidade crítica afetada | < 30 min | Pagamentos falhando |
| **SEV3** | Funcionalidade secundária afetada | < 2h | Relatórios lentos |
| **SEV4** | Problema menor | < 24h | Bug visual |

### Fluxo de Resposta

```
ALERTA RECEBIDO
      │
      ▼
┌─────────────────┐
│ 1. ACKNOWLEDGE  │ ← Confirmar que viu (< 5 min)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. DIAGNOSTICAR │ ← Entender o problema
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. COMUNICAR    │ ← Informar stakeholders
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. RESOLVER     │ ← Fix ou rollback
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. DOCUMENTAR   │ ← INCIDENT_LOG.md
└─────────────────┘
```

---

## 🔗 INTEGRAÇÕES RECOMENDADAS

| Ferramenta | Uso | Prioridade |
|------------|-----|------------|
| **Discord** | Alertas e comunicação | 🔴 Alta |
| **Uptime Robot** | Monitoramento externo | 🔴 Alta |
| **Grafana** | Dashboards | 🟡 Média |
| **Prometheus** | Coleta de métricas | 🟡 Média |
| **Sentry** | Error tracking | 🟡 Média |
| **Datadog** | APM completo | 🟢 Baixa (pago) |

---

*Última atualização: 2026-01-26*
