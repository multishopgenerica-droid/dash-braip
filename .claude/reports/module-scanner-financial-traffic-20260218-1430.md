# SCAN REPORT — financial / traffic (TrafficSpend CRUD)
Data: 2026-02-18

## RESUMO

| Metrica | Valor |
|---------|-------|
| Arquivos backend lidos | 4 (controller, service, dto, routes) |
| Arquivos frontend lidos | 2 (page.tsx, financial.service.ts) |
| Arquivos schema lidos | 1 (schema.prisma) |
| Endpoints mapeados | 6 (list, create, getById, update, delete, getByPlatform) |
| Endpoints smoke test | SERVICO_OFFLINE (URL generica no registry) |
| Bugs P0 | 1 |
| Bugs P1 | 3 |
| Bugs P2 | 4 |
| Bugs P3 | 3 |

---

## ENDPOINTS (rotas registradas)

| # | Metodo | URL | Controller Method |
|---|--------|-----|-------------------|
| 1 | GET | /api/v1/financial/traffic | trafficController.findAll |
| 2 | POST | /api/v1/financial/traffic | trafficController.create |
| 3 | GET | /api/v1/financial/traffic/platforms | trafficController.getByPlatform |
| 4 | GET | /api/v1/financial/traffic/:id | trafficController.findById |
| 5 | PUT | /api/v1/financial/traffic/:id | trafficController.update |
| 6 | DELETE | /api/v1/financial/traffic/:id | trafficController.delete |

> Smoke test: SERVICO_OFFLINE — URL real nao configurada no project-registry.md (valor placeholder "SEU-DOMINIO.com")
> Analise realizada inteiramente por inspecao estatica de codigo.

---

## BUGS ENCONTRADOS

---

### BUG-TRAF-001: Data exibida na tabela pode mostrar dia errado para usuarios em UTC-3 (São Paulo)

- **Severidade**: P0
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linha**: 434
- **Descricao**:
  O campo `date` no banco de dados usa `@db.Date` no Prisma, que ao ser serializado para JSON retorna
  uma string no formato `"2024-01-15T00:00:00.000Z"` (midnight UTC). Quando o browser do usuario
  esta em UTC-3 (America/Sao_Paulo), a expressao:

  ```ts
  new Date(traffic.date).toLocaleDateString('pt-BR')
  ```

  interpreta `2024-01-15T00:00:00.000Z` como `14/01/2024 às 21:00` no fuso local, e
  `toLocaleDateString` retorna `14/01/2024` — um dia ANTES da data real registrada.

  Confirmado em Node.js com timezone UTC-3:
  ```
  new Date('2024-01-15T00:00:00.000Z').toLocaleDateString('pt-BR') => "14/01/2024"
  ```

  O formulario (linha 29) ja faz a coisa certa ao usar `traffic.date.split('T')[0]` para
  popular o input `<input type="date">`, mas a EXIBICAO NA TABELA nao usa essa abordagem.

- **Fix proposto**:
  Substituir na linha 434:
  ```ts
  // ERRADO
  {new Date(traffic.date).toLocaleDateString('pt-BR')}

  // CORRETO
  {(() => {
    const [y, m, d] = (traffic.date as string).split('T')[0].split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('pt-BR');
  })()}
  ```
  Ou criar um helper `formatDateLocal(isoString: string)` que extrai YYYY-MM-DD e monta
  um `new Date(year, month-1, day)` em horario local, evitando o problema de timezone.

---

### BUG-TRAF-002: Constraint unique do banco ineficaz — duplicatas silenciosas permitidas

- **Severidade**: P1
- **Arquivo (schema)**: `/root/sistema-dash-braip/backend/prisma/schema.prisma` linha 717
- **Arquivo (DTO)**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/traffic.dto.ts`
- **Arquivo (service)**: `/root/sistema-dash-braip/backend/src/modules/financial/services/traffic.service.ts`
- **Descricao**:
  O schema define a seguinte constraint unique no modelo `TrafficSpend`:
  ```prisma
  @@unique([userId, platform, date, campaignId])
  ```
  O campo `campaignId` e opcional (`String?`). O DTO nao expoe `campaignId` e o service de
  `create` nunca popula esse campo, logo todos os registros criados via CRUD terao
  `campaignId = NULL`.

  Em PostgreSQL, valores `NULL` nao sao considerados iguais em constraints `UNIQUE`.
  Portanto, e possivel criar N registros com a mesma combinacao `(userId, platform, date, NULL)`
  sem violar a constraint — a protecao de duplicidade e COMPLETAMENTE INEFICAZ para uso
  via formulario.

  O usuario consegue criar 10 registros identicos (mesma plataforma, mesma data) sem
  receber nenhum erro, e os cards de totais irao somar esses valores duplicados erroneamente.

- **Fix proposto**:
  Opcao A — Alterar a constraint para nao incluir `campaignId`:
  ```prisma
  @@unique([userId, platform, date])
  ```
  Isso impediria dois gastos da mesma plataforma no mesmo dia (adequado se o modelo e
  "1 registro por plataforma por dia").

  Opcao B — Expor `campaignId` no DTO e no formulario e tornar o campo obrigatorio na
  constraint, mantendo multiplos registros por dia por campanha.

  Opcao C — Adicionar validacao no service antes do insert, buscando registro existente
  e lancando erro 409 Conflict em caso de duplicata.

---

### BUG-TRAF-003: Erro de unicidade (P2002) nao tratado — retorna HTTP 500 generico

- **Severidade**: P1
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/controllers/traffic.controller.ts`
- **Linha**: 18-24
- **Descricao**:
  O bloco catch do controller de `create` trata apenas `ZodError`. Qualquer outro erro do
  Prisma (como `PrismaClientKnownRequestError` com codigo `P2002` — violacao de unique) e
  propagado como HTTP 500 "Erro interno do servidor". O usuario ve uma mensagem generica
  sem entender que tentou criar um registro duplicado.

  Embora o BUG-002 torne a constraint praticamente inativa para o fluxo normal, ha cenarios
  onde ela pode ser violada (ex: importacao de dados por outra via com `campaignId` preenchido).
  Mesma ausencia no controller de `update`.

- **Fix proposto**:
  ```ts
  import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

  // No catch do create e update:
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ja existe um gasto de trafego para esta plataforma e data'
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro nao encontrado' });
    }
  }
  ```

---

### BUG-TRAF-004: Cards de totais e breakdown nao respeitam o filtro de plataforma da tabela

- **Severidade**: P1
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linhas**: 217-219, 284-287
- **Descricao**:
  O componente tem dois estados de dados independentes:
  1. `data` (de `listTraffic`) — respeita o filtro de plataforma selecionado no select
  2. `platformData` (de `getTrafficByPlatform`) — **sempre** busca TODOS os dados sem filtro

  Os cards de resumo (Gasto Total, Receita, Conversoes, ROAS) sao calculados a partir de
  `platformData`. Quando o usuario filtra a tabela por "Meta Ads", os cards continuam
  mostrando o total de TODAS as plataformas, criando inconsistencia visual e potencialmente
  enganosa. O usuario pode interpretar que os cards representam o total da plataforma filtrada.

  ```ts
  // platformData nunca recebe o filtro de plataforma:
  queryFn: () => financialService.getTrafficByPlatform(),  // sem args
  ```

- **Fix proposto**:
  Passar o filtro de plataforma ao `getTrafficByPlatform` e incluir no queryKey:
  ```ts
  const { data: platformData } = useQuery({
    queryKey: ['traffic-platforms', filters.platform],
    queryFn: () => financialService.getTrafficByPlatform(
      undefined, undefined, filters.platform || undefined
    ),
  });
  ```
  Isso requer tambem expor o parametro de plataforma na funcao `getTrafficByPlatform`
  do frontend service e na rota/controller/service do backend.

---

### BUG-TRAF-005: Formulario permite criar gasto com spend=0 (R$ 0,00) sem aviso

- **Severidade**: P2
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linhas**: 108-117
- **Descricao**:
  O campo "Gasto (R$)" tem `required` e `min="0"` no HTML. O atributo `required` com
  `type="number"` valida apenas que o campo nao esta vazio — ele aceita `0` como valor
  valido. Adicionalmente, o `onChange` usa `parseFloat(e.target.value) || 0`, o que faz
  com que limpar o campo (valor `''`) resulte em `0`, e o browser nao considera `0` como
  campo vazio para fins de `required`.

  Resultado: e possivel submeter o formulario com R$ 0,00 de gasto, criar um registro
  invalido semanticamente, e o ROAS calculado ficara como "0.00x" (pois divisao por zero
  e tratada como caso especial na linha 430).

  O backend DTO tambem aceita `spend: 0` (`nonnegative` permite zero).

- **Fix proposto**:
  Adicionar validacao no `handleSubmit` antes do `onSave`:
  ```ts
  if (!formData.spend || formData.spend <= 0) {
    toast.error('Gasto deve ser maior que zero');
    return;
  }
  ```
  E no backend DTO, se desejado:
  ```ts
  spend: z.number().int().positive('Gasto deve ser maior que zero'),
  ```

---

### BUG-TRAF-006: Paginacao renderiza todos os botoes sem limite — risco de performance

- **Severidade**: P2
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linhas**: 494-509
- **Descricao**:
  A paginacao usa `[...Array(data.pagination.totalPages)].map(...)` para renderizar um
  botao por pagina, sem nenhum limite maximo. Com `limit=20` (padrao), 10.000 registros
  geraria 500 botoes no DOM simultaneamente, causando degradacao de performance de render
  e UX ruim (barra horizontal de paginacao gigante).

  O DTO backend aceita `limit` ate 100 registros/pagina, o que com 100.000 registros
  ainda produziria 1.000 botoes.

- **Fix proposto**:
  Implementar paginacao com janela deslizante (ex: mostrar apenas 5 paginas ao redor da
  pagina atual, mais botoes Anterior/Proximo e ir para primeira/ultima):
  ```tsx
  // Mostrar no maximo 5 paginas ao redor da pagina atual
  const windowStart = Math.max(1, filters.page - 2);
  const windowEnd = Math.min(data.pagination.totalPages, filters.page + 2);
  ```

---

### BUG-TRAF-007: Estado de erro da query nao tratado — tela fica em branco silenciosamente

- **Severidade**: P2
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linhas**: 208-215, 416-428
- **Descricao**:
  A query principal usa apenas `isLoading` para controle de estado. Nao ha tratamento
  para `isError`:
  ```ts
  const { data, isLoading } = useQuery({...});
  // isError nao e desestruturado
  ```
  Se a API retornar erro (500, 401, rede offline), a tabela mostra apenas o estado vazio
  ("Nenhum gasto de trafego encontrado") porque `data` sera `undefined` e a condicao
  `data?.data.length === 0` e avaliada como falsa via optional chaining — na verdade cai
  no else do map e nao renderiza nada.

  Usuarios nao sabem se nao ha dados ou se houve um erro de comunicacao.

- **Fix proposto**:
  ```ts
  const { data, isLoading, isError } = useQuery({...});

  // Na tabela, adicionar estado de erro:
  ) : isError ? (
    <tr>
      <td colSpan={7} className="px-6 py-12 text-center text-red-400">
        Erro ao carregar dados. Tente novamente.
      </td>
    </tr>
  ) : data?.data.length === 0 ? (
  ```

---

### BUG-TRAF-008: Botoes de Editar e Excluir nao ficam desabilitados durante mutations

- **Severidade**: P2
- **Arquivo**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Linhas**: 471-484
- **Descricao**:
  Os botoes de edicao e exclusao nao verificam se uma mutation esta em andamento. O usuario
  pode clicar em "Excluir" duas vezes rapidamente e disparar duas requisicoes de delete
  para o mesmo ID. O segundo delete retornara 404 (registro ja excluido), e o `onError`
  da mutation exibira o toast "Erro ao excluir gasto de trafego" — mensagem enganosa pois
  a primeira requisicao ja funcionou corretamente.

  Tambem se aplica ao botao "Salvar" no modal de edicao.

- **Fix proposto**:
  ```tsx
  // Nos botoes da tabela:
  <button
    onClick={() => handleDelete(traffic.id)}
    disabled={deleteMutation.isPending}
    className="p-2 text-zinc-400 hover:text-red-400 transition disabled:opacity-50"
  >

  // No botao Salvar do modal:
  <button
    type="submit"
    disabled={createMutation.isPending || updateMutation.isPending}
    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition disabled:opacity-50"
  >
    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
  </button>
  ```

---

### BUG-TRAF-009: Filtros de data (startDate/endDate) existem no backend mas nao no frontend

- **Severidade**: P3
- **Arquivo (backend)**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/traffic.dto.ts` linha 32-33
- **Arquivo (frontend)**: `/root/sistema-dash-braip/frontend/src/app/(dashboard)/financeiro/trafego/page.tsx`
- **Descricao**:
  O `trafficFilterSchema` do backend define os filtros `startDate` e `endDate` opcionais.
  O `filters` state do frontend tem apenas `platform` e `page`. Nao ha nenhum input de
  data na UI de filtros. O usuario nao tem como filtrar os gastos por periodo — a tabela
  sempre carrega todos os registros (paginados), independente do periodo.

  Para uma pagina de gestao financeira, filtro de periodo e funcionalidade essencial.

- **Fix proposto**:
  Adicionar ao estado de filtros e a UI:
  ```ts
  const [filters, setFilters] = useState({
    platform: '',
    startDate: '',
    endDate: '',
    page: 1,
  });
  ```
  Adicionar inputs `<input type="date">` para startDate e endDate na secao de filtros.

---

### BUG-TRAF-010: Metodos getMonthlySpend e getDailySpend sao dead code

- **Severidade**: P3
- **Arquivo**: `/root/sistema-dash-braip/backend/src/modules/financial/services/traffic.service.ts`
- **Linhas**: 124-169
- **Descricao**:
  Os metodos `getMonthlySpend(userId, year, month)` e `getDailySpend(userId, startDate, endDate)`
  existem no service mas:
  1. Nao tem rotas registradas em `financial.routes.ts`
  2. Nao sao chamados por nenhum controller
  3. Nao sao chamados pelo frontend

  Sao dead code que aumentam a superfície de manutencao sem beneficio. Se forem planejados
  para uso futuro, devem ser documentados. Se obsoletos, devem ser removidos.

- **Fix proposto**:
  Ou registrar rotas e conectar ao frontend (implementacao completa), ou remover os metodos
  e adicionar comentario `// TODO: implementar dashboard de evolucao diaria/mensal`.

---

### BUG-TRAF-011: Multiplos campos do schema nunca populados pelo CRUD (campos orfaos)

- **Severidade**: P3
- **Arquivo (schema)**: `/root/sistema-dash-braip/backend/prisma/schema.prisma` linhas 691-711
- **Arquivo (dto)**: `/root/sistema-dash-braip/backend/src/modules/financial/dto/traffic.dto.ts`
- **Descricao**:
  O modelo `TrafficSpend` no Prisma tem os seguintes campos que NUNCA sao populados pelo
  CRUD atual (DTO nao os expoe, service nao os escreve, formulario nao os exibe):

  | Campo | Tipo | Descricao |
  |-------|------|-----------|
  | `accountId` | String? | ID da conta de anuncios |
  | `accountName` | String? | Nome da conta |
  | `campaignId` | String? | ID da campanha (tambem causa o BUG-002) |
  | `adSetName` | String? | Nome do conjunto de anuncios |
  | `cpm` | Float? | Custo por mil impressoes |
  | `cpc` | Float? | Custo por clique |
  | `ctr` | Float? | Taxa de cliques |
  | `cpa` | Float? | Custo por aquisicao |
  | `roas` | Float? | ROAS persistido no banco |

  O campo `roas` e calculado on-the-fly no frontend e no `getByPlatform`, mas nunca
  persistido no campo `roas` do banco. Os campos de metricas derivadas (cpm, cpc, ctr, cpa)
  tambem ficam sempre `null`.

- **Fix proposto**:
  Decidir o escopo do CRUD: se esses campos sao para integracao futura com APIs das
  plataformas (importacao automatica), documentar isso claramente. Se o CRUD manual nao
  vai usa-los, considerar uma migration para remove-los ou mante-los com `// Para uso futuro`.
  O campo `roas` deveria ser calculado e persistido no `create` e `update` se desejado
  como campo de busca/ordenacao.

---

## BOTOES DECORATIVOS

Nenhum botao decorativo (sem handler) encontrado. Todos os botoes tem handlers funcionais.

---

## ANALISE DE SEGURANCA

| Aspecto | Status |
|---------|--------|
| Isolamento multi-tenant (userId em todas as queries) | OK |
| Validacao Zod no controller (create, update, findAll) | OK |
| Autenticacao middleware global na rota | OK |
| `findById` verifica `userId` antes do `update` e `delete` | OK |
| SQL injection | N/A (ORM Prisma) |
| Exposicao de dados de outros usuarios | NAO — userId sempre filtrado |

---

## ANALISE DO ROAS

| Contexto | Calculo | Correto? |
|----------|---------|----------|
| Tabela frontend (linha 430) | `traffic.revenue / traffic.spend` (centavos/centavos) | SIM (proporcao igual) |
| getByPlatform service (linha 120) | `(revenue_cents / spend_cents).toFixed(2)` | SIM |
| getMonthlySpend service (linha 144) | `(revenue_cents / spend_cents).toFixed(2)` | SIM |
| overallRoas cards (linha 287) | `totalRevenue / totalSpend` (ambos centavos) | SIM |
| ROAS threshold coloracao (linha 463) | `parseFloat(roas) >= 1` (verde se ROAS >= 1x) | OK semanticamente |

O calculo de ROAS e matematicamente correto em todos os contextos porque a proporcao
revenue/spend e identica independente da unidade (centavos ou reais).

---

## ANALISE DE CONVERSAO CENTAVOS/REAIS

| Local | Conversao | Correto? |
|-------|-----------|----------|
| Modal form init — spend (linha 30) | `traffic.spend / 100` | SIM |
| Modal form init — revenue (linha 34) | `traffic.revenue / 100` | SIM |
| Modal submit — spend (linha 48) | `Math.round(formData.spend * 100)` | SIM |
| Modal submit — revenue (linha 49) | `Math.round(formData.revenue * 100)` | SIM |
| Tabela — spend (linha 443) | `formatCurrency(traffic.spend)` | SIM (divide por 100 internamente) |
| Cards — totalSpend (linha 317) | `formatCurrency(totalSpend)` onde totalSpend em cents | SIM |
| Cards — totalRevenue (linha 329) | `formatCurrency(totalRevenue)` onde totalRevenue em cents | SIM |
| Breakdown — platform.spend (linha 373) | `formatCurrency(platform.spend)` onde spend em cents | SIM |

Todas as conversoes de centavos/reais estao CORRETAS.

---

## AVISOS

1. **Servico offline**: URL de API no project-registry.md e placeholder (`SEU-DOMINIO.com`).
   Smoke test nao foi executado. Analise 100% estatica.

2. **Padrão truthy ao inves de null check (linhas 30 e 34)**: O codigo usa
   `traffic?.spend ? traffic.spend / 100 : 0` ao inves de `traffic?.spend != null ? ...`.
   Para `spend = 0`, o resultado e identico (0), mas o padrao e semanticamente incorreto
   e pode confundir mantenedores. Classificado como observacao, nao como bug funcional.

3. **window.confirm no delete (linha 278)**: Uso de `confirm()` nativo do browser para
   confirmacao de exclusao. Em Next.js com SSR, isso pode causar aviso de hidratacao.
   Alem disso, e bloqueante e nao personalizavel visualmente. Recomenda-se substituir
   por um modal de confirmacao proprio.

4. **queryKey de platforms estatica (linha 218)**: `queryKey: ['traffic-platforms']` nao
   inclui parametros de filtro. Se no futuro filtros forem passados para `getTrafficByPlatform`,
   o cache nao sera invalidado corretamente para diferentes combinacoes de parametros
   (relacionado ao BUG-004).
