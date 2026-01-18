# Dashboard Multi-Gateway

Dashboard inteligente para monitoramento de vendas, abandonos de carrinho e metricas de produtos, com suporte inicial para Braip.

## Estrutura do Projeto

```
sistema-dash-braip/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuracoes (DB, Redis, JWT)
│   │   ├── modules/        # Modulos da aplicacao
│   │   │   ├── auth/       # Autenticacao
│   │   │   ├── users/      # Usuarios
│   │   │   ├── gateways/   # Gateways de pagamento
│   │   │   ├── sales/      # Vendas
│   │   │   ├── abandons/   # Abandonos
│   │   │   ├── products/   # Produtos
│   │   │   ├── analytics/  # Metricas
│   │   │   └── sync/       # Sincronizacao
│   │   └── shared/         # Utilitarios compartilhados
│   └── prisma/             # Schema do banco
├── frontend/               # Next.js 14
│   └── src/
│       ├── app/            # App Router
│       ├── components/     # Componentes React
│       ├── services/       # Servicos de API
│       └── stores/         # Estado global (Zustand)
├── docker-compose.yml      # Dev environment
└── dashboard-stack.yaml    # Docker Swarm production
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Docker (opcional)

## Configuracao Rapida

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas configuracoes

npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 3. Com Docker

```bash
# Gerar secrets
export DB_PASSWORD=$(openssl rand -base64 32)
export JWT_ACCESS_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
export ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)

docker-compose up -d
```

## Credenciais Padrao

- Email: `admin@dashboard.com`
- Senha: `admin123`

## API Endpoints

### Autenticacao
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuario

### Gateways
- `GET /api/gateways` - Listar gateways
- `POST /api/gateways` - Adicionar gateway
- `POST /api/gateways/:id/sync` - Sincronizar

### Vendas
- `GET /api/sales` - Listar vendas
- `GET /api/sales/stats` - Estatisticas
- `GET /api/sales/by-status` - Por status

### Analytics
- `GET /api/analytics/dashboard` - Metricas do dashboard
- `GET /api/analytics/revenue` - Faturamento
- `GET /api/analytics/funnel` - Funil de conversao

## Deploy em Producao (Docker Swarm)

```bash
# Build das imagens
docker build -t dashboard-backend:latest ./backend
docker build -t dashboard-frontend:latest ./frontend

# Deploy
docker stack deploy -c dashboard-stack.yaml dashboard
```

## Tecnologias

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL + Redis
- JWT + bcrypt
- Socket.io

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Zustand
- Recharts
- PWA ready

## Proximos Passos

- [ ] Graficos de vendas por periodo
- [ ] Notificacoes em tempo real
- [ ] Exportacao de relatorios
- [ ] Integracao Hotmart
- [ ] Integracao Eduzz
