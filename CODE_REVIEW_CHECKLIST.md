# ✅ CODE REVIEW CHECKLIST - Sistema Dash Braip

> Executar ANTES de finalizar QUALQUER alteração de código!

---

## 🔍 CHECKLIST RÁPIDO (8 itens)

| # | Item | Status |
|---|------|--------|
| 1 | 🔍 Código funciona corretamente? | ⬜ |
| 2 | 🐛 Não introduziu novos bugs? | ⬜ |
| 3 | 🛡️ Não quebrou código existente? | ⬜ |
| 4 | 🔒 Sem vulnerabilidades de segurança? | ⬜ |
| 5 | 📝 Código está legível e comentado? | ⬜ |
| 6 | 🧹 Sem código morto ou console.log? | ⬜ |
| 7 | ⚡ Performance adequada? | ⬜ |
| 8 | 🔄 Compatível com o resto do sistema? | ⬜ |

---

## 📊 RESULTADO

| Aprovados | Resultado |
|-----------|-----------|
| 8/8 | ✅ APROVADO - Pode finalizar |
| 6-7/8 | 🟡 RESSALVAS - Finalizar com observações |
| <6/8 | 🔴 REPROVADO - Corrigir antes |

---

## 🔐 CHECKLIST DE SEGURANÇA

- [ ] Sem SQL Injection (usar Prisma/prepared statements)
- [ ] Sem XSS (sanitizar inputs/outputs)
- [ ] Autenticação em rotas protegidas
- [ ] Sem secrets hardcoded
- [ ] Sem console.log com dados sensíveis
- [ ] Validação de inputs (Zod/Joi)

---

## ⚡ CHECKLIST DE PERFORMANCE

- [ ] Sem N+1 queries (usar include)
- [ ] Índices nas colunas de busca
- [ ] Paginação implementada
- [ ] Cache onde necessário
- [ ] Sem loops desnecessários

---

*Última atualização: 2026-01-26*
