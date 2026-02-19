# 🆘 DISASTER_RECOVERY.md - Plano de Recuperação de Desastres

> **Objetivo:** Restaurar operações o mais rápido possível após qualquer incidente
> **Mantra:** "Planejar para o pior, esperar o melhor"

---

## 📊 CLASSIFICAÇÃO DE DESASTRES

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║   NÍVEIS DE SEVERIDADE                                                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   🔴 SEV1 - CRÍTICO                                                           ║
║   • Sistema completamente fora do ar                                          ║
║   • Perda de dados em andamento                                               ║
║   • Impacto financeiro imediato                                               ║
║   • RTO: 15 minutos | RPO: 1 hora                                             ║
║                                                                               ║
║   🟠 SEV2 - ALTO                                                              ║
║   • Funcionalidade crítica indisponível                                       ║
║   • Performance severamente degradada                                         ║
║   • Afeta maioria dos usuários                                                ║
║   • RTO: 30 minutos | RPO: 4 horas                                            ║
║                                                                               ║
║   🟡 SEV3 - MÉDIO                                                             ║
║   • Funcionalidade secundária afetada                                         ║
║   • Workaround disponível                                                     ║
║   • Afeta alguns usuários                                                     ║
║   • RTO: 2 horas | RPO: 24 horas                                              ║
║                                                                               ║
║   🟢 SEV4 - BAIXO                                                             ║
║   • Problema cosmético/menor                                                  ║
║   • Não afeta operações                                                       ║
║   • RTO: 24 horas | RPO: 48 horas                                             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

RTO = Recovery Time Objective (tempo máximo para restaurar)
RPO = Recovery Point Objective (perda máxima aceitável de dados)
```

---

## 🚨 PROCEDIMENTO DE EMERGÊNCIA GERAL

### Passo 1: Não Entre em Pânico!

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║   🧘 MANTENHA A CALMA                                                         ║
║                                                                               ║
║   • Respire fundo                                                             ║
║   • Não tome decisões precipitadas                                            ║
║   • Siga este documento passo a passo                                         ║
║   • Documente TUDO que fizer                                                  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Passo 2: Identificar e Classificar

1. O que está acontecendo exatamente?
2. Quando começou?
3. Qual é o impacto?
4. Quantos usuários afetados?
5. Qual severidade (SEV1-4)?

### Passo 3: Comunicar

```
COMUNICAÇÃO IMEDIATA:

1. Slack/Discord do time: "🚨 INCIDENTE SEV[X]: [descrição breve]"
2. Stakeholders (se SEV1/2)
3. Atualização a cada 15 minutos
```

### Passo 4: Mitigar

- SEV1/2: Primeiro ESTABILIZAR, depois investigar causa raiz
- SEV3/4: Pode investigar enquanto monitora

### Passo 5: Resolver

- Aplicar fix
- Verificar resolução
- Monitorar por 30 minutos

### Passo 6: Documentar

- Preencher INCIDENT_LOG.md
- Agendar post-mortem (SEV1/2)

---

## 🔥 CENÁRIOS DE DESASTRE E RESPOSTAS

### Cenário 1: Servidor/Aplicação Caiu

**Sintomas:**
- Site/API não responde
- Containers reiniciando

**Diagnóstico:**
```bash
# 1. Verificar status dos containers
docker ps -a

# 2. Ver logs
docker logs <container> --tail 200

# 3. Verificar recursos
docker stats
free -m
df -h
```

**Resolução:**

```bash
# Opção A: Reiniciar serviço
docker compose restart app

# Opção B: Rebuild completo
docker compose down
docker compose up -d --build

# Opção C: Rollback para versão anterior
git checkout HEAD~1
docker compose up -d --build

# Opção D: Usar DEPLOY_SAFE.sh
./DEPLOY_SAFE.sh --rollback
```

---

### Cenário 2: Banco de Dados Corrompido/Inacessível

**Sintomas:**
- Erros de conexão com banco
- Queries falhando
- Dados inconsistentes

**Diagnóstico:**
```bash
# 1. Verificar container do banco
docker logs postgres --tail 100

# 2. Testar conexão
psql -h localhost -U user -d dbname -c "SELECT 1"

# 3. Verificar espaço em disco
docker exec postgres df -h
```

**Resolução:**

```bash
# Se container travou:
docker restart postgres
# Aguardar 30s

# Se banco corrompido, restaurar backup:
# 1. Parar aplicação
docker compose stop app

# 2. Listar backups disponíveis
ls -la backups/

# 3. Restaurar último backup válido
gunzip -c backups/db_TIMESTAMP.sql.gz | docker exec -i postgres psql -U user -d dbname

# 4. Reiniciar aplicação
docker compose up -d app
```

---

### Cenário 3: Disco Cheio

**Sintomas:**
- Erros de "No space left on device"
- Banco não aceita writes
- Logs param de ser gravados

**Resolução Imediata:**
```bash
# 1. Verificar uso
df -h

# 2. Identificar maiores consumidores
du -sh /* 2>/dev/null | sort -hr | head -20

# 3. Limpar Docker (CUIDADO!)
docker system prune -f
docker volume prune -f

# 4. Limpar logs antigos
find /var/log -name "*.log" -mtime +7 -delete
truncate -s 0 /var/log/syslog

# 5. Limpar backups antigos (manter últimos 5)
ls -t backups/*.sql.gz | tail -n +6 | xargs rm -f
```

---

### Cenário 4: Ataque DDoS / Sobrecarga

**Sintomas:**
- Resposta muito lenta
- Timeouts frequentes
- CPU/memória no limite

**Resolução Imediata:**
```bash
# 1. Ativar modo manutenção (se disponível)
# Ex: criar arquivo /maintenance.html

# 2. Bloquear IPs suspeitos (se identificados)
# No firewall ou Cloudflare

# 3. Escalar horizontalmente (se possível)
docker service scale app=5

# 4. Ativar rate limiting mais agressivo
```

---

### Cenário 5: Credenciais Vazadas

**Sintomas:**
- Alerta de segurança
- Commit com secrets
- Acesso não autorizado

**AÇÃO IMEDIATA:**
```bash
# 1. REVOGAR CREDENCIAIS IMEDIATAMENTE
# - API keys
# - Senhas de banco
# - Tokens de acesso
# (Fazer isso no painel de cada serviço)

# 2. Gerar novas credenciais

# 3. Atualizar .env em todos os ambientes

# 4. Fazer deploy com novas credenciais

# 5. Auditar acessos
# - Verificar logs de acesso
# - Identificar uso indevido

# 6. Se código foi commitado com secrets:
# (Não adianta apenas remover - histórico Git guarda)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch arquivo-com-secrets" \
  --prune-empty --tag-name-filter cat -- --all
git push --force --all
```

---

### Cenário 6: Dados Deletados Acidentalmente

**Sintomas:**
- Registros sumiram
- Tabela/collection vazia
- Usuário reportou perda de dados

**Resolução:**
```bash
# 1. PARE! Não faça mais nada no banco

# 2. Identificar momento da deleção
# - Logs da aplicação
# - Logs do banco

# 3. Avaliar opções:

# Opção A: Point-in-time recovery (se configurado)
# Usar WAL do PostgreSQL para restaurar até momento específico

# Opção B: Restaurar backup completo
docker compose stop app
gunzip -c backups/db_PRE_DELEÇÃO.sql.gz | psql ...
docker compose up -d app

# Opção C: Restaurar apenas tabela afetada
# Extrair tabela do backup e importar
```

---

## 💾 ESTRATÉGIA DE BACKUP

### Frequência Recomendada

| Tipo | Frequência | Retenção | Destino |
|------|------------|----------|---------|
| Full DB | Diário 3h | 30 dias | S3/Remoto |
| Incremental | 6 em 6h | 7 dias | Local + S3 |
| Arquivos | Diário | 30 dias | S3 |
| Configs | A cada mudança | Indefinido | Git |

### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
S3_BUCKET=s3://meu-bucket/backups

# Backup do banco
docker exec postgres pg_dump -U user dbname | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Upload para S3
aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz $S3_BUCKET/

# Limpar backups locais antigos (manter 7 dias)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup concluído: db_$TIMESTAMP.sql.gz"
```

### Testar Restauração

```
⚠️ IMPORTANTE: Testar restauração MENSALMENTE!

1. Pegar backup aleatório
2. Restaurar em ambiente isolado
3. Verificar integridade dos dados
4. Documentar resultado
```

---

## 📞 CONTATOS DE EMERGÊNCIA

| Função | Nome | Telefone | Quando acionar |
|--------|------|----------|----------------|
| Dev Lead | [Nome] | [Tel] | SEV1/2 |
| DevOps | [Nome] | [Tel] | Infra down |
| DBA | [Nome] | [Tel] | Banco corrompido |
| Segurança | [Nome] | [Tel] | Vazamento/Ataque |
| Gerente | [Nome] | [Tel] | SEV1 prolongado |

### Serviços Externos

| Serviço | Suporte | Nível |
|---------|---------|-------|
| AWS | aws.amazon.com/support | Business |
| Cloudflare | support.cloudflare.com | Pro |
| Banco (ex: Neon) | [link suporte] | [nível] |

---

## 📋 CHECKLIST PÓS-INCIDENTE

### Imediato (até 24h)

- [ ] Sistema estabilizado
- [ ] Comunicação enviada para afetados
- [ ] INCIDENT_LOG.md atualizado
- [ ] Monitoramento reforçado

### Curto prazo (até 1 semana)

- [ ] Post-mortem realizado (SEV1/2)
- [ ] Causa raiz identificada
- [ ] Ações preventivas definidas
- [ ] Timeline documentada

### Médio prazo (até 1 mês)

- [ ] Ações preventivas implementadas
- [ ] Documentação atualizada
- [ ] Treinamento do time (se necessário)
- [ ] Revisão de processos

---

## 🔄 RUNBOOKS

### Runbook: Reiniciar Produção

```bash
# 1. Comunicar
echo "🔄 Iniciando restart de produção"

# 2. Colocar em manutenção (se disponível)

# 3. Restart gradual
docker compose restart redis
sleep 10
docker compose restart postgres
sleep 30
docker compose restart app
sleep 10

# 4. Verificar saúde
curl http://localhost:3000/health

# 5. Comunicar conclusão
echo "✅ Restart concluído"
```

### Runbook: Failover para Backup

```bash
# 1. Identificar que primário está down

# 2. Promover réplica (se houver)
# Específico por banco (consultar docs)

# 3. Atualizar DNS/Load Balancer
# Apontar para novo primário

# 4. Notificar time

# 5. Planejar reconstrução do primário
```

---

## 📊 MÉTRICAS PARA MONITORAR

### Indicadores de Problema

| Métrica | Normal | Alerta | Crítico |
|---------|--------|--------|---------|
| Error rate | < 0.1% | > 1% | > 5% |
| Latência p99 | < 500ms | > 1s | > 5s |
| CPU | < 60% | > 80% | > 95% |
| Memória | < 70% | > 85% | > 95% |
| Disco | < 70% | > 85% | > 95% |
| Conexões DB | < 70% | > 85% | > 95% |

### Alertas Configurados

```yaml
# Exemplo: Prometheus/Alertmanager
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Alto índice de erros"
```

---

## 🔐 SEGURANÇA EM DESASTRES

### Princípios

1. **Menor privilégio:** Mesmo em emergência, usar credenciais mínimas necessárias
2. **Audit trail:** Logar TUDO que fizer durante incidente
3. **Dois pares de olhos:** Ações críticas com segundo aprovador
4. **Comunicação segura:** Não enviar credenciais por canais inseguros

### Acesso de Emergência

```
⚠️ Credenciais de emergência devem:
- Ser guardadas em local seguro (cofre físico ou digital)
- Ser atualizadas após cada uso
- Ter uso logado automaticamente
- Requerer justificativa
```

---

*Em caso de desastre: CALMA, PROCESSO, DOCUMENTAÇÃO! 🆘*
