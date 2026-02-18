-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MARKETING', 'OPERACIONAL', 'TECNOLOGIA', 'RECURSOS_HUMANOS', 'TRAFEGO', 'INFRAESTRUTURA', 'OUTROS');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('UNICO', 'DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('GESTOR_TRAFEGO', 'COPYWRITER', 'DESIGNER', 'SUPORTE', 'DESENVOLVEDOR', 'ADMINISTRATIVO', 'VENDEDOR', 'GERENTE', 'OUTROS');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO');

-- CreateEnum
CREATE TYPE "ToolCategory" AS ENUM ('AUTOMACAO', 'EMAIL_MARKETING', 'CRM', 'DESIGN', 'VIDEO', 'HOSPEDAGEM', 'ANALYTICS', 'COMUNICACAO', 'GESTAO_PROJETOS', 'PAGAMENTOS', 'OUTROS');

-- CreateEnum
CREATE TYPE "TrafficPlatform" AS ENUM ('META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS', 'YOUTUBE_ADS', 'NATIVE_ADS', 'PINTEREST_ADS', 'LINKEDIN_ADS', 'TWITTER_ADS', 'OUTROS');

-- AlterTable
ALTER TABLE "gateway_configs" ADD COLUMN     "webhookToken" TEXT;

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planAmount" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "affiliateHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "botToken" TEXT,
    "botUsername" TEXT,
    "webhookSecret" TEXT,
    "authorizedUsers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_chat_logs" (
    "id" TEXT NOT NULL,
    "telegramConfigId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "messageIn" TEXT NOT NULL,
    "messageOut" TEXT,
    "intent" TEXT,
    "queryData" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "openai_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "instanceName" TEXT,
    "evolutionApiUrl" TEXT,
    "evolutionApiKey" TEXT,
    "authorizedPhones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_chat_logs" (
    "id" TEXT NOT NULL,
    "whatsappConfigId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "messageIn" TEXT NOT NULL,
    "messageOut" TEXT,
    "intent" TEXT,
    "queryData" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'UNICO',
    "recurrenceEndDate" TIMESTAMP(3),
    "employeeId" TEXT,
    "toolId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "role" "EmployeeRole" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ATIVO',
    "salary" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "benefits" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "paymentDay" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ToolCategory" NOT NULL,
    "monthlyCost" INTEGER NOT NULL,
    "annualCost" INTEGER,
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'MENSAL',
    "billingDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_spends" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "TrafficPlatform" NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT,
    "campaignId" TEXT,
    "campaignName" TEXT,
    "adSetName" TEXT,
    "date" DATE NOT NULL,
    "spend" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,
    "cpa" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traffic_spends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plans_productId_idx" ON "plans"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_productId_planKey_key" ON "plans"("productId", "planKey");

-- CreateIndex
CREATE INDEX "affiliates_gatewayConfigId_idx" ON "affiliates"("gatewayConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_gatewayConfigId_affiliateHash_key" ON "affiliates"("gatewayConfigId", "affiliateHash");

-- CreateIndex
CREATE INDEX "webhook_logs_gatewayConfigId_idx" ON "webhook_logs"("gatewayConfigId");

-- CreateIndex
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_configs_userId_key" ON "telegram_configs"("userId");

-- CreateIndex
CREATE INDEX "telegram_chat_logs_telegramConfigId_idx" ON "telegram_chat_logs"("telegramConfigId");

-- CreateIndex
CREATE INDEX "telegram_chat_logs_chatId_idx" ON "telegram_chat_logs"("chatId");

-- CreateIndex
CREATE INDEX "telegram_chat_logs_createdAt_idx" ON "telegram_chat_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "openai_configs_userId_key" ON "openai_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_configs_userId_key" ON "whatsapp_configs"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_chat_logs_whatsappConfigId_idx" ON "whatsapp_chat_logs"("whatsappConfigId");

-- CreateIndex
CREATE INDEX "whatsapp_chat_logs_phoneNumber_idx" ON "whatsapp_chat_logs"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_chat_logs_createdAt_idx" ON "whatsapp_chat_logs"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_dueDate_idx" ON "expenses"("dueDate");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "tools_userId_idx" ON "tools"("userId");

-- CreateIndex
CREATE INDEX "tools_category_idx" ON "tools"("category");

-- CreateIndex
CREATE INDEX "tools_isActive_idx" ON "tools"("isActive");

-- CreateIndex
CREATE INDEX "traffic_spends_userId_idx" ON "traffic_spends"("userId");

-- CreateIndex
CREATE INDEX "traffic_spends_platform_idx" ON "traffic_spends"("platform");

-- CreateIndex
CREATE INDEX "traffic_spends_date_idx" ON "traffic_spends"("date");

-- CreateIndex
CREATE UNIQUE INDEX "traffic_spends_userId_platform_date_campaignId_key" ON "traffic_spends"("userId", "platform", "date", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_configs_webhookToken_key" ON "gateway_configs"("webhookToken");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "gateway_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "gateway_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_chat_logs" ADD CONSTRAINT "telegram_chat_logs_telegramConfigId_fkey" FOREIGN KEY ("telegramConfigId") REFERENCES "telegram_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_chat_logs" ADD CONSTRAINT "whatsapp_chat_logs_whatsappConfigId_fkey" FOREIGN KEY ("whatsappConfigId") REFERENCES "whatsapp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_spends" ADD CONSTRAINT "traffic_spends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

