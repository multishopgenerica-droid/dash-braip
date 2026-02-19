# 🌿 GIT_WORKFLOW.md - Guia Completo de Git

> **Objetivo:** Padronizar o fluxo de trabalho com Git em todo o time
> **Mantra:** "Commits pequenos, branches curtas, reviews rápidos"

---

## 📊 MODELO DE BRANCHES

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           GITFLOW SIMPLIFICADO                                ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   main ─────●─────────────●─────────────●─────────────●───────► (produção)   ║
║              \           / \           / \           /                        ║
║               \         /   \         /   \         /                         ║
║   develop ─────●───●───●─────●───●───●─────●───●───●──────────► (staging)    ║
║                 \   \       / \   \       /                                   ║
║                  \   \     /   \   \     /                                    ║
║   feature/xxx     ●───●───●     ●───●───●                                     ║
║                                                                               ║
║   hotfix/xxx                                    ●───●                         ║
║                                                /     \                        ║
║   main ───────────────────────────────────●───●───────●──────►               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🏷️ TIPOS DE BRANCHES

| Tipo | Prefixo | Descrição | Exemplo |
|------|---------|-----------|---------|
| **Feature** | `feature/` | Nova funcionalidade | `feature/TASK-123-user-auth` |
| **Fix** | `fix/` | Correção de bug | `fix/TASK-456-login-error` |
| **Hotfix** | `hotfix/` | Correção urgente produção | `hotfix/critical-payment-bug` |
| **Refactor** | `refactor/` | Refatoração sem mudar comportamento | `refactor/cleanup-user-service` |
| **Docs** | `docs/` | Apenas documentação | `docs/update-readme` |
| **Test** | `test/` | Adicionar/corrigir testes | `test/user-service-coverage` |
| **Chore** | `chore/` | Manutenção, configs | `chore/update-dependencies` |

### Nomenclatura

```
[tipo]/[TASK-ID]-[descricao-curta]

Exemplos:
✅ feature/TASK-123-add-user-profile
✅ fix/TASK-456-login-timeout
✅ hotfix/payment-double-charge
✅ refactor/user-service-cleanup

❌ nova-feature        (sem prefixo)
❌ feature/add feature (espaços)
❌ FEATURE/TASK-123    (maiúsculas)
❌ feature/task-123-add-new-user-profile-page-with-settings (muito longo)
```

---

## 📝 CONVENTIONAL COMMITS

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova funcionalidade | `feat(auth): add password reset` |
| `fix` | Correção de bug | `fix(api): resolve timeout issue` |
| `docs` | Documentação | `docs(readme): update installation steps` |
| `style` | Formatação (sem mudança de código) | `style(css): format button styles` |
| `refactor` | Refatoração | `refactor(user): extract validation` |
| `test` | Testes | `test(auth): add login unit tests` |
| `chore` | Manutenção | `chore(deps): update lodash to 4.17.21` |
| `perf` | Performance | `perf(query): optimize user search` |
| `ci` | CI/CD | `ci(github): add deploy workflow` |
| `build` | Build system | `build(docker): update base image` |
| `revert` | Reverter commit | `revert: feat(auth): add password reset` |

### Exemplos Completos

```bash
# Simples
git commit -m "feat(user): add profile picture upload"

# Com corpo
git commit -m "fix(payment): resolve double charge issue

The payment was being processed twice due to a missing
idempotency check. Added UUID-based idempotency key.

Fixes #123"

# Breaking change
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API response now uses camelCase instead of snake_case"

# Com múltiplas referências
git commit -m "feat(auth): implement OAuth2 login

- Add Google OAuth provider
- Add GitHub OAuth provider
- Update user model with provider field

Closes #456, #457"
```

---

## 🔄 FLUXO DE TRABALHO DIÁRIO

### 1. Iniciar Nova Tarefa

```bash
# 1. Atualizar develop local
git checkout develop
git pull origin develop

# 2. Criar branch da tarefa
git checkout -b feature/TASK-123-descricao

# 3. Verificar que está na branch certa
git branch
```

### 2. Durante o Desenvolvimento

```bash
# Fazer commits frequentes e pequenos
git add arquivo.ts
git commit -m "feat(user): add validation function"

# Sincronizar com develop periodicamente (evita conflitos grandes)
git fetch origin
git rebase origin/develop

# Se houver conflitos
# 1. Resolver conflitos nos arquivos
# 2. git add <arquivos-resolvidos>
# 3. git rebase --continue
```

### 3. Preparar para PR

```bash
# 1. Garantir que está atualizado
git fetch origin
git rebase origin/develop

# 2. Rodar testes localmente
npm test  # ou equivalente

# 3. Rodar lint
npm run lint

# 4. Push da branch
git push origin feature/TASK-123-descricao

# Se já fez push antes e fez rebase, precisa forçar
git push origin feature/TASK-123-descricao --force-with-lease
```

### 4. Após Code Review

```bash
# Se precisar fazer ajustes
git add .
git commit -m "fix(user): address review comments"
git push origin feature/TASK-123-descricao

# Ou fazer squash dos commits de ajuste
git rebase -i HEAD~3  # últimos 3 commits
# Marcar commits de ajuste como "squash" ou "fixup"
git push origin feature/TASK-123-descricao --force-with-lease
```

---

## 🔀 MERGE vs REBASE

### Quando usar MERGE

```bash
# Para integrar develop na main (preserva histórico)
git checkout main
git merge develop

# Para branches compartilhadas
git merge feature/shared-feature
```

### Quando usar REBASE

```bash
# Para atualizar sua feature branch com develop
git checkout feature/minha-feature
git rebase develop

# Para limpar histórico antes de PR
git rebase -i HEAD~5  # squash/fixup commits
```

### Regra de Ouro

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║   NUNCA faça rebase de branches que outros estão usando!                      ║
║   SEMPRE faça rebase da sua feature branch antes do PR                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🚨 RESOLUÇÃO DE CONFLITOS

### Passo a Passo

```bash
# 1. Tentar rebase/merge
git rebase origin/develop

# 2. Git mostra arquivos com conflito
# CONFLICT (content): Merge conflict in src/user.ts

# 3. Abrir arquivo e encontrar marcadores
<<<<<<< HEAD
  código atual
=======
  código incoming
>>>>>>> feature/outra-branch

# 4. Resolver manualmente (escolher/combinar)

# 5. Marcar como resolvido
git add src/user.ts

# 6. Continuar rebase
git rebase --continue

# Se quiser abortar
git rebase --abort
```

### Ferramentas de Merge

```bash
# VS Code (recomendado)
# Abre automaticamente com botões: Accept Current | Accept Incoming | Accept Both

# Linha de comando
git mergetool

# Configurar ferramenta padrão
git config --global merge.tool vscode
```

---

## 📋 TEMPLATE DE PULL REQUEST

```markdown
## Descrição
[Descreva o que foi feito]

## Tipo de mudança
- [ ] 🆕 Nova feature
- [ ] 🐛 Bug fix
- [ ] 📝 Documentação
- [ ] ♻️ Refatoração
- [ ] 🧪 Testes
- [ ] 🔧 Configuração

## Tarefa relacionada
- Closes #[número]

## Como testar
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] BUGS_FIXED.md consultado
- [ ] IMPACT_ANALYSIS.md considerado
- [ ] Sem secrets/dados sensíveis

## Screenshots (se aplicável)
[Adicione screenshots]

## Notas adicionais
[Informações extras para o reviewer]
```

---

## ⚡ COMANDOS ÚTEIS

### Básicos do Dia a Dia

```bash
# Ver status
git status

# Ver histórico
git log --oneline -10

# Ver diferenças
git diff
git diff --staged

# Desfazer alterações não commitadas
git checkout -- arquivo.ts

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Desfazer último commit (remove alterações)
git reset --hard HEAD~1
```

### Stash (guardar alterações temporárias)

```bash
# Guardar
git stash
git stash -m "work in progress: user auth"

# Listar
git stash list

# Recuperar
git stash pop  # remove do stash
git stash apply  # mantém no stash

# Limpar
git stash drop
git stash clear
```

### Investigação

```bash
# Quem alterou cada linha
git blame arquivo.ts

# Buscar em commits
git log --grep="bug"
git log -S "função" # busca no código

# Ver alterações de um commit específico
git show abc1234

# Ver histórico de um arquivo
git log --follow -p arquivo.ts
```

### Limpeza

```bash
# Remover branches locais mergeadas
git branch --merged | grep -v "main\|develop" | xargs git branch -d

# Remover referências de branches remotas deletadas
git remote prune origin

# Limpar arquivos não rastreados
git clean -fd  # CUIDADO!
```

---

## 🔐 PROTEÇÕES DE BRANCH

### Configuração Recomendada (main)

```
✅ Require pull request reviews (1+)
✅ Dismiss stale pull request approvals
✅ Require status checks to pass
✅ Require branches to be up to date
✅ Include administrators
✅ Restrict who can push (only CI/CD)
```

### Configuração Recomendada (develop)

```
✅ Require pull request reviews (1+)
✅ Require status checks to pass
✅ Allow force pushes (maintainers only)
```

---

## 🚀 GITFLOW PARA RELEASES

### Feature → Develop → Main

```bash
# 1. Feature pronta → PR para develop
# 2. Testes em staging
# 3. Quando estável → PR develop para main
# 4. Deploy automático ou manual

# Criar tag de versão
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
```

### Hotfix

```bash
# 1. Criar branch de main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Corrigir
git commit -m "fix(payment): resolve critical bug"

# 3. PR para main E develop
# (para não perder o fix)
```

---

*Git é poderoso. Use com responsabilidade! 🌿*
