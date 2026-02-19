# SCAN REPORT — financial / employees (CRUD de Funcionários)
Data: 2026-02-18

## RESUMO
| Metrica | Valor |
|---------|-------|
| Arquivos backend | 4 (controller, service, dto, routes) |
| Arquivos frontend | 2 (page.tsx, financial.service.ts) |
| Arquivos schema | 1 (schema.prisma) |
| Endpoints totais | 6 (LIST, CREATE, PAYROLL, GET_BY_ID, UPDATE, DELETE) |
| Endpoints OK (smoke test) | N/A (servico offline — sem URL de producao configurada) |
| Endpoints OFFLINE | 6 (SERVICO_OFFLINE — URLs nao configuradas no registry) |
| Bugs P0 | 1 |
| Bugs P1 | 4 |
| Bugs P2 | 5 |
| Bugs P3 | 4 |

---

## ENDPOINTS (rotas registradas)
| # | Metodo | URL | Ordem no router | OK? |
|---|--------|-----|-----------------|-----|
| 1 | GET | /financial/employees | linha 27 | OK (ordem correta) |
| 2 | POST | /financial/employees | linha 28 | OK |
| 3 | GET | /financial/employees/payroll | linha 29 | OK (antes de /:id) |
| 4 | GET | /financial/employees/:id | linha 30 | OK |
| 5 | PUT | /financial/employees/:id | linha 31 | OK |
| 6 | DELETE | /financial/employees/:id | linha 32 | OK |

> Smoke tests: SERVICO_OFFLINE — URLs de producao nao configuradas no project-registry.md.
> Scan estatico continua normalmente.

---

## BUGS ENCONTRADOS

### BUG-EMP-001: Email vazio causa erro 400 ao criar/editar funcionário (CRITICO — P0)
- **Severidade:** P0
- **Arquivo(s):**
  - `backend/src/modules/financial/dto/employee.dto.ts` linha 24
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 31, 89-91
- **Descricao:**
  O campo `email` no formulario e inicializado como string vazia `''` (linha 31 do page.tsx: `email: employee?.email || ''`).
  Quando o usuario deixa o campo em branco e envia o formulario, a string vazia `""` e enviada ao backend.
  O DTO Zod valida `email: z.string().email('Email inválido').optional()` — `z.string().email()` **rejeita string vazia** (`""` nao e um email valido), retornando HTTP 400 com a mensagem "Email inválido".
  O campo email nao tem `required` no HTML, dando a entender ao usuario que e opcional, mas na pratica falha toda vez que deixado em branco.

- **Reproducao:**
  1. Clicar em "Novo Funcionário"
  2. Preencher apenas Nome, Cargo, Salário, Data de Início
  3. Deixar Email em branco
  4. Clicar "Salvar" → toast de erro "Email inválido"

- **Fix proposto (backend — preferido):**
  ```typescript
  // dto/employee.dto.ts linha 24
  // Antes:
  email: z.string().email('Email inválido').optional(),
  // Depois:
  email: z.string().email('Email inválido').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  ```
  **OU (frontend):**
  ```typescript
  // page.tsx no handleSubmit, antes de chamar onSave:
  onSave({
    ...formData,
    email: formData.email || undefined,
    phone: formData.phone || undefined,
    salary: Math.round(formData.salary * 100),
    bonus: Math.round(formData.bonus * 100),
    benefits: Math.round(formData.benefits * 100),
    startDate: new Date(formData.startDate + 'T12:00:00').toISOString(),
  });
  ```

---

### BUG-EMP-002: Deletar funcionário com despesas vinculadas lança erro 500 silencioso (P1)
- **Severidade:** P1
- **Arquivo(s):**
  - `backend/src/modules/financial/services/employee.service.ts` linhas 83-88
  - `backend/src/modules/financial/controllers/employee.controller.ts` linhas 93-111
  - `backend/prisma/schema.prisma` linhas 595-596
- **Descricao:**
  O model `Expense` tem um campo `employeeId String?` com FK para `Employee` sem `onDelete` especificado.
  No PostgreSQL, o comportamento padrão do Prisma para relações opcionais sem `onDelete` é `SetNull`, mas
  a ausência de migração explícita pode resultar em `RESTRICT` dependendo da versão do Prisma/banco.
  Mais importante: o service `delete()` faz `prisma.employee.delete({ where: { id } })` **sem verificar**
  se existem `Expense` registros vinculados.
  
  Se o banco estiver configurado como `RESTRICT` (ou se houver outra dependência não catalogada),
  o delete lançará um erro de FK que cai no catch do controller e retorna HTTP 500 genérico ao frontend.
  O frontend exibe apenas "Erro ao excluir funcionário" sem informar o motivo real.

- **Fix proposto:**
  ```typescript
  // employee.service.ts — antes do delete, desvincula expenses
  async delete(userId: string, id: string) {
    const employee = await this.findById(userId, id);
    if (!employee) return null;

    // Desvincula expenses antes de deletar
    await prisma.expense.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    return prisma.employee.delete({ where: { id } });
  }
  ```
  **OU** adicionar `onDelete: SetNull` explicitamente no schema Prisma:
  ```prisma
  // schema.prisma linha 596
  employee Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  ```

---

### BUG-EMP-003: Botão "Salvar" e botão "Excluir" não ficam desabilitados durante mutation em andamento (P1)
- **Severidade:** P1
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 220-226, 468-472
- **Descricao:**
  Os botoes de "Salvar" (submit do modal) e "Excluir" (na tabela) **nao possuem** atributo `disabled`
  vinculado ao estado de `isPending` das mutations. O usuario pode clicar multiplas vezes rapidamente,
  causando requests duplicados ao backend:
  - Criar o mesmo funcionario multiplas vezes
  - Disparar multiplos DELETEs para o mesmo ID (o segundo retorna 404, que e silenciado)
  - Disparar multiplos UPDATEs sobrepostos
  
- **Fix proposto:**
  ```tsx
  // Modal — botao Salvar
  const isMutating = createMutation.isPending || updateMutation.isPending;
  
  <button
    type="submit"
    disabled={isMutating}
    className={`flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition
      ${isMutating ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {isMutating ? 'Salvando...' : 'Salvar'}
  </button>
  
  // Tabela — botao Excluir
  <button
    onClick={() => handleDelete(employee.id)}
    disabled={deleteMutation.isPending}
    className="p-2 text-zinc-400 hover:text-red-400 transition disabled:opacity-50"
  >
    <Trash2 className="h-4 w-4" />
  </button>
  ```

---

### BUG-EMP-004: Campos `document` (CPF/CNPJ) e `endDate` (data de demissao) existem no schema Prisma mas sao ignorados no CRUD completo (P1)
- **Severidade:** P1
- **Arquivo(s):**
  - `backend/prisma/schema.prisma` linhas 622 e 632
  - `backend/src/modules/financial/dto/employee.dto.ts` (ausente)
  - `backend/src/modules/financial/services/employee.service.ts` (ausente)
  - `frontend/src/services/financial.service.ts` interface `Employee` (ausente)
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` formulario (ausente)
- **Descricao:**
  O model `Employee` no Prisma define dois campos funcionais importantes:
  - `document String?` — CPF/CNPJ do funcionario
  - `endDate DateTime?` — Data de demissao/encerramento do contrato
  
  Ambos os campos **nao aparecem** em nenhuma camada: nao estao no DTO Zod, nao sao processados pelo service,
  nao fazem parte da interface TypeScript `Employee` no frontend, e nao existem no formulario modal.
  Qualquer dado nesses campos (salvo diretamente no banco) sera ignorado e sobrescrito como `null`
  em qualquer operacao de update via API.

- **Fix proposto:**
  Adicionar ao DTO (`employee.dto.ts`):
  ```typescript
  document: z.string().optional(),
  endDate: z.string().datetime().optional().nullable(),
  ```
  Adicionar ao service `create()` e `update()`, ao tipo `Employee` no frontend e ao formulario modal.

---

### BUG-EMP-005: `createMutation.onSuccess` nao limpa `selectedEmployee` — estado sujo latente (P1)
- **Severidade:** P1
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 260-265
- **Descricao:**
  No `createMutation.onSuccess` (linha 260-265), o codigo faz `setShowModal(false)` mas **nao faz**
  `setSelectedEmployee(null)`. O `selectedEmployee` permanece com o valor do ultimo funcionario editado
  (se o usuario abriu um modal de edicao antes de criar um novo via `handleSave`).
  
  O cenario mais critico: se o estado `selectedEmployee` for lido em outros lugares futuros da pagina
  (ex: um segundo componente que verifica `selectedEmployee != null`), ele pode receber um valor obsoleto.
  Alem disso, ha uma inconsistencia de design: `updateMutation.onSuccess` (linha 276-282) corretamente
  faz `setSelectedEmployee(null)`, mas `createMutation.onSuccess` nao.

- **Fix proposto:**
  ```typescript
  // Linha 261 — adicionar setSelectedEmployee(null)
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['payroll'] });
    toast.success('Funcionário criado com sucesso!');
    setShowModal(false);
    setSelectedEmployee(null); // ADICIONAR ESTA LINHA
  },
  ```

---

### BUG-EMP-006: `name` no service de update usa falsy check (`&&`) em vez de `!== undefined` — impede limpar nome com trim (P2)
- **Severidade:** P2
- **Arquivo(s):**
  - `backend/src/modules/financial/services/employee.service.ts` linha 68
- **Descricao:**
  O update service usa:
  ```typescript
  ...(data.name && { name: data.name }),
  ```
  Se `data.name` for uma string com apenas espacos (`"   "`), o check `&&` avalia como `true` (truthy)
  e salva `"   "` no banco. O DTO `z.string().min(1)` aceita `"   "` pois min(1) conta bytes, nao
  caracteres significativos (nao ha `.trim()`). O funcionario ficaria com nome `"   "` no banco,
  exibindo-se como vazio na tabela.
  
  Alem disso, ha inconsistencia arquitetural: `salary`, `bonus`, `benefits` usam `!== undefined`
  (correto para valores potencialmente zero), enquanto `name`, `role` e `status` usam `&&`
  (potencialmente incorreto para strings/enums que precisam ser setados).

- **Fix proposto:**
  ```typescript
  // employee.service.ts e employee.dto.ts
  // No DTO, adicionar .trim():
  name: z.string().min(1, 'Nome é obrigatório').max(255).trim(),
  
  // No service update, usar !== undefined para consistencia:
  ...(data.name !== undefined && { name: data.name }),
  ...(data.role !== undefined && { role: data.role as EmployeeRole }),
  ...(data.status !== undefined && { status: data.status as EmployeeStatus }),
  ```

---

### BUG-EMP-007: `getPayroll` contabiliza apenas funcionarios ATIVOS — logica de negocio nao documentada e potencialmente incorreta (P2)
- **Severidade:** P2
- **Arquivo(s):**
  - `backend/src/modules/financial/services/employee.service.ts` linhas 90-108
- **Descricao:**
  O metodo `getMonthlyPayroll` filtra apenas `status: 'ATIVO'`:
  ```typescript
  where: { userId, status: 'ATIVO' }
  ```
  Funcionarios com status `FERIAS` ou `AFASTADO` **nao** entram na folha, embora tipicamente
  continuem recebendo salario (ferias e afastamento nao encerram o vínculo trabalhista).
  Apenas `INATIVO` deveria ser excluido da folha ativa.
  O Payroll Summary exibido na tela pode estar **subestimando** o custo real da folha de pagamento.

- **Fix proposto:**
  ```typescript
  // employee.service.ts — getMonthlyPayroll
  where: {
    userId,
    status: { notIn: ['INATIVO'] }, // ferias e afastados continuam na folha
  },
  ```

---

### BUG-EMP-008: Logica ternaria de conversao centavos -> reais usa falsy check — fragil para bonus/benefits = 0 (P2)
- **Severidade:** P2
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 35-37
- **Descricao:**
  ```typescript
  salary: employee?.salary ? employee.salary / 100 : 0,
  bonus: employee?.bonus ? employee.bonus / 100 : 0,
  benefits: employee?.benefits ? employee.benefits / 100 : 0,
  ```
  Se `bonus = 0` (sem bonus), o operador ternario curto-circuita e retorna `0` sem executar `/100`.
  O resultado final e `0`, que e correto **por coincidencia** (`0 / 100 = 0`).
  
  Porem, a logica e semanticamente errada e cria um risco latente: se o valor for `null` no banco
  (campo bonus e INT DEFAULT 0 no Prisma, entao nunca deveria ser null), a expressao ainda retornaria 0.
  A forma correta e `(employee?.salary ?? 0) / 100`.

- **Fix proposto:**
  ```typescript
  salary: (employee?.salary ?? 0) / 100,
  bonus: (employee?.bonus ?? 0) / 100,
  benefits: (employee?.benefits ?? 0) / 100,
  ```

---

### BUG-EMP-009: Tabela nao exibe coluna `Data de Início` do funcionário — informacao util ausente (P2)
- **Severidade:** P2
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 408-415
- **Descricao:**
  A tabela de funcionarios exibe: Nome, Cargo, Status, Salário, Total, Ações.
  O campo `startDate` (data de inicio/contratacao) existe no schema, DTO, service e formulario,
  mas **nao e exibido** na tabela. Para gestao de RH, a data de inicio e uma informacao essencial
  (calculo de tempo de empresa, aniversario de contratacao, periodo de experiencia, etc).
  O campo `paymentDay` (dia de pagamento) tambem nao e exibido.

- **Fix proposto:**
  Adicionar coluna na tabela:
  ```tsx
  <th>Desde</th>
  // ...
  <td>{new Date(employee.startDate).toLocaleDateString('pt-BR')}</td>
  ```

---

### BUG-EMP-010: Ausencia de estado de erro (isError) na query principal da lista — tela fica em branco silenciosamente (P2)
- **Severidade:** P2
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 243-251, 418-430
- **Descricao:**
  A query `useQuery({ queryKey: ['employees', filters], ... })` nao desestrutura `isError` nem `error`.
  Se o backend retornar 500, a tabela simplesmente nao renderiza nada (pois `data` fica `undefined` e
  nenhum dos conditions `isLoading`, `data?.data.length === 0` e verdadeiro) — a tabela renderiza
  um `tbody` vazio sem nenhuma mensagem de erro para o usuario.
  
  O mesmo ocorre com a query `payroll` (linha 253): sem tratamento de erro, o Payroll Summary
  simplesmente desaparece sem aviso.

- **Fix proposto:**
  ```typescript
  const { data, isLoading, isError } = useQuery({ ... });
  
  // Na tabela, adicionar:
  ) : isError ? (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center text-red-400">
        Erro ao carregar funcionários. Tente novamente.
      </td>
    </tr>
  ) : data?.data.length === 0 ? (
  ```

---

### BUG-EMP-011: Confirmacao de exclusao usa `window.confirm()` nativo — bloqueante e inconsistente com o design (P3)
- **Severidade:** P3
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linha 314
- **Descricao:**
  ```typescript
  if (confirm('Tem certeza que deseja excluir este funcionário?')) {
  ```
  `window.confirm()` usa o dialog nativo do browser, que bloqueia a thread JavaScript, tem aparencia
  inconsistente com o design da aplicacao (dark theme Zinc/Tailwind), e em alguns contextos (SSR, iframe,
  React strict mode) pode ter comportamento inesperado. A UX padrao para esse tipo de acao destrutiva
  e usar um modal de confirmacao customizado ou um toast com botao "Desfazer".

- **Fix proposto:**
  Implementar um modal de confirmacao customizado ou usar a biblioteca de toasts com acao:
  ```typescript
  const handleDelete = (id: string) => {
    toast.warning('Excluir este funcionário?', {
      action: { label: 'Confirmar', onClick: () => deleteMutation.mutate(id) },
      cancel: { label: 'Cancelar' },
    });
  };
  ```

---

### BUG-EMP-012: Paginacao renderiza botao atual com estilo ativo mesmo durante loading apos mudanca de pagina (P3)
- **Severidade:** P3
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 484-499
- **Descricao:**
  Quando o usuario clica em uma pagina diferente, `filters.page` e atualizado imediatamente (estado local),
  o botao exibe a cor ativa do emerald, mas a query ainda esta carregando os dados da nova pagina.
  Nao ha indicacao visual de "carregando pagina X" — o usuario ve o botao ativo mas a tabela ainda
  mostra os dados da pagina anterior (ou o spinner de loading que esconde a tabela inteira).
  Nao ha indicacao de "pagina atual" na URL (sem uso de `useSearchParams`), portanto o estado
  de paginacao nao sobrevive a um refresh da pagina.

- **Fix proposto:**
  Sincronizar paginacao com URL via `useSearchParams`, ou ao menos desabilitar botoes de pagina
  durante `isLoading` para evitar cliques multiplos.

---

### BUG-EMP-013: Interface `Employee` no frontend nao tem campos `document` e `endDate` — type safety incompleto (P3)
- **Severidade:** P3
- **Arquivo(s):**
  - `frontend/src/services/financial.service.ts` linhas 20-36
- **Descricao:**
  A interface TypeScript `Employee` no servico frontend:
  ```typescript
  export interface Employee {
    id: string; userId: string; name: string; email?: string; phone?: string;
    role: EmployeeRole; status: EmployeeStatus; salary: number; bonus: number;
    benefits: number; startDate: string; paymentDay: number; notes?: string;
    createdAt: string; updatedAt: string;
  }
  ```
  Faltam: `document?: string` e `endDate?: string`, que existem no banco.
  Se o backend retornar esses campos (apos eventual fix do BUG-EMP-004), o TypeScript nao os tipara,
  causando acesso sem tipo.

- **Fix proposto:**
  ```typescript
  export interface Employee {
    // ... campos existentes ...
    document?: string;   // CPF/CNPJ
    endDate?: string;    // Data de demissao (ISO string)
  }
  ```

---

### BUG-EMP-014: `getPayroll` query sem staleTime — refetch desnecessario a cada navegacao (P3)
- **Severidade:** P3
- **Arquivo(s):**
  - `frontend/src/app/(dashboard)/financeiro/funcionarios/page.tsx` linhas 253-256
- **Descricao:**
  ```typescript
  const { data: payroll } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => financialService.getPayroll(),
  });
  ```
  Sem `staleTime`, o TanStack Query marca os dados como stale imediatamente apos o fetch.
  A cada vez que o usuario navega para fora e volta para esta pagina (window focus), a query
  refaz o request ao backend desnecessariamente. Para dados de folha de pagamento que mudam
  apenas quando um funcionario e criado/editado/deletado, um `staleTime` adequado evitaria
  requests redundantes.

- **Fix proposto:**
  ```typescript
  const { data: payroll } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => financialService.getPayroll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  ```

---

## ANALISE ADICIONAL — Pontos Corretos

Os itens abaixo foram verificados e estao **corretos**:

1. **Isolamento multi-tenant:** Todas as queries do service usam `where: { userId }` ou `where: { id, userId }`. O controller sempre extrai `userId = req.user?.id` e verifica se e truthy antes de prosseguir.

2. **Conversao centavos<->reais:** A funcao `formatCurrency(cents)` divide por 100 corretamente. O formulario converte para centavos com `Math.round(valor * 100)` na submissao — protegido contra arredondamento de ponto flutuante.

3. **Ordem das rotas Express:** `/employees/payroll` esta registrado **antes** de `/employees/:id` (linhas 29-30 das routes), garantindo que a rota estatica "payroll" nao seja capturada pelo parametro dinamico `:id`.

4. **Invalidacao de cache:** As tres mutations (create, update, delete) invalidam corretamente tanto `['employees']` quanto `['payroll']`. O prefixo `['employees']` invalida todas as queries com esse prefixo, incluindo `['employees', filters]`.

5. **Paginacao ao filtrar:** Ao mudar role ou status, `page` e resetado para `1` (linhas 379, 393).

6. **Validacao de startDate:** O formulario verifica `!formData.startDate` antes de submeter e exibe toast de erro (linha 46-49), embora o campo ja tenha `required` HTML.

7. **Campos opcionais na tabela:** `employee.email` e renderizado condicionalmente com `{employee.email && (...)}`.

8. **Try/catch em todos os endpoints:** Todos os 5 metodos do controller tem try/catch com ZodError handling separado onde relevante (create, findAll, update).

9. **Timezone no startDate:** `new Date(formData.startDate + 'T12:00:00').toISOString()` usa meio-dia local para evitar que a data "escorregue" para o dia anterior em timezones UTC-offset negativos.

---

## BOTOES DECORATIVOS
| Componente | Botao | Situacao |
|------------|-------|----------|
| EmployeeModal | X (fechar) | Tem `onClick={onClose}` — FUNCIONAL |
| EmployeeModal | Cancelar | Tem `onClick={onClose}` — FUNCIONAL |
| EmployeeModal | Salvar | Tem `type="submit"` — FUNCIONAL |
| FuncionariosPage | Novo Funcionário | Tem onClick que seta estado — FUNCIONAL |
| FuncionariosPage | Editar (lapís) | Tem `onClick={() => handleEdit(employee)}` — FUNCIONAL |
| FuncionariosPage | Excluir (lixo) | Tem `onClick={() => handleDelete(employee.id)}` — FUNCIONAL |
| FuncionariosPage | Botoes de pagina | Tem `onClick` que atualiza filtros — FUNCIONAL |

Nenhum botao decorativo (sem handler) encontrado.

---

## AVISOS
- SERVICO_OFFLINE: Nenhuma URL de producao configurada no project-registry.md. Smoke tests nao executados.
- O campo `salary` no formulario tem `required` HTML e `required` no DTO Zod, mas um salario de R$0,00 e tecnicamente valido (sera aceito pelo Zod como `0`). Avaliar se faz sentido de negocio.
- O `getByRole` (employee.service.ts linha 111-124) nao e exposto via API — funcao existe mas sem endpoint, e usada indiretamente via `dashboard.service.ts` no macro view.
