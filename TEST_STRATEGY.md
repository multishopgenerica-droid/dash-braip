# 🧪 TEST_STRATEGY.md - Sistema Dash Braip

> **ESTRATÉGIA DE TESTES - CONFIANÇA NO CÓDIGO**
> Código sem teste é código que vai quebrar.

---

## 🎯 FILOSOFIA DE TESTES

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   "Se não tem teste, não funciona. Você só não sabe ainda."                   ║
║                                                                               ║
║   PIRÂMIDE DE TESTES:                                                         ║
║                                                                               ║
║                    ╱╲                                                         ║
║                   ╱  ╲        E2E (poucos)                                    ║
║                  ╱────╲       - Fluxos críticos                               ║
║                 ╱      ╲                                                      ║
║                ╱────────╲     Integração (médio)                              ║
║               ╱          ╲    - APIs, DB                                      ║
║              ╱────────────╲                                                   ║
║             ╱              ╲   Unitários (muitos)                             ║
║            ╱────────────────╲  - Funções, classes                             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 METAS DE COBERTURA

### Por Tipo de Arquivo

| Tipo de Arquivo | Cobertura Mínima | Ideal |
|-----------------|------------------|-------|
| **Utils/Helpers** | 90% | 100% |
| **Services** | 80% | 95% |
| **Controllers** | 70% | 85% |
| **Repositories** | 70% | 85% |
| **Middlewares** | 80% | 90% |
| **Components (UI)** | 60% | 80% |
| **Hooks** | 75% | 90% |
| **Pages** | 50% | 70% |

### Por Criticidade

| Área | Cobertura Mínima | Justificativa |
|------|------------------|---------------|
| **Autenticação** | 90% | Segurança |
| **Pagamentos** | 95% | Financeiro |
| **Dados sensíveis** | 85% | LGPD/Compliance |
| **APIs públicas** | 80% | Contrato |
| **Lógica de negócio** | 85% | Core do sistema |

---

## 🔵 TESTES UNITÁRIOS

### Quando Usar
- Funções puras
- Validações
- Transformações de dados
- Cálculos
- Utils/Helpers

### Estrutura do Teste

```typescript
// arquivo.spec.ts ou arquivo.test.ts

describe('[NomeDoModulo]', () => {
  // Setup compartilhado
  beforeEach(() => {
    // Preparar ambiente
  });

  afterEach(() => {
    // Limpar mocks
    jest.clearAllMocks();
  });

  describe('[nomeDaFuncao]', () => {
    it('deve [comportamento esperado] quando [condição]', () => {
      // Arrange (Preparar)
      const input = 'valor';
      
      // Act (Executar)
      const result = funcao(input);
      
      // Assert (Verificar)
      expect(result).toBe('esperado');
    });

    it('deve lançar erro quando [condição de erro]', () => {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      expect(() => funcao(invalidInput)).toThrow('Mensagem de erro');
    });
  });
});
```

### Exemplo: Testando um Service

```typescript
// user.service.spec.ts

import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { NotFoundException } from '@/shared/exceptions';

// Mock do repository
jest.mock('./user.repository');

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = new UserRepository() as jest.Mocked<UserRepository>;
    service = new UserService(repository);
  });

  describe('findById', () => {
    it('deve retornar usuário quando encontrado', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'John', email: 'john@test.com' };
      repository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException quando não encontrado', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar usuário com dados válidos', async () => {
      // Arrange
      const dto = { name: 'John', email: 'john@test.com' };
      const mockCreated = { id: '1', ...dto };
      repository.create.mockResolvedValue(mockCreated);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toEqual(mockCreated);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });
  });
});
```

---

## 🟢 TESTES DE INTEGRAÇÃO

### Quando Usar
- Endpoints de API
- Queries ao banco
- Integrações externas
- Fluxos entre módulos

### Estrutura para API

```typescript
// user.integration.spec.ts

import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database';
import { createTestUser, generateAuthToken } from '@/tests/helpers';

describe('User API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup do banco de teste
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar dados entre testes
    await prisma.user.deleteMany();
    
    // Criar usuário de teste e gerar token
    const user = await createTestUser();
    authToken = generateAuthToken(user);
  });

  describe('GET /api/users', () => {
    it('deve retornar lista de usuários', async () => {
      // Arrange
      await createTestUser({ name: 'User 1' });
      await createTestUser({ name: 'User 2' });

      // Act
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 2 + 1 do beforeEach
    });

    it('deve retornar 401 sem autenticação', async () => {
      // Act
      const response = await request(app).get('/api/users');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('deve criar usuário com dados válidos', async () => {
      // Arrange
      const newUser = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.password).toBeUndefined(); // Não retornar senha
    });

    it('deve retornar 400 com email duplicado', async () => {
      // Arrange
      const existingUser = await createTestUser({ email: 'existing@test.com' });

      // Act
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another User',
          email: 'existing@test.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });
  });
});
```

---

## 🔴 TESTES E2E (End-to-End)

### Quando Usar
- Fluxos críticos de usuário
- Jornadas completas
- Regressão de features importantes

### Ferramentas Recomendadas
- **Playwright** (recomendado)
- Cypress
- Puppeteer

### Exemplo com Playwright

```typescript
// e2e/login.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Fluxo de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Arrange & Act
    await page.fill('[data-testid="email"]', 'user@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Arrange & Act
    await page.fill('[data-testid="email"]', 'wrong@test.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Credenciais inválidas'
    );
  });

  test('deve redirecionar para login quando não autenticado', async ({ page }) => {
    // Act
    await page.goto('/dashboard');

    // Assert
    await expect(page).toHaveURL('/login');
  });
});
```

### Fluxos Críticos para E2E

| Fluxo | Prioridade | Frequência |
|-------|------------|------------|
| Login/Logout | 🔴 Alta | Sempre |
| Cadastro de usuário | 🔴 Alta | Sempre |
| Fluxo de pagamento | 🔴 Alta | Sempre |
| CRUD principal | 🟡 Média | Semanal |
| Relatórios | 🟡 Média | Semanal |
| Configurações | 🟢 Baixa | Mensal |

---

## 🎨 TESTES DE COMPONENTES (Frontend)

### Com React Testing Library

```typescript
// Button.spec.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('deve renderizar com texto correto', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve estar desabilitado quando disabled=true', () => {
    // Arrange & Act
    render(<Button disabled>Click me</Button>);

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('deve mostrar loading quando isLoading=true', () => {
    // Arrange & Act
    render(<Button isLoading>Click me</Button>);

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Testando Hooks

```typescript
// useCounter.spec.ts

import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('deve iniciar com valor padrão', () => {
    // Arrange & Act
    const { result } = renderHook(() => useCounter());

    // Assert
    expect(result.current.count).toBe(0);
  });

  it('deve iniciar com valor customizado', () => {
    // Arrange & Act
    const { result } = renderHook(() => useCounter(10));

    // Assert
    expect(result.current.count).toBe(10);
  });

  it('deve incrementar o contador', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());

    // Act
    act(() => {
      result.current.increment();
    });

    // Assert
    expect(result.current.count).toBe(1);
  });

  it('deve decrementar o contador', () => {
    // Arrange
    const { result } = renderHook(() => useCounter(5));

    // Act
    act(() => {
      result.current.decrement();
    });

    // Assert
    expect(result.current.count).toBe(4);
  });
});
```

---

## 📋 CONVENÇÕES DE NOMENCLATURA

### Arquivos de Teste

```
src/
├── modules/
│   └── user/
│       ├── user.service.ts
│       ├── user.service.spec.ts      # Teste unitário
│       └── user.integration.spec.ts  # Teste integração
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.spec.tsx           # Teste componente
└── e2e/
    └── login.spec.ts                 # Teste E2E
```

### Nomenclatura de Testes

```typescript
// ✅ BOM - Descreve comportamento
it('deve retornar lista vazia quando não há usuários', () => {});
it('deve lançar erro quando email é inválido', () => {});
it('deve criar usuário com sucesso', () => {});

// ❌ RUIM - Não descreve comportamento
it('test 1', () => {});
it('works', () => {});
it('user', () => {});
```

---

## 🛠️ CONFIGURAÇÃO

### Jest (Backend)

```javascript
// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};
```

### Vitest (Frontend)

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 🚀 COMANDOS

```bash
# Rodar todos os testes
npm test

# Rodar com coverage
npm run test:coverage

# Rodar apenas unitários
npm run test:unit

# Rodar apenas integração
npm run test:integration

# Rodar E2E
npm run test:e2e

# Rodar em watch mode (desenvolvimento)
npm run test:watch

# Rodar testes de um arquivo específico
npm test -- user.service.spec.ts
```

---

## ✅ CHECKLIST DE TESTES

### Antes de Criar PR

- [ ] Todos os testes existentes passam
- [ ] Novos testes foram escritos para código novo
- [ ] Cobertura não diminuiu
- [ ] Testes de edge cases incluídos
- [ ] Testes de erro incluídos

### Para Código Crítico

- [ ] Testes unitários completos
- [ ] Testes de integração
- [ ] Pelo menos 1 teste E2E
- [ ] Testes de segurança (se aplicável)
- [ ] Testes de performance (se aplicável)

---

## 📊 MÉTRICAS E RELATÓRIOS

### Verificar Cobertura

```bash
# Gerar relatório
npm run test:coverage

# Abrir relatório HTML
open coverage/lcov-report/index.html
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:coverage
        
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage is below 70%: $COVERAGE%"
            exit 1
          fi
```

---

*Última atualização: 2026-01-26*
