# QA AUDIT REPORT — relatorios-heatmap — 2026-02-18

## Status Geral: PASS

## Compilacao: 0 erros
- Comando: `cd /root/sistema-dash-braip/frontend && npx next build`
- Resultado: Build finalizado com sucesso. Todas as 17 paginas geradas sem erros.
- Pagina `/relatorios` compilada: 17.8 kB (257 kB First Load JS)

## Git Diff Review
- Arquivos modificados: 6 (incluindo 1 deletado)
- Arquivos esperados: `frontend/src/app/(dashboard)/relatorios/page.tsx`
- Arquivos de build/subproduto (esperados): `frontend/public/sw.js`, `frontend/public/workbox-4754cb34.js` (deletado, substituido por `workbox-849edfeb.js`), `frontend/next.config.js` (config PWA runtimeCaching adicionada)
- Arquivos suspeitos:
  - `.claude/settings.local.json` — Contem JWT token hardcoded em permissao Bash. **ALERTA DE SEGURANCA**: credencial exposta no diff. NAO e relacionado ao fix do heatmap.

## Fixes Verificados

| # | Fix | Arquivo | Linha | Status | Observacao |
|---|-----|---------|-------|--------|------------|
| 1 | z-index do tooltip `z-[9999]` | `frontend/src/app/(dashboard)/relatorios/page.tsx` | 166 | PASS | Alterado de `z-20` para `z-[9999]`. Garante que tooltip fica acima de qualquer outro elemento. |
| 2 | Posicionamento dinamico (cima/baixo) | `frontend/src/app/(dashboard)/relatorios/page.tsx` | 166 | PASS | Implementado `dayIndex <= 1 ? 'top-full mt-2' : 'bottom-full mb-2'`. Domingo (0) e Segunda (1) abrem tooltip para baixo; demais dias abrem para cima. Logica correta. |
| 3 | Container overflow-y-visible | `frontend/src/app/(dashboard)/relatorios/page.tsx` | 141 | PASS | Alterado de `overflow-x-auto` para `overflow-x-auto overflow-y-visible`. Permite tooltips nao serem clipados verticalmente. |

## Analise Detalhada dos Fixes

### FIX-1: z-index z-[9999]
- **Antes**: `z-20` (z-index: 20)
- **Depois**: `z-[9999]` (z-index: 9999)
- **Logica**: O tooltip precisa ficar acima de todas as camadas do dashboard, incluindo sidebar e outros overlays. z-[9999] garante isso.
- **Efeito colateral**: Nenhum identificado. O tooltip so aparece em hover (class `hidden group-hover:block`), entao nao interfere com outros elementos quando inativo.

### FIX-2: Posicionamento dinamico
- **Antes**: `bottom-full mb-2` (sempre para cima)
- **Depois**: Template literal com condicional `dayIndex <= 1 ? 'top-full mt-2' : 'bottom-full mb-2'`
- **Logica**: Os primeiros dias (Dom/Seg, indices 0 e 1) estao no topo da grade. Se o tooltip abrisse para cima, seria clipado ou ficaria fora da viewport. Abrindo para baixo (`top-full`) resolve. Os demais dias (indices 2-6) estao mais abaixo, entao tooltip para cima (`bottom-full`) e adequado.
- **Efeito colateral**: Nenhum. O `dayIndex` vem do `.map()` dos DAYS_OF_WEEK, entao e sempre 0-6.

### FIX-3: overflow-y-visible
- **Antes**: `overflow-x-auto` (overflow-y implicito: `auto`/`hidden` dependendo do contexto)
- **Depois**: `overflow-x-auto overflow-y-visible`
- **Logica**: Sem `overflow-y-visible`, o container do heatmap clipava tooltips que saiam dos limites verticais. Com essa propriedade, tooltips ficam visiveis mesmo quando excedem o container.
- **Efeito colateral**: Nenhum identificado. O scroll horizontal continua funcionando normalmente para telas estreitas.

## Patterns: OK (0 violacoes)
- React: Rules of Hooks respeitadas (useState, useMemo, useRef, useQuery no topo do componente)
- Next.js: "use client" directive presente no topo do arquivo
- Template literals em className: uso correto de interpolacao condicional
- Nenhum objeto como children de React
- Keys em listas: presentes em todos os `.map()`

## API Endpoints
| Endpoint | Status | HTTP Code | Observacao |
|----------|--------|-----------|------------|
| N/A | SERVICO_INDISPONIVEL | - | URLs do registry estao como placeholder (SEU-DOMINIO.com). Nao foi possivel testar endpoints. Nao conta como falha do fix. |

## Novos Bugs Encontrados
| # | Severidade | Descricao | Arquivo |
|---|-----------|-----------|---------|
| 1 | MEDIA | JWT token hardcoded exposto em `.claude/settings.local.json` no git diff. Embora nao seja codigo de producao, representa risco de seguranca se commitado. | `.claude/settings.local.json` |
| 2 | BAIXA | `next.config.js` e `sw.js` foram modificados (PWA runtimeCaching) — mudancas nao relacionadas ao fix do heatmap. Potencial drift se nao intencional. | `frontend/next.config.js`, `frontend/public/sw.js` |

## Consistencia
- O componente `SalesHeatmap` usa os mesmos patterns do restante do arquivo (Tailwind classes, interpolacao condicional, formatCurrency helper)
- Tooltip pattern (hover com `group`/`group-hover`) e consistente com o design system existente
- As 3 mudancas sao minimas e cirurgicas (apenas 2 linhas alteradas no arquivo principal)

## Veredicto: PASS

Todos os 3 fixes estao corretos, logicamente consistentes e a compilacao passou sem erros. As mudancas sao minimas e cirurgicas, sem refatoracao desnecessaria. Recomenda-se atentar para o JWT exposto no settings e para as mudancas nao-relacionadas em next.config.js/sw.js.
