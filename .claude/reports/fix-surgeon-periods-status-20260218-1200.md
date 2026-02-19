# FIX SURGEON REPORT -- periods-status
Data: 2026-02-18
Build CMD: `npx tsc --noEmit`

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 5 |
| Fixes aplicados | 5 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |

## FIXES

### FIX-001: Corrigir contagem de periodos (7 dias = 8 dias, 30 dias = 31 dias)
- Arquivo: frontend/src/app/(dashboard)/page.tsx
- Mudanca: `subDays(now, 7)` -> `subDays(now, 6)` e `subDays(now, 30)` -> `subDays(now, 29)`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-002: Unificar filtro de status em sync.service.ts (Prisma groupBy)
- Arquivo: backend/src/modules/sync/sync.service.ts (linha 312)
- Mudanca: `transStatus: { in: ['Aprovado', 'Pagamento Aprovado'] }` -> `transStatusCode: 2`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-002b: Unificar filtro de status em sync.service.ts (raw SQL syncAffiliatesFromSales e updateProductStats)
- Arquivo: backend/src/modules/sync/sync.service.ts (linhas 371, 404)
- Mudanca: `s."transStatus" IN ('Aprovado', 'Pagamento Aprovado')` -> `s."transStatusCode" = 2`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-003: Unificar filtro de status em braip.handler.ts
- Arquivo: backend/src/modules/webhooks/handlers/braip.handler.ts (linha 269)
- Mudanca: `transStatus: 'Aprovado'` -> `transStatusCode: 2`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-004: Corrigir SQL Injection em getAffiliateStats
- Arquivo: backend/src/modules/analytics/analytics.service.ts (linhas 411-453)
- Mudanca: Interpolacao de string em dateCondition -> parametros posicionais ($2, $3) + transStatus -> transStatusCode
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-005: Corrigir SQL Injection em getSalesBySource
- Arquivo: backend/src/modules/analytics/analytics.service.ts (linhas 497-519)
- Mudanca: Interpolacao de string em dateCondition -> parametros posicionais ($2, $3) + transStatus -> transStatusCode
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim
