# ✅ VALIDATION_RULES.md - Sistema Dash Braip

> **REGRAS DE VALIDAÇÃO OBRIGATÓRIAS**
> Nenhum código vai para produção sem passar por TODAS estas validações.

---

## 🎯 FILOSOFIA: ZERO TOLERÂNCIA A ERROS

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   "Se não passou em TODAS as validações, NÃO VAI PARA PRODUÇÃO!"             ║
║                                                                               ║
║   ❌ Não existe "é só um errinho pequeno"                                     ║
║   ❌ Não existe "depois eu arrumo"                                            ║
║   ❌ Não existe "funciona na minha máquina"                                   ║
║                                                                               ║
║   ✅ Passou em tudo? → Deploy                                                 ║
║   ❌ Falhou em algo? → Corrigir PRIMEIRO                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 NÍVEIS DE VALIDAÇÃO

### 🔵 NÍVEL 1: SINTAXE (Obrigatório - Automático)

| # | Validação | Comando | Bloqueante |
|---|-----------|---------|------------|
| 1.1 | ESLint | `npx eslint .` | ✅ SIM |
| 1.2 | Prettier | `npx prettier --check .` | ⚠️ Warning |
| 1.3 | TypeScript | `npx tsc --noEmit` | ✅ SIM |
| 1.4 | Syntax Check | Build sem erros | ✅ SIM |

**Critério de Aprovação:**
```
✅ APROVADO: 0 erros de ESLint + TypeScript compila
⚠️ WARNING: Avisos de Prettier (não bloqueia, mas corrigir)
❌ REPROVADO: Qualquer erro de sintaxe ou tipagem
```

---

### 🟢 NÍVEL 2: LÓGICA (Obrigatório - Automático)

| # | Validação | Comando | Bloqueante |
|---|-----------|---------|------------|
| 2.1 | Testes Unitários | `npm test` | ✅ SIM |
| 2.2 | Testes Integração | `npm run test:integration` | ✅ SIM |
| 2.3 | Cobertura | `npm run test:coverage` | ⚠️ Se < 70% |

**Critério de Aprovação:**
```
✅ APROVADO: Todos os testes passam + cobertura >= 70%
⚠️ WARNING: Cobertura entre 50-70%
❌ REPROVADO: Qualquer teste falhando OU cobertura < 50%
```

**Regras de Cobertura:**
```
- Arquivos novos: DEVEM ter testes
- Arquivos críticos (auth, pagamento): >= 80% cobertura
- Utils/helpers: >= 90% cobertura
- Componentes UI: >= 60% cobertura
```

---

### 🟡 NÍVEL 3: SEGURANÇA (Obrigatório - Automático)

| # | Validação | Comando | Bloqueante |
|---|-----------|---------|------------|
| 3.1 | npm audit | `npm audit --audit-level=high` | ✅ SIM (high/critical) |
| 3.2 | Secrets | `grep -r "password\|secret\|api_key" --include="*.ts"` | ✅ SIM |
| 3.3 | .env check | Verificar se .env não está no git | ✅ SIM |
| 3.4 | SQL Injection | Verificar queries parametrizadas | ✅ SIM |
| 3.5 | XSS | Verificar sanitização de inputs | ✅ SIM |

**Critério de Aprovação:**
```
✅ APROVADO: npm audit sem high/critical + sem secrets hardcoded
⚠️ WARNING: Vulnerabilidades moderate
❌ REPROVADO: Vulnerabilidades high/critical OU secrets no código
```

**Checklist de Segurança:**
```
□ Senhas não estão hardcoded
□ API keys vêm de variáveis de ambiente
□ Inputs do usuário são sanitizados
□ Queries usam parâmetros (não concatenação)
□ Autenticação usa tokens seguros
□ CORS configurado corretamente
□ Rate limiting implementado em endpoints sensíveis
```

---

### 🟠 NÍVEL 4: PERFORMANCE (Recomendado - Manual)

| # | Validação | Como Verificar | Bloqueante |
|---|-----------|----------------|------------|
| 4.1 | N+1 Queries | Revisar loops com queries | ⚠️ Warning |
| 4.2 | Bundle Size | `npm run build && du -sh dist` | ⚠️ Se > 5MB |
| 4.3 | Memory Leaks | Revisar event listeners | ⚠️ Warning |
| 4.4 | Response Time | Endpoint < 500ms | ⚠️ Warning |

**Critério de Aprovação:**
```
✅ APROVADO: Sem N+1, bundle < 5MB, response < 500ms
⚠️ WARNING: Performance degradada mas funcional
❌ REPROVADO: Performance crítica (response > 2s, bundle > 10MB)
```

**Checklist de Performance:**
```
□ Sem loops com queries dentro (N+1)
□ Paginação em listagens grandes
□ Índices no banco para queries frequentes
□ Cache implementado onde necessário
□ Imagens otimizadas
□ Lazy loading em componentes pesados
```

---

### 🔴 NÍVEL 5: ARQUITETURA (Obrigatório para features novas)

| # | Validação | Como Verificar | Bloqueante |
|---|-----------|----------------|------------|
| 5.1 | Padrões | Segue arquitetura definida | ✅ SIM |
| 5.2 | SOLID | Princípios respeitados | ⚠️ Warning |
| 5.3 | DRY | Sem código duplicado | ⚠️ Warning |
| 5.4 | Dependências | Não cria ciclos | ✅ SIM |

**Checklist de Arquitetura:**
```
□ Novo código segue estrutura existente
□ Services não acessam banco diretamente (usar Repository)
□ Controllers não têm lógica de negócio
□ Componentes são reutilizáveis
□ Não há dependências circulares
□ Nomes são descritivos e consistentes
```

---

## 🚀 SCRIPT DE VALIDAÇÃO COMPLETA

Execute antes de QUALQUER deploy:

```bash
./AUTOMATED_REVIEW.sh
```

O script executa TODOS os níveis automaticamente e só aprova se TUDO passar.

---

## 📊 MATRIZ DE DECISÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESULTADO DA VALIDAÇÃO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ TUDO VERDE                                                 │
│   └→ PODE FAZER DEPLOY                                          │
│                                                                 │
│   ⚠️ WARNINGS (sem erros críticos)                             │
│   └→ PODE FAZER DEPLOY                                          │
│      └→ MAS: Criar tarefa para corrigir warnings               │
│                                                                 │
│   ❌ ALGUM ERRO BLOQUEANTE                                      │
│   └→ NÃO FAZER DEPLOY                                           │
│      └→ Corrigir erro                                           │
│      └→ Rodar validação novamente                               │
│      └→ Só depois fazer deploy                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 CONFIGURAÇÃO DOS VALIDADORES

### ESLint (.eslintrc.js)
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    // Erros que BLOQUEIAM deploy
    'no-console': 'error',           // Usar logger
    'no-debugger': 'error',          // Remover debugger
    'no-unused-vars': 'error',       // Limpar código
    '@typescript-eslint/no-explicit-any': 'error', // Tipar tudo
    
    // Warnings (não bloqueiam mas avisar)
    'prefer-const': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn'
  }
};
```

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 📋 TEMPLATE: RELATÓRIO DE VALIDAÇÃO

```markdown
# 📋 RELATÓRIO DE VALIDAÇÃO - [DATA]

## 📊 RESUMO
| Nível | Status | Detalhes |
|-------|--------|----------|
| 1. Sintaxe | ✅/❌ | X erros |
| 2. Lógica | ✅/❌ | X testes falhando |
| 3. Segurança | ✅/❌ | X vulnerabilidades |
| 4. Performance | ✅/❌ | Response Xms |
| 5. Arquitetura | ✅/❌ | X violações |

## 🎯 RESULTADO FINAL
[ ] ✅ APROVADO - Pode fazer deploy
[ ] ❌ REPROVADO - Corrigir antes

## 📝 AÇÕES NECESSÁRIAS
1. [Ação 1]
2. [Ação 2]
```

---

*Última atualização: 2026-01-26*
