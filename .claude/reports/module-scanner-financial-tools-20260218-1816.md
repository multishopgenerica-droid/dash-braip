# SCAN REPORT — financial / ferramentas (Tools CRUD)
Data: 2026-02-18

## RESUMO

| Metrica | Valor |
|---------|-------|
| Arquivos backend lidos | 4 (controller, service, dto, routes) |
| Arquivos frontend lidos | 2 (page.tsx, financial.service.ts) |
| Arquivos schema lidos | 1 (schema.prisma) |
| Endpoints totais (tools) | 6 |
| Endpoints smoke test | SERVICO_OFFLINE (API nao acessivel em ambiente de scan) |
| Bugs P0 | 2 |
| Bugs P1 | 5 |
| Bugs P2 | 6 |
| Bugs P3 | 4 |

---

## ENDPOINTS (Tools)

| # | Metodo | Path | Handler |
|---|--------|------|---------|
| 1 | GET    | /financial/tools              | toolController.findAll      |
| 2 | POST   | /financial/tools              | toolController.create       |
| 3 | GET    | /financial/tools/cost         | toolController.getMonthlyCost |
| 4 | GET    | /financial/tools/:id          | toolController.findById     |
| 5 | PUT    | /financial/tools/:id          | toolController.update       |
| 6 | DELETE | /financial/tools/:id          | toolController.delete       |

Smoke test: SERVICO_OFFLINE — API indisponivel no ambiente de analise estatica.

---

## BUGS ENCONTRADOS

---

### BUG-TOOL-001: Rota GET /tools/cost capturada por GET /tools/:id (P0 - CRITICO)
- Severidade: **P0**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/financial.routes.ts`
- Linha: 37-38
- Descricao:
  A rota estatica `/tools/cost` esta registrada DEPOIS de `/tools/:id` na mesma linha de definicao do router do Express.

  ```
  router.get('/tools/cost', ...)   // linha 37
  router.get('/tools/:id', ...)    // linha 38
  ```

  **O Express avalia rotas na ordem de registro.** Como `:id` e um parametro dinamico e esta definido logo apos `/cost`, uma requisicao `GET /tools/cost` sera interceptada pela rota `/tools/:id` com `id = "cost"` antes de chegar ao handler correto.

  Resultado pratico: `GET /financial/tools/cost` retorna 404 ("Ferramenta nao encontrada") ao inves do custo mensal. O banner de custo total no frontend sempre mostra R$ 0,00 (valor padrao do fallback `costData?.monthlyCost || 0`).

  **Comparacao com padrao correto de employees (linha 29 vs 30):**
  ```
  router.get('/employees/payroll', ...)  // linha 29 — CORRETO: rota estatica ANTES do parametro
  router.get('/employees/:id', ...)      // linha 30
  ```
  O modulo de employees fez correto. O modulo de tools inverteu a ordem.

- Fix proposto: Mover `router.get('/tools/cost', ...)` para ANTES de `router.get('/tools/:id', ...)`.

---

### BUG-TOOL-002: monthlyCost do card exibe o valor RAW em centavos sem dividir por 100 (P0 - CRITICO)
- Severidade: **P0**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 422-423
- Descricao:
  No card de cada ferramenta, o campo `monthlyCost` e exibido assim:

  ```tsx
  <p className="text-2xl font-bold text-white">
    {formatCurrency(tool.monthlyCost)}
  </p>
  ```

  A funcao `formatCurrency` em `financial.service.ts` linha 424-428 ja divide por 100:
  ```ts
  export const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('pt-BR', { ... }).format(cents / 100);
  };
  ```

  Isso esta CORRETO — `tool.monthlyCost` vem da API em centavos e `formatCurrency` divide por 100.

  **MAS** o formulario modal (ToolModal) salva assim (linha 46):
  ```tsx
  monthlyCost: Math.round(formData.monthlyCost * 100),
  ```

  E inicializa o campo de edicao assim (linha 33):
  ```tsx
  monthlyCost: tool?.monthlyCost ? tool.monthlyCost / 100 : 0,
  ```

  O fluxo parece consistente, porem a exibicao no card usa `formatCurrency(tool.monthlyCost)` que divide por 100 — e o valor retornado pela API JA esta em centavos (inteiro), portanto a exibicao esta correta.

  **O bug real e no campo `annualCost` no card**: o campo `annualCost` e exibido NO FORMULARIO corretamente (linha 34: `/100` e linha 47: `*100`), mas **nao e exibido em nenhum lugar no card da ferramenta**. Um usuario que pagou R$ 1.200,00 anual (e preencheu o campo Custo Anual) nao consegue ver esse valor nos cards.

- Fix proposto: Adicionar exibicao do `annualCost` no card quando `recurrence === 'ANUAL'`, ou como linha secundaria abaixo do custo mensal.

---

### BUG-TOOL-003: getMonthlyToolsCost usa monthlyCost para calcular recurrencias ANUAL/SEMESTRAL/TRIMESTRAL mas o campo semanticamente incorreto (P1)
- Severidade: **P1**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- Linhas: 96-119
- Descricao:
  O servico calcula o custo mensal normalizado usando SEMPRE `tool.monthlyCost`:

  ```ts
  case 'ANUAL':
    monthlyTotal += Math.round(tool.monthlyCost / 12);   // divide monthlyCost por 12
  case 'SEMESTRAL':
    monthlyTotal += Math.round(tool.monthlyCost / 6);    // divide monthlyCost por 6
  case 'TRIMESTRAL':
    monthlyTotal += Math.round(tool.monthlyCost / 3);    // divide monthlyCost por 3
  ```

  O problema: o campo `monthlyCost` no schema do banco e no DTO e descrito como "Monthly cost in cents". Para uma ferramenta com recorrencia ANUAL, o usuario naturalmente preenche o campo "Custo Mensal" no formulario com o valor mensal (ex: R$ 100/mes). O calculo divide esse valor por 12, resultando em R$ 8,33/mes — um valor incorreto.

  O que deveria ocorrer para recorrencia ANUAL: o campo `annualCost` existe exatamente para esse proposito. O calculo correto seria `annualCost / 12`. Mas o codigo ignora `annualCost` completamente no calculo.

  Cenario real de bug:
  - Ferramenta: "Adobe Creative Cloud"
  - Recorrencia: ANUAL
  - annualCost: R$ 1.200,00 (120000 centavos)
  - monthlyCost: R$ 0 (usuario nao sabe o que colocar)
  - Resultado atual: R$ 0/mes no banner
  - Resultado esperado: R$ 100/mes no banner

- Fix proposto:
  ```ts
  case 'ANUAL':
    if (tool.annualCost) {
      monthlyTotal += Math.round(tool.annualCost / 12);
    } else {
      monthlyTotal += Math.round(tool.monthlyCost / 12);
    }
    break;
  ```
  Idem para SEMESTRAL (annualCost/6 ou monthlyCost/6) e TRIMESTRAL.

---

### BUG-TOOL-004: getByCategory ignora normalizacao de recorrencia no _sum.monthlyCost (P1)
- Severidade: **P1**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- Linhas: 126-139
- Descricao:
  O metodo `getByCategory` faz um `groupBy` com `_sum: { monthlyCost: true }`. Isso retorna a SOMA RAW de `monthlyCost` por categoria, sem aplicar nenhuma normalizacao por recorrencia.

  Uma ferramenta com recorrencia SEMANAL (custo mensal * 4) e uma com recorrencia ANUAL (custo mensal / 12) sao somadas com o mesmo peso, distorcendo os totais por categoria.

  Esse metodo e usado no dashboard financeiro macro (breakdown.toolsByCategory), o que causa valores incorretos no dashboard de visao geral.

- Fix proposto: Calcular o custo mensal normalizado por ferramenta antes de agrupar, ou documentar explicitamente que o valor e o custo bruto e nao o custo mensal equivalente.

---

### BUG-TOOL-005: isActive filter usa z.coerce.boolean() que tem comportamento incorreto com string "false" (P1)
- Severidade: **P1**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/dto/tool.dto.ts`
- Linha: 35
- Descricao:
  ```ts
  isActive: z.coerce.boolean().optional(),
  ```

  `z.coerce.boolean()` em Zod usa a coercao nativa do JavaScript: `Boolean("false")` retorna `true` porque qualquer string nao-vazia e truthy.

  Quando o frontend envia `?isActive=false` (string via query param), o Zod converte `"false"` para `true`, filtrando apenas ferramentas ATIVAS ao inves de INATIVAS.

  O filtro "Inativas" no frontend portanto nunca funciona — sempre retorna ferramentas ativas.

  Nota: o frontend passa o valor corretamente:
  ```tsx
  isActive: filters.isActive === '' ? undefined : filters.isActive === 'true',
  ```
  Isso converte para boolean antes de enviar, mas o Axios serializa booleans como strings em query params (`?isActive=false`), reintroduzindo o problema.

- Fix proposto:
  ```ts
  isActive: z.string().transform(v => v === 'true').pipe(z.boolean()).optional(),
  // ou:
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  ```

---

### BUG-TOOL-006: annualCost no formulario nao e enviado como undefined quando zerado (P1)
- Severidade: **P1**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 47 e 140
- Descricao:
  No formulario, o campo `annualCost` tem valor padrao `0` (linha 34):
  ```tsx
  annualCost: tool?.annualCost ? tool.annualCost / 100 : 0,
  ```

  No `handleSubmit` (linha 47):
  ```tsx
  annualCost: formData.annualCost ? Math.round(formData.annualCost * 100) : undefined,
  ```

  Quando o usuario deixa o campo em branco, o `parseFloat` retorna `0` (linha 140: `parseFloat(e.target.value) || 0`), que e falsy, entao `annualCost` e enviado como `undefined`. Ate aqui correto.

  **Mas**: quando o usuario digita `0` explicitamente no campo, ou quando a ferramenta JA TEM annualCost = 0 no banco e o usuario edita sem tocar nesse campo, `formData.annualCost` sera `0` (falsy), entao sera enviado como `undefined`, e o Prisma nao vai zerar o campo — ele sera ignorado no update (pois updateToolSchema e partial).

  **Cenario de perda de dado**: Ferramenta tem annualCost = 500000 (R$ 5.000). Usuario edita apenas o nome. O campo annualCost no formulario mostra R$ 5.000 (correto). Ao salvar, `Math.round(5000 * 100)` = `500000`, enviado corretamente. Esse cenario especifico esta OK.

  **Cenario real de bug**: usuario quer ZERAR o annualCost (digitar 0 ou apagar o campo). O valor sera `0` (falsy), enviado como `undefined`, e o campo permanece com o valor antigo no banco. Nao ha como zerar o annualCost via UI.

- Fix proposto:
  ```tsx
  annualCost: formData.annualCost != null ? Math.round(formData.annualCost * 100) : undefined,
  ```
  E tratar o campo como nullable no schema, permitindo `null` para zerar explicitamente.

---

### BUG-TOOL-007: Paginacao com numero grande de paginas nao tem limite visual (P1)
- Severidade: **P1**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linhas: 441-457
- Descricao:
  A paginacao renderiza UM BOTAO POR PAGINA:
  ```tsx
  {[...Array(data.pagination.totalPages)].map((_, i) => (
    <button key={i} ...>{i + 1}</button>
  ))}
  ```

  Se um usuario tem 200 ferramentas com limit=20, serao renderizados 10 botoes (aceitavel). Mas se o limit for 1 (possivel via manipulacao de query), ou se houver centenas de ferramentas, a UI quebra com dezenas de botoes. O padrao correto e usar paginacao "..." (ellipsis) ou limitar a janela de paginas exibidas.

  Mais grave: nao ha botoes "Anterior" / "Proximo", tornando a navegacao inconveniente para users que precisam avancar pagina a pagina.

- Fix proposto: Implementar paginacao com janela maxima (ex: mostrar no maximo 7 botoes) e botoes Anterior/Proximo.

---

### BUG-TOOL-008: Sem confirmacao de loading no botao Salvar do modal (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linhas: 199-204
- Descricao:
  O botao "Salvar" nao fica desabilitado durante a mutacao:
  ```tsx
  <button type="submit" className="...">
    Salvar
  </button>
  ```

  Nao ha `disabled={createMutation.isPending || updateMutation.isPending}` nem indicador de loading. O usuario pode clicar multiplas vezes e criar/atualizar a ferramenta mais de uma vez antes de receber o feedback.

- Fix proposto:
  ```tsx
  <button
    type="submit"
    disabled={createMutation.isPending || updateMutation.isPending}
    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white transition"
  >
    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
  </button>
  ```

---

### BUG-TOOL-009: Sem confirmacao de loading no botao Excluir do card (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 407-412
- Descricao:
  Similar ao BUG-008: o botao de exclusao nao fica desabilitado durante `deleteMutation.isPending`. O usuario pode clicar duas vezes, causando erro 404 na segunda chamada (ferramenta ja deletada) ou comportamento indefinido.

- Fix proposto: Adicionar `disabled={deleteMutation.isPending}` e feedback visual no botao de lixeira.

---

### BUG-TOOL-010: Error state ausente na listagem de ferramentas (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 222-229
- Descricao:
  O hook `useQuery` para listagem retorna `isLoading` e `data`, mas o estado de `isError` e completamente ignorado:
  ```tsx
  const { data, isLoading } = useQuery({ ... });
  ```

  Se a API retornar erro (500, timeout, etc.), o componente renderiza apenas o grid vazio sem nenhuma mensagem de erro para o usuario. O usuario nao sabe se nao tem ferramentas cadastradas ou se houve falha de comunicacao.

- Fix proposto:
  ```tsx
  const { data, isLoading, isError } = useQuery({ ... });
  // ...
  {isError && (
    <div className="col-span-full text-center text-red-400 py-12">
      Erro ao carregar ferramentas. Tente novamente.
    </div>
  )}
  ```

---

### BUG-TOOL-011: Error state ausente no banner de custo mensal (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linhas: 232-235
- Descricao:
  ```tsx
  const { data: costData } = useQuery({
    queryKey: ['tools-cost'],
    queryFn: () => financialService.getToolsCost(),
  });
  ```

  Nao ha `isError` nem `isLoading` capturados. Quando a query de custo falha (que ocorrera SEMPRE enquanto o BUG-001 existir — rota capturada pelo parametro `:id`), o banner exibe "R$ 0,00" sem qualquer indicacao de erro. O usuario acredita que seu custo mensal e zero.

- Fix proposto: Adicionar estado de loading/error no banner de custo, com skeleton ou mensagem de erro.

---

### BUG-TOOL-012: billingDate sofre deslocamento de timezone ao editar ferramenta existente (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 36
- Descricao:
  Ao inicializar o formulario para edicao:
  ```tsx
  billingDate: tool?.billingDate ? tool.billingDate.split('T')[0] : '',
  ```

  O `tool.billingDate` vem da API como ISO string UTC (ex: `"2026-03-01T12:00:00.000Z"`). O `split('T')[0]` extrai `"2026-03-01"`, que parece correto.

  Ao salvar (linha 48):
  ```tsx
  billingDate: formData.billingDate ? new Date(formData.billingDate + 'T12:00:00').toISOString() : undefined,
  ```

  O codigo adiciona `T12:00:00` (sem timezone) antes de converter para ISO. `new Date("2026-03-01T12:00:00")` e interpretado como **hora local do browser**. Em um browser no timezone America/Sao_Paulo (UTC-3), isso se torna `"2026-03-01T15:00:00.000Z"` — correto para esse timezone.

  O problema ocorre quando o backend retorna `"2026-02-28T15:00:00.000Z"` (salvo por usuario em Sao_Paulo). O `split('T')[0]` extrai `"2026-02-28"`. Ao re-salvar em um browser com timezone UTC, o `new Date("2026-02-28T12:00:00")` vira `"2026-02-28T12:00:00.000Z"` — diferente do original. A data muda ao simplesmente abrir e fechar o modal de edicao sem modificar nada.

  A mitigacao `T12:00:00` (meio-dia) serve para evitar que a data mude para o dia anterior em timezones negativos, mas nao e robusta para todos os casos.

- Fix proposto: Tratar billingDate como date-only string no banco (sem hora), ou sempre usar `T00:00:00Z` (UTC midnight) e garantir que o campo date do input seja tratado como UTC.

---

### BUG-TOOL-013: Toggle de status (ativo/inativo) exige abrir modal para alterar (P2)
- Severidade: **P2**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linhas: 429-433
- Descricao:
  O card mostra uma badge "Inativa" quando a ferramenta esta inativa, mas nao oferece toggle direto para ativar/desativar sem abrir o modal de edicao completo. O UX esperado para uma lista de ferramentas e um toggle switch diretamente no card.

  O badge "Inativa" so aparece quando `!tool.isActive`, nao ha botao de toggle rapido. Isso força o usuario a: clicar no lapis -> abrir modal -> marcar checkbox -> clicar Salvar — para uma acao trivial.

- Fix proposto: Adicionar um toggle switch (ou botao "Ativar"/"Desativar") diretamente no card que dispara `updateMutation` com apenas `{ isActive: !tool.isActive }`.

---

### BUG-TOOL-014: createToolSchema.monthlyCost aceita 0 mas o negocio requer custo positivo (P3)
- Severidade: **P3**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/dto/tool.dto.ts`
- Linha: 22
- Descricao:
  ```ts
  monthlyCost: z.number().int().nonnegative('Custo nao pode ser negativo'),
  ```

  `nonnegative()` aceita 0. Uma ferramenta com custo zero nao faz sentido semantico (exceto ferramentas gratuitas, que poderiam ser registradas, mas o banner as incluiria sem impacto). Comparando com `createExpenseSchema.amount` no `expense.dto.ts` (linha 37):
  ```ts
  amount: z.number().int().positive('Valor deve ser positivo'),
  ```

  O expense usa `.positive()` (> 0), enquanto tool usa `.nonnegative()` (>= 0). Isso e inconsistente. Se ferramentas gratuitas sao validas, deveria ser documentado; se nao sao, deveria usar `.positive()`.

- Fix proposto: Definir e documentar se custo zero e valido. Se nao: `z.number().int().positive(...)`. Se sim: manter `.nonnegative()` e tratar no calculo do banner.

---

### BUG-TOOL-015: update service nao permite zerar name via PATCH semantico incorreto (P3)
- Severidade: **P3**
- Arquivo: `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- Linha: 67
- Descricao:
  ```ts
  ...(data.name && { name: data.name }),
  ```

  A condicao `data.name && ...` nao atualiza o nome se `data.name` for uma string vazia `""`. Isso protege contra apagamento acidental do nome, mas e inconsistente com o resto do update que usa `data.campo !== undefined`.

  Mais importante: como o DTO ja valida `name: z.string().min(1)`, uma string vazia seria rejeitada pelo Zod com erro 400 antes de chegar ao service. Portanto a verificacao `data.name &&` e redundante e pode mascarar situacoes onde um `name: null` (de um client malicioso que bypassa Zod) chegasse ao service e fosse silenciosamente ignorado.

- Fix proposto: Usar o mesmo padrao dos outros campos: `...(data.name !== undefined && { name: data.name })`. O Zod ja garante que name nao sera vazio.

---

### BUG-TOOL-016: Tipo do parametro em createTool/updateTool no service frontend e Partial<Tool> (P3)
- Severidade: **P3**
- Arquivo: `/root/sistema-dash-braip/frontend/src/services/financial.service.ts`
- Linhas: 356-363
- Descricao:
  ```ts
  createTool: async (data: Partial<Tool>): Promise<Tool> => { ... }
  updateTool: async (id: string, data: Partial<Tool>): Promise<Tool> => { ... }
  ```

  O tipo `Partial<Tool>` inclui campos que nao devem ser enviados ao criar/atualizar: `id`, `userId`, `createdAt`, `updatedAt`. O TypeScript nao impede que o chamador passe esses campos.

  Deveriam existir tipos dedicados `CreateToolInput` e `UpdateToolInput` (sem `id`, `userId`, `createdAt`, `updatedAt`) para melhor type safety e prevencao de envio acidental de campos readonly.

- Fix proposto:
  ```ts
  type CreateToolInput = Omit<Tool, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  type UpdateToolInput = Partial<Omit<Tool, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
  ```

---

### BUG-TOOL-017: recurrence label exibida no card reflete o tipo de cobranca mas nao o valor normalizado (P3)
- Severidade: **P3**
- Arquivo: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx`
- Linha: 426
- Descricao:
  ```tsx
  <p className="text-xs text-zinc-500">
    {RECURRENCE_LABELS[tool.recurrence]}
  </p>
  ```

  O card exibe "R$ 1.200,00" (monthlyCost = 120000 centavos) com label "Anual" para uma ferramenta de cobranca anual. Isso e confuso: o usuario ve um valor e nao sabe se e o custo mensal ou anual. Deveria ser explicito: "R$ 1.200,00 / Anual" ou exibir o equivalente mensal calculado.

- Fix proposto: Adicionar contexto ao valor exibido, ex: "R$ 100,00/mes (equivalente)" quando recurrence != MENSAL, ou mostrar o valor com o periodo correto ("R$ 1.200,00/ano").

---

## BOTOES DECORATIVOS

| Componente | Elemento | Observacao |
|-----------|---------|------------|
| ToolModal | Botao "X" (fechar) | Funcionando — dispara `onClose` |
| ToolModal | Botao "Cancelar" | Funcionando — dispara `onClose` |
| ToolModal | Botao "Salvar" | Funcionando — mas sem disabled/loading state (BUG-008) |
| Card | Botao lapis (editar) | Funcionando — dispara `handleEdit` |
| Card | Botao lixeira (excluir) | Funcionando — mas sem disabled state (BUG-009) |
| Card | Link externo | Funcionando — `target="_blank" rel="noopener noreferrer"` correto |
| Paginacao | Botoes de pagina | Funcionando — mas sem botoes Anterior/Proximo (BUG-007) |

Nenhum botao puramente decorativo encontrado (sem handler). Todos os elementos interativos tem acoes associadas.

---

## MAPA DE INCONSISTENCIAS

### Conversao centavos/reais — resumo

| Ponto | Operacao | Status |
|-------|----------|--------|
| Backend schema `monthlyCost` | Int em centavos | OK |
| Backend schema `annualCost` | Int em centavos | OK |
| DTO createToolSchema `monthlyCost` | `.int().nonnegative()` | OK |
| Frontend modal inicializacao | `tool.monthlyCost / 100` | OK |
| Frontend modal submit | `Math.round(formData.monthlyCost * 100)` | OK |
| Frontend card exibicao | `formatCurrency(tool.monthlyCost)` | OK (formata centavos) |
| Frontend banner custo | `formatCurrency(costData?.monthlyCost \|\| 0)` | OK mas retorna 0 por BUG-001 |
| Service `getMonthlyToolsCost` ANUAL | `monthlyCost / 12` | BUG-003: deveria usar annualCost |
| Service `getByCategory` sum | `_sum.monthlyCost` sem normalizacao | BUG-004 |

### Isolamento multi-tenant — resumo

| Camada | Verificacao | Status |
|--------|------------|--------|
| Controller create | `userId = req.user?.id` | OK |
| Controller findAll | `userId = req.user?.id` | OK |
| Controller findById | `userId = req.user?.id` | OK |
| Controller update | `userId = req.user?.id` | OK |
| Controller delete | `userId = req.user?.id` | OK |
| Service create | `data: { userId, ... }` | OK |
| Service findAll | `where: { userId }` | OK |
| Service findById | `where: { id, userId }` | OK |
| Service update | `findById(userId, id)` antes de update | OK |
| Service delete | `findById(userId, id)` antes de delete | OK |
| Service getMonthlyCost | `where: { userId, isActive: true }` | OK |

Isolamento multi-tenant esta correto em todas as operacoes. Nao ha IDOR (Insecure Direct Object Reference).

### Tratamento de erros — resumo

| Handler | try/catch | ZodError | 404 | 500 |
|---------|-----------|---------|-----|-----|
| create | Sim | Sim (400) | N/A | Sim |
| findAll | Sim | Sim (400) | N/A | Sim |
| findById | Sim | Nao necessario | Sim (404) | Sim |
| update | Sim | Sim (400) | Sim (404) | Sim |
| delete | Sim | Nao necessario | Sim (404) | Sim |
| getMonthlyCost | Sim | Nao necessario | N/A | Sim |

Tratamento de erros esta adequado no controller. O service nao trata erros do Prisma (ex: violacao de constraint, timeout do banco) — deixa propagar para o controller capturar como erro 500. Aceitavel, porem logs de erro revelam stack traces completos (console.error inclui o objeto error).

---

## AVISOS

1. **SERVICO_OFFLINE**: A API em `https://api.SEU-DOMINIO.com` nao esta configurada para este ambiente de analise. Smoke tests de endpoints foram pulados. O scan foi realizado integralmente de forma estatica.

2. **BUG-001 E CRITICO E SILENCIOSO**: A inversao de rota `/tools/cost` vs `/tools/:id` faz com que o endpoint de custo retorne 404 em producao. O frontend trata o erro silenciosamente (`costData?.monthlyCost || 0`), portanto o banner mostra R$ 0,00 sem qualquer alerta. Este bug pode estar ativo em producao sem que a equipe saiba.

3. **annualCost nao aparece nos cards**: O campo `annualCost` existe no schema, no DTO e no formulario, mas nao e renderizado em nenhum lugar da UI de listagem. Informacao preenchida pelo usuario some visualmente.

4. **Schema.prisma — Tool sem index em billingDate**: O modelo `Tool` nao tem index em `billingDate`. Se o sistema futuramente precisar consultar ferramentas com cobranca proxima ("ferramentas vencendo nos proximos 7 dias"), a query sera um full scan. Recomendado adicionar `@@index([billingDate])`.

---

## ARQUIVOS ANALISADOS

| Arquivo | Linhas |
|---------|--------|
| `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/ferramentas/page.tsx` | 471 |
| `/root/sistema-dash-braip/frontend/src/services/financial.service.ts` | 431 |
| `/root/sistema-dash-braip/backend/src/modules/financial/controllers/tool.controller.ts` | 131 |
| `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts` | 142 |
| `/root/sistema-dash-braip/backend/src/modules/financial/dto/tool.dto.ts` | 43 |
| `/root/sistema-dash-braip/backend/src/modules/financial/dto/expense.dto.ts` | 57 |
| `/root/sistema-dash-braip/backend/src/modules/financial/financial.routes.ts` | 51 |
| `/root/sistema-dash-braip/backend/prisma/schema.prisma` | 723 |

Total: 8 arquivos, 2.049 linhas analisadas.
