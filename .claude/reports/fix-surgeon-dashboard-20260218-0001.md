# FIX SURGEON REPORT -- Dashboard Financeiro
Data: 2026-02-18
Build CMD: npx tsc --noEmit

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 7 |
| Fixes aplicados | 7 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |

## FIXES

### FIX-1 (P0): Margem de lucro calculada errada - APLICADO
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- Mudanca: Adicionado `totalRevenue = revenue + trafficRevenue`. netProfit e profitMargin agora usam totalRevenue como base em vez de apenas revenue (vendas).
- Linhas: 73-76
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-2 (P0): N+1 queries em getMonthlyTrend - APLICADO
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- Mudanca: 3 queries sequenciais dentro do for loop substituidas por Promise.all com 5 queries paralelas (incluindo payroll e tools do FIX-3).
- Linhas: 119-155
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-3 (P1): getMonthlyTrend omite payroll e tools do profit - APLICADO
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- Mudanca: Adicionado employeeService.getMonthlyPayroll e toolService.getMonthlyToolsCost no Promise.all. Profit agora subtrai payrollTotal e toolsTotal.
- Linhas: 119-163 (junto com FIX-2)
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-4 (P1): Sem staleTime nas queries React Query - APLICADO
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- Mudanca: Adicionado `staleTime: 5 * 60 * 1000` nas 3 queries useQuery.
- Linhas: 149-165
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-5 (P1): Sem error state na pagina - APLICADO
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- Mudanca: Removido loading global. Cada secao (Main Stats, Summary Cards, Charts) agora tem loading e error individuais com mensagens claras.
- Linhas: 169-275
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-6 (P1): profit.margin como string (risco NaN%) - APLICADO
- Arquivo backend: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- Arquivo frontend: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- Mudanca backend: profitMargin agora retorna `parseFloat((...).toFixed(2))` (number) em vez de string.
- Mudanca frontend: `Number(macroView.profit.margin) || 0` para tratar NaN.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-7 (P1): Validacao de months sem limite - APLICADO
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/controllers/dashboard.controller.ts`
- Mudanca: `Math.min(Math.max(parseInt(...) || 6, 1), 24)` — clampa months entre 1 e 24.
- Linha: 33
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim
