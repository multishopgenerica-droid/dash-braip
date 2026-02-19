# Project Registry — sistema-dash-braip

> Auto-gerado pelo onboard.sh em 2026-02-18.
> Edite este arquivo para refinar modulos, adicionar presets e shared files.

## STACK

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js + TypeScript + Tailwind + Zustand + TanStack Query |
| Backend | Express.js + Prisma |
| Database | PostgreSQL |
| Deploy | Docker Compose |

## PROJECT PATHS

- **Root**: /root/sistema-dash-braip
- **Frontend**: /root/sistema-dash-braip/frontend/src
- **Backend**: /root/sistema-dash-braip/backend


- **Deploy**: Docker Compose

## URLS

- **Frontend**: https://SEU-DOMINIO.com
- **API**: https://api.SEU-DOMINIO.com
- **API Prefix**: /api/v1/
- **Auth Header**: x-tenant-slug: SLUG (ou Authorization: Bearer TOKEN)

## MODULE MAP

> Modulos detectados automaticamente. Refine conforme necessario.


### abandons
- **backend**: backend/src/modules/abandons/
- **controllers**: abandons.controller.ts
- **frontend**: abandons.service.ts
- **endpoints**: 0

### ai-analysis
- **backend**: backend/src/modules/ai-analysis/
- **controllers**: ai-analysis.controller.ts
- **frontend**: ai-analysis.service.ts
- **endpoints**: 0

### analytics
- **backend**: backend/src/modules/analytics/
- **controllers**: analytics.controller.ts
- **frontend**: analytics.service.ts
- **endpoints**: 0

### auth
- **backend**: backend/src/modules/auth/
- **controllers**: auth.controller.ts
- **frontend**: auth.service.ts,auth.store.ts
- **endpoints**: 0

### financial
- **backend**: backend/src/modules/financial/
- **controllers**: traffic.controller.ts,tool.controller.ts,dashboard.controller.ts,employee.controller.ts,expense.controller.ts
- **frontend**: financial.service.ts
- **endpoints**: 0

### gateways
- **backend**: backend/src/modules/gateways/
- **controllers**: gateways.controller.ts
- **frontend**: gateways.service.ts,gateways
- **endpoints**: 0

### openai
- **backend**: backend/src/modules/openai/
- **controllers**: openai.controller.ts
- **frontend**: openai.service.ts
- **endpoints**: 0

### products
- **backend**: backend/src/modules/products/
- **controllers**: products.controller.ts
- **frontend**: products
- **endpoints**: 0

### sales
- **backend**: backend/src/modules/sales/
- **controllers**: sales.controller.ts
- **frontend**: sales.service.ts,sales
- **endpoints**: 0

### sync
- **backend**: backend/src/modules/sync/
- **endpoints**: 0

### telegram
- **backend**: backend/src/modules/telegram/
- **controllers**: telegram.controller.ts
- **frontend**: telegram.service.ts
- **endpoints**: 0

### users
- **backend**: backend/src/modules/users/
- **controllers**: users.controller.ts
- **endpoints**: 0

### webhooks
- **backend**: backend/src/modules/webhooks/
- **controllers**: webhooks.controller.ts
- **endpoints**: 0

### whatsapp
- **backend**: backend/src/modules/whatsapp/
- **controllers**: whatsapp.controller.ts
- **frontend**: whatsapp.service.ts
- **endpoints**: 0

## PRESETS (GRUPOS DE MODULOS)

> Defina presets para trabalhar em grupos de modulos com /maestria.
> Exemplo: /maestria modo fix no grupo core

```
core:       [PREENCHER]
frontend:   [PREENCHER]
backend:    [PREENCHER]
all:        [abandons,ai-analysis,analytics,auth,financial,gateways,openai,products,sales,sync,telegram,users,webhooks,whatsapp]
```

## SHARED FILES (CONFLICT ZONES)

> Arquivos usados por 2+ modulos. Importante para file locking na Maestria.

| Arquivo | Usado por | Dono padrao |
|---------|-----------|-------------|
| lib/ | todos os modulos | (definir dono) |
| components/shared/ | todos os modulos | (definir dono) |


## ZONAS PROIBIDAS (NUNCA EDITAR VIA AGENTE)

> Arquivos que NENHUM agente pode editar automaticamente.

- (ex: app.module.ts, App.tsx, docker-compose.yml, .env)

## DEPLOY COMMANDS

> Comandos de deploy do projeto. O deploy-guardian gera esses comandos
> mas NUNCA os executa — o usuario deve confirmar.

```bash
# Preencha com os comandos reais:
# docker compose down && docker compose up -d
# pm2 restart all
# vercel deploy --prod
```

## PLANNING STATUS

- **planning_ready**: false
- **PRDs**: 0
- **Architecture docs**: 0
- **Stories**: 0
