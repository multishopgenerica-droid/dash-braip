# 📡 API_DOCUMENTATION.md - Documentação de API

> **Objetivo:** Documentar todos os endpoints da API de forma clara e padronizada
> **Mantra:** "API bem documentada = integração sem dor de cabeça"

---

## 📊 VISÃO GERAL

### Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3000/api` |
| Staging | `https://staging-api.exemplo.com/api` |
| Produção | `https://api.exemplo.com/api` |

### Versionamento

```
/api/v1/...  # Versão atual
/api/v2/...  # Próxima versão (quando houver breaking changes)
```

### Formato de Resposta

Todas as respostas seguem o formato:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Formato de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      { "field": "email", "message": "Email inválido" }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 AUTENTICAÇÃO

### JWT Bearer Token

```
Authorization: Bearer <token>
```

### Obter Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Nome"
    }
  }
}
```

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📋 CÓDIGOS DE STATUS HTTP

| Código | Significado | Quando usar |
|--------|-------------|-------------|
| `200` | OK | Requisição bem sucedida |
| `201` | Created | Recurso criado |
| `204` | No Content | Sucesso sem corpo (DELETE) |
| `400` | Bad Request | Dados inválidos |
| `401` | Unauthorized | Não autenticado |
| `403` | Forbidden | Sem permissão |
| `404` | Not Found | Recurso não existe |
| `409` | Conflict | Conflito (ex: email duplicado) |
| `422` | Unprocessable | Validação falhou |
| `429` | Too Many Requests | Rate limit atingido |
| `500` | Internal Error | Erro do servidor |

---

## 📚 ENDPOINTS

### Template de Documentação

```markdown
### [METHOD] /endpoint

**Descrição:** O que este endpoint faz

**Autenticação:** 🔒 Requer / 🔓 Pública

**Permissões:** ADMIN, USER, etc.

**Rate Limit:** X requests/minuto

**Query Parameters:**
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| page | number | Não | Página (default: 1) |
| limit | number | Não | Itens por página (default: 20) |

**Request Body:**
\`\`\`json
{
  "campo": "tipo - descrição"
}
\`\`\`

**Response 200:**
\`\`\`json
{
  "success": true,
  "data": { }
}
\`\`\`

**Possíveis Erros:**
| Código | Erro | Descrição |
|--------|------|-----------|
| 400 | VALIDATION_ERROR | Dados inválidos |
| 404 | NOT_FOUND | Recurso não existe |
```

---

## 🧑‍💼 USERS

### GET /api/v1/users

**Descrição:** Lista todos os usuários (paginado)

**Autenticação:** 🔒 Requer

**Permissões:** ADMIN

**Query Parameters:**
| Param | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| page | number | Não | 1 | Página atual |
| limit | number | Não | 20 | Itens por página (max: 100) |
| search | string | Não | - | Busca por nome ou email |
| status | string | Não | - | Filtrar por status (active, inactive) |
| sortBy | string | Não | createdAt | Campo para ordenação |
| sortOrder | string | Não | desc | asc ou desc |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Nome Completo",
        "status": "active",
        "role": "USER",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### GET /api/v1/users/:id

**Descrição:** Busca usuário por ID

**Autenticação:** 🔒 Requer

**Permissões:** ADMIN ou próprio usuário

**Path Parameters:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | ID do usuário |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome Completo",
    "phone": "+5511999999999",
    "status": "active",
    "role": "USER",
    "avatar": "https://...",
    "preferences": { ... },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T08:00:00Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuário não encontrado"
  }
}
```

---

### POST /api/v1/users

**Descrição:** Cria novo usuário

**Autenticação:** 🔒 Requer

**Permissões:** ADMIN

**Request Body:**
```json
{
  "email": "novo@example.com",
  "name": "Nome Completo",
  "password": "Senha@123",
  "phone": "+5511999999999",
  "role": "USER"
}
```

**Validações:**
| Campo | Regras |
|-------|--------|
| email | Obrigatório, formato email válido, único |
| name | Obrigatório, min 2 caracteres |
| password | Obrigatório, min 8 caracteres, 1 maiúscula, 1 número, 1 especial |
| phone | Opcional, formato E.164 |
| role | Opcional, enum: USER, ADMIN |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "novo@example.com",
    "name": "Nome Completo"
  },
  "message": "Usuário criado com sucesso"
}
```

**Response 409:**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Este email já está em uso"
  }
}
```

---

### PUT /api/v1/users/:id

**Descrição:** Atualiza usuário

**Autenticação:** 🔒 Requer

**Permissões:** ADMIN ou próprio usuário

**Request Body:**
```json
{
  "name": "Novo Nome",
  "phone": "+5511888888888"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Novo Nome",
    "phone": "+5511888888888"
  },
  "message": "Usuário atualizado com sucesso"
}
```

---

### DELETE /api/v1/users/:id

**Descrição:** Remove usuário (soft delete)

**Autenticação:** 🔒 Requer

**Permissões:** ADMIN

**Response 204:** (Sem corpo)

---

## 🔧 HEALTH CHECK

### GET /api/health

**Descrição:** Verifica saúde da API

**Autenticação:** 🔓 Pública

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.2.3",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

---

## 📏 RATE LIMITING

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/v1/auth/*` | 10 requests | 1 minuto |
| `/api/v1/*` (autenticado) | 100 requests | 1 minuto |
| `/api/v1/*` (não autenticado) | 20 requests | 1 minuto |

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
```

### Response 429 (Limite Excedido)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em 60 segundos."
  }
}
```

---

## 📨 WEBHOOKS

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `user.created` | Usuário criado |
| `user.updated` | Usuário atualizado |
| `user.deleted` | Usuário removido |
| `payment.completed` | Pagamento confirmado |
| `payment.failed` | Pagamento falhou |

### Payload

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    ...
  },
  "signature": "sha256=..."
}
```

### Verificação de Assinatura

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## 🛠️ FERRAMENTAS

### Postman Collection

```
[Link para collection do Postman]
```

### OpenAPI/Swagger

```
[Link para Swagger UI]
/api/docs
```

### GraphQL Playground (se aplicável)

```
/graphql
```

---

## ❓ FAQ

### Como reportar bugs na API?

Criar issue no repositório com:
- Endpoint afetado
- Request enviado
- Response recebido
- Response esperado

### Como solicitar novos endpoints?

Criar issue com tag `feature-request` descrevendo o caso de uso.

---

*Documentação atualizada em: 2026-01-26*
