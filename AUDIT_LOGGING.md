# 📋 Audit Logging Guide

> Multi-Agent System v7.0 - Enterprise Complete Edition

## Schema de Audit Log

```typescript
interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    type: 'user' | 'system' | 'api';
    id: string;
    email?: string;
    ip?: string;
  };
  action: string;          // Ex: "user.create", "payment.refund"
  resource: { type: string; id: string; };
  details: {
    before?: object;
    after?: object;
    reason?: string;
  };
  result: 'success' | 'failure' | 'denied';
  context: {
    correlationId: string;
    environment: string;
  };
}
```

## Ações que DEVEM ser logadas

### Autenticação
- `auth.login` / `auth.login.failed` / `auth.logout`
- `auth.password.change` / `auth.password.reset`
- `auth.mfa.enable` / `auth.mfa.disable`

### Usuários
- `user.create` / `user.update` / `user.delete`
- `user.role.change`

### Dados sensíveis
- `data.export` / `data.delete` / `data.access`

### Financeiro
- `payment.create` / `payment.refund`
- `subscription.create` / `subscription.cancel`

## Implementação Node.js

```javascript
class AuditLogger {
  async log(auditData) {
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...auditData,
    };
    
    // Remover dados sensíveis
    if (entry.details?.before?.password) {
      entry.details.before.password = '[REDACTED]';
    }
    
    await this.storage.log(entry);
    return entry;
  }
}

// Middleware
function auditMiddleware(auditLogger, action) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      await auditLogger.log({
        actor: { type: req.user ? 'user' : 'anonymous', id: req.user?.id || 'anonymous', ip: req.ip },
        action,
        resource: { type: req.baseUrl.split('/').pop(), id: req.params.id || 'N/A' },
        result: res.statusCode < 400 ? 'success' : 'failure',
        context: { correlationId: req.correlationId },
      });
    });
    next();
  };
}
```

## Retenção

| Regulação | Retenção |
|-----------|----------|
| LGPD | 5 anos |
| GDPR | 6 anos |
| SOC 2 | 7 anos |
| PCI-DSS | 1 ano |
