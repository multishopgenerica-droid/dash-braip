-- CreateEnum
CREATE TYPE "AiAnalysisType" AS ENUM ('SALES_TREND', 'PRODUCT_PERFORMANCE', 'CUSTOMER_BEHAVIOR', 'CONVERSION_OPTIMIZATION', 'ABANDONMENT_ANALYSIS', 'REVENUE_FORECAST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AiAnalysisType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "result" TEXT,
    "status" "AiAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analyses_userId_idx" ON "ai_analyses"("userId");

-- CreateIndex
CREATE INDEX "ai_analyses_type_idx" ON "ai_analyses"("type");

-- CreateIndex
CREATE INDEX "ai_analyses_status_idx" ON "ai_analyses"("status");
