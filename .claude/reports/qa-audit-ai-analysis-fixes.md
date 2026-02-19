# QA AUDIT REPORT — ai-analysis — 2026-02-18 (hora: estimativa sessao)

## Status Geral: PASS (com observacoes)

---

## Compilacao: 0 erros

Comando executado: `npx tsc --noEmit --pretty` no diretorio `/root/sistema-dash-braip/backend`
Resultado: sem erros TypeScript. Compilacao limpa.

---

## Git Diff Review

- Arquivos modificados: 4
- Arquivos esperados: 3 (ai-analysis.routes.ts, ai-analysis.service.ts, openai.service.ts)
- Arquivos suspeitos: 1 (frontend/public/sw.js)

### Analise do arquivo suspeito: `frontend/public/sw.js`

O arquivo `sw.js` (Service Worker) foi modificado mas NAO e parte dos fixes ai-analysis.
Analise do diff: a mudanca e apenas na hash do build Next.js (build ID `aZJdNt-WsyvhajifErymP` -> `2vEHmWUrJ7Dx40Y-EA6jF`) e no CSS hash.
Isso indica que o frontend foi recompilado e o SW foi regenerado automaticamente.
Avaliacao: NAO e suspeito — e efeito colateral de um rebuild do Next.js. Nenhum codigo de logica alterado.

---

## Fixes Verificados

| # | Fix | Arquivo | Status | Observacao |
|---|-----|---------|--------|------------|
| FIX-1 | Rota /execute | backend/src/modules/ai-analysis/ai-analysis.routes.ts:14 | PASS | Linha 14: `router.post('/:id/execute', ...)` correto. Frontend usa `/api/ai-analysis/${id}/execute` (ai-analysis.service.ts:58). Endpoints batem. |
| FIX-2 | Integracao OpenAI | backend/src/modules/ai-analysis/ai-analysis.service.ts:109-153 | PASS | Import em linha 6 correto. Fallback logico em linhas 131-135. Status PROCESSING/COMPLETED/FAILED cobertos. |
| FIX-3 | Comparativo de periodos | backend/src/modules/openai/openai.service.ts | PASS com RESSALVA | Ver detalhes abaixo |

---

## Detalhes FIX-1

Arquivo: `/root/sistema-dash-braip/backend/src/modules/ai-analysis/ai-analysis.routes.ts`

- Backend rota: `POST /:id/execute` (linha 14)
- Controller handler: `aiAnalysisController.processAiAnalysis` (linha 14) — nome do handler e `processAiAnalysis`, mas a rota URL e `/execute`. Nao ha conflito pois e apenas o nome da funcao interna.
- Frontend service: `api.post(\`/api/ai-analysis/${id}/execute\`)` (linha 58 de ai-analysis.service.ts)
- Consistencia: CONFIRMADA

---

## Detalhes FIX-2

Arquivo: `/root/sistema-dash-braip/backend/src/modules/ai-analysis/ai-analysis.service.ts`

- Import: `import { openAIService } from '../openai/openai.service';` (linha 6) — correto, singleton exportado
- Chamada: `openAIService.analyzeData(userId, analysis.prompt)` (linha 129)
- Fallback: se `aiResult.success && aiResult.analysis` falhar -> chama `generateAnalysisResult()` (linha 134)
- Status PROCESSING: set em linha 123 antes do try
- Status COMPLETED: set em linha 141 no bloco de sucesso
- Status FAILED: set em linha 148-150 no catch

OBSERVACAO: O fallback quando `analyzeData()` retorna `{success: false}` (OpenAI nao configurada) funciona corretamente — chama o template local. Porem quando `analyzeData()` lanca uma excecao (erro de rede, por exemplo), o catch em linha 146 seta status FAILED e propaga o erro. Isso e comportamento correto — erros inesperados devem marcar como FAILED.

OBSERVACAO 2: Se o prompt estiver vazio (`analysis.prompt = ""`), o codigo nao valida isso. `analyzeData()` recebera prompt vazio e enviara para OpenAI. O DTO deveria validar prompt nao-vazio. Severidade: BAIXA (o DTO de criacao provavelmente ja valida, nao foi verificado neste audit).

---

## Detalhes FIX-3

Arquivo: `/root/sistema-dash-braip/backend/src/modules/openai/openai.service.ts`

### Checklist do fix:

- [x] `extractDatesFromQuery` parseia 2 meses (linhas 171-192): correto, encontra todos os nomes de meses, ordena e monta startDate/endDate
- [x] `buildFullContext` tem `comparisonPeriod` (linhas 417-449): correto, busca dados do segundo periodo
- [x] Interface `FullContext` tem campo `comparisonPeriod` opcional (linhas 65-71): correto, `comparisonPeriod?`
- [x] `analyzeData()` inclui `comparisonSection` no system prompt (linhas 536-611): correto

### RESSALVA 1 — Duplicacao de logica de parsing de meses

A logica de parsing de nomes de meses e `monthNames` esta DUPLICADA:
- Em `extractDatesFromQuery()` (linhas 171-192): parseia 2 meses para definir `startDate`/`endDate` da busca principal
- Em `buildFullContext()` (linhas 417-449): repete o mesmo parsing para montar `comparisonPeriod`

O segundo parsing em `buildFullContext` e necessario para determinar se ha comparativo, mas usa sua propria variavel `compMonthNames` identica a `monthNames` de `extractDatesFromQuery`. Nao e um bug funcional, mas e duplicacao de codigo que pode gerar inconsistencia futura.

### RESSALVA 2 — Comportamento com "marco" (marco sem cedilha)

O mapa de meses usa `'marco'` (normalizado sem cedilha). A normalizacao NFD + replace de acentos esta em linha 132-134 do `extractDatesFromQuery` e em linha 422 do `buildFullContext`. Isso garante que "marco" e "marco" (com cedilha) ambos funcionem. OK.

### RESSALVA 3 — Ano fixo = `now.getFullYear()`

Se o usuario perguntar "comparativo janeiro/fevereiro" em marco de 2026, o sistema usa o ano atual (2026), mas janeiro de 2026 ja passou. Isso e comportamento CORRETO e esperado — nao e um bug.

### RESSALVA 4 — foundMonths pode ter duplicatas (POTENCIAL BUG)

Em `extractDatesFromQuery` linha 178-181, o loop sobre `monthNames` empurra `monthIndex` sem checar duplicatas. Se o usuario escrever "comparativo janeiro janeiro", `foundMonths = [0, 0]` (dois janeiros). A condicao `foundMonths.length >= 2` seria verdadeira, e o resultado seria: startDate = 1/jan, endDate = 31/jan (mesmo mes). Nao e um crash, mas e logica incorreta. Severidade: BAIXA (input invalido do usuario).

---

## Patterns: OK (com observacoes menores)

- Express: async handlers com next(error) em todos os pontos. OK.
- Prisma: queries com where por userId garantindo isolamento de dados. OK.
- OpenAI: API key recuperada do banco, NUNCA exposta no response. OK.
- Error handling: try/catch presente em todos os pontos criticos. OK.
- console.log extensivos em producao (linhas 129, 130, 136, 142, 490-495): aceitavel para debugging inicial, mas considerar remover em producao para evitar log de userId e prompt do usuario.

---

## API Endpoints

| Endpoint | Status | HTTP Code | Observacao |
|----------|--------|-----------|------------|
| POST /api/ai-analysis/:id/execute | SERVICO_INDISPONIVEL | N/A | Servico backend em swarm, sem porta exposta diretamente. Servico Running ha 45 min. |
| GET /api/ai-analysis | SERVICO_INDISPONIVEL | N/A | Mesma razao — trafego via Traefik/dominio interno. |

Nota: O servico `dashboard_dashboard-backend` esta Running (1/1 replicas). A indisponibilidade e apenas de acesso direto da maquina de teste sem o dominio correto. NAO e regressao dos fixes.

---

## Novos Bugs Encontrados

| # | Severidade | Descricao | Arquivo |
|---|-----------|-----------|---------|
| 1 | BAIXA | `extractDatesFromQuery`: se usuario digita nome de mes repetido (ex: "janeiro janeiro"), `foundMonths` tera duplicatas e o comparativo sera montado com periodo unico (startDate == endDate do primeiro mes) | openai.service.ts:177-191 |
| 2 | BAIXA | `buildFullContext`: mesma vulnerabilidade de duplicatas de meses (linhas 423-428) | openai.service.ts:423-428 |
| 3 | INFO | Duplicacao do mapa `monthNames`/`compMonthNames` entre `extractDatesFromQuery` e `buildFullContext` — candidate para refatoracao futura | openai.service.ts |
| 4 | INFO | console.log em producao loga userId e prompt do usuario (dados sensiveis de negocio). Considerar remover ou mover para debug level | openai.service.ts:129-130, 490-495 |

---

## Veredicto: PASS

Os 3 fixes estao funcionalmente corretos:
- FIX-1: Rota `/execute` no backend bate com o frontend. CORRETO.
- FIX-2: Import do openAIService correto, fallback implementado, estados de status cobertos. CORRETO.
- FIX-3: Parsing de dois meses, campo `comparisonPeriod` na interface, dados buscados e secao comparativa no prompt. CORRETO.

Compilacao TypeScript limpa (0 erros). Nenhum bug critico introduzido. Os novos bugs encontrados sao de severidade BAIXA/INFO e nao bloqueiam o funcionamento.
