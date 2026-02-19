# 🔙 ROLLBACK.md - Sistema Dash Braip

> ⚠️ **USAR EM CASO DE EMERGÊNCIA!**
> Quando o deploy quebrou produção e precisa voltar RÁPIDO.

---

## 🚨 ROLLBACK RÁPIDO (1 COMANDO)

### Se usou Docker Swarm:
```bash
# Ver histórico de deploys
docker service ls

# Rollback do serviço específico
docker service update --rollback STACK_SERVICO

# Exemplo:
docker service update --rollback dash-braip_backend
```

### Se usou Docker Compose:
```bash
# Voltar para imagem anterior
docker compose down
git checkout HEAD~1
docker compose up -d --build
```

### Se usou Git direto:
```bash
# Ver últimos commits
git log --oneline -10

# Voltar para commit anterior
git revert HEAD --no-edit
# ou
git reset --hard HEAD~1  # CUIDADO: perde alterações
```

---

## 📋 CHECKLIST PÓS-ROLLBACK

- [ ] Verificar se serviço voltou
- [ ] Testar endpoint principal
- [ ] Verificar logs de erro
- [ ] Notificar equipe
- [ ] Documentar o que deu errado

---

## 🗄️ ROLLBACK DE BANCO DE DADOS

### Restaurar último backup:
```bash
# Listar backups disponíveis
ls -la /backups/*.sql.gz

# Restaurar
gunzip -c /backups/backup_MAIS_RECENTE.sql.gz | psql -h localhost -U postgres -d DATABASE
```

### Reverter última migration (Prisma):
```bash
cd backend
npx prisma migrate resolve --rolled-back NOME_MIGRATION
```

---

## 📊 HISTÓRICO DE ROLLBACKS

| Data | Motivo | Commit Revertido | Tempo para Resolver |
|------|--------|------------------|---------------------|
| - | - | - | - |

---

## 🔴 COMANDOS DE EMERGÊNCIA

```bash
# Parar TUDO imediatamente
docker compose down

# Ver o que está rodando
docker ps

# Ver logs do erro
docker logs CONTAINER_ID --tail 100

# Reiniciar serviço específico
docker compose restart SERVICO
```

---

## 📞 CONTATOS DE EMERGÊNCIA

| Responsável | Contato | Área |
|-------------|---------|------|
| - | - | - |

---

*Última atualização: 2026-01-26*
