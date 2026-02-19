# DEPLOY VALIDATION REPORT
Data: 2026-02-18
Modulos: analytics, sync, sales, products, financial, ai-analysis, openai, whatsapp, frontend

## RESULTADO: APROVADO (com avisos menores)

## CHECKLIST
| # | Check | Status | Detalhes |
|---|-------|--------|----------|
| 1 | Compilacao Backend (tsc) | PASS | 0 erros |
| 2 | Compilacao Frontend (next build) | PASS | 0 erros, 15 rotas geradas |
| 3 | Revenue Field (transTotalValue -> transValue) | PASS | 0 usos de `_sum.transTotalValue` restantes |
| 4 | Revenue Field em SQL raw | PASS | `SUM(s."transValue")` correto em sync e analytics |
| 5 | Periodos (date.ts) | PASS | `last7days` = subDays(6), `last30days` = subDays(29) |
| 6 | Periodos (frontend) | PASS | 7d = subDays(6), 30d = subDays(29) |
| 7 | Timezone Docker | PASS | `TZ=America/Sao_Paulo` no Dockerfile e docker-compose |
| 8 | Timezone filtros | PASS | Offsets `-03:00` aplicados nos filtros de data |
| 9 | Status unificado | PASS | `transStatusCode: 2` / `SALE_STATUS.PAGAMENTO_APROVADO` consistente |
| 10 | Import Chain (tsc --noEmit) | PASS | Coberto pelo build sem erros |

## AVISOS (nao bloqueantes)

### 1. subDays(today, 7) em getComparison() - analytics.service.ts:309,334
A funcao `getComparison()` usa `subDays(today, 7)` para comparar "esta semana vs semana passada".
**Veredicto**: ACEITAVEL - sao janelas simetricas de comparacao (7 dias vs 7 dias anteriores).
Ambos os blocos usam a mesma logica, entao a comparacao e justa e coerente.

### 2. subDays(now, 30) em page.tsx:437 (frontend)
O case "custom" usa `subDays(now, 30)` como fallback quando o usuario nao definiu datas.
**Veredicto**: ACEITAVEL - e apenas um fallback default, nao o periodo padrao do dashboard.
O periodo "30 dias" real usa `subDays(29)` na linha 421.

## ARQUIVOS MODIFICADOS (22 arquivos, +533 -418 linhas)

### Infraestrutura
- `docker-compose.yml` - TZ=America/Sao_Paulo adicionado
- `backend/docker/Dockerfile` - ENV TZ=America/Sao_Paulo + tzdata instalado

### Backend - Revenue field fix (transTotalValue -> transValue)
- `backend/src/modules/analytics/analytics.service.ts` - aggregates + SQL raw
- `backend/src/modules/sales/sales.service.ts` - aggregates
- `backend/src/modules/products/products.service.ts` - aggregates
- `backend/src/modules/financial/services/dashboard.service.ts` - aggregates
- `backend/src/modules/sync/sync.service.ts` - aggregates + SQL raw
- `backend/src/modules/openai/openai.service.ts` - aggregates
- `backend/src/modules/ai-analysis/ai-analysis.service.ts` - aggregates
- `backend/src/modules/whatsapp/ai-query.service.ts` - aggregates
- `backend/src/modules/webhooks/handlers/braip.handler.ts` - aggregates

### Backend - Periodos fix
- `backend/src/shared/utils/date.ts` - subDays(7->6) e subDays(30->29)

### Frontend
- `frontend/src/app/(dashboard)/page.tsx` - subDays(7->6) e subDays(30->29)
- `frontend/src/app/(dashboard)/abandonos/page.tsx` - periodos
- `frontend/src/app/(auth)/login/page.tsx` - melhorias login
- `frontend/src/app/globals.css` - estilos
- `frontend/src/app/layout.tsx` - layout
- `frontend/public/sw.js` - service worker

### Outros
- `backend/prisma/seed.ts` - seed data
- `CHANGELOG.md` - documentacao
- `.claude/settings.local.json` - settings

## CONFIRMACAO DE CORRECOES

### Os valores devem agora bater com a Braip porque:
1. **transValue** (valor liquido da comissao) esta sendo usado em vez de **transTotalValue** (valor bruto do produto) - alinhado com o que a Braip mostra no painel do afiliado
2. **Timezone BRT** garante que "hoje" no dashboard = "hoje" na Braip (ambos em horario de Brasilia)
3. **Periodos corretos**: "7 dias" agora inclui hoje + 6 dias anteriores = 7 dias (nao 8), batendo com a contagem da Braip
4. **Status code 2** unificado garante que apenas vendas aprovadas sao contabilizadas

## COMANDOS DE DEPLOY (se aprovado pelo team lead)

```bash
# Rebuild da imagem backend com timezone
docker build -t dashboard-backend:latest -f docker/Dockerfile .

# Deploy do stack
docker stack deploy -c dashboard-stack.yaml dashboard
```

>>> USUARIO DEVE CONFIRMAR ANTES DE EXECUTAR <<<
