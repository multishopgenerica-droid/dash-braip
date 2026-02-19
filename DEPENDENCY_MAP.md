# 🔗 DEPENDENCY_MAP.md - Sistema Dash Braip

> **CONSULTAR ANTES DE QUALQUER ALTERAÇÃO!**
> Este mapa mostra QUEM DEPENDE DE QUEM no projeto.

---

## 🎯 COMO USAR ESTE ARQUIVO

```
ANTES de alterar qualquer arquivo:
1. Buscar o arquivo aqui: Ctrl+F → "nome-do-arquivo"
2. Ver QUEM DEPENDE dele
3. Esses arquivos também serão AFETADOS pela mudança!
4. Testar TODOS os dependentes após a alteração
```

---

## 🔴 ARQUIVOS CRÍTICOS (MUITAS DEPENDÊNCIAS)

| Arquivo | Dependentes | Risco |
|---------|-------------|-------|
| - | - | 🔴 CRÍTICO |

> ⚠️ Arquivos com mais de 5 dependentes são CRÍTICOS
> Qualquer alteração requer revisão extra!

---

## 📁 MAPA DE DEPENDÊNCIAS DO BACKEND

### 🔧 Configuração & Core

```
📁 src/
├── config/
│   └── database.ts
│       └── DEPENDENTES:
│           ├── src/app.ts
│           ├── src/server.ts
│           └── [listar todos que importam]
│
├── middlewares/
│   └── auth.middleware.ts
│       └── DEPENDENTES:
│           ├── src/routes/*.ts
│           └── [listar todos que importam]
│
└── utils/
    └── helpers.ts
        └── DEPENDENTES:
            └── [listar todos que importam]
```

### 📦 Módulos

```
📁 src/modules/
├── auth/
│   ├── auth.controller.ts
│   │   └── DEPENDENTES: routes/auth.routes.ts
│   ├── auth.service.ts
│   │   └── DEPENDENTES: auth.controller.ts
│   └── auth.repository.ts
│       └── DEPENDENTES: auth.service.ts
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.repository.ts
│
└── [outros módulos...]
```

### 🗄️ Modelos/Entidades

```
📁 src/entities/ (ou models/ ou prisma/)
├── User.ts
│   └── DEPENDENTES:
│       ├── auth.service.ts
│       ├── users.service.ts
│       └── [todos que usam User]
│
├── [Model].ts
│   └── DEPENDENTES:
│       └── [listar]
```

---

## 🎨 MAPA DE DEPENDÊNCIAS DO FRONTEND

### 🧩 Componentes Compartilhados

```
📁 src/components/
├── ui/
│   ├── Button.tsx
│   │   └── USADO EM:
│   │       ├── pages/Login.tsx
│   │       ├── pages/Dashboard.tsx
│   │       └── [+X páginas]
│   │
│   ├── Input.tsx
│   │   └── USADO EM:
│   │       └── [listar]
│   │
│   └── Modal.tsx
│       └── USADO EM:
│           └── [listar]
│
├── layout/
│   ├── Header.tsx
│   │   └── USADO EM: App.tsx, Layout.tsx
│   └── Sidebar.tsx
│       └── USADO EM: Layout.tsx
```

### 🪝 Hooks Customizados

```
📁 src/hooks/
├── useAuth.ts
│   └── USADO EM:
│       ├── pages/Login.tsx
│       ├── components/PrivateRoute.tsx
│       └── [listar]
│
├── useApi.ts
│   └── USADO EM:
│       └── [listar]
```

### 🔌 Serviços/API

```
📁 src/services/
├── api.ts
│   └── USADO EM:
│       ├── services/auth.service.ts
│       ├── services/users.service.ts
│       └── [todos os services]
│
├── auth.service.ts
│   └── USADO EM:
│       ├── hooks/useAuth.ts
│       ├── pages/Login.tsx
│       └── [listar]
```

### 📄 Páginas

```
📁 src/pages/
├── Login.tsx
│   └── DEPENDE DE:
│       ├── components/ui/Button.tsx
│       ├── components/ui/Input.tsx
│       ├── hooks/useAuth.ts
│       └── services/auth.service.ts
│
├── Dashboard.tsx
│   └── DEPENDE DE:
│       └── [listar dependências]
```

---

## 🔄 DEPENDÊNCIAS CIRCULARES (EVITAR!)

| Arquivo A | Arquivo B | Status |
|-----------|-----------|--------|
| - | - | ⚠️ Circular |

> Dependências circulares causam problemas de build!
> Se encontrar, refatorar para quebrar o ciclo.

---

## 📊 ESTATÍSTICAS

| Métrica | Valor |
|---------|-------|
| Total de arquivos mapeados | - |
| Arquivos críticos (5+ deps) | - |
| Dependências circulares | 0 |
| Última atualização | 2026-01-26 |

---

## 🔧 COMO ATUALIZAR ESTE MAPA

```bash
# Backend - encontrar dependentes de um arquivo
grep -r "import.*arquivo" src/

# Frontend - encontrar onde componente é usado
grep -r "import.*Component" src/
grep -r "<Component" src/

# Gerar árvore de dependências (se tiver madge instalado)
npx madge --image graph.svg src/
```

---

## 📋 TEMPLATE PARA ADICIONAR NOVO ARQUIVO

```markdown
### arquivo.ts
- **Localização**: src/path/arquivo.ts
- **Tipo**: [Service/Controller/Component/Hook/Util]
- **Importa de**:
  - dependency1.ts
  - dependency2.ts
- **É importado por**:
  - dependent1.ts
  - dependent2.ts
- **Nível de risco**: [🟢 Baixo / 🟡 Médio / 🟠 Alto / 🔴 Crítico]
```

---

*Última atualização: 2026-01-26*
