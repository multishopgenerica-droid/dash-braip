# 🔒 SECURITY SCANNER - Sistema Dash Braip

> Verificações de segurança regulares

---

## 🔴 QUANDO EXECUTAR

- ✅ Antes de QUALQUER deploy
- ✅ Após adicionar nova dependência
- ✅ Semanalmente (scan completo)

---

## 🔍 COMANDOS RÁPIDOS

```bash
# Verificar vulnerabilidades
cd backend && npm audit
cd frontend && npm audit

# Procurar secrets expostos
grep -r "password\s*=" --include="*.ts" | grep -v node_modules
grep -r "apiKey\s*=" --include="*.ts" | grep -v node_modules
```

---

## 📊 SEVERIDADES

| Severidade | Ação |
|------------|------|
| 🔴 CRÍTICA | Corrigir em 24h, bloquear deploy |
| 🟠 ALTA | Corrigir em 1 semana |
| 🟡 MÉDIA | Corrigir em 1 mês |
| 🟢 BAIXA | Adicionar ao backlog |

---

## 🛡️ OWASP TOP 10 CHECK

- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Authentication Failures
- [ ] A08: Integrity Failures
- [ ] A09: Security Logging
- [ ] A10: SSRF

---

*Última atualização: 2026-01-26*
