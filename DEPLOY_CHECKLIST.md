# 🚀 DEPLOY CHECKLIST - Sistema Dash Braip

> Executar ANTES de qualquer deploy!

---

## 🔴 ITENS CRÍTICOS (obrigatórios)

| # | Item | Status |
|---|------|--------|
| 1 | 🧪 Testes passando? | ⬜ |
| 2 | 🔒 Sem vulnerabilidades críticas? | ⬜ |
| 3 | 📝 CHANGELOG atualizado? | ⬜ |
| 4 | 🗄️ Migrations executadas? | ⬜ |
| 5 | 🔧 Variáveis de ambiente corretas? | ⬜ |
| 6 | 💾 Backup do banco feito? | ⬜ |
| 7 | 🧹 Build sem erros? | ⬜ |
| 8 | 🔄 Plano de rollback definido? | ⬜ |

---

## 📊 RESULTADO

| Aprovados | Resultado |
|-----------|-----------|
| 8/8 | ✅ APROVADO - Pode fazer deploy |
| 6-7/8 | 🟡 RESSALVAS - Deploy com cuidado |
| <6/8 | 🔴 BLOQUEADO - NÃO fazer deploy |

---

## 🚀 COMANDOS DE DEPLOY

```bash
# 1. Build
docker compose build --no-cache [SERVICO]

# 2. Deploy
docker service update --force [STACK]_[SERVICO]

# 3. Verificar data do container (DEVE SER RECENTE!)
docker ps --format "table {{.Names}}\t{{.CreatedAt}}"

# 4. Verificar logs
docker service logs [STACK]_[SERVICO] --tail 50

# 5. Testar em produção
curl https://[URL]/api/health
```

---

## 🔄 ROLLBACK DE EMERGÊNCIA

```bash
# Reverter para commit anterior
git checkout [COMMIT_ANTERIOR]

# Rebuild e deploy
docker compose build --no-cache
docker service update --force [STACK]_[SERVICO]
```

---

*Última atualização: 2026-01-26*
