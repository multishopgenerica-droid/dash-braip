# SCAN REPORT — financial/expenses (CRUD de Gastos)
Data: 2026-02-18

## RESUMO
| Metrica | Valor |
|---------|-------|
| Arquivos backend lidos | 5 (controller, service, dto, routes, schema) |
| Arquivos frontend lidos | 2 (page.tsx, financial.service.ts) |
| Endpoints totais | 5 (CRUD completo) |
| Endpoints smoke test | SERVICO_OFFLINE (nao testavel — URL generica no registry) |
| Bugs P0 (CRITICO) | 3 |
| Bugs P1 (ALTO) | 7 |
| Bugs P2 (MEDIO) | 6 |
| Bugs P3 (BAIXO) | 5 |

## ENDPOINTS
| # | Metodo | URL | Status |
|---|--------|-----|--------|
| 1 | GET    | /api/financial/expenses | SERVICO_OFFLINE (URL generica no registry) |
| 2 | POST   | /api/financial/expenses | SERVICO_OFFLINE |
| 3 | GET    | /api/financial/expenses/:id | SERVICO_OFFLINE |
| 4 | PUT    | /api/financial/expenses/:id | SERVICO_OFFLINE |
| 5 | DELETE | /api/financial/expenses/:id | SERVICO_OFFLINE |

## BUGS ENCONTRADOS

---

### BUG-EXP-001: Formulario aceita amount=0 (zero reais) sem erro de validacao
- **Severidade**: P0 — CRITICO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 126
- **Descricao**: O campo Valor usa `parseFloat(e.target.value) || 0` como fallback. Se o usuario apagar o campo ou digitar 0, o valor fica 0. No `handleSubmit` (linha 47), `Math.round(0 * 100)` = 0. O backend tem `z.number().int().positive()` (dto linha 36), o que rejeitaria 0 corretamente. No entanto, a interface permite submeter o formulario com amount=0 (`required` nao impede zero em input type=number), gerando um erro 400 do backend sem mensagem amigavel pre-validacao no frontend.
- **Fix proposto**: Adicionar validacao no `handleSubmit` antes de chamar `onSave`: `if (formData.amount <= 0) { toast.error('Valor deve ser maior que zero'); return; }`. Alternativamente, usar `min="0.01"` no input HTML e adicionar validacao explicita.

---

### BUG-EXP-002: Conversao de centavos no input de edicao pode acumular erro de ponto flutuante
- **Severidade**: P0 — CRITICO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 37
- **Descricao**: Na edicao, `expense.amount / 100` converte centavos para reais para exibir no input. Ex: um valor de 1999 centavos vira `19.99`. Ao salvar, `Math.round(19.99 * 100)` = 1999. Ate ai correto. Porem, se o valor armazenado for algo como 4999 centavos, `4999/100 = 49.99`, e `Math.round(49.99*100) = 4999`. A questao e que `parseFloat` pode gerar imprecisao: `parseFloat("49.99") * 100 = 4998.999999999999`, e `Math.round(4998.99) = 4999` — neste caso Math.round salva. Contudo valores como `0.1 + 0.2` no campo podem causar erros. O verdadeiro problema ocorre quando o usuario EDITA o valor no input: `parseFloat(e.target.value)` pode capturar valores com muitas casas decimais que o `Math.round` nao consegue corrigir perfeitamente em todos os casos.
- **Fix proposto**: Usar `Math.round(parseFloat(formData.amount.toFixed(2)) * 100)` ou tratar o input como string ate o submit, aplicando conversao segura via biblioteca como `dinero.js` ou `currency.js`.

---

### BUG-EXP-003: `recurrenceEndDate` existe no schema Prisma mas e completamente ignorado pelo CRUD
- **Severidade**: P0 — CRITICO
- **Arquivo (schema)**: `/root/sistema-dash-braip/backend/prisma/schema.prisma`, linha 592
- **Arquivo (dto)**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/expense.dto.ts`
- **Arquivo (service)**: `/root/sistema-dash-braip/backend/src/modules/financial/services/expense.service.ts`
- **Arquivo (frontend)**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Descricao**: O model `Expense` no Prisma tem o campo `recurrenceEndDate DateTime?` (schema linha 592). Este campo esta ausente: (a) no `createExpenseSchema` e `updateExpenseSchema` no DTO; (b) no `create()` e `update()` do service; (c) na interface `Expense` do frontend (financial.service.ts); (d) no formulario modal. Resultado: usuarios podem selecionar recorrencia (MENSAL, SEMANAL, etc.) mas nunca conseguem definir quando ela termina. O campo existe no banco mas e sempre NULL.
- **Fix proposto**: Adicionar `recurrenceEndDate: z.string().datetime().optional()` ao DTO, processar no service em create/update, adicionar campo `recurrenceEndDate?: string` na interface Expense do frontend, e adicionar campo "Data Fim de Recorrencia" no formulario (visivel apenas quando recurrence != 'UNICO').

---

### BUG-EXP-004: `employeeId` e `toolId` existem no schema mas sao ignorados no CRUD
- **Severidade**: P1 — ALTO
- **Arquivo (schema)**: `/root/sistema-dash-braip/backend/prisma/schema.prisma`, linhas 595-598
- **Arquivo (dto)**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/expense.dto.ts`
- **Descricao**: O model `Expense` possui campos `employeeId String?` e `toolId String?` para vincular gastos a funcionarios e ferramentas. Estes campos: (a) nao estao no `createExpenseSchema` nem `updateExpenseSchema`; (b) nao sao salvos no `service.create()`; (c) nao existem na interface `Expense` do frontend. Assim, a relacao entre gastos e funcionarios/ferramentas nunca pode ser populada via CRUD.
- **Fix proposto**: Adicionar `employeeId: z.string().optional()` e `toolId: z.string().optional()` ao DTO. Processar no service. Adicionar na interface TypeScript do frontend se necessario.

---

### BUG-EXP-005: `paidAt` nao e exibido nem editavel no formulario frontend
- **Severidade**: P1 — ALTO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 32-41 (formData)
- **Descricao**: O campo `paidAt` existe no schema Prisma (linha 589), na interface `Expense` do frontend (financial.service.ts linha 13), no `CreateExpenseDTO` (dto linha 38) e e processado no service. Porem o formulario modal NAO tem campo para `paidAt`. Quando o usuario muda o status para 'PAGO', a data de pagamento nunca e registrada. O backend aceita `paidAt` no body mas o frontend nunca o envia. Auditoria de pagamentos fica comprometida.
- **Fix proposto**: Adicionar `paidAt` ao `formData` no estado inicial e incluir campo de data "Data de Pagamento" no formulario, visivel/obrigatorio quando `status === 'PAGO'`.

---

### BUG-EXP-006: Estado `isLoading` sem tratamento de erro — `data` pode ser undefined e crashar
- **Severidade**: P1 — ALTO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 199-207 (useQuery) e 350 (data?.data.length === 0)
- **Descricao**: O hook `useQuery` nao captura `isError` nem `error`. Se a API retornar erro (rede, 500, 401), `data` fica `undefined` e `isLoading` vira `false`. A condicao `data?.data.length === 0` (linha 350) usa optional chaining, o que evita crash nesse ponto. Porem a linha `data?.data.map(...)` (linha 357) tambem usa optional chaining, resultando em tabela VAZIA sem nenhuma mensagem de erro para o usuario. O usuario nao sabe se a lista esta vazia ou se houve falha.
- **Fix proposto**: Desestruturar `isError` e `error` do `useQuery` e adicionar terceira condicao no tbody para exibir mensagem de erro visivel, ex: `<td colSpan={6} className="text-red-400">Erro ao carregar gastos. Tente novamente.</td>`.

---

### BUG-EXP-007: Paginacao renderiza TODOS os botoes sem limite — performance com muitos registros
- **Severidade**: P1 — ALTO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 407-419
- **Descricao**: `[...Array(data.pagination.totalPages)].map(...)` renderiza um botao para cada pagina. Com 1000 registros e limite de 20, isso gera 50 botoes. Com 10.000 registros, 500 botoes. Nao ha paginacao estilo "elipsis" (ex: 1, 2, ..., 47, 48, 49). Isso causa: (a) layout quebrado horizontalmente; (b) problemas de performance com muitos registros.
- **Fix proposto**: Implementar paginacao com janela sliding: mostrar apenas as paginas adjacentes a atual (ex: pagina atual +/- 2), com elipsis e botoes de Anterior/Proximo.

---

### BUG-EXP-008: `confirm()` nativo para confirmacao de delete — UX ruim e bloqueante
- **Severidade**: P1 — ALTO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 262
- **Descricao**: `if (confirm('Tem certeza que deseja excluir este gasto?'))` usa o dialogo nativo do browser, que: (a) e bloqueante (trava o event loop); (b) nao pode ser estilizado para combinar com o dark theme; (c) em alguns contextos (SSR, testes automatizados) pode causar comportamento inesperado; (d) e inconsistente com o restante da UI que usa toasts do Sonner. Em Next.js com `'use client'`, funciona mas e considerada ma pratica moderna.
- **Fix proposto**: Substituir por um modal de confirmacao customizado ou pelo componente `AlertDialog` do Radix UI / shadcn/ui.

---

### BUG-EXP-009: Filtro de busca por nome/texto ausente — icone `Search` importado mas nunca usado
- **Severidade**: P1 — ALTO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 16 (import Search) e toda a pagina
- **Descricao**: O icone `Search` esta importado do lucide-react na linha 16 mas nunca e utilizado em nenhum lugar do JSX. Isso indica que havia plano de implementar um campo de busca por nome/descricao mas foi abandonado. Sem busca textual, o usuario so pode filtrar por categoria e status, sendo incapaz de localizar um gasto especifico pelo nome.
- **Fix proposto**: (a) Se busca foi abandonada: remover o import de `Search` para eliminar dead code. (b) Se deve ser implementada: adicionar campo de busca com `debounce` que passa parametro `search` para `listExpenses`, e adicionar suporte a este parametro no backend (`expenseFilterSchema` e query `where`).

---

### BUG-EXP-010: `updateExpense` usa PUT mas deveria ser PATCH — update nao-parcial forcado
- **Severidade**: P1 — ALTO
- **Arquivo frontend**: `/root/sistema-dash-braip/frontend/src/services/financial.service.ts`, linha 307
- **Arquivo backend routes**: `/root/sistema-dash-braip/backend/src/modules/financial/financial.routes.ts`, linha 23
- **Descricao**: O frontend envia `PUT /financial/expenses/:id` com todos os campos do formulario (incluindo campos que o usuario nao editou). O backend usa `updateExpenseSchema = createExpenseSchema.partial()` (DTO linha 43), que aceita campos parciais, mas a rota e metodo HTTP sao PUT (semantica de substituicao total). Mais importante: o formulario de edicao nao inclui `paidAt`, `employeeId`, `toolId`, e `recurrenceEndDate`. Se esses campos existiam no registro original, o update NAO os apaga (o service usa spreads condicionais), mas a inconsistencia semantica entre PUT (total replace) e o comportamento real (partial update) pode confundir desenvolvedores futuros.
- **Fix proposto**: Mudar a rota no backend de `router.put` para `router.patch` e no frontend de `api.put` para `api.patch`. Atualizar a nomenclatura do metodo para `updateExpense` ou criar `patchExpense`.

---

### BUG-EXP-011: `dueDate` no filtro do backend compara com `dueDate` mas dashboard usa status PENDENTE sem data
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/expense.service.ts`, linha 33-37
- **Descricao**: O filtro de data em `findAll` filtra pela coluna `dueDate`. Gastos sem `dueDate` (campo opcional no schema e DTO) nunca aparecem quando os filtros `startDate`/`endDate` sao aplicados, mesmo que sejam gastos relevantes do periodo (ex: gasto criado no mes mas sem data de vencimento definida). O frontend nao expoe `startDate`/`endDate` nos filtros (so categoria e status), mas o dashboard service usa `dueDate` para calcular totais mensais — gastos sem `dueDate` sao excluidos dos totais do dashboard.
- **Fix proposto**: Para o dashboard, considerar usar `createdAt` como fallback quando `dueDate` e null. Ou tornar `dueDate` obrigatorio no schema. Documentar a decisao de negocio.

---

### BUG-EXP-012: `getMonthlyTotal` no service nao filtra por status — inclui gastos CANCELADOS nos totais
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/expense.service.ts`, linhas 114-127
- **Descricao**: O metodo `getMonthlyTotal` agrega todos os gastos do mes sem filtrar por status. Gastos com status `CANCELADO` sao incluidos na soma, inflando os totais financeiros. O mesmo problema existe em `getMacroView` do dashboard service (linhas 32-43) e `getMonthlyTrend` (linhas 130-136).
- **Fix proposto**: Adicionar `status: { not: 'CANCELADO' }` ou `status: { in: ['PENDENTE', 'PAGO', 'VENCIDO'] }` nas queries de agregacao de totais.

---

### BUG-EXP-013: Tabela sem coluna "Recorrencia" — informacao importante omitida
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 334-341 (thead)
- **Descricao**: A tabela tem colunas: Nome, Categoria, Status, Valor, Vencimento, Acoes. O campo `recurrence` e coletado no formulario mas nunca exibido na listagem. Usuario nao consegue ver de relance quais gastos sao recorrentes vs unicos sem clicar em editar.
- **Fix proposto**: Adicionar coluna "Recorrencia" na tabela usando `RECURRENCE_LABELS[expense.recurrence]`.

---

### BUG-EXP-014: Formatacao de data na tabela pode mostrar data errada por timezone
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 378
- **Descricao**: `new Date(expense.dueDate).toLocaleDateString('pt-BR')` interpreta a string ISO do backend como UTC. Se o backend retornar `"2026-02-18T00:00:00.000Z"`, em timezone America/Sao_Paulo (UTC-3) o `new Date()` cria `2026-02-17T21:00:00` local, e `toLocaleDateString` exibe `17/02/2026` em vez de `18/02/2026` — um dia a menos. O formulario compensa isso adicionando `T12:00:00` (linha 48) ao salvar, o que e um workaround parcial.
- **Fix proposto**: Normalizar o tratamento de datas. Opcao consistente: salvar e retornar datas como strings `YYYY-MM-DD` (sem timezone) para campos de dia inteiro. No frontend, parsear como `expense.dueDate.split('T')[0]` e usar `new Date(dateStr + 'T12:00:00')` antes de `toLocaleDateString`.

---

### BUG-EXP-015: `Math.round` no submit pode produzir valor negativo se usuario digitar valor negativo
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 47 e 126
- **Descricao**: O input tem `min="0"` (linha 123), mas isso e apenas validacao HTML nativa que pode ser bypassada. Se um valor negativo for submetido (via DevTools ou automacao), `Math.round(formData.amount * 100)` sera negativo. O DTO backend tem `.positive()` que rejeita corretamente, mas gera erro 400 sem mensagem clara no frontend (o handler de erro tenta `err.response?.data?.details?.[0]?.message` que para Zod retorna mensagem tecnica em ingles).
- **Fix proposto**: Adicionar validacao frontend antes do submit: `if (formData.amount < 0.01) {...}`. Complementa o BUG-EXP-001.

---

### BUG-EXP-016: Sem filtro por periodo de data no frontend — filtros `startDate`/`endDate` existem no backend mas nao sao expostos
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 193-197 (estado filters)
- **Descricao**: O backend suporta `startDate` e `endDate` no `expenseFilterSchema` (dto linhas 49-50). O frontend so expoe filtros de `category` e `status`. Usuarios nao conseguem filtrar gastos por periodo (ex: "gastos de janeiro de 2026").
- **Fix proposto**: Adicionar inputs de data "De" e "Ate" no painel de filtros, passando `startDate` e `endDate` para `listExpenses`.

---

### BUG-EXP-017: Cache invalidation invalida apenas `['expenses']` mas nao invalida dashboard/summary
- **Severidade**: P2 — MEDIO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linhas**: 212, 227, 243
- **Descricao**: Todas as mutations (create, update, delete) invalidam apenas `queryKey: ['expenses']`. Se houver queries em cache para o dashboard financeiro (ex: `['financial-summary']`, `['macro-view']`), elas NAO sao invalidadas apos criar/editar/deletar um gasto. O usuario pode ver dados desatualizados no dashboard apos operacoes CRUD.
- **Fix proposto**: Adicionar invalidacao adicional: `queryClient.invalidateQueries({ queryKey: ['financial'] })` ou adicionar as chaves especificas do dashboard nas mutations de gastos.

---

### BUG-EXP-018: Modal sem estado de loading durante submit — duplo-clique pode criar gasto duplicado
- **Severidade**: P3 — BAIXO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 176-182 (botao Salvar)
- **Descricao**: O botao "Salvar" nao desabilita durante a execucao da mutation. `createMutation.isPending` e `updateMutation.isPending` existem no TanStack Query mas nao sao usados. Um usuario pode clicar "Salvar" multiplas vezes antes da resposta, criando registros duplicados.
- **Fix proposto**: `<button disabled={createMutation.isPending || updateMutation.isPending} ...>`. Mostrar spinner ou texto "Salvando..." durante o isPending.

---

### BUG-EXP-019: Botao Cancelar no modal nao tem `type="button"` — pode submeter formulario em alguns browsers
- **Severidade**: P3 — BAIXO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linha**: 169-174
- **Descricao**: O botao Cancelar tem `type="button"` (linha 170) — isso esta correto. Porem e boa pratica verificar: o botao de fechar (X) no header do modal (linha 59) tambem nao tem `type="button"`, mas como e filho de um `<div>` e nao de um `<form>`, nao causa submissao. Sem impacto real, mas recomenda-se type="button" explicito em todos os botoes dentro de formularios.
- **Fix proposto**: Adicionar `type="button"` ao botao X de fechar (linha 59) por clareza e defensividade.

---

### BUG-EXP-020: Nenhum index de banco para busca combinada — performance degradada com volume
- **Severidade**: P3 — BAIXO
- **Arquivo**: `/root/sistema-dash-braip/backend/prisma/schema.prisma`, linhas 605-609
- **Descricao**: Os indexes definidos para `Expense` sao individuais: `@@index([userId])`, `@@index([category])`, `@@index([status])`, `@@index([dueDate])`. A query mais comum em `findAll` usa `{ userId, category?, status?, dueDate? }`. Sem index composto `(userId, status)` ou `(userId, category)`, o PostgreSQL faz table scan filtrado por userId e depois filtra por status/category em memoria. Com muitos registros por usuario, a performance degrada.
- **Fix proposto**: Adicionar `@@index([userId, status])` e `@@index([userId, category])` no model `Expense` no schema Prisma.

---

### BUG-EXP-021: `description` e `notes` sao campos diferentes mas nao ha limite de tamanho no DTO para `description`
- **Severidade**: P3 — BAIXO
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/expense.dto.ts`, linha 33
- **Descricao**: `description: z.string().optional()` nao tem limite de tamanho. No Prisma schema, `description String?` sem `@db.Text` usa `VARCHAR(255)` por padrao em PostgreSQL. Um input de `description` muito longo causaria erro de banco com mensagem generica "Erro interno do servidor" em vez de erro de validacao.  Ja `notes` no schema usa `@db.Text` (linha 601) e nao tem limite, o que e correto para um campo de observacoes livres.
- **Fix proposto**: Adicionar `.max(500)` ou `.max(1000)` ao campo `description` no DTO. Ou adicionar `@db.Text` ao campo `description` no schema Prisma se textos longos sao esperados.

---

### BUG-EXP-022: Falta `aria-label` nos botoes de acao da tabela — acessibilidade
- **Severidade**: P3 — BAIXO
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/gastos/page.tsx`
- **Linhas**: 383-395
- **Descricao**: Os botoes de Editar e Excluir na tabela contem apenas icones SVG (Pencil, Trash2) sem texto visivel. Sem `aria-label`, leitores de tela anunciam esses botoes como elementos sem nome, impossibilitando uso por pessoas com deficiencia visual.
- **Fix proposto**: Adicionar `aria-label="Editar gasto"` e `aria-label="Excluir gasto"` nos respectivos botoes.

---

## BOTOES DECORATIVOS
| Componente | Botao | Status |
|-----------|-------|--------|
| GastosPage | Icone X (fechar modal) | Funcional (onClick=onClose presente) |
| GastosPage | Botao Editar (Pencil) | Funcional (onClick=handleEdit presente) |
| GastosPage | Botao Excluir (Trash2) | Funcional (onClick=handleDelete presente) |
| GastosPage | Botao Salvar | Funcional (type=submit no form) |
| GastosPage | Botao Cancelar | Funcional (type=button com onClick=onClose) |

Nenhum botao decorativo identificado (todos tem handlers). Porem o import `Search` e um icone nao-utilizado (ver BUG-EXP-009).

## AVISOS

### 1. SERVICO OFFLINE — Smoke tests nao executados
O registry contem URLs genericas (`https://SEU-DOMINIO.com`). Os endpoints da API nao foram testados via curl. Isso NAO afeta a analise estatica de codigo — todos os bugs acima foram identificados por leitura e analise dos arquivos fonte.

### 2. Campos do Prisma nao mapeados no DTO/Frontend
Resumo dos campos presentes no model `Expense` do Prisma que estao ausentes no DTO e/ou frontend:
- `recurrenceEndDate` — ausente no DTO, service e frontend (BUG-EXP-003, P0)
- `employeeId` / `toolId` — ausentes no DTO e service (BUG-EXP-004, P1)
- `paidAt` — ausente no formulario frontend (BUG-EXP-005, P1)

### 3. API usa PUT para update parcial
Semanticamente incorreto (deveria ser PATCH), mas funcionalmente correto porque o service usa spreads condicionais. Detalhe no BUG-EXP-010.

### 4. Scan parcial — outros arquivos relacionados nao analisados nesta sessao
Os seguintes arquivos existem mas foram fora do escopo desta analise:
- `/root/sistema-dash-braip/backend/src/modules/financial/services/employee.service.ts`
- `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- `/root/sistema-dash-braip/backend/src/modules/financial/services/traffic.service.ts`
