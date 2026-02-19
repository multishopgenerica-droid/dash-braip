# FIX SURGEON REPORT -- TRAFFIC (Trafego)
Data: 2026-02-18
Build CMD: `npx tsc --noEmit`

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 4 |
| Fixes aplicados | 4 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |

## FIXES

### FIX-1 P0: Data exibida com dia errado em UTC-3
- Arquivo: `frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- Mudanca: Criado helper `formatDateSafe()` que parseia ISO date via string split sem instanciar `new Date()`, evitando conversao de timezone que causava dia anterior em UTC-3.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-2 P1: Constraint unique ineficaz com campaignId=NULL
- Arquivos: `backend/src/modules/financial/services/traffic.service.ts` + `backend/src/modules/financial/controllers/traffic.controller.ts`
- Mudanca: Adicionado `findFirst` antes do `create` para checar duplicata por userId+platform+date+campaignName (evitando o problema de NULL != NULL no PostgreSQL). Controller trata erro DUPLICATE_TRAFFIC_SPEND retornando HTTP 409.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-3 P1: Erro P2002 nao tratado - retorna 500 generico
- Arquivo: `backend/src/modules/financial/controllers/traffic.controller.ts`
- Mudanca: Import de `Prisma` do `@prisma/client`. Tratamento de `PrismaClientKnownRequestError` com code `P2002` nos metodos `create` e `update`, retornando HTTP 409 com mensagem clara em vez de 500 generico.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-4 P1: Cards de totais nao respeitam filtro de plataforma
- Arquivo: `frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- Mudanca: Cards de totais agora calculam a partir de `data?.data` (dados filtrados da tabela, que respeitam o filtro de plataforma) em vez de `platformData` (dados globais sem filtro).
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim
