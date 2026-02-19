# FIX SURGEON REPORT -- EMPLOYEES (Sprint 3)
Data: 2026-02-18
Build CMD: npx tsc --noEmit

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 5 |
| Fixes aplicados | 5 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |

## FIXES

### FIX-1 P0: Email vazio quebra criacao/edicao de funcionario
- Arquivo: backend/src/modules/financial/dto/employee.dto.ts (linha 24)
- Arquivo: frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx (handleSubmit)
- Mudanca: DTO agora aceita string vazia via `.or(z.literal('')).transform(v => v === '' ? undefined : v)` para email e phone. Frontend converte campos vazios para undefined no handleSubmit.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit)

### FIX-2 P1: Delete com expenses vinculadas causa erro 500
- Arquivo: backend/src/modules/financial/services/employee.service.ts (delete method)
- Mudanca: Adicionado `prisma.expense.updateMany({ where: { employeeId: id }, data: { employeeId: null } })` antes do delete para desvincular expenses.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit, confirmado employeeId nullable no schema)

### FIX-3 P1: Botoes sem disabled durante mutations
- Arquivo: frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx
- Mudanca: (1) Adicionado prop `isSaving` ao EmployeeModal. (2) Botao Salvar agora tem `disabled={isSaving}` e texto "Salvando..." durante pending. (3) Botao Excluir agora tem `disabled={deleteMutation.isPending}` e texto "Excluindo..." durante pending. (4) Modal recebe `isSaving={createMutation.isPending || updateMutation.isPending}`.
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit)

### FIX-4 P1: Campos document e endDate ignorados
- Arquivos modificados:
  1. backend/src/modules/financial/dto/employee.dto.ts - Adicionado `document: z.string().optional()` e `endDate: z.string().datetime().optional().nullable()`
  2. backend/src/modules/financial/services/employee.service.ts - Adicionado processamento de document e endDate no create() e update()
  3. frontend/src/services/financial.service.ts - Adicionado `document?: string` e `endDate?: string` na interface Employee
  4. frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx - Adicionado campos CPF/CNPJ e Data de Saida no formulario modal, incluindo estado e handleSubmit
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit, confirmado campos existem no Prisma schema)

### FIX-5 P1: createMutation.onSuccess nao limpa selectedEmployee
- Arquivo: frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx
- Mudanca: Adicionado `setSelectedEmployee(null)` no onSuccess do createMutation
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim (tsc --noEmit)
