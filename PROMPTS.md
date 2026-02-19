# Prompts Padrao — Claude Ultra Kit v4.0

> Copie o prompt, substitua apenas o que esta entre `[COLCHETES]`.
> O agente descobre o resto automaticamente via project-registry.md.

---

## PLANNING (Novo no v4.0)

### Planejar Feature Completa
```
/plan-feature feature="[DESCRICAO DA FEATURE]"
/plan-feature feature="[DESCRICAO]" tipo=brownfield
```

### Criar PRD
```
/create-prd projeto="[NOME]"
/create-prd projeto="[NOME]" tipo=brownfield
```

### Criar Documento de Arquitetura
```
/architect-first projeto="[NOME]"
/architect-first projeto="[NOME]" tipo=[fullstack|backend|frontend|brownfield]
```

### Criar Stories a partir de PRD
```
/create-story prd="docs/prd-[SLUG].md"
/create-story descricao="[DESCRICAO DO EPIC]"
```

---

## EXECUTION

### Pipeline Autonomo Completo (1 comando faz tudo)
```
/full-pipeline modulo=[MODULO]
/full-pipeline modulos=[X],[Y],[Z]
```

### Nexus (Comando Unico Inteligente)
```
/nexus modulo=[MODULO]
/nexus modulo=[MODULO] alvo=[DESCRICAO]
/nexus modulos=[X],[Y],[Z]
/nexus modo=plan feature="[DESCRICAO]"
```

### Validar Ambiente
```
/pre-flight modulo=[MODULO]
```

### CRUD ou Modulo Isolado
```
/audit-workflow modulo=[MODULO]
/audit-workflow modulo=[MODULO] crud=[CRUD]
```

### Multiplos Modulos em Paralelo
```
/maestria modo [scan|fix|full] nos modulos [X] e [Y]
```

### Testar no Browser (Playwright)
```
/deep-e2e-tester modulo=[MODULO] crud=[CRUD]
```

### Investigar Bug
```
/bug-investigator modulo=[MODULO]
BUG: [descricao do problema]
```

### Tracking (Sessoes Longas)
```
/progress-tracker
```

### Reverter Sprint (Desfazer Tudo)
```
/rollback-all
```

---

## Referencia Rapida

| Quero... | Prompt |
|----------|--------|
| Planejar feature | `/plan-feature feature="X"` |
| Criar PRD | `/create-prd projeto="X"` |
| Criar arquitetura | `/architect-first projeto="X"` |
| Criar stories | `/create-story prd="docs/prd-X.md"` |
| TUDO autonomo | `/nexus modulo=X` |
| Fix em 1 modulo | `/audit-workflow modulo=X` |
| Fix em 2+ modulos | `/maestria modo fix nos modulos X e Y` |
| Testar no browser | `/deep-e2e-tester modulo=X` |
| Investigar bug | `/bug-investigator` + descricao |
| Reverter tudo | `/rollback-all` |
