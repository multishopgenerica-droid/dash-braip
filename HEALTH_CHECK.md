# 🏥 HEALTH_CHECK.md - Sistema Dash Braip

> Verificações obrigatórias APÓS cada deploy.
> Se alguma falhar → ROLLBACK imediato!

---

## 🔍 VERIFICAÇÃO RÁPIDA (executar após deploy)

```bash
# 1. Verificar se containers estão rodando
docker ps | grep -E "backend|frontend"

# 2. Verificar logs por erros
docker logs $(docker ps -q --filter name=backend) --tail 50 2>&1 | grep -i error

# 3. Testar endpoint de saúde
curl -s http://localhost:3000/health || echo "❌ FALHOU"

# 4. Verificar data do container (deve ser recente)
docker inspect --format='{{.Created}}' $(docker ps -q --filter name=backend)
```

---

## 📋 ENDPOINTS PARA VERIFICAR

| # | Endpoint | Método | Resposta Esperada | Crítico |
|---|----------|--------|-------------------|---------|
| 1 | /health | GET | 200 OK | ✅ SIM |
| 2 | /api/health | GET | 200 OK | ✅ SIM |
| 3 | /api/auth/status | GET | 200/401 | ✅ SIM |
| 4 | / (frontend) | GET | 200 OK | ✅ SIM |

---

## 🤖 SCRIPT DE HEALTH CHECK AUTOMÁTICO

```bash
#!/bin/bash
# Salvar como: health-check.sh

BASE_URL="${1:-http://localhost:3000}"
ERRORS=0

echo "🏥 Verificando saúde de $BASE_URL..."

# Verificar endpoints
endpoints=("/health" "/api/health" "/")

for endpoint in "${endpoints[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 400 ]; then
        echo "✅ $endpoint → $STATUS"
    else
        echo "❌ $endpoint → $STATUS"
        ((ERRORS++))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "✅ TODOS OS ENDPOINTS SAUDÁVEIS!"
    exit 0
else
    echo ""
    echo "❌ $ERRORS ENDPOINT(S) COM PROBLEMA!"
    echo "🔙 CONSIDERE FAZER ROLLBACK!"
    exit 1
fi
```

---

## 📊 STATUS ATUAL

### Última Verificação: 2026-01-26

| Serviço | Status | Última Checagem |
|---------|--------|-----------------|
| Backend | 🟢 OK | - |
| Frontend | 🟢 OK | - |
| Database | 🟢 OK | - |
| Redis | ⚪ N/A | - |

---

## 🚨 SE HEALTH CHECK FALHAR

1. **NÃO ENTRE EM PÂNICO**
2. Verifique os logs: `docker logs CONTAINER --tail 100`
3. Se for crítico: **ROLLBACK IMEDIATO** (ver ROLLBACK.md)
4. Se for menor: investigar e corrigir
5. Documentar o problema

---

## 📈 MÉTRICAS A MONITORAR

| Métrica | Limite Aceitável | Crítico |
|---------|------------------|---------|
| Response Time | < 500ms | > 2s |
| Error Rate | < 1% | > 5% |
| CPU | < 70% | > 90% |
| Memory | < 80% | > 95% |

---

## 🔗 INTEGRAÇÕES EXTERNAS

| Serviço | Endpoint de Teste | Status |
|---------|-------------------|--------|
| Database | `SELECT 1` | - |
| Redis | `PING` | - |
| Storage | - | - |

---

*Última atualização: 2026-01-26*
