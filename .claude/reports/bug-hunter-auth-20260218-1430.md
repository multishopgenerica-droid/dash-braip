# Bug Hunter Report - Modulo AUTH
**Data**: 2026-02-18
**Modulo**: auth
**Investigador**: Claude Opus 4.6 (Bug Hunter Forense)

---

## BUG-AUTH-001: PostgreSQL fora do ar - volume bind mount aponta para diretorio inexistente
**SEVERIDADE**: P0 CRASH
**SINTOMA**: Login SEMPRE retorna `{"success":false,"error":"Erro interno do servidor"}` (HTTP 500)
**RAIZ**: O servico `dashboard_dashboard-postgres` esta em loop de restart (0/1 replicas) porque o volume configurado no `dashboard-stack.yaml` faz bind mount para um diretorio que NAO EXISTE no disco.

**ARQUIVO**: `/root/sistema-dash-braip/dashboard-stack.yaml`
**LINHA**: 86-91

**PROBLEMA**:
O volume `dashboard_pg_data` esta configurado como bind mount para:
```
/var/lib/docker/volumes/sistema-dash-braip_postgres_data/_data
```

Este diretorio **NAO EXISTE** no servidor. Os volumes que existem no disco sao:
- `/var/lib/docker/volumes/dashboard_dashboard_pg_data/` (volume gerenciado pelo Docker Swarm)
- `/var/lib/docker/volumes/postgres_data/` (volume antigo)

O erro exato do Docker Swarm:
```
failed to populate volume: error while mounting volume
'/var/lib/docker/volumes/dashboard_dashboard_pg_data/_data':
failed to mount local volume: mount
/var/lib/docker/volumes/sistema-dash-braip_postgres_data/_data:
/var/lib/docker/volumes/dashboard_dashboard_pg_data/_data,
flags: 0x1000: no such file or directory
```

**CADEIA COMPLETA DO ERRO**:
```
1. PostgreSQL container nao inicia (volume inexistente)
2. Backend tenta conectar em dashboard-postgres:5432 (host name do service)
3. Prisma lanca PrismaClientKnownRequestError: "Can't reach database server at dashboard-postgres:5432"
4. Erro nao e AppError nem ZodError nem JWT error
5. error.middleware.ts (linha 55) captura como erro generico
6. Retorna HTTP 500: "Erro interno do servidor"
7. Frontend mostra "Erro ao fazer login" ou "Erro interno do servidor"
```

**EVIDENCIA** (logs do backend):
```
Can't reach database server at `dashboard-postgres:5432`
Please make sure your database server is running at `dashboard-postgres:5432`.
```

**EVIDENCIA** (curl):
```bash
# Validacao Zod funciona (prova que o backend esta rodando):
curl -X POST .../api/auth/login -d '{}' -> 400 "Dados invalidos"

# Login com dados validos cai no banco inacessivel:
curl -X POST .../api/auth/login -d '{"email":"admin@dashboard.com","password":"admin123"}' -> 500 "Erro interno do servidor"
```

**FIX** (2 opcoes):

Opcao A - Remover bind mount e usar volume Docker gerenciado (RECOMENDADO):
```yaml
# dashboard-stack.yaml linhas 85-91
volumes:
  dashboard_pg_data:
    driver: local
  dashboard_redis_data:
    driver: local
```

Opcao B - Criar o diretorio esperado:
```bash
mkdir -p /var/lib/docker/volumes/sistema-dash-braip_postgres_data/_data
```

ATENCAO: Se escolher Opcao A, o banco sera criado do zero (sem dados). Se havia dados no volume antigo `postgres_data`, seria necessario migra-los primeiro.

Apos fix, rodar:
```bash
docker stack deploy -c /root/sistema-dash-braip/dashboard-stack.yaml dashboard
# Aguardar PostgreSQL subir, depois:
# docker exec no container postgres e rodar prisma migrate/seed
```

**IMPACTO**: TODA a aplicacao esta inacessivel. Nenhum endpoint que acessa banco funciona. Apenas rotas que nao tocam o banco (como /health e validacao Zod) respondem corretamente.

---

## BUG-AUTH-002: Rota /register protegida por authorize() sem authMiddleware
**SEVERIDADE**: P1 FUNCIONALIDADE
**SINTOMA**: Rota POST /api/auth/register sempre retorna 401 "Acesso nao autorizado"
**RAIZ**: A rota de registro usa `authorize(Role.ADMIN)` como middleware, mas `authorize()` depende de `req.user` que so e populado pelo `authMiddleware`. Sem `authMiddleware` antes de `authorize`, `req.user` e sempre `undefined`.

**ARQUIVO**: `/root/sistema-dash-braip/backend/src/modules/auth/auth.routes.ts`
**LINHA**: 10

**PROBLEMA**:
```typescript
// Linha 10 - ATUAL (BUGADO)
router.post('/register', authorize(Role.ADMIN), authController.register);
```

O middleware `authorize()` no arquivo `auth.middleware.ts` linhas 46-59:
```typescript
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {  // <-- req.user SEMPRE sera undefined aqui
      next(new AppError(401, AUTH_MESSAGES.UNAUTHORIZED));  // <-- SEMPRE cai aqui
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, AUTH_MESSAGES.FORBIDDEN));
      return;
    }
    next();
  };
}
```

`req.user` so e definido pelo `authMiddleware` (que extrai do token JWT e busca no banco). Sem ele na chain, `authorize` rejeita TODOS os requests.

**FIX**:
```typescript
// Linha 10 - CORRIGIDO
router.post('/register', authMiddleware, authorize(Role.ADMIN), authController.register);
```

**IMPACTO**: Impossivel registrar novos usuarios pela API. O unico user no sistema e o do seed (`admin@dashboard.com`). Este bug NAO afeta o login.

---

## BUG-AUTH-003: Credenciais expostas no dashboard-stack.yaml (SEGURANCA)
**SEVERIDADE**: P1 FUNCIONALIDADE (seguranca)
**SINTOMA**: Secrets de JWT, encryption key, senha do banco e proxy URL estao em texto plano no arquivo de stack
**RAIZ**: O `dashboard-stack.yaml` contem credenciais hardcoded em vez de usar Docker secrets ou .env

**ARQUIVO**: `/root/sistema-dash-braip/dashboard-stack.yaml`
**LINHA**: 8, 40-48

**PROBLEMA**:
```yaml
# Linha 8 - Senha do banco em texto plano
POSTGRES_PASSWORD: dashboard123

# Linhas 42-48 - Todos os secrets expostos
JWT_ACCESS_SECRET: 8778f5268d...
JWT_REFRESH_SECRET: 6d5e96f6f3...
ENCRYPTION_KEY: ca72afa9256e...
BRAIP_PROXY_URL: http://USER:PASS@server...
```

Este arquivo esta no git (nao esta no .gitignore), portanto todos os secrets estao no historico do repositorio.

**FIX**: Usar Docker Swarm secrets ou arquivo .env externo (nao versionado).

**IMPACTO**: Qualquer pessoa com acesso ao repositorio pode acessar o banco, forjar tokens JWT, e descriptografar dados criptografados.

---

## RESUMO

| Bug | Severidade | Status | Bloqueia Login |
|-----|-----------|--------|----------------|
| BUG-AUTH-001 | P0 | PostgreSQL offline | SIM - causa raiz |
| BUG-AUTH-002 | P1 | Register inacessivel | NAO |
| BUG-AUTH-003 | P1 | Secrets expostos | NAO |

**ORDEM DE CORRECAO**: BUG-AUTH-001 primeiro (desbloqueia toda app), depois BUG-AUTH-002, depois BUG-AUTH-003.

### Nota sobre o codigo de auth
O fluxo de login no codigo esta CORRETO do ponto de vista logico:
- Frontend (login/page.tsx) -> auth.store.ts -> auth.service.ts -> POST /api/auth/login
- Backend: auth.routes.ts -> authLimiter -> auth.controller.ts -> auth.service.ts -> prisma + bcrypt + jwt
- Validacao Zod, hashing bcrypt, JWT generation, refresh token management - tudo ok
- O UNICO motivo do login falhar e a INFRAESTRUTURA (PostgreSQL offline)
