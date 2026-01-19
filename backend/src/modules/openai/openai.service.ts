import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { SALE_STATUS } from '../../shared/constants/status-codes';

interface AnalysisResult {
  success: boolean;
  analysis?: string;
  tokensUsed?: number;
  error?: string;
}

interface DashboardContext {
  salesSummary: {
    today: { total: number; approved: number; revenue: number };
    yesterday: { total: number; approved: number; revenue: number };
    thisWeek: { total: number; approved: number; revenue: number };
    thisMonth: { total: number; approved: number; revenue: number };
  };
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  topAffiliates: Array<{ name: string; sales: number; commission: number }>;
  conversionRate: number;
  ticketMedio: number;
}

export class OpenAIService {
  private openai: OpenAI | null = null;

  private getClient(apiKey: string): OpenAI {
    return new OpenAI({ apiKey });
  }

  async getConfig(userId: string) {
    return prisma.openAIConfig.findUnique({
      where: { userId },
    });
  }

  async updateConfig(
    userId: string,
    data: {
      enabled?: boolean;
      apiKey?: string;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ) {
    return prisma.openAIConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  async testConnection(userId: string): Promise<{ connected: boolean; error?: string }> {
    const config = await this.getConfig(userId);

    if (!config || !config.apiKey) {
      return { connected: false, error: 'API key not configured' };
    }

    try {
      const client = this.getClient(config.apiKey);
      const response = await client.models.list();

      if (response.data && response.data.length > 0) {
        return { connected: true };
      }
      return { connected: false, error: 'No models available' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { connected: false, error: errorMessage };
    }
  }

  async getDashboardContext(userId: string): Promise<DashboardContext> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Helper to get period stats
    const getPeriodStats = async (start: Date, end: Date) => {
      const [total, approved, revenueData] = await Promise.all([
        prisma.sale.count({
          where: {
            gatewayConfig: { userId },
            transCreateDate: { gte: start, lte: end },
          },
        }),
        prisma.sale.count({
          where: {
            gatewayConfig: { userId },
            transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
            transCreateDate: { gte: start, lte: end },
          },
        }),
        prisma.sale.aggregate({
          where: {
            gatewayConfig: { userId },
            transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
            transCreateDate: { gte: start, lte: end },
          },
          _sum: { transTotalValue: true },
        }),
      ]);
      return {
        total,
        approved,
        revenue: revenueData._sum.transTotalValue || 0,
      };
    };

    // Get all period stats in parallel
    const [todayStats, yesterdayStats, weekStats, monthStats, topProducts, topAffiliates] = await Promise.all([
      getPeriodStats(todayStart, todayEnd),
      getPeriodStats(yesterdayStart, yesterdayEnd),
      getPeriodStats(weekStart, todayEnd),
      getPeriodStats(monthStart, todayEnd),
      prisma.sale.groupBy({
        by: ['productName'],
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: monthStart, lte: todayEnd },
        },
        _count: true,
        _sum: { transTotalValue: true },
        orderBy: { _count: { productName: 'desc' } },
        take: 5,
      }),
      Promise.resolve([]), // Simplified - affiliate grouping is complex
    ]);

    return {
      salesSummary: {
        today: todayStats,
        yesterday: yesterdayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
      },
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        sales: p._count,
        revenue: p._sum.transTotalValue || 0,
      })),
      topAffiliates: [], // Simplified - affiliate data would need more complex query
      conversionRate:
        monthStats.total > 0
          ? (monthStats.approved / monthStats.total) * 100
          : 0,
      ticketMedio:
        monthStats.approved > 0
          ? monthStats.revenue / monthStats.approved
          : 0,
    };
  }

  async analyzeData(
    userId: string,
    prompt: string,
    customContext?: string
  ): Promise<AnalysisResult> {
    const config = await this.getConfig(userId);

    if (!config || !config.apiKey || !config.enabled) {
      return { success: false, error: 'OpenAI not configured or disabled' };
    }

    try {
      const client = this.getClient(config.apiKey);

      // Get dashboard context
      const context = await this.getDashboardContext(userId);

      const systemPrompt = `Você é um assistente de análise de dados de vendas para um dashboard de e-commerce/infoprodutos.
Você tem acesso aos seguintes dados do negócio:

RESUMO DE VENDAS:
- Hoje: ${context.salesSummary.today.total} vendas (${context.salesSummary.today.approved} aprovadas), R$ ${(context.salesSummary.today.revenue / 100).toFixed(2)} faturamento
- Ontem: ${context.salesSummary.yesterday.total} vendas (${context.salesSummary.yesterday.approved} aprovadas), R$ ${(context.salesSummary.yesterday.revenue / 100).toFixed(2)} faturamento
- Esta semana: ${context.salesSummary.thisWeek.total} vendas (${context.salesSummary.thisWeek.approved} aprovadas), R$ ${(context.salesSummary.thisWeek.revenue / 100).toFixed(2)} faturamento
- Este mês: ${context.salesSummary.thisMonth.total} vendas (${context.salesSummary.thisMonth.approved} aprovadas), R$ ${(context.salesSummary.thisMonth.revenue / 100).toFixed(2)} faturamento

TOP PRODUTOS:
${context.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.sales} vendas, R$ ${(p.revenue / 100).toFixed(2)}`).join('\n')}

TOP AFILIADOS:
${context.topAffiliates.map((a, i) => `${i + 1}. ${a.name}: ${a.sales} vendas, R$ ${(a.commission / 100).toFixed(2)} comissão`).join('\n')}

MÉTRICAS:
- Taxa de conversão: ${context.conversionRate.toFixed(1)}%
- Ticket médio: R$ ${(context.ticketMedio / 100).toFixed(2)}

${customContext ? `CONTEXTO ADICIONAL:\n${customContext}\n` : ''}

Responda de forma clara e concisa, usando formatação Markdown quando apropriado.
Sempre que mencionar valores monetários, use o formato R$ X.XXX,XX.
Forneça insights acionáveis e recomendações quando relevante.`;

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
      });

      const tokensUsed = response.usage?.total_tokens || 0;

      // Update usage stats
      await prisma.openAIConfig.update({
        where: { userId },
        data: {
          totalTokensUsed: { increment: tokensUsed },
          totalRequests: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        success: true,
        analysis: response.choices[0]?.message?.content || 'Sem resposta',
        tokensUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OpenAI analysis error:', error);
      return { success: false, error: errorMessage };
    }
  }

  async processQueryForBot(userId: string, query: string): Promise<string> {
    const config = await this.getConfig(userId);

    if (!config || !config.apiKey || !config.enabled) {
      // Fallback to simple keyword-based responses
      return this.fallbackResponse(userId, query);
    }

    const result = await this.analyzeData(userId, query);

    if (result.success && result.analysis) {
      return result.analysis;
    }

    // If OpenAI fails, use fallback
    return this.fallbackResponse(userId, query);
  }

  private async fallbackResponse(userId: string, query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    const context = await this.getDashboardContext(userId);

    // Simple keyword matching for common queries
    if (lowerQuery.includes('hoje') || lowerQuery.includes('today')) {
      const today = context.salesSummary.today;
      return `📊 *Resumo de Hoje*\n\n` +
        `• Vendas: ${today.total}\n` +
        `• Aprovadas: ${today.approved}\n` +
        `• Faturamento: R$ ${(today.revenue / 100).toFixed(2).replace('.', ',')}`;
    }

    if (lowerQuery.includes('ontem') || lowerQuery.includes('yesterday')) {
      const yesterday = context.salesSummary.yesterday;
      return `📊 *Resumo de Ontem*\n\n` +
        `• Vendas: ${yesterday.total}\n` +
        `• Aprovadas: ${yesterday.approved}\n` +
        `• Faturamento: R$ ${(yesterday.revenue / 100).toFixed(2).replace('.', ',')}`;
    }

    if (lowerQuery.includes('semana') || lowerQuery.includes('week')) {
      const week = context.salesSummary.thisWeek;
      return `📊 *Resumo da Semana*\n\n` +
        `• Vendas: ${week.total}\n` +
        `• Aprovadas: ${week.approved}\n` +
        `• Faturamento: R$ ${(week.revenue / 100).toFixed(2).replace('.', ',')}`;
    }

    if (lowerQuery.includes('mês') || lowerQuery.includes('mes') || lowerQuery.includes('month')) {
      const month = context.salesSummary.thisMonth;
      return `📊 *Resumo do Mês*\n\n` +
        `• Vendas: ${month.total}\n` +
        `• Aprovadas: ${month.approved}\n` +
        `• Faturamento: R$ ${(month.revenue / 100).toFixed(2).replace('.', ',')}\n` +
        `• Taxa de conversão: ${context.conversionRate.toFixed(1)}%\n` +
        `• Ticket médio: R$ ${(context.ticketMedio / 100).toFixed(2).replace('.', ',')}`;
    }

    if (lowerQuery.includes('produto') || lowerQuery.includes('product')) {
      if (context.topProducts.length === 0) {
        return '📦 Nenhum produto com vendas no período.';
      }
      return `📦 *Top Produtos*\n\n` +
        context.topProducts.map((p, i) =>
          `${i + 1}. ${p.name}\n   ${p.sales} vendas - R$ ${(p.revenue / 100).toFixed(2).replace('.', ',')}`
        ).join('\n\n');
    }

    if (lowerQuery.includes('afiliado') || lowerQuery.includes('affiliate')) {
      if (context.topAffiliates.length === 0) {
        return '👥 Nenhum afiliado com vendas no período.';
      }
      return `👥 *Top Afiliados*\n\n` +
        context.topAffiliates.map((a, i) =>
          `${i + 1}. ${a.name}\n   ${a.sales} vendas - R$ ${(a.commission / 100).toFixed(2).replace('.', ',')} comissão`
        ).join('\n\n');
    }

    if (lowerQuery.includes('comparar') || lowerQuery.includes('compare') || lowerQuery.includes('comparativo')) {
      const today = context.salesSummary.today;
      const yesterday = context.salesSummary.yesterday;
      const diff = yesterday.revenue > 0
        ? ((today.revenue - yesterday.revenue) / yesterday.revenue * 100).toFixed(1)
        : 'N/A';
      return `📈 *Comparativo Hoje vs Ontem*\n\n` +
        `*Hoje:*\n` +
        `• Vendas: ${today.total} (${today.approved} aprovadas)\n` +
        `• Faturamento: R$ ${(today.revenue / 100).toFixed(2).replace('.', ',')}\n\n` +
        `*Ontem:*\n` +
        `• Vendas: ${yesterday.total} (${yesterday.approved} aprovadas)\n` +
        `• Faturamento: R$ ${(yesterday.revenue / 100).toFixed(2).replace('.', ',')}\n\n` +
        `*Variação:* ${diff}%`;
    }

    // Default response with summary
    const month = context.salesSummary.thisMonth;
    return `📊 *Resumo Geral*\n\n` +
      `*Este mês:*\n` +
      `• Vendas: ${month.total} (${month.approved} aprovadas)\n` +
      `• Faturamento: R$ ${(month.revenue / 100).toFixed(2).replace('.', ',')}\n` +
      `• Taxa de conversão: ${context.conversionRate.toFixed(1)}%\n\n` +
      `_Dica: Pergunte sobre "hoje", "ontem", "semana", "produtos", "afiliados" ou "comparativo"._`;
  }

  async getUsageStats(userId: string) {
    const config = await this.getConfig(userId);

    if (!config) {
      return {
        totalTokensUsed: 0,
        totalRequests: 0,
        lastUsedAt: null,
      };
    }

    return {
      totalTokensUsed: config.totalTokensUsed,
      totalRequests: config.totalRequests,
      lastUsedAt: config.lastUsedAt,
    };
  }
}

export const openAIService = new OpenAIService();
