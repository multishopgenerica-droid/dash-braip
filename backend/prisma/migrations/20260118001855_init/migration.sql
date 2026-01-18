-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "GatewayType" AS ENUM ('BRAIP', 'HOTMART', 'EDUZZ', 'KIWIFY', 'MONETIZZE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gateway" "GatewayType" NOT NULL,
    "apiToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "transKey" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "planKey" TEXT,
    "productName" TEXT NOT NULL,
    "planName" TEXT,
    "transValue" INTEGER NOT NULL,
    "transTotalValue" INTEGER NOT NULL,
    "transFreight" INTEGER,
    "transFreightType" TEXT,
    "transStatus" TEXT NOT NULL,
    "transStatusCode" INTEGER NOT NULL,
    "paymentType" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientDocument" TEXT,
    "clientAddress" TEXT,
    "clientCity" TEXT,
    "clientState" TEXT,
    "clientZipCode" TEXT,
    "hasOrderBump" BOOLEAN NOT NULL DEFAULT false,
    "trackingCode" TEXT,
    "shippingCompany" TEXT,
    "commissions" JSONB,
    "commissionsRelease" TIMESTAMP(3),
    "transCreateDate" TIMESTAMP(3) NOT NULL,
    "transUpdateDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planValue" INTEGER NOT NULL,
    "planAmount" INTEGER NOT NULL,
    "productKey" TEXT NOT NULL,
    "productType" INTEGER NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abandons" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "abandonKey" TEXT,
    "productKey" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "planKey" TEXT,
    "planName" TEXT,
    "planAmount" INTEGER,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "clientDocument" TEXT,
    "clientAddress" TEXT,
    "clientCity" TEXT,
    "clientState" TEXT,
    "clientZipCode" TEXT,
    "transCreateDate" TIMESTAMP(3) NOT NULL,
    "transUpdateDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abandons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "productHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalAbandons" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "subKey" TEXT NOT NULL,
    "subStatus" INTEGER NOT NULL,
    "nextCharge" TIMESTAMP(3),
    "nextAttempt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "approvedSales" INTEGER NOT NULL DEFAULT 0,
    "pendingSales" INTEGER NOT NULL DEFAULT 0,
    "canceledSales" INTEGER NOT NULL DEFAULT 0,
    "chargebacks" INTEGER NOT NULL DEFAULT 0,
    "refunds" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalAbandons" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_configs_userId_gateway_key" ON "gateway_configs"("userId", "gateway");

-- CreateIndex
CREATE INDEX "sales_transStatusCode_idx" ON "sales"("transStatusCode");

-- CreateIndex
CREATE INDEX "sales_transCreateDate_idx" ON "sales"("transCreateDate");

-- CreateIndex
CREATE INDEX "sales_productKey_idx" ON "sales"("productKey");

-- CreateIndex
CREATE UNIQUE INDEX "sales_gatewayConfigId_transKey_key" ON "sales"("gatewayConfigId", "transKey");

-- CreateIndex
CREATE INDEX "abandons_transCreateDate_idx" ON "abandons"("transCreateDate");

-- CreateIndex
CREATE INDEX "abandons_productKey_idx" ON "abandons"("productKey");

-- CreateIndex
CREATE UNIQUE INDEX "abandons_gatewayConfigId_abandonKey_key" ON "abandons"("gatewayConfigId", "abandonKey");

-- CreateIndex
CREATE UNIQUE INDEX "products_gatewayConfigId_productHash_key" ON "products"("gatewayConfigId", "productHash");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_gatewayConfigId_subKey_key" ON "subscriptions"("gatewayConfigId", "subKey");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_gatewayConfigId_date_key" ON "daily_metrics"("gatewayConfigId", "date");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_configs" ADD CONSTRAINT "gateway_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "gateway_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandons" ADD CONSTRAINT "abandons_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "gateway_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "gateway_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
