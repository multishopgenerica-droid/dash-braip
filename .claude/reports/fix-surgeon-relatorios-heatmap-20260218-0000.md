# FIX SURGEON REPORT -- relatorios-heatmap
Data: 2026-02-18
Build CMD: npx tsc --noEmit

## RESUMO
| Metrica | Valor |
|---------|-------|
| Total fixes tentados | 3 |
| Fixes aplicados | 3 |
| Fixes revertidos | 0 |
| Fixes pulados | 0 |
| Circuit breaker | nao |

## FIXES

### FIX-1: Aumentar z-index do tooltip do heatmap
- Arquivo: /root/sistema-dash-braip/frontend/src/app/(dashboard)/relatorios/page.tsx
- Mudanca: Trocado `z-20` por `z-[9999]` na div do tooltip
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-2: Posicionamento dinamico do tooltip (cima/baixo)
- Arquivo: /root/sistema-dash-braip/frontend/src/app/(dashboard)/relatorios/page.tsx
- Mudanca: Tooltip usa `top-full mt-2` para Dom/Seg (dayIndex <= 1) e `bottom-full mb-2` para os demais dias
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim

### FIX-3: Corrigir overflow que clipa tooltips
- Arquivo: /root/sistema-dash-braip/frontend/src/app/(dashboard)/relatorios/page.tsx
- Mudanca: Adicionado `overflow-y-visible` ao container `overflow-x-auto`
- Erros antes: 0
- Erros depois: 0
- Status: APLICADO
- Verificado: sim
