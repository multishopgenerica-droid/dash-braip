import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { SALE_STATUS } from '../../shared/constants/status-codes';

interface AnalysisResult {
  success: boolean;
  analysis?: string;
  tokensUsed?: number;
  error?: string;
}

interface PeriodStats {
  total: number;
  approved: number;
  pending: number;
  canceled: number;
  revenue: number;
}

interface DailySale {
  date: string;
  total: number;
  approved: number;
  revenue: number;
}

interface ProductSale {
  name: string;
  sales: number;
  revenue: number;
}

interface ExtractedDates {
  startDate: Date | null;
  endDate: Date | null;
}

interface DayOfWeekStats {
  dayName: string;
  dayNumber: number;
  totalSales: number;
  approvedSales: number;
  revenue: number;
}

interface FullContext {
  requestedPeriod: {
    startDate: string;
    endDate: string;
    stats: PeriodStats;
    dailySales: DailySale[];
  };
  comparison: {
    today: PeriodStats;
    yesterday: PeriodStats;
    thisWeek: PeriodStats;
    thisMonth: PeriodStats;
  };
  topProducts: ProductSale[];
  conversionRate: number;
  ticketMedio: number;
  dayOfWeekPatterns: DayOfWeekStats[];
  bestDay: string;
  worstDay: string;
}

export class OpenAIService {
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

  // Extract dates from user query
  private extractDatesFromQuery(query: string): ExtractedDates {
    const result: ExtractedDates = { startDate: null, endDate: null };

    console.log('[OpenAI] extractDatesFromQuery - Input:', query);

    // Normalize query
    const normalizedQuery = query.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    console.log('[OpenAI] Normalized query:', normalizedQuery);

    // Pattern: DD/MM/YYYY or DD-MM-YYYY
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
    const matches = [...normalizedQuery.matchAll(datePattern)];

    console.log('[OpenAI] Date matches found:', matches.length, matches.map(m => m[0]));

    if (matches.length >= 1) {
      const [, day1, month1, year1] = matches[0];
      result.startDate = new Date(parseInt(year1), parseInt(month1) - 1, parseInt(day1), 0, 0, 0);
      console.log('[OpenAI] Start date parsed:', result.startDate.toISOString());
    }

    if (matches.length >= 2) {
      const [, day2, month2, year2] = matches[1];
      result.endDate = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2), 23, 59, 59);
      console.log('[OpenAI] End date parsed:', result.endDate.toISOString());
    } else if (result.startDate) {
      // If only one date, check for keywords
      if (normalizedQuery.includes('ate') || normalizedQuery.includes('até') ||
          normalizedQuery.includes('a ') || normalizedQuery.includes('hoje')) {
        result.endDate = new Date();
        result.endDate.setHours(23, 59, 59);
      } else {
        // Single date = same day
        result.endDate = new Date(result.startDate);
        result.endDate.setHours(23, 59, 59);
      }
    }

    // Handle relative dates
    const now = new Date();

    if (!result.startDate && !result.endDate) {
      // Check for relative period keywords
      if (normalizedQuery.includes('ultimos 7 dias') || normalizedQuery.includes('ultima semana')) {
        result.startDate = new Date(now);
        result.startDate.setDate(result.startDate.getDate() - 7);
        result.startDate.setHours(0, 0, 0, 0);
        result.endDate = new Date(now);
        result.endDate.setHours(23, 59, 59);
      } else if (normalizedQuery.includes('ultimos 30 dias') || normalizedQuery.includes('ultimo mes')) {
        result.startDate = new Date(now);
        result.startDate.setDate(result.startDate.getDate() - 30);
        result.startDate.setHours(0, 0, 0, 0);
        result.endDate = new Date(now);
        result.endDate.setHours(23, 59, 59);
      } else if (normalizedQuery.includes('este mes') || normalizedQuery.includes('mes atual')) {
        result.startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        result.endDate = new Date(now);
        result.endDate.setHours(23, 59, 59);
      } else if (normalizedQuery.includes('janeiro')) {
        result.startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        result.endDate = new Date(now.getFullYear(), 0, 31, 23, 59, 59);
      }
    }

    console.log('[OpenAI] Final extracted dates:', {
      startDate: result.startDate?.toISOString() || 'null',
      endDate: result.endDate?.toISOString() || 'null',
    });

    return result;
  }

  // Get period stats from database
  private async getPeriodStats(userId: string, startDate: Date, endDate: Date): Promise<PeriodStats> {
    const [total, approved, pending, canceled, revenueData] = await Promise.all([
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
          transCreateDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.CANCELADA,
          transCreateDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: startDate, lte: endDate },
        },
        _sum: { transTotalValue: true },
      }),
    ]);

    return {
      total,
      approved,
      pending,
      canceled,
      revenue: revenueData._sum.transTotalValue || 0,
    };
  }

  // Get daily sales breakdown
  private async getDailySales(userId: string, startDate: Date, endDate: Date): Promise<DailySale[]> {
    const sales = await prisma.sale.findMany({
      where: {
        gatewayConfig: { userId },
        transCreateDate: { gte: startDate, lte: endDate },
      },
      select: {
        transCreateDate: true,
        transStatusCode: true,
        transTotalValue: true,
      },
      orderBy: { transCreateDate: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { total: number; approved: number; revenue: number }> = {};

    for (const sale of sales) {
      const dateKey = sale.transCreateDate.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, approved: 0, revenue: 0 };
      }
      grouped[dateKey].total++;
      if (sale.transStatusCode === SALE_STATUS.PAGAMENTO_APROVADO) {
        grouped[dateKey].approved++;
        grouped[dateKey].revenue += sale.transTotalValue;
      }
    }

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get top products for period
  private async getTopProducts(userId: string, startDate: Date, endDate: Date): Promise<ProductSale[]> {
    const products = await prisma.sale.groupBy({
      by: ['productName'],
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: startDate, lte: endDate },
      },
      _count: true,
      _sum: { transTotalValue: true },
      orderBy: { _count: { productName: 'desc' } },
      take: 10,
    });

    return products.map((p) => ({
      name: p.productName,
      sales: p._count,
      revenue: p._sum.transTotalValue || 0,
    }));
  }

  // Calculate day of week patterns
  private calculateDayOfWeekPatterns(dailySales: DailySale[]): DayOfWeekStats[] {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const patterns: DayOfWeekStats[] = dayNames.map((name, index) => ({
      dayName: name,
      dayNumber: index,
      totalSales: 0,
      approvedSales: 0,
      revenue: 0,
    }));

    for (const sale of dailySales) {
      const date = new Date(sale.date);
      const dayOfWeek = date.getDay();
      patterns[dayOfWeek].totalSales += sale.total;
      patterns[dayOfWeek].approvedSales += sale.approved;
      patterns[dayOfWeek].revenue += sale.revenue;
    }

    return patterns;
  }

  // Build full context for AI
  private async buildFullContext(userId: string, query: string): Promise<FullContext> {
    const now = new Date();
    const extractedDates = this.extractDatesFromQuery(query);

    // Default to current month if no dates extracted
    const startDate = extractedDates.startDate || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endDate = extractedDates.endDate || new Date(now);
    endDate.setHours(23, 59, 59);

    // Calculate comparison periods
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Fetch all data in parallel
    const [
      requestedStats,
      dailySales,
      topProducts,
      todayStats,
      yesterdayStats,
      weekStats,
      monthStats,
    ] = await Promise.all([
      this.getPeriodStats(userId, startDate, endDate),
      this.getDailySales(userId, startDate, endDate),
      this.getTopProducts(userId, startDate, endDate),
      this.getPeriodStats(userId, todayStart, todayEnd),
      this.getPeriodStats(userId, yesterdayStart, yesterdayEnd),
      this.getPeriodStats(userId, weekStart, todayEnd),
      this.getPeriodStats(userId, monthStart, todayEnd),
    ]);

    const conversionRate = requestedStats.total > 0
      ? (requestedStats.approved / requestedStats.total) * 100
      : 0;

    const ticketMedio = requestedStats.approved > 0
      ? requestedStats.revenue / requestedStats.approved
      : 0;

    // Calculate day of week patterns
    const dayOfWeekPatterns = this.calculateDayOfWeekPatterns(dailySales);

    // Find best and worst days
    const sortedByApproved = [...dayOfWeekPatterns].sort((a, b) => b.approvedSales - a.approvedSales);
    const bestDay = sortedByApproved[0]?.dayName || 'N/A';
    const worstDay = sortedByApproved[sortedByApproved.length - 1]?.dayName || 'N/A';

    return {
      requestedPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        stats: requestedStats,
        dailySales,
      },
      comparison: {
        today: todayStats,
        yesterday: yesterdayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
      },
      topProducts,
      conversionRate,
      ticketMedio,
      dayOfWeekPatterns,
      bestDay,
      worstDay,
    };
  }

  // Format currency
  private formatCurrency(value: number): string {
    return `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Format date
  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  async analyzeData(
    userId: string,
    prompt: string,
    customContext?: string
  ): Promise<AnalysisResult> {
    console.log('[OpenAI] ========== analyzeData CALLED ==========');
    console.log('[OpenAI] userId:', userId);
    console.log('[OpenAI] prompt:', prompt);

    const config = await this.getConfig(userId);
    console.log('[OpenAI] config found:', !!config, 'enabled:', config?.enabled, 'hasKey:', !!config?.apiKey);

    if (!config || !config.apiKey || !config.enabled) {
      console.log('[OpenAI] Returning error - not configured or disabled');
      return { success: false, error: 'OpenAI not configured or disabled' };
    }

    try {
      const client = this.getClient(config.apiKey);

      // Build comprehensive context from database
      const context = await this.buildFullContext(userId, prompt);

      console.log('OpenAI Context:', JSON.stringify({
        requestedPeriod: context.requestedPeriod.startDate + ' to ' + context.requestedPeriod.endDate,
        totalSales: context.requestedPeriod.stats.total,
        approvedSales: context.requestedPeriod.stats.approved,
        revenue: context.requestedPeriod.stats.revenue,
        dailySalesCount: context.requestedPeriod.dailySales.length,
      }));

      // Build detailed daily sales string
      const dailySalesText = context.requestedPeriod.dailySales.length > 0
        ? context.requestedPeriod.dailySales
            .map(d => `  - ${this.formatDate(d.date)}: ${d.total} vendas (${d.approved} aprovadas), ${this.formatCurrency(d.revenue)}`)
            .join('\n')
        : '  Nenhuma venda no período.';

      // Build top products string
      const topProductsText = context.topProducts.length > 0
        ? context.topProducts
            .map((p, i) => `  ${i + 1}. ${p.name}: ${p.sales} vendas, ${this.formatCurrency(p.revenue)}`)
            .join('\n')
        : '  Nenhum produto vendido no período.';

      // Build day of week patterns string
      const dayOfWeekText = context.dayOfWeekPatterns
        .map(d => `  • ${d.dayName}: ${d.totalSales} vendas (${d.approvedSales} aprovadas), ${this.formatCurrency(d.revenue)}`)
        .join('\n');

      const systemPrompt = `Você é um assistente de análise de dados de vendas especializado.
Você tem acesso aos dados REAIS do banco de dados do usuário.
IMPORTANTE: Use SOMENTE os dados fornecidos abaixo para responder. NÃO invente números.

═══════════════════════════════════════════════════════════════
📊 DADOS DO PERÍODO SOLICITADO: ${this.formatDate(context.requestedPeriod.startDate)} até ${this.formatDate(context.requestedPeriod.endDate)}
═══════════════════════════════════════════════════════════════

📈 RESUMO DO PERÍODO:
  • Total de vendas: ${context.requestedPeriod.stats.total}
  • Vendas aprovadas: ${context.requestedPeriod.stats.approved}
  • Vendas pendentes: ${context.requestedPeriod.stats.pending}
  • Vendas canceladas: ${context.requestedPeriod.stats.canceled}
  • Faturamento total: ${this.formatCurrency(context.requestedPeriod.stats.revenue)}
  • Taxa de conversão: ${context.conversionRate.toFixed(1)}%
  • Ticket médio: ${this.formatCurrency(context.ticketMedio)}

📅 VENDAS DIÁRIAS (${context.requestedPeriod.dailySales.length} dias com vendas):
${dailySalesText}

🏆 TOP PRODUTOS DO PERÍODO:
${topProductsText}

📆 PADRÃO POR DIA DA SEMANA (acumulado do período):
${dayOfWeekText}

  🏆 Melhor dia: ${context.bestDay}
  ⚠️ Pior dia: ${context.worstDay}

═══════════════════════════════════════════════════════════════
📊 DADOS COMPARATIVOS
═══════════════════════════════════════════════════════════════

📆 HOJE:
  • Vendas: ${context.comparison.today.total} (${context.comparison.today.approved} aprovadas)
  • Faturamento: ${this.formatCurrency(context.comparison.today.revenue)}

📆 ONTEM:
  • Vendas: ${context.comparison.yesterday.total} (${context.comparison.yesterday.approved} aprovadas)
  • Faturamento: ${this.formatCurrency(context.comparison.yesterday.revenue)}

📆 ÚLTIMOS 7 DIAS:
  • Vendas: ${context.comparison.thisWeek.total} (${context.comparison.thisWeek.approved} aprovadas)
  • Faturamento: ${this.formatCurrency(context.comparison.thisWeek.revenue)}

📆 ESTE MÊS:
  • Vendas: ${context.comparison.thisMonth.total} (${context.comparison.thisMonth.approved} aprovadas)
  • Faturamento: ${this.formatCurrency(context.comparison.thisMonth.revenue)}

${customContext ? `\n═══════════════════════════════════════════════════════════════\n📝 CONTEXTO ADICIONAL:\n${customContext}\n` : ''}

═══════════════════════════════════════════════════════════════
INSTRUÇÕES:
═══════════════════════════════════════════════════════════════
1. Responda APENAS com base nos dados acima
2. Se não houver dados, informe que não há vendas no período
3. Use valores monetários no formato R$ X.XXX,XX
4. Seja preciso com os números - não arredonde a menos que faça sentido
5. Forneça insights e análises quando apropriado
6. Use formatação markdown para melhor legibilidade`;

      const response = await client.chat.completions.create({
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: config.maxTokens || 1500,
        temperature: config.temperature || 0.3, // Lower temperature for more factual responses
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
      return this.fallbackResponse(userId, query);
    }

    const result = await this.analyzeData(userId, query);

    if (result.success && result.analysis) {
      return result.analysis;
    }

    return this.fallbackResponse(userId, query);
  }

  private async fallbackResponse(userId: string, query: string): Promise<string> {
    const context = await this.buildFullContext(userId, query);
    const stats = context.requestedPeriod.stats;

    return `📊 *Dados do Período*
${this.formatDate(context.requestedPeriod.startDate)} até ${this.formatDate(context.requestedPeriod.endDate)}

• Total de vendas: ${stats.total}
• Aprovadas: ${stats.approved}
• Pendentes: ${stats.pending}
• Canceladas: ${stats.canceled}
• Faturamento: ${this.formatCurrency(stats.revenue)}
• Conversão: ${context.conversionRate.toFixed(1)}%
• Ticket médio: ${this.formatCurrency(context.ticketMedio)}

_Configure a OpenAI nas configurações para análises mais detalhadas._`;
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
