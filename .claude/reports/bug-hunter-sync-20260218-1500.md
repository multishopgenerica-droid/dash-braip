# Bug Hunter Report - Modulo SYNC + GATEWAYS
**Data**: 2026-02-18
**Investigador**: Claude Opus 4.6 (Bug Hunter Forense)
**Modulos**: sync, gateways, analytics

---

## RESUMO EXECUTIVO

O dashboard NAO puxa dados de vendas da Braip por **3 bugs encadeados**. O bug raiz (BUG-SYNC-001) causa falha em cascata que impede tanto o sync automatico quanto o sync manual, e bloqueia TODAS as queries do analytics.

---

## BUG-SYNC-001: Migration pendente - coluna webhookToken e 12+ tabelas nao existem no banco

**SEVERIDADE**: P0 CRASH
**SINTOMA**: Todo acesso ao GatewayConfig falha com erro Prisma P2022: "The column gateway_configs.webhookToken does not exist in the current database"
**RAIZ**: O schema.prisma foi atualizado extensivamente apos a ultima migration (20260118005022_add_ai_analysis_model) mas NENHUMA nova migration foi criada com `prisma migrate dev`. O Prisma Client foi regenerado (`prisma generate`) e espera colunas/tabelas que nao existem no banco.

**ARQUIVO**: `/root/sistema-dash-braip/backend/prisma/schema.prisma`
**LINHA**: 60 (webhookToken no model GatewayConfig)

**PROBLEMA**: O schema.prisma define na linha 60:
```prisma
webhookToken String?     @unique @default(cuid())
```
Mas a tabela `gateway_configs` no banco de dados PostgreSQL NAO tem esta coluna. A init migration (20260118001855_init) criou a tabela SEM este campo.

**Colunas no banco REAL**:
```
id, userId, gateway, apiToken, isActive, lastSync, syncStatus, createdAt, updatedAt
```
**Colunas esperadas pelo Prisma Client**: todos os acima + `webhookToken`

**Tabelas FALTANDO no banco** (existem no schema.prisma mas nunca foram migradas):
- `plans` (referenciado por sync de planos)
- `affiliates` (referenciado por sync de afiliados)
- `webhook_logs` (referenciado pelo webhook controller)
- `telegram_configs`
- `telegram_chat_logs`
- `openai_configs`
- `whatsapp_configs`
- `whatsapp_chat_logs`
- `expenses`
- `employees`
- `tools`
- `traffic_spends`

**Enums FALTANDO**: `WebhookStatus`, `ExpenseCategory`, `ExpenseStatus`, `RecurrenceType`, `EmployeeRole`, `EmployeeStatus`, `ToolCategory`, `TrafficPlatform`

**FIX**:
```bash
# Dentro do container backend OU no host:
cd /root/sistema-dash-braip/backend
npx prisma migrate dev --name add_missing_tables_and_columns
# Isso vai gerar a migration SQL e aplica-la automaticamente.
# Depois rebuild o container:
docker service update --force dashboard_dashboard-backend
```

**IMPACTO**: Este bug bloqueia TUDO:
- syncAllActiveGateways() falha ao fazer findMany no GatewayConfig (P2022)
- analytics.service.ts falha em getAffiliateStats, getSalesBySource, getProductsWithPlans
- webhooks.controller.ts falha ao buscar por webhookToken
- sync.service.ts falha ao tentar inserir em affiliates/plans (tabelas inexistentes)
- Todo o modulo financial falha (tabelas nao existem)

**EVIDENCIA**:
```
docker service logs:
"prisma:error The column gateway_configs.webhookToken does not exist in the current database."
"Scheduled sync failed: PrismaClientKnownRequestError: ... code: 'P2022', column: 'gateway_configs.webhookToken'"
```

---

## BUG-SYNC-002: Endpoint triggerSync nao executa o sync real

**SEVERIDADE**: P1 FUNCIONALIDADE
**SINTOMA**: POST /api/gateways/:id/sync retorna sucesso mas NAO sincroniza nada
**RAIZ**: O handler `triggerSync` no controller e um stub que apenas retorna uma mensagem de sucesso sem nunca chamar `syncGateway()`.

**ARQUIVO**: `/root/sistema-dash-braip/backend/src/modules/gateways/gateways.controller.ts`
**LINHA**: 140-155

**PROBLEMA**:
```typescript
export async function triggerSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // This will be handled by the sync module
    // For now, just return a message       <-- STUB! Nunca implementado.
    res.json({
      success: true,
      message: GATEWAY_MESSAGES.SYNC_STARTED,
    });
  } catch (error) {
    next(error);
  }
}
```

**FIX**:
```typescript
import { syncGateway } from '../sync/sync.service';

export async function triggerSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.params.id;
    
    // Verify gateway belongs to user
    const gateway = await gatewaysService.getGatewayById(req.user!.id, gatewayId);
    
    // Start sync in background (don't await)
    syncGateway(gateway.id).catch((error) => {
      console.error(`Background sync failed for gateway ${gateway.id}:`, error);
    });
    
    res.json({
      success: true,
      message: GATEWAY_MESSAGES.SYNC_STARTED,
    });
  } catch (error) {
    next(error);
  }
}
```

**IMPACTO**: Mesmo que o BUG-001 seja corrigido, o usuario nao consegue disparar um sync manual pelo dashboard. Apenas o cron (a cada 5 min) funciona.

**DEPENDENCIA**: Corrigir BUG-001 ANTES, caso contrario o sync vai falhar no banco.

---

## BUG-SYNC-003: Nenhum gateway configurado no banco de dados

**SEVERIDADE**: P1 FUNCIONALIDADE
**SINTOMA**: Mesmo com o scheduler rodando a cada 5 minutos, nao ha dados de vendas
**RAIZ**: A tabela `gateway_configs` tem 0 registros. O seed.ts cria apenas o usuario admin, mas nao configura nenhum gateway Braip. Sem gateway, syncAllActiveGateways() nao tem nada para sincronizar.

**ARQUIVO**: `/root/sistema-dash-braip/backend/prisma/seed.ts`
**LINHA**: 6-28

**PROBLEMA**: O seed apenas cria o usuario admin. Nao ha nenhum gateway configurado, e o dashboard depende de um gateway Braip ativo para buscar vendas.

**FIX**: O usuario precisa configurar o gateway via API ou interface:
```bash
# Via API (apos corrigir BUG-001):
curl -X POST https://api-dash.utmia.com.br/api/gateways \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gateway": "BRAIP", "apiToken": "<TOKEN_DA_BRAIP>"}'
```

**IMPACTO**: Sem gateway, o cron scheduler roda mas nao faz nada (findMany where isActive:true retorna array vazio).

**DEPENDENCIA**: Corrigir BUG-001 ANTES. Atualmente, mesmo se o usuario tentasse criar o gateway via API, a query falharia porque Prisma tenta selecionar webhookToken que nao existe.

---

## ORDEM DE CORRECAO

1. **BUG-SYNC-001** (P0): Gerar e aplicar migration Prisma
2. **BUG-SYNC-003** (P1): Configurar gateway Braip (precisa de token API valido)
3. **BUG-SYNC-002** (P1): Implementar triggerSync real no controller

---

## VERIFICACOES ADICIONAIS

### Credenciais (sem expor valores)
- `BRAIP_PROXY_URL`: [CONFIGURADO]
- `DATABASE_URL`: [CONFIGURADO]
- `ENCRYPTION_KEY`: [CONFIGURADO]

### Scheduler
- O cron scheduler ESTA ativo (confirmado nos logs: "Sync scheduler started (every 5 minutes)")
- Executa a cada 5 minutos mas FALHA com PrismaClientKnownRequestError P2022

### Proxy
- O BRAIP_PROXY_URL esta configurado mas nao pode ser testado ate o BUG-001 ser resolvido

### Erros de PostgreSQL
- Multiplos erros "terminating connection due to administrator command" (SqlState E57P01) indicam que o PostgreSQL teve restart/maintenance recente, o que derrubou conexoes do Prisma connection pool. Isso e um sintoma secundario.

---

## NOTAS TECNICAS

- Prisma `migrate status` reporta "Database schema is up to date!" porque as 2 migrations existentes FORAM aplicadas. Porem, o schema.prisma evoluiu significativamente apos a ultima migration SEM gerar novas migrations.
- O `prisma generate` (que gera o Prisma Client) usa o schema.prisma como fonte de verdade. O runtime JS gerado espera TODAS as colunas e tabelas do schema, mesmo que nao existam no banco.
- Este tipo de drift acontece quando alguem roda `prisma generate` sem `prisma migrate dev`.
