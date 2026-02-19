# FIX SURGEON REPORT -- Ferramentas (Tools CRUD)
Data: 2026-02-18
Build CMD: `npx tsc --noEmit` (backend)

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 7 |
| Fixes aplicados | 7 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |
| Erros compilacao antes | 0 |
| Erros compilacao depois | 0 |

## FIXES

### FIX-1 (P0): Banner de custo silencia erros, exibe R$0,00
- Arquivo: `frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Mudanca: Desestruturado `isLoading: costLoading` e `isError: costError` da query `['tools-cost']`. Banner agora exibe "Carregando..." durante loading e "Erro ao calcular" em caso de falha.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-2 (P0): getMonthlyToolsCost usa monthlyCost em vez de annualCost
- Arquivo: `backend/src/modules/financial/services/tool.service.ts`
- Mudanca: Para recorrencias ANUAL, SEMESTRAL, TRIMESTRAL, agora usa `tool.annualCost` (com fallback para `tool.monthlyCost`) para calcular o custo mensal equivalente.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit passou)

### FIX-3 (P1): z.coerce.boolean() converte "false" para true
- Arquivo: `backend/src/modules/financial/dto/tool.dto.ts`
- Mudanca: Substituido `z.coerce.boolean()` por `z.preprocess((v) => v === 'true' || v === true, z.boolean())` no campo isActive do toolFilterSchema.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit passou)

### FIX-4 (P1): annualCost nao pode ser zerado via UI
- Arquivo: `frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Mudanca: Substituido `formData.annualCost ? Math.round(...) : undefined` por `typeof formData.annualCost === 'number' ? Math.round(formData.annualCost * 100) : undefined`. Agora o valor 0 e enviado corretamente.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-5 (P1): annualCost nunca exibido nos cards
- Arquivo: `frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Mudanca: Card agora mostra custo anual (com equivalente mensal) quando recorrencia e ANUAL e annualCost esta preenchido. Caso contrario, mostra monthlyCost/mes como antes.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-6 (P1): Paginacao sem limite
- Arquivo: `frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Mudanca: Substituida paginacao que renderizava TODOS os botoes por janela deslizante com max 5 botoes + botoes "Anterior"/"Proximo" com disabled nos limites.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-7 (P1): isError ausente na query de listagem
- Arquivo: `frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Mudanca: Desestruturado `isError` da query de listagem. Grid agora exibe "Erro ao carregar ferramentas. Tente novamente." em caso de falha na API.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim
