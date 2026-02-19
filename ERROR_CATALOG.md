# 📚 ERROR_CATALOG.md - Sistema Dash Braip

> **CATÁLOGO DE ERROS CONHECIDOS + SOLUÇÕES**
> Quando encontrar um erro, PRIMEIRO consulte aqui!

---

## 🎯 COMO USAR ESTE ARQUIVO

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ANTES de tentar resolver um erro:                                           ║
║                                                                               ║
║   1. Copie a mensagem de erro                                                 ║
║   2. Busque aqui: Ctrl+F → colar erro                                         ║
║   3. Se encontrar → USE A SOLUÇÃO DOCUMENTADA                                 ║
║   4. Se não encontrar → Resolva e ADICIONE AQUI                               ║
║                                                                               ║
║   ⚠️ NÃO REINVENTE A RODA - Use soluções já testadas!                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 ÍNDICE POR CATEGORIA

| Categoria | Qtd | Link |
|-----------|-----|------|
| 🔴 Database | 0 | [Ver](#-database) |
| 🟠 Docker | 0 | [Ver](#-docker) |
| 🟡 TypeScript/JavaScript | 0 | [Ver](#-typescriptjavascript) |
| 🟢 API/Backend | 0 | [Ver](#-apibackend) |
| 🔵 Frontend/React | 0 | [Ver](#-frontendreact) |
| 🟣 Autenticação | 0 | [Ver](#-autenticação) |
| ⚪ Build/Deploy | 0 | [Ver](#-builddeploy) |
| 🔶 Performance | 0 | [Ver](#-performance) |

---

## 🔴 DATABASE

### ERR-DB-001: Connection Pool Exhausted

**Erro:**
```
Error: Connection pool exhausted - Too many connections
FATAL: too many connections for role "postgres"
```

**Causa:**
Conexões não estão sendo fechadas corretamente, ou pool muito pequeno.

**Solução:**
```typescript
// 1. Verificar se conexões estão sendo fechadas
// ERRADO:
const connection = await pool.connect();
// faz algo
// esqueceu de fechar!

// CERTO:
const connection = await pool.connect();
try {
  // faz algo
} finally {
  connection.release(); // SEMPRE liberar
}

// 2. Aumentar pool se necessário
// .env
DATABASE_POOL_SIZE=20
```

**Prevenção:**
- Usar try/finally para garantir release
- Configurar timeout de conexão
- Monitorar conexões ativas

---

### ERR-DB-002: Migration Failed

**Erro:**
```
Error: Migration failed - relation "xxx" already exists
Error: column "xxx" of relation "xxx" does not exist
```

**Causa:**
Estado do banco inconsistente com migrations.

**Solução:**
```bash
# 1. Verificar status das migrations
npx prisma migrate status

# 2. Se em desenvolvimento, resetar
npx prisma migrate reset

# 3. Se em produção, resolver manualmente
# CUIDADO: fazer backup primeiro!
npx prisma migrate resolve --applied "migration_name"
```

**Prevenção:**
- Nunca editar migrations já aplicadas
- Sempre testar migrations em staging
- Fazer backup antes de migrations em produção

---

### ERR-DB-003: Query Timeout

**Erro:**
```
Error: Query timeout - canceling statement due to statement timeout
```

**Causa:**
Query muito lenta, geralmente falta de índice ou N+1.

**Solução:**
```sql
-- 1. Identificar query lenta
EXPLAIN ANALYZE SELECT ...;

-- 2. Criar índice se necessário
CREATE INDEX idx_table_column ON table(column);

-- 3. Aumentar timeout temporariamente (não recomendado)
SET statement_timeout = '60s';
```

**Prevenção:**
- Criar índices para campos de busca frequente
- Evitar SELECT *
- Usar paginação

---

## 🟠 DOCKER

### ERR-DOCKER-001: Container Keeps Restarting

**Erro:**
```
Container xxx is restarting (exit code 1)
docker: Error response from daemon: Container is not running
```

**Causa:**
Aplicação crashando no startup.

**Solução:**
```bash
# 1. Ver logs do container
docker logs CONTAINER_NAME --tail 100

# 2. Rodar interativamente para debug
docker run -it IMAGE_NAME sh

# 3. Verificar variáveis de ambiente
docker exec CONTAINER_NAME env

# 4. Verificar health check
docker inspect CONTAINER_NAME | grep -A 10 Health
```

**Prevenção:**
- Implementar health checks
- Logs claros no startup
- Validar .env antes de deploy

---

### ERR-DOCKER-002: Port Already in Use

**Erro:**
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**Causa:**
Outra aplicação usando a mesma porta.

**Solução:**
```bash
# 1. Identificar processo na porta
lsof -i :3000
# ou
netstat -tulpn | grep 3000

# 2. Matar processo (se seguro)
kill -9 PID

# 3. Ou usar porta diferente
docker run -p 3001:3000 ...
```

---

### ERR-DOCKER-003: Out of Disk Space

**Erro:**
```
Error: no space left on device
```

**Causa:**
Disco cheio com imagens/volumes antigos.

**Solução:**
```bash
# 1. Verificar uso de disco Docker
docker system df

# 2. Limpar recursos não usados
docker system prune -a

# 3. Remover volumes órfãos
docker volume prune

# 4. Limpar build cache
docker builder prune
```

**Prevenção:**
- Limpar semanalmente
- Configurar log rotation
- Monitorar uso de disco

---

## 🟡 TYPESCRIPT/JAVASCRIPT

### ERR-TS-001: Cannot find module

**Erro:**
```
Error: Cannot find module 'xxx' or its corresponding type declarations
Module not found: Error: Can't resolve 'xxx'
```

**Causa:**
Módulo não instalado ou path incorreto.

**Solução:**
```bash
# 1. Verificar se está instalado
npm ls xxx

# 2. Instalar se necessário
npm install xxx

# 3. Se for tipos
npm install -D @types/xxx

# 4. Se for path relativo, verificar
# ERRADO: import { x } from 'src/utils'
# CERTO:  import { x } from '../utils'
# ou configure paths no tsconfig.json
```

---

### ERR-TS-002: Type 'xxx' is not assignable

**Erro:**
```
Type 'string' is not assignable to type 'number'
Type 'xxx | undefined' is not assignable to type 'xxx'
```

**Causa:**
Incompatibilidade de tipos.

**Solução:**
```typescript
// 1. Para undefined, usar optional chaining ou default
const value = obj?.property ?? defaultValue;

// 2. Para conversão de tipo
const num = Number(stringValue);
const str = String(numValue);

// 3. Se tiver certeza do tipo (usar com cuidado)
const value = obj.property as ExpectedType;

// 4. Para union types
if (typeof value === 'string') {
  // TypeScript sabe que é string aqui
}
```

---

### ERR-TS-003: Property does not exist

**Erro:**
```
Property 'xxx' does not exist on type 'yyy'
```

**Causa:**
Acessando propriedade não definida no tipo.

**Solução:**
```typescript
// 1. Definir a propriedade na interface
interface User {
  name: string;
  email: string;
  phone?: string; // opcional
}

// 2. Se for objeto dinâmico
interface DynamicObj {
  [key: string]: unknown;
}

// 3. Se vier de API, tipar corretamente
const response = await api.get<User>('/user');
```

---

## 🟢 API/BACKEND

### ERR-API-001: CORS Error

**Erro:**
```
Access to XMLHttpRequest at 'xxx' from origin 'yyy' has been blocked by CORS
```

**Causa:**
Backend não permite requisições do frontend.

**Solução:**
```typescript
// Express
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:3000', 'https://seusite.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// NestJS
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true,
});
```

---

### ERR-API-002: JWT Invalid/Expired

**Erro:**
```
JsonWebTokenError: invalid token
TokenExpiredError: jwt expired
```

**Causa:**
Token inválido ou expirado.

**Solução:**
```typescript
// 1. Verificar se token está sendo enviado corretamente
// Header: Authorization: Bearer TOKEN

// 2. Verificar secret
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 3. Implementar refresh token
if (error.name === 'TokenExpiredError') {
  // Renovar token
}

// 4. Limpar token no frontend se inválido
localStorage.removeItem('token');
```

---

### ERR-API-003: Request Entity Too Large

**Erro:**
```
PayloadTooLargeError: request entity too large
```

**Causa:**
Body da requisição maior que o limite.

**Solução:**
```typescript
// Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Para uploads, usar multer com limite
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

---

## 🔵 FRONTEND/REACT

### ERR-REACT-001: Cannot update component while rendering

**Erro:**
```
Warning: Cannot update a component while rendering a different component
```

**Causa:**
Atualizando estado durante render.

**Solução:**
```typescript
// ERRADO:
function Component() {
  const [count, setCount] = useState(0);
  setCount(1); // ❌ Atualiza durante render
  return <div>{count}</div>;
}

// CERTO:
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(1); // ✅ Atualiza em efeito
  }, []);
  
  return <div>{count}</div>;
}
```

---

### ERR-REACT-002: Too many re-renders

**Erro:**
```
Error: Too many re-renders. React limits the number of renders
```

**Causa:**
Loop infinito de atualizações.

**Solução:**
```typescript
// ERRADO:
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ❌ Loop infinito
  return <div>{count}</div>;
}

// ERRADO:
<button onClick={handleClick()}> // ❌ Executa no render

// CERTO:
<button onClick={handleClick}> // ✅ Passa referência
<button onClick={() => handleClick(param)}> // ✅ Arrow function
```

---

### ERR-REACT-003: Memory leak - Can't perform state update on unmounted

**Erro:**
```
Warning: Can't perform a React state update on an unmounted component
```

**Causa:**
Async operation completa após componente desmontar.

**Solução:**
```typescript
function Component() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      const result = await api.get('/data');
      if (isMounted) { // ✅ Verificar antes de atualizar
        setData(result);
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false; // Cleanup
    };
  }, []);
  
  return <div>{data}</div>;
}
```

---

## 🟣 AUTENTICAÇÃO

### ERR-AUTH-001: Invalid Credentials

**Erro:**
```
Error: Invalid email or password
401 Unauthorized
```

**Solução:**
```typescript
// Backend: NÃO revelar qual campo está errado
// ERRADO:
if (!user) throw new Error('Email não encontrado');
if (!passwordMatch) throw new Error('Senha incorreta');

// CERTO:
if (!user || !passwordMatch) {
  throw new UnauthorizedException('Credenciais inválidas');
}
```

---

### ERR-AUTH-002: Session Expired

**Erro:**
```
Error: Session expired, please login again
```

**Solução:**
```typescript
// Frontend: Interceptor para renovar token
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await refreshToken();
        return api.request(error.config);
      } catch {
        logout();
        redirect('/login');
      }
    }
    return Promise.reject(error);
  }
);
```

---

## ⚪ BUILD/DEPLOY

### ERR-BUILD-001: Out of Memory

**Erro:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solução:**
```bash
# Aumentar memória do Node
export NODE_OPTIONS="--max-old-space-size=4096"

# Ou no package.json
"build": "NODE_OPTIONS='--max-old-space-size=4096' npm run build"
```

---

### ERR-BUILD-002: TypeScript Errors Blocking Build

**Erro:**
```
Type error: xxx
Build failed due to TypeScript errors
```

**Solução:**
```bash
# 1. Corrigir os erros (recomendado)
npx tsc --noEmit

# 2. Se precisar ignorar temporariamente (NÃO RECOMENDADO)
// @ts-ignore
// @ts-expect-error

# 3. Verificar tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

## 🔶 PERFORMANCE

### ERR-PERF-001: N+1 Query Problem

**Erro:**
```
Query executed 100 times in loop
Slow response time on list endpoints
```

**Solução:**
```typescript
// ERRADO (N+1):
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// CERTO (Eager loading):
const users = await User.findAll({
  include: [{ model: Post }]
});

// Prisma:
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

---

## ➕ TEMPLATE PARA ADICIONAR NOVO ERRO

```markdown
### ERR-[CAT]-[NUM]: [Título]

**Erro:**
\`\`\`
[Mensagem de erro exata]
\`\`\`

**Causa:**
[Explicação da causa]

**Solução:**
\`\`\`[linguagem]
// Código da solução
\`\`\`

**Prevenção:**
- [Como evitar no futuro]

**Referências:**
- [Links úteis]

---
```

---

## 📊 ESTATÍSTICAS

| Métrica | Valor |
|---------|-------|
| Total de erros catalogados | 18 |
| Última atualização | 2026-01-26 |
| Erros mais frequentes | - |

---

*Última atualização: 2026-01-26*
