# 📚 Runbooks Index

> Multi-Agent System v7.0 - Enterprise Complete Edition

## Quick Reference

| Problema | Comando |
|----------|---------|
| Serviço não responde | `./scripts/runbooks/restart-service.sh` |
| Deploy falhou | `./scripts/runbooks/emergency-rollback.sh` |
| CPU/Memória alta | `./scripts/runbooks/scale-up.sh 5` |
| Disco cheio | `./scripts/runbooks/check-disk-space.sh` |
| Cache corrompido | `./scripts/runbooks/clear-cache.sh` |
| DB lento | Ver seção "Database" abaixo |

---

## 🚨 Emergências

### Serviço Down
```bash
# 1. Verificar status
docker service ls

# 2. Ver logs
docker service logs app --tail 100

# 3. Restart
./scripts/runbooks/restart-service.sh

# 4. Se não resolver, rollback
./scripts/runbooks/emergency-rollback.sh
```

### Deploy Falhou
```bash
# Rollback imediato
./scripts/runbooks/emergency-rollback.sh

# Verificar logs do deploy
cat logs/deploy-*.log | tail -50
```

### Alta Latência
```bash
# 1. Verificar métricas
curl localhost:9090/api/v1/query?query=http_request_duration_seconds

# 2. Escalar se necessário
./scripts/runbooks/scale-up.sh 5

# 3. Verificar banco
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

---

## 🗄️ Database

### Queries Lentas
```sql
-- Queries em execução
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '30 seconds';

-- Matar query específica
SELECT pg_terminate_backend(PID);
```

### Conexões Esgotadas
```sql
-- Ver conexões
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Liberar conexões idle
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';
```

### Restaurar Backup
```bash
./scripts/db/rollback-migration.sh restore
```

---

## 📊 Monitoramento

### Verificar Saúde
```bash
# Health check
curl -s localhost:3000/health | jq

# Métricas
curl -s localhost:3000/metrics | head -50

# Recursos
docker stats --no-stream
```

### Dashboards
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

---

## 📞 Escalation

| Nível | Quem | Quando |
|-------|------|--------|
| L1 | Dev de Plantão | Sempre |
| L2 | Tech Lead | > 15 min sem resolução |
| L3 | CTO | > 30 min, impacto crítico |
