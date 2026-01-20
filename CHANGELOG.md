# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.3.0] - 2026-01-20

### Adicionado
- **Módulo Financeiro Completo** - Sistema de gestão financeira para controle interno das operações
  - **Gastos**: CRUD completo para despesas gerais com categorias (Marketing, Operacional, Tecnologia, RH, Tráfego, Infraestrutura, Outros) e status (Pendente, Pago, Cancelado, Vencido)
  - **Funcionários**: Gestão de equipe com cargos, salários, bônus, benefícios e folha de pagamento
  - **Ferramentas**: Controle de assinaturas e softwares com custo mensal/anual e recorrência
  - **Tráfego**: Registro de gastos com anúncios por plataforma (Meta, Google, TikTok, etc.) com métricas de impressões, cliques, conversões e ROAS
  - **Dashboard Financeiro**: Visão macro da operação com faturamento, custos totais, lucro líquido, margem e breakdown por categoria
  - **Tendência Mensal**: Gráfico de evolução receita x custos nos últimos 6 meses

### Backend
- Novos models Prisma: `Expense`, `Employee`, `Tool`, `TrafficSpend`
- Novos enums: `ExpenseCategory`, `ExpenseStatus`, `RecurrenceType`, `EmployeeRole`, `EmployeeStatus`, `ToolCategory`, `TrafficPlatform`
- API completa em `/api/financial` com endpoints para CRUD e analytics
- Services com agregações para dashboard macro e tendências

### Frontend
- 5 novas páginas em `/financeiro`:
  - Visão Geral (dashboard)
  - Gastos (tabela com filtros)
  - Funcionários (tabela + resumo folha)
  - Ferramentas (cards)
  - Tráfego (tabela + métricas por plataforma)
- Sidebar atualizado com seção "Financeiro"
- Integração com sonner para notificações toast

---

## [1.2.0] - 2026-01-19

### Adicionado
- Integração com OpenAI para análise inteligente
- Módulo Telegram para notificações
- Módulo WhatsApp para automação
- Webhooks para recebimento de eventos

### Corrigido
- Sincronização de vendas do dia atual
- Detecção de datas pela IA

---

## [1.1.0] - 2026-01-18

### Adicionado
- Endpoint para listar todos os produtos (incluindo sem vendas)
- Métricas de receita pendente
- Página de relatórios com gráficos

### Melhorado
- Extração de datas pela IA com contexto do banco

---

## [1.0.0] - 2026-01-17

### Lançamento Inicial
- Dashboard principal com métricas de vendas
- Integração com Braip API
- Listagem de vendas com filtros
- Listagem de abandonos
- Gestão de gateways
- Autenticação JWT
- Interface moderna com dark mode
