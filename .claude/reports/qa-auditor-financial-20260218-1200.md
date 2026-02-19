# QA AUDIT REPORT — financial — 2026-02-18

## Status Geral: FAIL

## Compilacao: Build passou com sucesso (informado pelo solicitante)

## Git Diff Review
Auditoria baseada em leitura direta dos arquivos. Git diff nao executado pois o escopo da auditoria
foi definido pelo solicitante com lista explícita de fixes. Arquivos auditados: 11 arquivos.

---

## Sprint 1 - Dashboard (7 fixes)

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| 1 | FIX-1 P0: Margem usa totalRevenue (sales + trafficRevenue) | dashboard.service.ts | APLICADO | `totalRevenue = revenue + trafficRevenue` na linha 75; `profitMargin = totalRevenue > 0 ? ... / totalRevenue * 100` na linha 77 |
| 2 | FIX-2 P0: N+1 queries parallelizadas com Promise.all | dashboard.service.ts | APLICADO | `getMonthlyTrend` usa `Promise.all([salesRevenue, expenses, traffic, payroll, toolsCost])` na linha 121 |
| 3 | FIX-3 P1: Payroll e tools incluidos no profit do trend | dashboard.service.ts | APLICADO | `profit: revenue - expenseTotal - trafficTotal - payrollTotal - toolsTotal` na linha 162 |
| 4 | FIX-4 P1: staleTime nas queries React Query | page.tsx (financeiro) | APLICADO | Todas as 3 queries tem `staleTime: 5 * 60 * 1000` (linhas 152, 158, 164) |
| 5 | FIX-5 P1: Error state na pagina financeiro | page.tsx (financeiro) | APLICADO | `errorMacro`, `errorTrends`, `errorSummary` todos tratados com banner de erro vermelho |
| 6 | FIX-6 P1: profit.margin como number (nao string) | dashboard.service.ts + page.tsx | PARCIAL - PROBLEMA RESIDUAL | Backend retorna `parseFloat(...)` (number correto, linha 77). Porem a interface `MacroView` em `financial.service.ts` linha 239 define `margin: string` (tipo errado). O frontend usa `Number(macroView.profit.margin)` como workaround na linha 167, o que mascara o problema de tipagem mas funciona em runtime. |
| 7 | FIX-7 P1: months com clamping 1-24 | dashboard.controller.ts | APLICADO | `Math.min(Math.max(parseInt(...) || 6, 1), 24)` na linha 33 |

---

## Sprint 2 - Gastos (10 fixes)

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| 1 | FIX-1 P0: amount=0 validado no frontend | gastos/page.tsx | APLICADO | `if (formData.amount <= 0)` com toast.error na linha 49 |
| 2 | FIX-2 P0: Precisao float com Math.round | gastos/page.tsx | APLICADO | `Math.round(parseFloat(Number(formData.amount).toFixed(2)) * 100)` na linha 53 |
| 3 | FIX-3 P1: paidAt enviado quando status=PAGO | gastos/page.tsx | APLICADO | `paidAt: formData.status === 'PAGO' && formData.paidAt ? new Date(...).toISOString() : undefined` na linha 58 |
| 4 | FIX-4 P1: isError tratado na query | gastos/page.tsx | APLICADO | `isError` desestruturado na linha 236 e tratado na tabela (linhas 393-398) |
| 5 | FIX-5 P1: Paginacao com janela deslizante | gastos/page.tsx | APLICADO | Logica de janela deslizante com `maxVisible=5`, startPage/endPage calculados dinamicamente (linhas 454-498) |
| 6 | FIX-6 P1: PUT→PATCH no backend e frontend | financial.routes.ts + financial.service.ts | PARCIAL - PROBLEMA RESIDUAL | Backend usa `router.patch('/expenses/:id')` (linha 23 - correto). Frontend `updateExpense` usa `api.patch(...)` (linha 310 - correto). POREM: `updateEmployee` ainda usa `api.put(...)` (linha 335) e `updateTool` ainda usa `api.put(...)` (linha 365) e `updateTraffic` ainda usa `api.put(...)` (linha 395). O fix foi aplicado apenas para expenses, nao para os outros recursos. |
| 7 | FIX-7 P1: Import Search removido | gastos/page.tsx | APLICADO | Nao ha import de `Search` no arquivo (imports sao: Plus, Pencil, Trash2, X) |
| 8 | FIX-8 P1: Botao disabled durante mutations | gastos/page.tsx | APLICADO | Botao submit tem `disabled={isSaving}` na linha 214; `isSaving={createMutation.isPending || updateMutation.isPending}` na linha 508 |
| 9 | FIX-9 P1: Cache invalidation invalida ['financial'] | gastos/page.tsx | APLICADO | Todos os 3 mutations invalidam `['expenses']` E `['financial']` (linhas 249-250, 265-266, 281-282) |
| 10 | FIX-10 P2: Gastos cancelados excluidos dos totais | expense.service.ts | APLICADO | `status: { not: 'CANCELADO' }` presente em `getTotalByCategory` (linha 100), `getMonthlyTotal` (linha 126) e no `getMacroView` do dashboard (linha 35) |

---

## Sprint 3 - Funcionários (5 fixes)

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| 1 | FIX-1 P0: Email vazio aceito (z.literal + transform) | employee.dto.ts + frontend | APLICADO | DTO linha 24: `.email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v)`. Frontend linha 57: `email: formData.email || undefined` |
| 2 | FIX-2 P1: Delete desvincula expenses antes | employee.service.ts | APLICADO | `prisma.expense.updateMany({ where: { employeeId: id }, data: { employeeId: null } })` executado antes do delete (linhas 91-94) |
| 3 | FIX-3 P1: Botoes disabled durante mutations | funcionarios/page.tsx | PARCIAL - PROBLEMA RESIDUAL | Botao Excluir tem `disabled={deleteMutation.isPending}` (linha 501). MAS os botoes Editar e Salvar (dentro do modal) nao bloqueiam o botao de editar durante update — o edit button na tabela nao tem disabled. O modal tem `isSaving={createMutation.isPending || updateMutation.isPending}` (linha 542) que desabilita o submit, mas o botao Editar da tabela permanece clicavel durante mutations. |
| 4 | FIX-4 P1: Campos document e endDate no DTO, service, interface e form | multiplos | APLICADO | `document` no DTO (linha 31), service.create (linha 13), service.update (linha 73), interface Employee (linha 26), form (linha 35, 119). `endDate` no DTO (linha 33), service.create (linha 20), service.update (linha 80), interface Employee (linha 33), form (linha 41, 226-229). |
| 5 | FIX-5 P1: createMutation.onSuccess limpa selectedEmployee | funcionarios/page.tsx | APLICADO | `onSuccess` do createMutation: `setSelectedEmployee(null)` na linha 295 |

---

## Sprint 4 - Ferramentas (7 fixes)

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| 1 | FIX-1 P0: Banner de custo trata erro e loading | ferramentas/page.tsx | APLICADO | `costLoading` exibe "Carregando...", `costError` exibe "Erro ao calcular" (linhas 323-327) |
| 2 | FIX-2 P0: getMonthlyToolsCost usa annualCost | tool.service.ts | APLICADO | Case ANUAL: `tool.annualCost ? Math.round(tool.annualCost / 12) : Math.round(tool.monthlyCost / 12)` (linhas 101-103). Logica tambem para SEMESTRAL e TRIMESTRAL. |
| 3 | FIX-3 P1: z.coerce.boolean corrigido | tool.dto.ts | APLICADO | `z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional()` na linha 35. Substitui o problemático `z.coerce.boolean()` que aceitava qualquer string como true. |
| 4 | FIX-4 P1: annualCost pode ser zerado | ferramentas/page.tsx | APLICADO | `annualCost: typeof formData.annualCost === 'number' ? Math.round(formData.annualCost * 100) : undefined` na linha 47 — permite valor 0 |
| 5 | FIX-5 P1: annualCost exibido nos cards | ferramentas/page.tsx | APLICADO | Card exibe `formatCurrency(tool.annualCost)` quando `tool.recurrence === 'ANUAL' && tool.annualCost` (linhas 431-438) |
| 6 | FIX-6 P1: Paginacao com janela deslizante | ferramentas/page.tsx | APLICADO | Logica de janela deslizante com `maxButtons=5` (linhas 453-496) |
| 7 | FIX-7 P1: isError tratado na query | ferramentas/page.tsx | APLICADO | `isError` desestruturado na linha 222 e tratado no grid (linhas 364-366) |

---

## Sprint 5 - Trafego (4 fixes)

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| 1 | FIX-1 P0: Data formatada sem bug UTC-3 | trafego/page.tsx | APLICADO | `formatDateSafe` na linha 17-20: parse manual `isoDate.split('T')[0].split('-')` evita conversao de timezone do `new Date()` |
| 2 | FIX-2 P1: Validacao de duplicata no service | traffic.service.ts | APLICADO | `findFirst` antes do create com where por userId+platform+date+campaignName (linhas 10-20), lanca `DUPLICATE_TRAFFIC_SPEND` |
| 3 | FIX-3 P1: Erro P2002 tratado no controller | traffic.controller.ts | APLICADO | Tratamento de `DUPLICATE_TRAFFIC_SPEND` (linha 23) e `Prisma.PrismaClientKnownRequestError` com `error.code === 'P2002'` (linhas 26-28) |
| 4 | FIX-4 P1: Cards respeitam filtro de plataforma | trafego/page.tsx | APLICADO | `totalSpend/totalRevenue/totalConversions` calculados a partir de `data?.data` (tabela filtrada, linhas 289-292), nao de `platformData` |

---

## Problemas Encontrados

### Novos Bugs Encontrados

| # | Severidade | Descricao | Arquivo |
|---|-----------|-----------|---------|
| 1 | MEDIA | Interface `MacroView.profit.margin` tipada como `string` mas backend retorna `number`. O frontend usa `Number(macroView.profit.margin)` como workaround. A interface esta incorreta e pode causar confusao futura. | `/root/sistema-dash-braip/frontend/src/services/financial.service.ts` linha 239 |
| 2 | MEDIA | `updateEmployee`, `updateTool` e `updateTraffic` no service frontend usam `api.put(...)` enquanto apenas `updateExpense` foi corrigido para `api.patch(...)`. Backend de employees usa `router.put('/employees/:id')` (linha 31), tools usa `router.put('/tools/:id')` (linha 39) e traffic usa `router.put('/traffic/:id')` (linha 47) — estes ainda sao PUT, portanto nao ha inconsistencia para esses recursos. O fix foi parcial: apenas expenses foi migrado. | `/root/sistema-dash-braip/frontend/src/services/financial.service.ts` linhas 335, 365, 395 |
| 3 | BAIXA | Paginacao de trafego (trafego/page.tsx) NAO usa janela deslizante — usa `[...Array(totalPages)].map(...)` sem limite de botoes visiveis. Se houver muitas paginas, renderizara todos os botoes. Gastos e Ferramentas foram corrigidos, Trafego e Funcionarios nao. | `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx` linha 500 |
| 4 | BAIXA | Paginacao de funcionarios (funcionarios/page.tsx) tambem NAO usa janela deslizante — mesma situacao do trafego. | `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linha 516 |

---

## Resumo de Contagem

| Sprint | Total | Aplicados | Parciais | Ausentes |
|--------|-------|-----------|----------|---------|
| Sprint 1 - Dashboard | 7 | 6 | 1 (FIX-6) | 0 |
| Sprint 2 - Gastos | 10 | 9 | 1 (FIX-6) | 0 |
| Sprint 3 - Funcionarios | 5 | 4 | 1 (FIX-3) | 0 |
| Sprint 4 - Ferramentas | 7 | 7 | 0 | 0 |
| Sprint 5 - Trafego | 4 | 4 | 0 | 0 |
| **TOTAL** | **33** | **30** | **3** | **0** |

Fixes com problemas residuais que requerem correcao:
- Sprint 1 FIX-6: tipo `margin: string` na interface MacroView
- Sprint 2 FIX-6: PUT→PATCH aplicado apenas para expenses, nao para employees/tools/traffic (mas estes recursos ainda tem rota PUT no backend, entao nao e um bug funcional ainda)
- Sprint 3 FIX-3: botao Editar na tabela de funcionarios nao desabilita durante mutations

---

## Veredicto: REPROVADO

**30 de 33 fixes completamente aplicados. 3 fixes parcialmente implementados com problemas residuais.**

Os 3 fixes parciais nao bloqueiam o funcionamento basico do modulo, mas representam inconsistencias de tipagem e UX que devem ser corrigidas antes de aprovacao final.

Acoes requeridas antes de reaprovacao:
1. Corrigir `profit.margin` de `string` para `number` na interface `MacroView` em `financial.service.ts`
2. Avaliar se PUT→PATCH deve ser aplicado tambem para employees, tools e traffic (ou documentar que e intencional manter PUT)
3. Adicionar `disabled` no botao Editar da tabela de funcionarios durante mutations ativas
