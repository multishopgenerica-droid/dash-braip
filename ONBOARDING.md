# 👋 ONBOARDING.md - Guia Completo para Novos Desenvolvedores

> **Objetivo:** Tornar qualquer desenvolvedor produtivo em MENOS DE 1 DIA
> **Mantra:** "Não pergunte duas vezes a mesma coisa - documente!"

---

## 🎯 ROADMAP DE ONBOARDING

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║   DIA 1 - DE ZERO A PRODUTIVO                                                 ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   HORA 1-2: Setup do Ambiente                                                 ║
║   ├── Clonar repositório                                                      ║
║   ├── Instalar dependências                                                   ║
║   ├── Configurar .env                                                         ║
║   └── Rodar projeto localmente                                                ║
║                                                                               ║
║   HORA 3-4: Entender o Projeto                                                ║
║   ├── Ler CLAUDE.md (OBRIGATÓRIO!)                                            ║
║   ├── Ler SYSTEM_MAP.md                                                       ║
║   ├── Explorar estrutura de pastas                                            ║
║   └── Entender fluxos principais                                              ║
║                                                                               ║
║   HORA 5-6: Primeira Tarefa                                                   ║
║   ├── Verificar KANBAN.md                                                     ║
║   ├── Pegar tarefa simples (tag: good-first-issue)                            ║
║   ├── Seguir processo do CLAUDE.md                                            ║
║   └── Abrir primeiro PR                                                       ║
║                                                                               ║
║   HORA 7-8: Code Review e Merge                                               ║
║   ├── Receber feedback                                                        ║
║   ├── Fazer ajustes                                                           ║
║   └── 🎉 Primeiro merge!                                                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 CHECKLIST DE PRIMEIRO DIA

### 1. Acessos Necessários
- [ ] Git/GitHub/GitLab do projeto
- [ ] Ambiente de desenvolvimento (staging/dev)
- [ ] Banco de dados de desenvolvimento
- [ ] Slack/Discord do time
- [ ] Jira/Linear/Notion do projeto
- [ ] VPN (se necessário)
- [ ] Credenciais de API (se necessário)

### 2. Ferramentas Obrigatórias
- [ ] Git instalado e configurado
- [ ] Editor/IDE configurado (VS Code recomendado)
- [ ] Docker Desktop instalado
- [ ] Gerenciador de pacotes (npm/yarn/pip/etc)
- [ ] Cliente de banco (DBeaver, pgAdmin, etc)
- [ ] Postman/Insomnia para APIs
- [ ] Extensões do VS Code instaladas

### 3. Configuração Local
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] .env configurado
- [ ] Banco de dados rodando
- [ ] Projeto rodando localmente
- [ ] Testes passando

---

## 🔧 SETUP DO AMBIENTE

### Passo 1: Clonar o Repositório

```bash
# Via HTTPS
git clone https://github.com/SEU_USUARIO/PROJETO.git

# Via SSH (recomendado)
git clone git@github.com:SEU_USUARIO/PROJETO.git

# Entrar no diretório
cd PROJETO
```

### Passo 2: Configurar Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações locais
# IMPORTANTE: Nunca commitar o .env!
```

### Variáveis Comuns do .env
```env
# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=projeto_dev

# API
API_PORT=3000
API_URL=http://localhost:3000

# Auth
JWT_SECRET=dev-secret-change-in-prod
JWT_EXPIRES_IN=7d

# Externos (pedir ao time)
EXTERNAL_API_KEY=
```

### Passo 3: Instalar Dependências

```bash
# Node.js (npm)
npm install

# Node.js (yarn)
yarn install

# Node.js (pnpm)
pnpm install

# Python
pip install -r requirements.txt
# ou
poetry install

# PHP
composer install

# Go
go mod download

# Rust
cargo build

# Ruby
bundle install

# .NET
dotnet restore
```

### Passo 4: Subir Serviços

```bash
# Se usa Docker Compose
docker compose up -d

# Verificar se está rodando
docker compose ps

# Ver logs se tiver problema
docker compose logs -f
```

### Passo 5: Rodar o Projeto

```bash
# Node.js
npm run dev
# ou
yarn dev

# Python/Django
python manage.py runserver

# Python/FastAPI
uvicorn main:app --reload

# Go
go run main.go

# PHP/Laravel
php artisan serve

# .NET
dotnet run

# Ruby/Rails
rails server
```

### Passo 6: Verificar Funcionamento

```bash
# Testar se API está respondendo
curl http://localhost:3000/health

# Rodar testes
npm test
# ou
pytest
# ou
go test ./...
```

---

## 📚 DOCUMENTAÇÃO ESSENCIAL

### Ordem de Leitura (IMPORTANTE!)

| Ordem | Arquivo | Por que ler? |
|-------|---------|--------------|
| 1️⃣ | **CLAUDE.md** | Regras do projeto - OBRIGATÓRIO |
| 2️⃣ | **SYSTEM_MAP.md** | Visão geral da arquitetura |
| 3️⃣ | **ONBOARDING.md** | Este arquivo |
| 4️⃣ | **GIT_WORKFLOW.md** | Como trabalhar com Git |
| 5️⃣ | **BUGS_FIXED.md** | Bugs que não podem voltar |
| 6️⃣ | **ERROR_CATALOG.md** | Erros comuns e soluções |
| 7️⃣ | **KANBAN.md** | Tarefas disponíveis |

### O que NÃO fazer (Aprenda com erros dos outros!)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║   ❌ ERROS COMUNS DE NOVATOS - NÃO COMETA!                                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   1. Alterar código sem ler CLAUDE.md primeiro                                ║
║      → SEMPRE leia as regras antes de codar                                   ║
║                                                                               ║
║   2. Não consultar BUGS_FIXED.md antes de alterar arquivo                     ║
║      → Você pode reintroduzir bug já corrigido                                ║
║                                                                               ║
║   3. Fazer várias alterações em um único commit                               ║
║      → Commits devem ser atômicos (uma alteração por vez)                     ║
║                                                                               ║
║   4. Não rodar testes antes do commit                                         ║
║      → SEMPRE rode os testes localmente                                       ║
║                                                                               ║
║   5. Fazer push direto na main/master                                         ║
║      → SEMPRE trabalhe em branches                                            ║
║                                                                               ║
║   6. Não pedir review antes de mergear                                        ║
║      → Code review é OBRIGATÓRIO                                              ║
║                                                                               ║
║   7. Commitar .env ou secrets                                                 ║
║      → NUNCA commite dados sensíveis                                          ║
║                                                                               ║
║   8. Resolver conflitos sem entender o código                                 ║
║      → Se não entender, PERGUNTE                                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🏃 PRIMEIRA TAREFA

### Como Pegar uma Tarefa

1. Abra `KANBAN.md`
2. Procure tarefas com tag `good-first-issue` ou `starter`
3. Mova para "Em Progresso"
4. Atualize com seu nome

### Fluxo da Tarefa

```
1. Criar branch
   git checkout -b feature/TASK-XXX-descricao

2. Fazer análise de impacto
   → Preencher IMPACT_ANALYSIS.md mentalmente ou por escrito

3. Consultar BUGS_FIXED.md
   → Ctrl+F pelo arquivo que vai alterar

4. Implementar
   → Seguindo padrões do projeto

5. Testar localmente
   → npm test (ou equivalente)

6. Commit
   → git commit -m "feat(scope): descrição"

7. Push
   → git push origin feature/TASK-XXX-descricao

8. Abrir PR
   → Preencher template do PR

9. Aguardar review
   → Responder comentários

10. Merge!
    → 🎉
```

---

## 🆘 PROBLEMAS COMUNS

### Projeto não roda

```bash
# 1. Verificar se dependências estão instaladas
npm install  # ou equivalente

# 2. Verificar se .env está correto
cat .env

# 3. Verificar se Docker está rodando
docker ps

# 4. Verificar logs
docker compose logs -f

# 5. Consultar ERROR_CATALOG.md
# Ctrl+F pela mensagem de erro
```

### Banco não conecta

```bash
# 1. Verificar se container está rodando
docker ps | grep postgres  # ou mysql/mongo

# 2. Verificar variáveis de conexão no .env
# 3. Testar conexão manualmente
psql -h localhost -U postgres -d dbname

# 4. Verificar porta
netstat -an | grep 5432
```

### Testes falhando

```bash
# 1. Verificar se banco de teste existe
# 2. Rodar migrations de teste
# 3. Limpar cache de testes
# 4. Consultar ERROR_CATALOG.md
```

---

## 👥 CONTATOS

| Função | Quem | Quando procurar |
|--------|------|-----------------|
| Tech Lead | [Nome] | Dúvidas de arquitetura |
| Backend | [Nome] | Dúvidas de API/banco |
| Frontend | [Nome] | Dúvidas de UI/UX |
| DevOps | [Nome] | Problemas de infra |
| Mentor | [Nome] | Qualquer dúvida! |

---

## ✅ CHECKLIST FINAL

Antes de considerar o onboarding completo:

- [ ] Ambiente funcionando 100%
- [ ] Li CLAUDE.md completamente
- [ ] Li SYSTEM_MAP.md
- [ ] Entendi a estrutura do projeto
- [ ] Fiz pelo menos 1 PR
- [ ] Recebi feedback e ajustei
- [ ] Sei onde buscar ajuda
- [ ] Sei onde documentar dúvidas

---

## 🎓 PRÓXIMOS PASSOS

Após o primeiro dia:

1. **Semana 1:** Completar 3-5 tarefas simples
2. **Semana 2:** Pegar tarefa de complexidade média
3. **Semana 3:** Participar ativamente de code reviews
4. **Mês 1:** Ser capaz de fazer review para outros
5. **Mês 2:** Pegar tarefas complexas independentemente

---

*Bem-vindo ao time! Qualquer dúvida, pergunte. Melhor perguntar do que quebrar produção! 🚀*
