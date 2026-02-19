# 📋 TEMPLATES.md - Sistema Dash Braip

> **TEMPLATES DE CÓDIGO PADRONIZADO**
> Copiar, colar, adaptar. Não reinvente a roda.

---

## 🎯 OBJETIVO

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   CÓDIGO PADRONIZADO = MENOS ERROS = MAIS PRODUTIVIDADE                       ║
║                                                                               ║
║   • Todos os arquivos seguem o mesmo padrão                                   ║
║   • Novos devs entendem rapidamente                                           ║
║   • Code review mais rápido                                                   ║
║   • Menos bugs por inconsistência                                             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📁 ÍNDICE

| Tipo | Backend | Frontend |
|------|---------|----------|
| Controller | [Ver](#backend-controller) | - |
| Service | [Ver](#backend-service) | [Ver](#frontend-service) |
| Repository | [Ver](#backend-repository) | - |
| Entity/Model | [Ver](#backend-entity) | - |
| DTO | [Ver](#backend-dto) | - |
| Middleware | [Ver](#backend-middleware) | - |
| Component | - | [Ver](#frontend-component) |
| Hook | - | [Ver](#frontend-hook) |
| Context | - | [Ver](#frontend-context) |
| Page | - | [Ver](#frontend-page) |

---

## 🔧 BACKEND TEMPLATES

### Backend: Controller

```typescript
// src/modules/[module]/[module].controller.ts

import { Request, Response, NextFunction } from 'express';
import { [Module]Service } from './[module].service';
import { Create[Module]Dto, Update[Module]Dto } from './dto';
import { ApiResponse } from '@/shared/types';
import { HttpStatus } from '@/shared/constants';

export class [Module]Controller {
  constructor(private readonly service: [Module]Service) {}

  /**
   * Lista todos os registros
   * GET /api/[module]
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const result = await this.service.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });

      const response: ApiResponse = {
        success: true,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };

      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca por ID
   * GET /api/[module]/:id
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: '[Module] não encontrado',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria novo registro
   * POST /api/[module]
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: Create[Module]Dto = req.body;
      const result = await this.service.create(dto);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: result,
        message: '[Module] criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza registro
   * PUT /api/[module]/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: Update[Module]Dto = req.body;
      const result = await this.service.update(id, dto);

      return res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: '[Module] atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove registro (soft delete)
   * DELETE /api/[module]/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.service.delete(id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: '[Module] removido com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

### Backend: Service

```typescript
// src/modules/[module]/[module].service.ts

import { [Module]Repository } from './[module].repository';
import { Create[Module]Dto, Update[Module]Dto } from './dto';
import { [Module] } from './[module].entity';
import { PaginatedResult, PaginationParams } from '@/shared/types';
import { NotFoundException, BadRequestException } from '@/shared/exceptions';

export class [Module]Service {
  constructor(private readonly repository: [Module]Repository) {}

  /**
   * Lista com paginação
   */
  async findAll(params: PaginationParams): Promise<PaginatedResult<[Module]>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findMany({ skip, take: limit, search }),
      this.repository.count({ search }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca por ID
   */
  async findById(id: string): Promise<[Module] | null> {
    const entity = await this.repository.findById(id);
    
    if (!entity) {
      throw new NotFoundException('[Module] não encontrado');
    }
    
    return entity;
  }

  /**
   * Cria novo registro
   */
  async create(dto: Create[Module]Dto): Promise<[Module]> {
    // Validações de negócio
    await this.validateCreate(dto);
    
    return this.repository.create(dto);
  }

  /**
   * Atualiza registro
   */
  async update(id: string, dto: Update[Module]Dto): Promise<[Module]> {
    // Verifica se existe
    await this.findById(id);
    
    // Validações de negócio
    await this.validateUpdate(id, dto);
    
    return this.repository.update(id, dto);
  }

  /**
   * Remove registro (soft delete)
   */
  async delete(id: string): Promise<void> {
    // Verifica se existe
    await this.findById(id);
    
    // Validações de negócio
    await this.validateDelete(id);
    
    await this.repository.softDelete(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // VALIDAÇÕES PRIVADAS
  // ═══════════════════════════════════════════════════════════════

  private async validateCreate(dto: Create[Module]Dto): Promise<void> {
    // Implementar validações específicas
  }

  private async validateUpdate(id: string, dto: Update[Module]Dto): Promise<void> {
    // Implementar validações específicas
  }

  private async validateDelete(id: string): Promise<void> {
    // Verificar dependências antes de deletar
  }
}
```

---

### Backend: Repository

```typescript
// src/modules/[module]/[module].repository.ts

import { PrismaClient } from '@prisma/client';
import { Create[Module]Dto, Update[Module]Dto } from './dto';
import { [Module] } from './[module].entity';

export class [Module]Repository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<[Module][]> {
    const { skip, take, search } = params;

    return this.prisma.[module].findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            // Adicionar outros campos de busca
          ],
        }),
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(params: { search?: string }): Promise<number> {
    const { search } = params;

    return this.prisma.[module].count({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    });
  }

  async findById(id: string): Promise<[Module] | null> {
    return this.prisma.[module].findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Create[Module]Dto): Promise<[Module]> {
    return this.prisma.[module].create({ data });
  }

  async update(id: string, data: Update[Module]Dto): Promise<[Module]> {
    return this.prisma.[module].update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.[module].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

---

### Backend: Entity

```typescript
// src/modules/[module]/[module].entity.ts

export interface [Module] {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

---

### Backend: DTO

```typescript
// src/modules/[module]/dto/create-[module].dto.ts

import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class Create[Module]Dto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

// src/modules/[module]/dto/update-[module].dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { Create[Module]Dto } from './create-[module].dto';

export class Update[Module]Dto extends PartialType(Create[Module]Dto) {}
```

---

### Backend: Middleware

```typescript
// src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/shared/utils/jwt';
import { UnauthorizedException } from '@/shared/exceptions';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new UnauthorizedException('Token inválido ou expirado'));
  }
};
```

---

## 🎨 FRONTEND TEMPLATES

### Frontend: Component

```typescript
// src/components/[Component]/[Component].tsx

import { memo } from 'react';
import { cn } from '@/lib/utils';
import styles from './[Component].module.css';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface [Component]Props {
  /** Descrição da prop */
  title: string;
  /** Descrição da prop opcional */
  description?: string;
  /** Callback de ação */
  onAction?: () => void;
  /** Classes adicionais */
  className?: string;
  /** Filhos */
  children?: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

function [Component]Base({
  title,
  description,
  onAction,
  className,
  children,
}: [Component]Props) {
  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleClick = () => {
    onAction?.();
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className={cn(styles.container, className)}>
      <h2 className={styles.title}>{title}</h2>
      
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      
      {children}
      
      {onAction && (
        <button 
          type="button"
          onClick={handleClick}
          className={styles.button}
        >
          Ação
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const [Component] = memo([Component]Base);
[Component].displayName = '[Component]';
```

---

### Frontend: Hook

```typescript
// src/hooks/use[Hook].ts

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Use[Hook]Options {
  /** Executar automaticamente ao montar */
  autoFetch?: boolean;
  /** Dependências para re-executar */
  deps?: unknown[];
}

interface Use[Hook]Return<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function use[Hook]<T>(
  endpoint: string,
  options: Use[Hook]Options = {}
): Use[Hook]Return<T> {
  const { autoFetch = true, deps = [] } = options;

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ─────────────────────────────────────────────────────────────
  // FETCH FUNCTION
  // ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // ─────────────────────────────────────────────────────────────
  // RESET FUNCTION
  // ─────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData, ...deps]);

  // ─────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    reset,
  };
}
```

---

### Frontend: Context

```typescript
// src/contexts/[Context]Context.tsx

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface [Context]State {
  value: string;
  isLoading: boolean;
}

interface [Context]Actions {
  setValue: (value: string) => void;
  reset: () => void;
}

type [Context]ContextType = [Context]State & [Context]Actions;

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialState: [Context]State = {
  value: '',
  isLoading: false,
};

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const [Context]Context = createContext<[Context]ContextType | undefined>(
  undefined
);

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

interface [Context]ProviderProps {
  children: ReactNode;
}

export function [Context]Provider({ children }: [Context]ProviderProps) {
  const [state, setState] = useState<[Context]State>(initialState);

  // ─────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────

  const setValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, value }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // MEMOIZED VALUE
  // ─────────────────────────────────────────────────────────────

  const contextValue = useMemo(
    () => ({
      ...state,
      setValue,
      reset,
    }),
    [state, setValue, reset]
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <[Context]Context.Provider value={contextValue}>
      {children}
    </[Context]Context.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function use[Context]() {
  const context = useContext([Context]Context);

  if (context === undefined) {
    throw new Error('use[Context] must be used within a [Context]Provider');
  }

  return context;
}
```

---

### Frontend: Service

```typescript
// src/services/[module].service.ts

import { api } from './api';
import { [Module], Create[Module]Dto, Update[Module]Dto } from '@/types/[module]';
import { PaginatedResponse, ApiResponse } from '@/types/api';

const BASE_URL = '/api/[module]';

export const [module]Service = {
  /**
   * Lista com paginação
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<[Module]>> {
    const response = await api.get<PaginatedResponse<[Module]>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Busca por ID
   */
  async findById(id: string): Promise<[Module]> {
    const response = await api.get<ApiResponse<[Module]>>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Cria novo
   */
  async create(data: Create[Module]Dto): Promise<[Module]> {
    const response = await api.post<ApiResponse<[Module]>>(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Atualiza
   */
  async update(id: string, data: Update[Module]Dto): Promise<[Module]> {
    const response = await api.put<ApiResponse<[Module]>>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
```

---

### Frontend: Page

```typescript
// src/pages/[module]/index.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [module]Service } from '@/services/[module].service';
import { Layout } from '@/components/Layout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function [Module]Page() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  const { data, isLoading, error } = useQuery({
    queryKey: ['[module]', page, search],
    queryFn: () => [module]Service.findAll({ page, search }),
  });

  // ─────────────────────────────────────────────────────────────
  // MUTATIONS
  // ─────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: [module]Service.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[module]'] });
      toast.success('[Module] removido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover [module]');
    },
  });

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover?')) {
      deleteMutation.mutate(id);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (error) {
    return <div>Erro ao carregar dados</div>;
  }

  return (
    <Layout title="[Module]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">[Module]</h1>
          <Button href="/[module]/novo">Novo</Button>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />

        {/* Table */}
        <DataTable
          data={data?.data ?? []}
          isLoading={isLoading}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'createdAt', label: 'Criado em', format: 'date' },
          ]}
          actions={(row) => (
            <>
              <Button href={`/[module]/${row.id}`} variant="ghost" size="sm">
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.id)}
              >
                Excluir
              </Button>
            </>
          )}
        />

        {/* Pagination */}
        {data && (
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </Layout>
  );
}
```

---

## 📋 CHECKLIST DE USO

Ao criar novo arquivo:

- [ ] Copiar template apropriado
- [ ] Substituir [Module] pelo nome real
- [ ] Adaptar propriedades/campos
- [ ] Adicionar validações específicas
- [ ] Adicionar testes
- [ ] Atualizar DEPENDENCY_MAP.md

---

*Última atualização: 2026-01-26*
