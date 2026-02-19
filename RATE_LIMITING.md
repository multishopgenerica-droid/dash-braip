# 🛡️ Rate Limiting Configuration

> Multi-Agent System v6.2 - Bulletproof Edition

## Overview

Rate limiting protege sua API contra:
- Ataques de DDoS
- Abuso de endpoints
- Consumo excessivo de recursos
- Scraping não autorizado

---

## Configuração Recomendada

### Por Tipo de Endpoint

| Endpoint Type | Limit | Window | Justificativa |
|--------------|-------|--------|---------------|
| **Public APIs** | 100 req | 1 min | Proteção geral |
| **Authentication** | 5 req | 1 min | Previne brute force |
| **Password Reset** | 3 req | 1 hour | Alta sensibilidade |
| **File Upload** | 10 req | 1 min | Recursos intensivos |
| **Search** | 30 req | 1 min | Pode ser pesado |
| **Webhooks** | 1000 req | 1 min | Integrações precisam mais |
| **Admin APIs** | 1000 req | 1 min | Usuários confiáveis |

### Por Tier de Usuário

| Tier | Limit | Window |
|------|-------|--------|
| **Anonymous** | 30 req | 1 min |
| **Free** | 60 req | 1 min |
| **Pro** | 300 req | 1 min |
| **Enterprise** | 1000 req | 1 min |

---

## Implementação por Stack

### Node.js (Express)

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Limiter geral
const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    error: 'Too many requests',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'];
  }
});

// Limiter para auth (mais restrito)
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts',
    retryAfter: 60
  }
});

// Uso
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### Python (FastAPI)

```python
# middleware/rate_limiter.py
from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

# Uso em rotas
@app.get("/api/search")
@limiter.limit("30/minute")
async def search(request: Request):
    pass

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    pass
```

### Go (Gin)

```go
// middleware/rate_limiter.go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/ulule/limiter/v3"
    mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
    sredis "github.com/ulule/limiter/v3/drivers/store/redis"
)

func RateLimiter() gin.HandlerFunc {
    rate := limiter.Rate{
        Period: 1 * time.Minute,
        Limit:  100,
    }
    
    store, _ := sredis.NewStore(redisClient)
    
    return mgin.NewMiddleware(limiter.New(store, rate))
}

// Uso
r.Use(RateLimiter())
```

### PHP (Laravel)

```php
// app/Http/Kernel.php
protected $middlewareGroups = [
    'api' => [
        'throttle:60,1', // 60 requests per minute
    ],
];

// routes/api.php
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Customizado por usuário
// app/Providers/RouteServiceProvider.php
RateLimiter::for('api', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(300)->by($request->user()->id)
        : Limit::perMinute(30)->by($request->ip());
});
```

---

## Headers de Resposta

Sempre inclua estes headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60 (quando bloqueado)
```

---

## Circuit Breaker

Para proteger contra cascata de falhas:

```javascript
// circuit-breaker.js
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,      // 3s timeout
  errorThresholdPercentage: 50, // 50% de erros abre o circuito
  resetTimeout: 30000  // 30s para tentar novamente
};

const breaker = new CircuitBreaker(asyncFunction, options);

breaker.on('open', () => {
  console.log('Circuit breaker OPEN - serviço indisponível');
  notifyDiscord('Circuit breaker aberto!');
});

breaker.on('halfOpen', () => {
  console.log('Circuit breaker HALF-OPEN - testando...');
});

breaker.on('close', () => {
  console.log('Circuit breaker CLOSED - serviço recuperado');
});
```

---

## Monitoramento

### Métricas para coletar:
- Requests por endpoint/minuto
- Taxa de bloqueios (429)
- IPs mais ativos
- Endpoints mais acessados

### Alertas recomendados:
- Taxa de 429 > 5% → Warning
- Taxa de 429 > 10% → Alert
- Mesmo IP bloqueado 10+ vezes → Possível ataque

---

## Bypass para IPs confiáveis

```javascript
const WHITELIST = [
  '127.0.0.1',
  process.env.MONITORING_IP,
  // IPs de serviços internos
];

const limiter = rateLimit({
  skip: (req) => WHITELIST.includes(req.ip)
});
```

---

## Comandos Úteis

```bash
# Ver IPs bloqueados (Redis)
redis-cli KEYS "ratelimit:*" | head -20

# Limpar bloqueio de IP específico
redis-cli DEL "ratelimit:192.168.1.100"

# Ver estatísticas
redis-cli INFO stats | grep -E "keyspace|expired"
```
