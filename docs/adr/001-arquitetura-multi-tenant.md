# ADR-001: Arquitetura Multi-Tenant com Schema por Tenant

**Data:** 2024-01-15  
**Status:** Aceito  
**Decisores:** Tech Lead, DBA, Arquiteto

## Contexto

O sistema precisa suportar múltiplos clientes (tenants) com isolamento de dados, performance adequada e custos gerenciáveis.

## Decisão

Adotamos a estratégia de **Schema por Tenant** no PostgreSQL, onde cada tenant tem seu próprio schema dentro de um mesmo banco de dados.

```
Database: app_production
├── schema: tenant_abc
│   ├── users
│   ├── orders
│   └── products
├── schema: tenant_xyz
│   ├── users
│   ├── orders
│   └── products
└── schema: public
    └── tenants (registro de todos os tenants)
```

## Alternativas Consideradas

### Opção 1: Banco de dados por tenant
- **Prós:** Isolamento total, fácil backup individual
- **Contras:** Alto custo, difícil manutenção com muitos tenants

### Opção 2: Coluna tenant_id em todas as tabelas
- **Prós:** Simples, um único schema
- **Contras:** Risco de vazamento de dados, queries mais complexas

### Opção 3: Schema por tenant (ESCOLHIDA)
- **Prós:** Bom isolamento, custo moderado, fácil migração
- **Contras:** Limite de schemas (~10.000), connection pool compartilhado

## Consequências

### Positivas
- Isolamento de dados sem custo adicional de infraestrutura
- Facilidade para exportar/excluir dados de um tenant (LGPD)
- Migrations podem ser aplicadas a schemas específicos

### Negativas
- Necessidade de gerenciar schemas dinamicamente
- Connection pool compartilhado pode ser gargalo

### Riscos
- Bug no código pode expor dados entre tenants (mitigado com row-level security)

## Links Relacionados

- [PostgreSQL Schemas Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [PR #123: Implementação Multi-Tenant](https://github.com/org/repo/pull/123)
