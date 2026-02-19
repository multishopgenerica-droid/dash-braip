# 🚩 Feature Flags Guide

> Multi-Agent System v7.0 - Enterprise Complete Edition

## O que são Feature Flags?

Permitem ligar/desligar funcionalidades SEM fazer deploy.

```
✅ Deploy com feature desligada → Liga para 5% → 50% → 100%
❌ Se der problema → Desliga instantaneamente (sem deploy!)
```

## Config (feature-flags.json)

```json
{
  "features": {
    "new-checkout": {
      "enabled": false,
      "description": "Novo fluxo de checkout",
      "rollout": {
        "percentage": 0,
        "users": ["user-123"],
        "groups": ["beta-testers"]
      },
      "owner": "team-payments"
    },
    "dark-mode": {
      "enabled": true,
      "rollout": { "percentage": 100 }
    }
  }
}
```

## Implementação JavaScript

```javascript
const crypto = require('crypto');

class FeatureFlags {
  constructor(config) {
    this.features = config.features || {};
  }

  isEnabled(featureName, context = {}) {
    const feature = this.features[featureName];
    if (!feature || !feature.enabled) return false;

    const rollout = feature.rollout || {};

    // Usuário específico
    if (rollout.users?.includes(context.userId)) return true;

    // Grupo específico
    if (rollout.groups?.some(g => context.groups?.includes(g))) return true;

    // Grupo excluído
    if (rollout.excludeGroups?.some(g => context.groups?.includes(g))) return false;

    // Rollout percentual (hash determinístico)
    if (rollout.percentage !== undefined) {
      if (rollout.percentage >= 100) return true;
      if (rollout.percentage <= 0) return false;
      const hash = this._hashUser(context.userId || 'anonymous', featureName);
      return hash < rollout.percentage;
    }

    return true;
  }

  _hashUser(userId, featureName) {
    const hash = crypto.createHash('md5').update(`${userId}-${featureName}`).digest('hex');
    return parseInt(hash.substring(0, 8), 16) % 100;
  }
}

// Uso
const flags = new FeatureFlags(config);

if (flags.isEnabled('new-checkout', { userId: user.id, groups: user.groups })) {
  return renderNewCheckout();
}
return renderOldCheckout();
```

## Best Practices

1. **Nomeação clara**: `feature-name`, não `flag1`
2. **Owner definido**: Quem é responsável?
3. **Limpeza**: Remova flags após rollout 100%
4. **Testes**: Teste com flag ON e OFF
5. **Monitoramento**: Monitore métricas por flag
