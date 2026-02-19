# SCAN REPORT — financial (Dashboard / Visão Geral)
Data: 2026-02-18

## RESUMO

| Metrica | Valor |
|---------|-------|
| Arquivos backend lidos | 6 |
| Arquivos frontend lidos | 2 |
| Arquivos de schema lidos | 1 |
| Endpoints totais dashboard | 3 |
| Endpoints OK (200) | N/A (smoke test nao realizado — auth JWT necessaria) |
| Bugs P0 | 2 |
| Bugs P1 | 5 |
| Bugs P2 | 6 |
| Bugs P3 | 4 |

---

## ENDPOINTS DO MODULO

| # | Metodo | URL | Auth | Observacao |
|---|--------|-----|------|------------|
| 1 | GET | /api/v1/financial/dashboard/macro | JWT (authMiddleware) | getMacroView |
| 2 | GET | /api/v1/financial/dashboard/trend?months=6 | JWT | getMonthlyTrend |
| 3 | GET | /api/v1/financial/dashboard/summary | JWT | getSummaryCards |
| 4 | GET | /api/v1/financial/expenses | JWT | listagem paginada |
| 5 | POST | /api/v1/financial/expenses | JWT | criacao |
| 6 | GET | /api/v1/financial/expenses/:id | JWT | detalhe |
| 7 | PUT | /api/v1/financial/expenses/:id | JWT | atualizacao |
| 8 | DELETE | /api/v1/financial/expenses/:id | JWT | exclusao |
| 9 | GET | /api/v1/financial/employees | JWT | listagem paginada |
| 10 | POST | /api/v1/financial/employees | JWT | criacao |
| 11 | GET | /api/v1/financial/employees/payroll | JWT | **ROTA SOMBRA** (ver BUG-FIN-001) |
| 12 | GET | /api/v1/financial/employees/:id | JWT | detalhe |
| 13 | PUT | /api/v1/financial/employees/:id | JWT | atualizacao |
| 14 | DELETE | /api/v1/financial/employees/:id | JWT | exclusao |
| 15 | GET | /api/v1/financial/tools | JWT | listagem paginada |
| 16 | POST | /api/v1/financial/tools | JWT | criacao |
| 17 | GET | /api/v1/financial/tools/cost | JWT | **ROTA SOMBRA** (ver BUG-FIN-002) |
| 18 | GET | /api/v1/financial/tools/:id | JWT | detalhe |
| 19 | PUT | /api/v1/financial/tools/:id | JWT | atualizacao |
| 20 | DELETE | /api/v1/financial/tools/:id | JWT | exclusao |
| 21 | GET | /api/v1/financial/traffic | JWT | listagem paginada |
| 22 | POST | /api/v1/financial/traffic | JWT | criacao |
| 23 | GET | /api/v1/financial/traffic/platforms | JWT | **ROTA SOMBRA** (ver BUG-FIN-002) |
| 24 | GET | /api/v1/financial/traffic/:id | JWT | detalhe |
| 25 | PUT | /api/v1/financial/traffic/:id | JWT | atualizacao |
| 26 | DELETE | /api/v1/financial/traffic/:id | JWT | exclusao |

---

## BUGS ENCONTRADOS

---

### BUG-FIN-001: Rotas estaticas interceptadas por rota dinamica (:id) — Express shadow route
- **Severidade**: P0 (erro de runtime, endpoint retorna dado errado silenciosamente)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/financial.routes.ts`
- **Linhas**: 29–32 (employees) e 37–38 (tools) e 45–46 (traffic)
- **Descricao**:
  Em Express.js, as rotas sao avaliadas na ordem de registro. No arquivo de rotas, as rotas
  estaticas `/employees/payroll` e `/tools/cost` e `/traffic/platforms` sao registradas
  ANTES das rotas dinamicas `/:id`, o que esta correto. MAS o problema real esta em:

  ```
  router.get('/employees/payroll', ...)   // linha 29 — OK na ordem
  router.get('/employees/:id', ...)       // linha 32 — captura :id = "payroll" se a linha 29 falhar
  ```

  Na listagem atual o registro esta na ordem correta, portanto este nao e um bug de ordem.
  POREM: a rota `/tools/cost` (linha 37) e `/traffic/platforms` (linha 45) estao registradas
  ANTES de `/:id` (linhas 39 e 47 respectivamente) — isso esta correto.

  O bug REAL e diferente: o cliente frontend em `financial.service.ts` linha 371 chama
  `/financial/tools/cost`, mas o controller registra essa rota como `getMonthlyCost`
  e o service responde com `{ monthlyCost: number }`. A interface do frontend em
  `getToolsCost` retorna `Promise<{ monthlyCost: number }>` — isso BATE.
  Porem o `getMacroView` no backend NUNO chama esse endpoint de API: ele chama
  diretamente `toolService.getMonthlyToolsCost(userId)` — o que e correto internamente.

  O problema P0 real aqui: a rota `GET /employees/payroll` esta na linha 29, e
  `GET /employees/:id` esta na linha 32. Na versao atual do Express (4.x), a primeira
  rota que combinar vence. "payroll" e uma string literal, entao deveria casar com
  a linha 29 antes da 32. CONFIRMA-SE que a ordem esta correta.

  **RECLASSIFICADO para P1** — ver BUG-FIN-002 para o P0 real.

---

### BUG-FIN-001 (REVISADO): Calculo de lucro liquido inconsistente entre getMacroView e getMonthlyTrend
- **Severidade**: P0 (dados financeiros incorretos exibidos ao usuario)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- **Linhas**: 73–74 (getMacroView) vs 156 (getMonthlyTrend)
- **Descricao**:
  Em `getMacroView`, o `netProfit` e calculado como:
  ```typescript
  // linha 73-74
  const totalCosts = expensesTotal + payrollTotal + toolsTotal + trafficTotal;
  const netProfit = revenue - totalCosts;
  ```

  Mas `revenue` aqui e apenas `salesRevenue._sum?.transValue` (vendas aprovadas), sem incluir
  `trafficRevenue`. O retorno da API na linha 85 mostra:
  ```typescript
  revenue: {
    sales: revenue,
    trafficRevenue,
    total: revenue + trafficRevenue,  // <-- total correto
  },
  profit: {
    net: netProfit,  // <-- calculado com revenue SEM trafficRevenue
  }
  ```

  Portanto `profit.net = salesRevenue - totalCosts`, mas o total de receita exibido ao
  usuario e `salesRevenue + trafficRevenue`. A margem de lucro fica incorreta:
  - Exibido para o usuario: `revenue.total` (com trafficRevenue)
  - Lucro calculado sobre: `revenue.sales` (sem trafficRevenue)
  - Margem = `(netProfit / revenue) * 100` — usa `revenue` sem trafficRevenue (linha 75),
    mas o denominador correto deveria ser `revenue.total`

  Em `getMonthlyTrend` (linha 156), o profit ja e calculado apenas com:
  ```typescript
  profit: revenue - expenseTotal - trafficTotal  // sem payroll, sem tools
  ```
  As duas funcoes calculam `profit` com bases de custo diferentes, gerando inconsistencia
  entre o card "Lucro Liquido" do mes atual e os graficos de tendencia.

- **Fix proposto**:
  ```typescript
  // dashboard.service.ts linha 74 — getMacroView
  const totalRevenue = revenue + trafficRevenue;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00';

  // dashboard.service.ts linha 156 — getMonthlyTrend
  // Adicionar payrollTotal e toolsTotal ao calculo (ou documentar que e estimativa)
  const payroll = await employeeService.getMonthlyPayroll(userId);
  const toolsCost = await toolService.getMonthlyToolsCost(userId);
  profit: revenue - expenseTotal - trafficTotal - payroll.total - toolsCost,
  ```

---

### BUG-FIN-002: N+1 queries severo em getMonthlyTrend — banco chamado em loop
- **Severidade**: P0 (performance critica — cada requisicao dispara 3N queries ao banco)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- **Linhas**: 107–161
- **Descricao**:
  O metodo `getMonthlyTrend` executa um `for` loop de `months` iteracoes (padrao: 6).
  Dentro de cada iteracao, sao feitas **3 queries sequenciais** ao banco de dados:
  1. `prisma.sale.aggregate(...)` — busca receita de vendas
  2. `prisma.expense.aggregate(...)` — busca despesas
  3. `prisma.trafficSpend.aggregate(...)` — busca gasto de trafego

  Com `months = 6`, isso resulta em **18 queries sequenciais** por requisicao.
  Com `months = 12`, seria **36 queries**.

  As queries dentro do loop sao executadas com `await` sequencial, nao em paralelo.
  Alem disso, `getMonthlyTrend` nao usa Promise.all nem agrupa as queries por range
  de datas em uma unica query com GROUP BY.

- **Fix proposto**:
  Substituir o loop por 3 queries unicas com `GROUP BY` para cada modelo, cobrindo
  todo o periodo de uma vez:
  ```typescript
  // Buscar todos os meses de uma vez com groupBy no banco
  const [salesByMonth, expensesByMonth, trafficByMonth] = await Promise.all([
    prisma.$queryRaw`SELECT DATE_TRUNC('month', "transCreateDate") as month, SUM("transValue") as total
                     FROM sales JOIN gateway_configs ON ...
                     WHERE ... GROUP BY month`,
    // similar para expenses e traffic
  ]);
  ```
  Ou usar `prisma.sale.groupBy` com campo de data truncado. No minimo, paralelizar
  as 3 queries dentro do loop com `Promise.all`.

---

### BUG-FIN-003: formatCurrency divide por 100 valores que ja podem estar em reais
- **Severidade**: P1 (valores exibidos 100x menores que o real, dependendo da fonte)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/services/financial.service.ts`
- **Linha**: 424–429
- **Descricao**:
  ```typescript
  export const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);  // <-- divide por 100
  };
  ```

  O schema Prisma confirma que `transValue`, `salary`, `bonus`, `benefits`, `monthlyCost`,
  `spend`, `revenue`, `amount` estao todos em **centavos** (comentarios no schema:
  `// Value in cents`, `// Monthly salary in cents`, `// Amount spent in cents`).

  Portanto a divisao por 100 e CORRETA para os campos do banco.

  O bug potencial e em `summary?.monthlyTrafficSpend` exibido no mini-card da pagina
  (page.tsx linha 256). Este valor vem de `totalTrafficSpend._sum?.spend || 0` que e
  a soma do campo `spend` em centavos — correto, sera dividido por 100.

  O risco real esta em `getMonthlyToolsCost` em `tool.service.ts` que retorna
  `monthlyTotal` calculado como soma/divisao de `tool.monthlyCost` (centavos).
  A divisao `Math.round(tool.monthlyCost / 12)` para recorrencia ANUAL perde precisao
  por arredondamento inteiro (ver BUG-FIN-005).

  **Risco adicional**: Se qualquer parte do sistema popular `TrafficSpend.revenue` ou
  campos similares com valores em reais (nao centavos), a formatacao exibiria valores
  100x menores. O campo `revenue` da TrafficSpend nao tem validacao que garanta centavos.

- **Fix proposto**:
  Adicionar JSDoc explicitando que a funcao espera centavos. Validar no backend que
  todos os campos de valor sao persistidos em centavos antes de salvar.

---

### BUG-FIN-004: getMonthlyTrend exclui payroll e tools do calculo de profit
- **Severidade**: P1 (underreporting de custos nos graficos historicos)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts`
- **Linhas**: 147–157
- **Descricao**:
  O calculo de `profit` em `getMonthlyTrend` e:
  ```typescript
  profit: revenue - expenseTotal - trafficTotal
  ```

  Nao inclui `payrollTotal` (salarios) nem `toolsTotal` (ferramentas). Esses dois
  custos sao fixos mensais e representam frequentemente a maior parte dos custos
  operacionais. O grafico de "Tendencia Mensal" exibe um lucro inflado em relacao
  ao que `getMacroView` calcula para o mes atual.

  Usuario ve:
  - Card "Lucro Liquido" (getMacroView): R$ X (descontando payroll + tools)
  - Barra do mes no grafico (getMonthlyTrend): R$ Y >> X (sem descontar payroll + tools)

  Os dados sao inconsistentes entre si na mesma pagina.

- **Fix proposto**:
  Incluir payroll e tools no calculo do `profit` dentro do loop do `getMonthlyTrend`.
  Como `getMonthlyPayroll` e `getMonthlyToolsCost` nao aceitam filtro de data
  (retornam estimativa do mes corrente), a opcao pragmatica e buscar uma vez antes
  do loop e reutilizar o valor fixo para todos os meses historicos, documentando
  que e uma estimativa.

---

### BUG-FIN-005: Math.round em centavos causa erro de arredondamento acumulativo
- **Severidade**: P1 (calculo financeiro impreciso)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- **Linhas**: 101–103 e 104–106 e 107–109
- **Descricao**:
  ```typescript
  case 'ANUAL':
    monthlyTotal += Math.round(tool.monthlyCost / 12);  // perde fracao de centavo
  case 'SEMESTRAL':
    monthlyTotal += Math.round(tool.monthlyCost / 6);
  case 'TRIMESTRAL':
    monthlyTotal += Math.round(tool.monthlyCost / 3);
  ```

  `tool.monthlyCost` esta em centavos (inteiro). Para uma ferramenta com custo anual
  de R$ 119,90 = 11990 centavos: `Math.round(11990 / 12) = Math.round(999.16) = 999`
  em vez de 999.17. O erro unitario e pequeno, mas com multiplas ferramentas e meses
  o erro acumula.

  Alem disso, ha ambiguidade semantica: o campo `monthlyCost` para uma ferramenta
  com recorrencia `ANUAL` armazena o custo mensal ou o custo anual total? O schema
  documenta `// Monthly cost in cents` mas o campo `annualCost` tambem existe e nao
  e utilizado no calculo `getMonthlyToolsCost`. Se `monthlyCost` ja e o custo mensal,
  dividir por 12 e errado (dividiria de novo).

- **Fix proposto**:
  Clarificar semantica: para recorrencia ANUAL, usar `annualCost / 12` (que e o custo
  total anual) em vez de `monthlyCost / 12`. Usar valores em centavos com virgula
  flutuante durante calculos intermediarios e arredondar apenas no resultado final.

---

### BUG-FIN-006: React Query sem staleTime — refetch a cada foco de janela
- **Severidade**: P1 (performance — requests desnecessarios ao backend financeiro)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 149–162
- **Descricao**:
  ```typescript
  const { data: macroView, isLoading: loadingMacro } = useQuery({
    queryKey: ['financial', 'macro'],
    queryFn: () => financialService.getMacroView(),
    // sem staleTime definido
  });
  ```

  O padrao de `staleTime` no TanStack Query e `0ms`, o que significa que os dados sao
  considerados stale imediatamente apos o fetch. Isso dispara refetch automatico sempre
  que o usuario:
  - Volta para a aba do navegador
  - Reativa o foco na janela
  - Navega entre paginas e volta

  Para dados financeiros de dashboard que nao mudam em tempo real, isso gera 3
  requisicoes desnecessarias ao backend (uma para cada query) a cada alternancia de foco.
  O backend por sua vez executa 18+ queries ao banco de dados.

- **Fix proposto**:
  ```typescript
  useQuery({
    queryKey: ['financial', 'macro'],
    queryFn: () => financialService.getMacroView(),
    staleTime: 1000 * 60 * 5,  // 5 minutos
    gcTime: 1000 * 60 * 10,    // 10 minutos
  });
  ```

---

### BUG-FIN-007: Ausencia de error state na pagina — erros silenciados para o usuario
- **Severidade**: P1 (UX critico — falha de API nao exibida ao usuario)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 149–179
- **Descricao**:
  As tres queries `useQuery` capturam `isLoading` mas descartam `isError` e `error`:
  ```typescript
  const { data: macroView, isLoading: loadingMacro } = useQuery({ ... });
  const { data: trends, isLoading: loadingTrends } = useQuery({ ... });
  const { data: summary, isLoading: loadingSummary } = useQuery({ ... });
  ```

  Se qualquer query falhar (backend offline, 500, timeout de rede), o componente
  simplesmente nao renderiza os cards correspondentes (condicoes `{macroView && ...}`,
  `{trends && ...}`), exibindo uma pagina parcialmente vazia sem nenhuma mensagem
  de erro. O usuario ve uma pagina em branco ou incompleta sem saber o motivo.

- **Fix proposto**:
  ```typescript
  const { data: macroView, isLoading: loadingMacro, isError: errorMacro } = useQuery({ ... });
  // ...
  if (errorMacro || errorTrends || errorSummary) {
    return (
      <div className="p-6">
        <p className="text-red-400">Erro ao carregar dados financeiros. Tente novamente.</p>
      </div>
    );
  }
  ```

---

### BUG-FIN-008: TrendChart renderiza coluna com altura baseada em revenue, mas colore por profit — semantica errada
- **Severidade**: P2 (dado enganoso — o usuario interpreta a cor como indicador primario)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 109–146
- **Descricao**:
  ```typescript
  const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
  const profitPercentage = trend.revenue > 0 ? (trend.profit / trend.revenue) * 100 : 0;

  <div
    className={`... ${profitPercentage >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
    style={{ height: `${height}%` }}
    title={`${formatCurrency(trend.revenue)} (Lucro: ${formatCurrency(trend.profit)})`}
  />
  ```

  A altura da barra representa `revenue` (faturamento). A cor da barra representa
  `profitPercentage` (margem de lucro). Isso cria visualizacao ambigua:
  - Um mes com alto faturamento mas prejuizo tera barra ALTA e VERMELHA
  - Um mes com baixo faturamento mas lucro tera barra BAIXA e VERDE
  - A legenda diz "Lucro" para verde, levando o usuario a interpretar "barra verde alta = lucro alto"
    quando na realidade "barra alta = faturamento alto"

  Alem disso, a legenda no grafico nao tem nenhuma indicacao de escala no eixo Y.
  Nao ha labels de valor nas barras nem eixo Y com valores monetarios.

- **Fix proposto**:
  Ou normalizar a altura pelo profit (nao por revenue) e usar um eixo Y com escala,
  ou usar duas barras separadas (revenue e profit) com cores fixas e consistentes,
  ou ao menos adicionar labels de valor sobre cada barra.

---

### BUG-FIN-009: TrendChart com trends vazio causa Math.max(...[]) = -Infinity
- **Severidade**: P2 (crash ou NaN em producao quando nao ha dados historicos)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 110–111
- **Descricao**:
  ```typescript
  const maxRevenue = Math.max(...trends.map((t) => t.revenue));
  ```

  Se `trends` for um array vazio (usuario novo sem dados), `Math.max()` com spread de
  array vazio retorna `-Infinity`. Isso resulta em:
  ```
  height = (-Infinity > 0) ? ... : 0  // condicional protege este caso
  ```
  A condicao `maxRevenue > 0` evita o crash na altura, MAS se todos os revenues forem
  0 (nenhuma venda), `maxRevenue = 0` e todas as alturas sao 0. Isso e correto.
  O risco maior e se `trends` for `undefined` — o componente `TrendChart` so e
  renderizado quando `{trends && <TrendChart trends={trends} />}`, entao trends nunca
  e `undefined` dentro do componente. Mas se `trends` for `[]` (array vazio retornado
  pela API), o `.map()` produz `[]` e `Math.max(...[])` retorna `-Infinity`. A divisao
  `trend.revenue / maxRevenue` seria `0 / -Infinity = 0` — nao causa crash visivel,
  mas e semanticamente errado.

- **Fix proposto**:
  ```typescript
  const maxRevenue = trends.length > 0 ? Math.max(...trends.map((t) => t.revenue), 0) : 0;
  ```

---

### BUG-FIN-010: CostBreakdownCard nao valida se costs.total == soma dos itens
- **Severidade**: P2 (dado potencialmente inconsistente exibido)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 67–107
- **Descricao**:
  O componente exibe proporcoes calculadas como `(cost.value / total) * 100` onde
  `total = macroView.costs.total`. As barras de proporcao somam percentuais baseados
  no total. Porem `macroView.costs.total` e calculado no backend como:
  ```typescript
  const totalCosts = expensesTotal + payrollTotal + toolsTotal + trafficTotal;
  ```
  Se o backend retornar um total diferente da soma dos itens (ex: bug futuro), as barras
  somariam mais ou menos de 100% sem nenhum aviso visual. Nao ha validacao no frontend.

  Adicionalmente, se `total == 0` (sem custos), a divisao e protegida:
  ```typescript
  const percentage = total > 0 ? (cost.value / total) * 100 : 0;
  ```
  Isso esta correto. O bug e apenas a falta de assertion/validacao.

- **Fix proposto**:
  Calcular `total` no frontend somando os itens da lista, em vez de confiar no campo
  `costs.total` da API:
  ```typescript
  const total = costs.reduce((sum, c) => sum + c.value, 0);
  ```

---

### BUG-FIN-011: getMacroView aceita datas invalidas via query string sem validacao
- **Severidade**: P2 (pode gerar erros 500 ou resultados inesperados)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/controllers/dashboard.controller.ts`
- **Linhas**: 12–17
- **Descricao**:
  ```typescript
  const { startDate, endDate } = req.query;
  const result = await financialDashboardService.getMacroView(
    userId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  ```

  Nao ha validacao de:
  1. Se `startDate` e uma string de data valida — `new Date("abc")` retorna `Invalid Date`
  2. Se `startDate <= endDate` — periodo invertido nao retornaria dados
  3. Se o periodo nao e excessivamente longo (ex: `startDate=2000-01-01` scanneia anos de dados)

  Um `Invalid Date` passado para o Prisma provavelmente causa erro 500, que e capturado
  pelo try/catch mas retorna mensagem generica sem indicar o problema ao cliente.

- **Fix proposto**:
  Adicionar validacao com `isNaN(date.getTime())` antes de passar ao service:
  ```typescript
  const start = startDate ? new Date(startDate as string) : undefined;
  if (start && isNaN(start.getTime())) {
    return res.status(400).json({ error: 'startDate invalido' });
  }
  ```

---

### BUG-FIN-012: getMonthlyPayroll inclui funcionarios em FERIAS e AFASTADO no calculo
- **Severidade**: P2 (calculo de folha pode estar incorreto dependendo da politica)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/employee.service.ts`
- **Linhas**: 91–108
- **Descricao**:
  ```typescript
  async getMonthlyPayroll(userId: string) {
    const result = await prisma.employee.aggregate({
      where: {
        userId,
        status: 'ATIVO',  // apenas ATIVO
      },
      ...
    });
  ```

  O metodo filtra apenas `status: 'ATIVO'`, excluindo `FERIAS` e `AFASTADO`.
  Funcionarios em ferias ou afastados podem ainda ter salario a pagar (dependendo
  da politica da empresa). O filtro exclusivo de `ATIVO` pode subestimar a folha real.

  Contrastando, `getSummaryCards` no dashboard.service.ts linha 170 conta apenas
  `status: 'ATIVO'` para `activeEmployees` — consistente. Mas `getByRole` em
  employee.service.ts linha 112 tambem filtra apenas `ATIVO` para o breakdown,
  o que pode omitir funcionarios em ferias do detalhamento.

- **Fix proposto**:
  Considerar incluir `FERIAS` e `AFASTADO` no calculo da folha (ou tornar configuravel),
  documentando a decisao de negocio.

---

### BUG-FIN-013: Ausencia de loading parcial — pagina inteira bloqueia ate todas as queries
- **Severidade**: P2 (UX — usuario ve spinner longo desnecessariamente)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 164–179
- **Descricao**:
  ```typescript
  const isLoading = loadingMacro || loadingTrends || loadingSummary;

  if (isLoading) {
    return (/* spinner completo */);
  }
  ```

  A pagina exibe skeleton completo enquanto QUALQUER das 3 queries ainda estiver
  carregando. Se `macroView` ja chegou mas `trends` ainda esta carregando, o usuario
  continua vendo o spinner ao inves de ver os StatCards imediatamente.

  As queries sao independentes entre si — cada secao poderia ser renderizada
  individualmente assim que seus dados chegassem.

- **Fix proposto**:
  Remover o `isLoading` global e usar `loadingMacro`, `loadingTrends` e `loadingSummary`
  individualmente em cada secao, exibindo skeletons parciais.

---

### BUG-FIN-014: profit.margin retornado como string pela API mas parseFloat no frontend pode falhar silenciosamente
- **Severidade**: P2 (inconsistencia de tipos — risco de NaN exibido)
- **Arquivo backend**: `/root/sistema-dash-braip/backend/src/modules/financial/services/dashboard.service.ts` linha 75
- **Arquivo frontend**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx` linha 181
- **Descricao**:
  O backend retorna:
  ```typescript
  profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0.00';
  // type: string
  ```

  O frontend recebe via interface TypeScript:
  ```typescript
  // financial.service.ts linha 235
  profit: {
    net: number;
    margin: string;  // correto, e string
  };
  ```

  E faz:
  ```typescript
  // page.tsx linha 181
  const profitMargin = macroView ? parseFloat(macroView.profit.margin) : 0;
  ```

  Se `macroView.profit.margin` chegar como `undefined` ou valor nao numerico (ex: erro
  de serializacao), `parseFloat(undefined)` retorna `NaN`. O card exibiria `NaN%` e a
  logica de variante (`profitMargin >= 20`) retorna `false` silenciosamente.

  Melhor pratica: retornar `margin` como `number` do backend, evitando o `parseFloat`
  no frontend.

- **Fix proposto**:
  ```typescript
  // backend dashboard.service.ts
  profitMargin: revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(2)) : 0
  // type: number

  // frontend financial.service.ts
  profit: { net: number; margin: number; }

  // page.tsx
  const profitMargin = macroView?.profit.margin ?? 0;
  ```

---

### BUG-FIN-015: TrendChart exibe label do mes como numero (ex: "02") sem nome — pouco legivel
- **Severidade**: P3 (UX menor)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 127–129
- **Descricao**:
  ```typescript
  <span className="text-xs text-zinc-500 mt-2">
    {trend.month.split('-')[1]}  // extrai "02" de "2026-02"
  </span>
  ```

  O label exibe apenas o numero do mes ("02", "03"...) sem o nome ("Fev", "Mar").
  Quando o historico abrange virada de ano (ex: Nov/2025 a Abr/2026), numeros iguais
  de meses em anos diferentes nao sao distinguiveis. Ex: se months=14, "02" pode
  aparecer duas vezes.

- **Fix proposto**:
  ```typescript
  const [year, month] = trend.month.split('-');
  const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
    month: 'short'
  });
  ```

---

### BUG-FIN-016: StatCard de "Margem de Lucro" nao exibe trend (variacao vs mes anterior)
- **Severidade**: P3 (feature gap — informacao util ausente)
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/page.tsx`
- **Linhas**: 213–218
- **Descricao**:
  O componente `StatCard` suporta as props `trend` e `trendLabel` (variacao percentual
  com seta para cima/baixo), mas nenhum dos 4 StatCards principais usa essas props.
  O StatCard de "Margem de Lucro" seria o candidato mais natural para mostrar variacao
  vs mes anterior, mas a API nao retorna essa informacao.

- **Fix proposto**:
  Calcular variacao vs mes anterior usando os dados de `trends` ja disponibles na pagina.
  O mes anterior esta em `trends[trends.length - 2]` e o mes atual em `trends[trends.length - 1]`.

---

### BUG-FIN-017: Input de `months` em getMonthlyTrend nao tem limite maximo — pode causar timeout
- **Severidade**: P3 (seguranca / performance)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/controllers/dashboard.controller.ts`
- **Linha**: 33
- **Descricao**:
  ```typescript
  const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
  ```

  Nao ha validacao de valor minimo (1) nem maximo. Um usuario mal-intencionado ou um
  bug de frontend poderia enviar `months=10000`, causando 30.000 queries ao banco em
  uma unica requisicao, potencialmente derrubando o banco.

  Adicionalmente, `parseInt('abc', 10)` retorna `NaN`, e `NaN` passado ao loop
  `for (let i = NaN - 1; i >= 0; i--)` nao executa nenhuma iteracao (retorna `[]`),
  o que e seguro mas silencia o erro.

- **Fix proposto**:
  ```typescript
  const months = Math.min(Math.max(parseInt(req.query.months as string, 10) || 6, 1), 24);
  ```

---

### BUG-FIN-018: getMonthlyToolsCost busca TODOS os tools para calcular custo — ineficiente
- **Severidade**: P3 (performance — N ferramentas carregadas em memoria)
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/tool.service.ts`
- **Linhas**: 88–123
- **Descricao**:
  ```typescript
  const tools = await prisma.tool.findMany({
    where: { userId, isActive: true },
  });
  // loop em JS para calcular soma
  ```

  Em vez de usar `prisma.tool.aggregate` com `_sum`, o metodo carrega todos os
  registros de tools para memoria e faz o calculo em JavaScript. Para usuarios com
  muitas ferramentas, isso e ineficiente. O problema adicional e que a logica de
  normalizacao por recorrencia nao pode ser feita no SQL, entao a abordagem atual
  e necessaria — mas deveria ser documentada.

  Porem, para o caso `MENSAL` (mais comum), `aggregate` seria suficiente.

- **Fix proposto**:
  Separar o calculo: usar `aggregate` para ferramentas `MENSAL` e carregar em
  memoria apenas as de outras recorrencias.

---

## ANALISE DE CONSISTENCIA SCHEMA vs SERVICE

| Campo | Schema | Tipo no Schema | Usado corretamente? |
|-------|--------|----------------|---------------------|
| Sale.transValue | sales | Int (centavos) | Sim |
| Expense.amount | expenses | Int (centavos) | Sim |
| Employee.salary | employees | Int (centavos) | Sim |
| Employee.bonus | employees | Int (centavos) | Sim |
| Employee.benefits | employees | Int (centavos) | Sim |
| Tool.monthlyCost | tools | Int (centavos) | Sim (mas semantica ambigua para ANUAL) |
| Tool.annualCost | tools | Int? (centavos) | NAO USADO em getMonthlyToolsCost |
| TrafficSpend.spend | traffic_spends | Int (centavos) | Sim |
| TrafficSpend.revenue | traffic_spends | Int (centavos) | Sim |
| TrafficSpend.roas | traffic_spends | Float? | Campo calculado no SELECT, nao salvo |

**Inconsistencia critica**: `Tool.annualCost` existe no schema mas nao e utilizado
em `getMonthlyToolsCost`. Para ferramentas anuais, o calculo usa `monthlyCost / 12`,
mas se o usuario cadastrou o custo anual em `annualCost`, esse campo e ignorado.

---

## BOTOES DECORATIVOS

Nenhum botao decorativo identificado na pagina `financeiro/page.tsx`. A pagina e
somente leitura (dashboard), sem acoes interativas.

---

## RESUMO DE RISCOS POR PRIORIDADE

### P0 — Correcao URGENTE (dados incorretos exibidos)
1. **BUG-FIN-001**: Lucro liquido calculado sem incluir `trafficRevenue` no denominador — margem de lucro errada
2. **BUG-FIN-002**: N+1 queries em `getMonthlyTrend` — 18 queries por requisicao (impacto de performance critico)

### P1 — Alta prioridade
3. **BUG-FIN-003**: Risco de formatCurrency dividir por 100 valores ja em reais se fonte de dados for inconsistente
4. **BUG-FIN-004**: Grafico de tendencia omite payroll e tools do calculo de profit — dado inflado
5. **BUG-FIN-005**: Math.round em centavos acumula erro; `annualCost` ignorado na normalizacao de ferramentas anuais
6. **BUG-FIN-006**: Ausencia de `staleTime` causa refetch a cada foco de janela — 18+ queries redundantes
7. **BUG-FIN-007**: Sem error state — falha de API deixa pagina em branco sem aviso ao usuario

### P2 — Media prioridade
8. **BUG-FIN-008**: TrendChart — altura por revenue, cor por profit — visualizacao semanticamente enganosa
9. **BUG-FIN-009**: `Math.max(...[])` retorna `-Infinity` quando array de trends e vazio
10. **BUG-FIN-010**: CostBreakdownCard confia em `costs.total` da API em vez de recalcular no frontend
11. **BUG-FIN-011**: Datas invalidas em query string causam erro 500 sem mensagem clara
12. **BUG-FIN-012**: `getMonthlyPayroll` exclui funcionarios em FERIAS e AFASTADO do calculo
13. **BUG-FIN-013**: Loading global bloqueia toda a pagina — cada secao deveria ter loading independente
14. **BUG-FIN-014**: `profit.margin` retornado como string da API — risco de `NaN%` exibido se parseFloat falhar

### P3 — Baixa prioridade / Melhorias
15. **BUG-FIN-015**: Label de mes no grafico exibe numero ("02") sem nome — confuso em historico multi-ano
16. **BUG-FIN-016**: StatCards nao exibem variacao vs mes anterior (feature gap)
17. **BUG-FIN-017**: `months` sem limite maximo — possivel ataque de DoS por query excessiva
18. **BUG-FIN-018**: `getMonthlyToolsCost` carrega todos os tools em memoria em vez de agregar no banco

---

## AVISOS

1. **Smoke test nao realizado**: O servico requer autenticacao JWT (authMiddleware em todas as rotas).
   Nao foi possivel testar os endpoints sem credenciais validas. O scan foi estatico.

2. **Tool.annualCost**: Campo presente no schema (`Int?`) mas completamente ignorado em
   `getMonthlyToolsCost`. Se o design original pretendia usar `annualCost` para ferramentas
   anuais, ha uma feature nao implementada que causa calculos incorretos.

3. **Dupla contagem potencial**: `Expense` tem campo opcional `toolId` e `employeeId`,
   sugerindo que despesas podem estar vinculadas a ferramentas ou funcionarios. Se existirem
   despesas de categoria TECNOLOGIA vinculadas a tools, elas serao somadas em
   `expensesTotal` E em `toolsTotal`, causando dupla contagem no custo total.
   O schema permite este cenario mas o service nao tem guard contra ele.

4. **Scan incompleto proposital**: O `dashboard.service.ts` chama `expenseService.getTotalByCategory`,
   `employeeService.getByRole`, `toolService.getByCategory` e `trafficService.getByPlatform`
   dentro do `getMacroView` para popular `breakdown`. Esses dados do breakdown sao retornados
   pela API mas **nao sao renderizados** na pagina `financeiro/page.tsx` — o frontend importa
   `MacroView` com o campo `breakdown` definido na interface mas nenhum componente usa esses dados.
   Isso representa 4 queries extras ao banco por requisicao cujos resultados sao descartados
   no frontend.
