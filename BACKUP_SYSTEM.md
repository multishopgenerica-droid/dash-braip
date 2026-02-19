# 💾 BACKUP SYSTEM - Sistema Dash Braip

> Lembrar de fazer backup ANTES de operações críticas!

---

## 🔴 QUANDO FAZER BACKUP

- ✅ Antes de QUALQUER deploy
- ✅ Antes de migrations
- ✅ Antes de alterar .env
- ✅ Antes de deletar dados
- ✅ Diariamente (automático)

---

## 🔍 COMANDOS

```bash
# Backup do banco PostgreSQL
pg_dump -h localhost -U postgres -d [DATABASE] | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup de arquivos importantes
tar -czvf config_backup_$(date +%Y%m%d).tar.gz .env* docker-compose.yml
```

---

## 🔄 RESTAURAÇÃO

```bash
# Restaurar banco
gunzip -c backup_XXXXXXXX.sql.gz | psql -h localhost -U postgres -d [DATABASE]

# Restaurar configurações
tar -xzvf config_backup_XXXXXXXX.tar.gz
```

---

## 📊 TIPOS DE BACKUP

| Tipo | Frequência | Retenção |
|------|------------|----------|
| 🗄️ Banco de dados | Diário | 30 dias |
| 📁 Uploads | Semanal | 90 dias |
| ⚙️ Configurações | Por alteração | Indefinido |

---

*Última atualização: 2026-01-26*
