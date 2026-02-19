# 🔍 IMPACT_ANALYSIS.md - Sistema Dash Braip

> **USAR ANTES DE QUALQUER ALTERAÇÃO!**
> Este template garante que você entenda o impacto ANTES de mexer.

---

## 🚨 REGRA ABSOLUTA

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ❌ NÃO ALTERAR NENHUM ARQUIVO SEM PREENCHER ESTE TEMPLATE!                  ║
║                                                                               ║
║   O Claude DEVE preencher esta análise e mostrar ao usuário                   ║
║   ANTES de executar qualquer mudança.                                         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 TEMPLATE DE ANÁLISE DE IMPACTO

### Copiar e preencher para CADA tarefa:

```markdown
# 🔍 ANÁLISE DE IMPACTO - [DATA]

## 📝 SOLICITAÇÃO
> [Descrever exatamente o que foi pedido]

## 🎯 OBJETIVO
> [O que será alcançado com essa mudança]

---

## 📁 ARQUIVOS A SEREM ALTERADOS

| # | Arquivo | Alteração | Linhas |
|---|---------|-----------|--------|
| 1 | path/arquivo1.ts | [descrição] | ~XX |
| 2 | path/arquivo2.ts | [descrição] | ~XX |

---

## 🔗 ANÁLISE DE DEPENDÊNCIAS

### Arquivos que DEPENDEM dos alterados:
| Arquivo Alterado | Dependentes | Ação Necessária |
|------------------|-------------|-----------------|
| arquivo1.ts | dep1.ts, dep2.ts | Testar |
| arquivo2.ts | dep3.ts | Testar |

### Verificação no DEPENDENCY_MAP.md:
- [ ] Consultei DEPENDENCY_MAP.md
- [ ] Listei TODOS os dependentes
- [ ] Nenhum dependente crítico? [SIM/NÃO]

---

## 🛡️ VERIFICAÇÃO DE PROTEÇÕES

### Consulta ao BUGS_FIXED.md:
```bash
grep -i "arquivo1\|arquivo2" BUGS_FIXED.md
```

| Arquivo | Está Protegido? | Bug # | Linhas Protegidas |
|---------|-----------------|-------|-------------------|
| arquivo1.ts | ⚠️ SIM / ✅ NÃO | #XXX | 45-67 |
| arquivo2.ts | ⚠️ SIM / ✅ NÃO | - | - |

### Consulta ao ERROR_CATALOG.md:
- [ ] Erro similar já ocorreu antes? [SIM/NÃO]
- [ ] Solução documentada aplicável? [SIM/NÃO]

---

## ⚠️ CLASSIFICAÇÃO DE RISCO

### Critérios:
| Fator | Pontos | Este Caso |
|-------|--------|-----------|
| Altera autenticação/auth | +3 | [ ] |
| Altera pagamentos/financeiro | +3 | [ ] |
| Altera banco de dados/migration | +2 | [ ] |
| Altera API pública | +2 | [ ] |
| Arquivo com 5+ dependentes | +2 | [ ] |
| Arquivo em BUGS_FIXED.md | +2 | [ ] |
| Altera lógica de negócio | +1 | [ ] |
| Altera apenas visual/UI | +0 | [ ] |
| Altera apenas texto/copy | +0 | [ ] |

### Cálculo:
- **Total de pontos**: [X]
- **Nível de Risco**:
  - 0-1: 🟢 BAIXO
  - 2-3: 🟡 MÉDIO  
  - 4-5: 🟠 ALTO
  - 6+:  🔴 CRÍTICO

### RISCO FINAL: [🟢/🟡/🟠/🔴] [NÍVEL]

---

## 🔙 PLANO DE ROLLBACK

### SE FALHAR, executar:
```bash
# Opção 1: Git
git checkout HEAD -- path/arquivo1.ts path/arquivo2.ts

# Opção 2: Backup manual
cp path/arquivo1.ts.backup path/arquivo1.ts

# Opção 3: Docker (se já fez deploy)
docker service update --rollback STACK_SERVICE
```

### Backup criado em:
- [ ] arquivo1.ts.backup
- [ ] arquivo2.ts.backup
- [ ] Git stash: `git stash push -m "backup antes de [tarefa]"`

---

## ✅ CHECKLIST PRÉ-EXECUÇÃO

### Análise:
- [ ] Entendi completamente o que foi pedido
- [ ] Listei TODOS os arquivos a alterar
- [ ] Consultei DEPENDENCY_MAP.md
- [ ] Consultei BUGS_FIXED.md
- [ ] Consultei ERROR_CATALOG.md
- [ ] Calculei o nível de risco

### Preparação:
- [ ] Backup criado
- [ ] Plano de rollback definido
- [ ] Usuário aprovou o plano

### SE RISCO 🔴 CRÍTICO:
- [ ] Aprovação EXPLÍCITA do usuário
- [ ] Snapshot do banco criado
- [ ] Horário de baixo tráfego

---

## 📊 RESULTADO DA ANÁLISE

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🔍 ANÁLISE DE IMPACTO CONCLUÍDA                                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  📁 Arquivos a alterar: [X]                                                   ║
║  🔗 Dependentes afetados: [X]                                                 ║
║  🛡️ Arquivos protegidos: [X]                                                 ║
║  ⚠️ Nível de risco: [🟢/🟡/🟠/🔴]                                             ║
║                                                                               ║
║  ✅ APROVADO PARA EXECUÇÃO? [Aguardando confirmação do usuário]               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚠️ AÇÕES POR NÍVEL DE RISCO

### 🟢 BAIXO (0-1 pontos)
```
→ Pode executar após mostrar plano
→ Backup recomendado mas não obrigatório
→ Deploy normal
```

### 🟡 MÉDIO (2-3 pontos)
```
→ DEVE mostrar análise completa ao usuário
→ Backup OBRIGATÓRIO
→ Testar bem antes de deploy
→ Aguardar confirmação explícita
```

### 🟠 ALTO (4-5 pontos)
```
→ PARAR e discutir com usuário
→ Backup OBRIGATÓRIO
→ Considerar fazer em etapas menores
→ Testar extensivamente
→ Deploy em horário de baixo tráfego
→ Monitorar por 10 minutos após deploy
```

### 🔴 CRÍTICO (6+ pontos)
```
→ PARAR IMEDIATAMENTE
→ Não executar sem aprovação EXPLÍCITA
→ Criar snapshot COMPLETO do banco
→ Backup de TODOS os arquivos relacionados
→ Considerar ambiente de staging primeiro
→ Deploy apenas em horário de baixíssimo tráfego
→ Monitorar por 30 minutos após deploy
→ Ter plano de rollback testado
```
```

---

*Template versão: Enterprise v5.0 - 2026-01-26*
