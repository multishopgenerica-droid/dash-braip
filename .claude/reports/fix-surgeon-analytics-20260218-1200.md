# FIX SURGEON REPORT — analytics (timezone)
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

### FIX-001: Adicionar TZ=America/Sao_Paulo no Dockerfile (stage runner)
- Arquivo: backend/docker/Dockerfile
- Mudanca: Adicionado `ENV TZ=America/Sao_Paulo` e `tzdata` na instalacao apt-get da stage runner
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-002: Adicionar TZ=America/Sao_Paulo no docker-compose.yml
- Arquivo: docker-compose.yml
- Mudanca: Adicionado `TZ: America/Sao_Paulo` nas environment variables do service backend
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-003: Corrigir filtros de data getDashboardMetrics com offset BRT
- Arquivo: backend/src/modules/analytics/analytics.service.ts (linhas 59, 62)
- Mudanca: `'T00:00:00'` -> `'T00:00:00-03:00'` e `'T23:59:59'` -> `'T23:59:59-03:00'`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-004: Corrigir filtros de data getSalesHeatmap com offset BRT
- Arquivo: backend/src/modules/analytics/analytics.service.ts (linhas 591, 594)
- Mudanca: Mesmo padrao do FIX-003 para o bloco de filtro do heatmap
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-005: Corrigir agrupamento de receita por data BRT
- Arquivo: backend/src/modules/analytics/analytics.service.ts (linha 240)
- Mudanca: `toISOString().split('T')[0]` -> `toLocaleDateString('en-CA')` (usa TZ local em vez de UTC)
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

## NOTAS
- date.ts (startOfDay/endOfDay) usa setHours() que ja opera no timezone local. Com TZ=America/Sao_Paulo definido no container, funciona corretamente sem alteracao.
- O heatmap (getDay/getHours nas linhas 611-612) tambem opera no timezone local, entao com TZ definido no container, os valores serao BRT.
- Nao foram tocados arquivos de sync/webhook conforme instrucao.
