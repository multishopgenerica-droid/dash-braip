import { AiAnalysis, AiAnalysisType, AiAnalysisStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { AppError } from '../../shared/middlewares/error.middleware';
import { CreateAiAnalysisDTO, UpdateAiAnalysisDTO, AiAnalysisQueryDTO } from './ai-analysis.dto';

export async function listAiAnalyses(
  userId: string,
  query: AiAnalysisQueryDTO
): Promise<PaginatedResult<AiAnalysis>> {
  const { skip, take, page } = getPaginationParams(query);

  const where: Prisma.AiAnalysisWhereInput = { userId };

  if (query.type) {
    where.type = query.type as AiAnalysisType;
  }

  if (query.status) {
    where.status = query.status as AiAnalysisStatus;
  }

  const [analyses, total] = await Promise.all([
    prisma.aiAnalysis.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiAnalysis.count({ where }),
  ]);

  return createPaginatedResult(analyses, total, page, take);
}

export async function getAiAnalysisById(
  userId: string,
  analysisId: string
): Promise<AiAnalysis> {
  const analysis = await prisma.aiAnalysis.findFirst({
    where: { id: analysisId, userId },
  });

  if (!analysis) {
    throw new AppError(404, 'Analise nao encontrada');
  }

  return analysis;
}

export async function createAiAnalysis(
  userId: string,
  data: CreateAiAnalysisDTO
): Promise<AiAnalysis> {
  const analysis = await prisma.aiAnalysis.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      type: data.type,
      prompt: data.prompt,
      metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : Prisma.JsonNull,
      status: AiAnalysisStatus.PENDING,
    },
  });

  return analysis;
}

export async function updateAiAnalysis(
  userId: string,
  analysisId: string,
  data: UpdateAiAnalysisDTO
): Promise<AiAnalysis> {
  const analysis = await prisma.aiAnalysis.findFirst({
    where: { id: analysisId, userId },
  });

  if (!analysis) {
    throw new AppError(404, 'Analise nao encontrada');
  }

  const updatedAnalysis = await prisma.aiAnalysis.update({
    where: { id: analysisId },
    data,
  });

  return updatedAnalysis;
}

export async function deleteAiAnalysis(
  userId: string,
  analysisId: string
): Promise<void> {
  const analysis = await prisma.aiAnalysis.findFirst({
    where: { id: analysisId, userId },
  });

  if (!analysis) {
    throw new AppError(404, 'Analise nao encontrada');
  }

  await prisma.aiAnalysis.delete({
    where: { id: analysisId },
  });
}

export async function processAiAnalysis(
  userId: string,
  analysisId: string
): Promise<AiAnalysis> {
  const analysis = await prisma.aiAnalysis.findFirst({
    where: { id: analysisId, userId },
  });

  if (!analysis) {
    throw new AppError(404, 'Analise nao encontrada');
  }

  // Update status to processing
  await prisma.aiAnalysis.update({
    where: { id: analysisId },
    data: { status: AiAnalysisStatus.PROCESSING },
  });

  try {
    // Here you would integrate with an AI service (OpenAI, Claude, etc.)
    // For now, we'll generate a placeholder response based on the type
    const result = await generateAnalysisResult(analysis, userId);

    const updatedAnalysis = await prisma.aiAnalysis.update({
      where: { id: analysisId },
      data: {
        result,
        status: AiAnalysisStatus.COMPLETED,
      },
    });

    return updatedAnalysis;
  } catch (error) {
    await prisma.aiAnalysis.update({
      where: { id: analysisId },
      data: { status: AiAnalysisStatus.FAILED },
    });
    throw error;
  }
}

async function generateAnalysisResult(
  analysis: AiAnalysis,
  userId: string
): Promise<string> {
  // Get relevant data based on analysis type
  const gatewayConfigs = await prisma.gatewayConfig.findMany({
    where: { userId },
    select: { id: true },
  });

  const gatewayIds = gatewayConfigs.map((g) => g.id);

  // Fetch metrics for context
  const [salesCount, approvedSales, abandonsCount, revenue] = await Promise.all([
    prisma.sale.count({
      where: { gatewayConfigId: { in: gatewayIds } },
    }),
    prisma.sale.count({
      where: { gatewayConfigId: { in: gatewayIds }, transStatusCode: 2 },
    }),
    prisma.abandon.count({
      where: { gatewayConfigId: { in: gatewayIds } },
    }),
    prisma.sale.aggregate({
      where: { gatewayConfigId: { in: gatewayIds }, transStatusCode: 2 },
      _sum: { transValue: true },
    }),
  ]);

  const totalRevenue = revenue._sum.transValue || 0;
  const conversionRate = salesCount > 0 ? ((approvedSales / salesCount) * 100).toFixed(2) : 0;

  // Generate analysis based on type
  const context = {
    totalSales: salesCount,
    approvedSales,
    abandons: abandonsCount,
    revenue: totalRevenue / 100,
    conversionRate,
    prompt: analysis.prompt,
    type: analysis.type,
  };

  // This is a placeholder - in production, you would call an AI API here
  const analysisTemplates: Record<string, string> = {
    SALES_TREND: `## Analise de Tendencia de Vendas

**Metricas Atuais:**
- Total de Vendas: ${context.totalSales}
- Vendas Aprovadas: ${context.approvedSales}
- Faturamento: R$ ${context.revenue.toLocaleString('pt-BR')}
- Taxa de Conversao: ${context.conversionRate}%

**Observacoes:**
${context.prompt}

**Recomendacoes:**
1. Monitorar padroes de vendas por horario
2. Identificar produtos com melhor performance
3. Analisar sazonalidade nas vendas`,

    PRODUCT_PERFORMANCE: `## Analise de Performance de Produtos

**Visao Geral:**
- Total de Vendas Registradas: ${context.totalSales}
- Taxa de Conversao Geral: ${context.conversionRate}%

**Analise Solicitada:**
${context.prompt}

**Pontos de Atencao:**
1. Identificar produtos com baixa conversao
2. Analisar ticket medio por produto
3. Verificar abandonos por produto`,

    CUSTOMER_BEHAVIOR: `## Analise de Comportamento do Cliente

**Dados Coletados:**
- Checkouts Iniciados: ${context.totalSales}
- Abandonos de Carrinho: ${context.abandons}
- Compras Concluidas: ${context.approvedSales}

**Contexto da Analise:**
${context.prompt}

**Insights:**
1. Analisar pontos de friccao no checkout
2. Identificar horarios de pico de abandono
3. Mapear jornada do cliente`,

    CONVERSION_OPTIMIZATION: `## Otimizacao de Conversao

**Funil Atual:**
- Taxa de Conversao: ${context.conversionRate}%
- Abandonos: ${context.abandons}

**Foco da Otimizacao:**
${context.prompt}

**Acoes Sugeridas:**
1. A/B testing em paginas de checkout
2. Simplificar formularios
3. Implementar retargeting`,

    ABANDONMENT_ANALYSIS: `## Analise de Abandonos

**Situacao Atual:**
- Total de Abandonos: ${context.abandons}
- Vendas Totais: ${context.totalSales}
- Taxa de Abandono: ${((context.abandons / (context.abandons + context.totalSales)) * 100).toFixed(2)}%

**Pergunta:**
${context.prompt}

**Estrategias de Recuperacao:**
1. Email de recuperacao automatico
2. Remarketing segmentado
3. Ofertas de urgencia`,

    REVENUE_FORECAST: `## Previsao de Faturamento

**Historico:**
- Faturamento Atual: R$ ${context.revenue.toLocaleString('pt-BR')}
- Ticket Medio: R$ ${context.approvedSales > 0 ? (context.revenue / context.approvedSales).toFixed(2) : 0}

**Parametros da Previsao:**
${context.prompt}

**Projecoes:**
- Manter crescimento atual
- Cenario otimista (+20%)
- Cenario conservador (-10%)`,

    CUSTOM: `## Analise Personalizada

**Solicitacao:**
${context.prompt}

**Dados Disponiveis:**
- Vendas: ${context.totalSales}
- Aprovadas: ${context.approvedSales}
- Abandonos: ${context.abandons}
- Faturamento: R$ ${context.revenue.toLocaleString('pt-BR')}
- Conversao: ${context.conversionRate}%

**Nota:** Para analises mais profundas, considere integrar com uma API de IA.`,
  };

  return analysisTemplates[analysis.type] || analysisTemplates.CUSTOM;
}
