import { prisma } from '../../config/database';
import { SALE_STATUS } from '../../shared/constants/status-codes';
import OpenAI from 'openai';

// Intent types
export type IntentType =
  | 'REVENUE_TODAY'
  | 'REVENUE_YESTERDAY'
  | 'REVENUE_WEEK'
  | 'REVENUE_MONTH'
  | 'SALES_TODAY'
  | 'SALES_YESTERDAY'
  | 'SALES_WEEK'
  | 'SALES_MONTH'
  | 'APPROVED_SALES'
  | 'PENDING_SALES'
  | 'CANCELED_SALES'
  | 'TOP_PRODUCTS'
  | 'COMPARE_TODAY_YESTERDAY'
  | 'COMPARE_WEEK'
  | 'COMPARE_MONTH'
  | 'MONTHLY_SUMMARY'
  | 'WEEKLY_SUMMARY'
  | 'DAILY_SUMMARY'
  | 'AI_ANALYSIS'
  | 'AI_STRATEGY'
  | 'AI_PROBLEMS'
  | 'AI_OPPORTUNITIES'
  | 'HELP'
  | 'UNKNOWN';

interface QueryResult {
  intent: IntentType;
  data: Record<string, unknown>;
  response: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface FullAnalyticsData {
  todayRevenue: number;
  yesterdayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  todaySales: number;
  yesterdaySales: number;
  weekSales: number;
  monthSales: number;
  todayApproved: number;
  weekApproved: number;
  monthApproved: number;
  todayConversion: number;
  weekConversion: number;
  monthConversion: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  recentTrend: 'up' | 'down' | 'stable';
  abandonedCarts: number;
  pendingSales: number;
  canceledSales: number;
  chargebacks: number;
  avgTicket: number;
  peakDay: string;
  worstDay: string;
}

export class AIQueryService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // Detect intent from user message
  detectIntent(message: string): IntentType {
    const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // AI Analysis intents
    if (msg.includes('analis') || msg.includes('analise') || msg.includes('insight') ||
        msg.includes('diagnos') || msg.includes('avali') || msg.includes('situacao') ||
        msg.includes('cenario') || msg.includes('como estou') || msg.includes('como esta')) {
      return 'AI_ANALYSIS';
    }

    if (msg.includes('estrateg') || msg.includes('o que fazer') || msg.includes('como melhorar') ||
        msg.includes('sugest') || msg.includes('recomend') || msg.includes('conselho') ||
        msg.includes('dica') || msg.includes('acao') || msg.includes('proximo passo')) {
      return 'AI_STRATEGY';
    }

    if (msg.includes('problem') || msg.includes('erro') || msg.includes('ruim') ||
        msg.includes('caindo') || msg.includes('baixo') || msg.includes('pior') ||
        msg.includes('preocup') || msg.includes('atenção') || msg.includes('cuidado')) {
      return 'AI_PROBLEMS';
    }

    if (msg.includes('oportunid') || msg.includes('potencial') || msg.includes('crescer') ||
        msg.includes('melhor') || msg.includes('aproveitar') || msg.includes('escalar')) {
      return 'AI_OPPORTUNITIES';
    }

    // Help
    if (msg.includes('ajuda') || msg.includes('help') || msg.includes('comandos') || msg === 'oi' || msg === 'ola') {
      return 'HELP';
    }

    // Comparisons
    if (msg.includes('compara') || msg.includes('versus') || msg.includes(' vs ')) {
      if (msg.includes('ontem') || msg.includes('hoje')) return 'COMPARE_TODAY_YESTERDAY';
      if (msg.includes('semana')) return 'COMPARE_WEEK';
      if (msg.includes('mes')) return 'COMPARE_MONTH';
    }

    // Summaries
    if (msg.includes('resumo') || msg.includes('relatorio')) {
      if (msg.includes('mes') || msg.includes('mensal')) return 'MONTHLY_SUMMARY';
      if (msg.includes('semana') || msg.includes('semanal')) return 'WEEKLY_SUMMARY';
      return 'DAILY_SUMMARY';
    }

    // Revenue
    if (msg.includes('fatura') || msg.includes('faturei') || msg.includes('receita') || msg.includes('ganho') || msg.includes('ganhei')) {
      if (msg.includes('ontem')) return 'REVENUE_YESTERDAY';
      if (msg.includes('semana')) return 'REVENUE_WEEK';
      if (msg.includes('mes')) return 'REVENUE_MONTH';
      return 'REVENUE_TODAY';
    }

    // Sales count
    if (msg.includes('venda') || msg.includes('vendas') || msg.includes('vendi')) {
      if (msg.includes('aprovad')) return 'APPROVED_SALES';
      if (msg.includes('pendente') || msg.includes('aguardando')) return 'PENDING_SALES';
      if (msg.includes('cancelad') || msg.includes('estornada')) return 'CANCELED_SALES';
      if (msg.includes('ontem')) return 'SALES_YESTERDAY';
      if (msg.includes('semana')) return 'SALES_WEEK';
      if (msg.includes('mes')) return 'SALES_MONTH';
      return 'SALES_TODAY';
    }

    // Approved
    if (msg.includes('aprovad')) {
      return 'APPROVED_SALES';
    }

    // Products
    if (msg.includes('produto') || msg.includes('mais vend') || msg.includes('top') || msg.includes('melhor')) {
      return 'TOP_PRODUCTS';
    }

    // Today/Now queries
    if (msg.includes('hoje') || msg.includes('agora')) {
      if (msg.includes('fatura') || msg.includes('receita')) return 'REVENUE_TODAY';
      return 'SALES_TODAY';
    }

    // Yesterday
    if (msg.includes('ontem')) {
      if (msg.includes('fatura') || msg.includes('receita')) return 'REVENUE_YESTERDAY';
      return 'SALES_YESTERDAY';
    }

    return 'UNKNOWN';
  }

  // Process query and return result
  async processQuery(userId: string, message: string): Promise<QueryResult> {
    const intent = this.detectIntent(message);

    switch (intent) {
      case 'HELP':
        return this.getHelpResponse();

      case 'AI_ANALYSIS':
        return this.getAIAnalysis(userId, message, 'analysis');

      case 'AI_STRATEGY':
        return this.getAIAnalysis(userId, message, 'strategy');

      case 'AI_PROBLEMS':
        return this.getAIAnalysis(userId, message, 'problems');

      case 'AI_OPPORTUNITIES':
        return this.getAIAnalysis(userId, message, 'opportunities');

      case 'REVENUE_TODAY':
        return this.getRevenue(userId, this.getTodayRange());

      case 'REVENUE_YESTERDAY':
        return this.getRevenue(userId, this.getYesterdayRange());

      case 'REVENUE_WEEK':
        return this.getRevenue(userId, this.getWeekRange());

      case 'REVENUE_MONTH':
        return this.getRevenue(userId, this.getMonthRange());

      case 'SALES_TODAY':
        return this.getSalesCount(userId, this.getTodayRange());

      case 'SALES_YESTERDAY':
        return this.getSalesCount(userId, this.getYesterdayRange());

      case 'SALES_WEEK':
        return this.getSalesCount(userId, this.getWeekRange());

      case 'SALES_MONTH':
        return this.getSalesCount(userId, this.getMonthRange());

      case 'APPROVED_SALES':
        return this.getApprovedSales(userId);

      case 'PENDING_SALES':
        return this.getPendingSales(userId);

      case 'CANCELED_SALES':
        return this.getCanceledSales(userId);

      case 'TOP_PRODUCTS':
        return this.getTopProducts(userId);

      case 'COMPARE_TODAY_YESTERDAY':
        return this.compareToYesterday(userId);

      case 'COMPARE_WEEK':
        return this.compareWeeks(userId);

      case 'COMPARE_MONTH':
        return this.compareMonths(userId);

      case 'MONTHLY_SUMMARY':
        return this.getMonthlySummary(userId);

      case 'WEEKLY_SUMMARY':
        return this.getWeeklySummary(userId);

      case 'DAILY_SUMMARY':
        return this.getDailySummary(userId);

      default:
        // For unknown intents, try AI analysis
        if (this.openai) {
          return this.getAIAnalysis(userId, message, 'general');
        }
        return this.getUnknownResponse(message);
    }
  }

  // Get full analytics data for AI analysis
  private async getFullAnalyticsData(userId: string): Promise<FullAnalyticsData> {
    const todayRange = this.getTodayRange();
    const yesterdayRange = this.getYesterdayRange();
    const weekRange = this.getWeekRange();
    const monthRange = this.getMonthRange();
    const lastMonthRange = this.getLastMonthRange();
    const last7DaysRange = this.getLast7DaysRange();

    // Parallel queries for performance
    const [
      todayStats,
      yesterdayStats,
      weekStats,
      monthStats,
      lastMonthStats,
      topProducts,
      abandonedCarts,
      pendingSales,
      canceledSales,
      chargebacks,
      last7DaysSales,
    ] = await Promise.all([
      this.getPeriodStats(userId, todayRange),
      this.getPeriodStats(userId, yesterdayRange),
      this.getPeriodStats(userId, weekRange),
      this.getPeriodStats(userId, monthRange),
      this.getPeriodStats(userId, lastMonthRange),
      this.getTopProductsData(userId, monthRange),
      this.getAbandonedCartsCount(userId),
      this.getPendingSalesCount(userId),
      this.getCanceledSalesCount(userId),
      this.getChargebacksCount(userId),
      this.getDailySalesData(userId, last7DaysRange),
    ]);

    // Calculate trend
    const trend = this.calculateTrend(last7DaysSales);

    // Find peak and worst days
    const { peakDay, worstDay } = this.findPeakAndWorstDays(last7DaysSales);

    return {
      todayRevenue: todayStats.revenue,
      yesterdayRevenue: yesterdayStats.revenue,
      weekRevenue: weekStats.revenue,
      monthRevenue: monthStats.revenue,
      lastMonthRevenue: lastMonthStats.revenue,
      todaySales: todayStats.total,
      yesterdaySales: yesterdayStats.total,
      weekSales: weekStats.total,
      monthSales: monthStats.total,
      todayApproved: todayStats.approved,
      weekApproved: weekStats.approved,
      monthApproved: monthStats.approved,
      todayConversion: todayStats.total > 0 ? (todayStats.approved / todayStats.total) * 100 : 0,
      weekConversion: weekStats.total > 0 ? (weekStats.approved / weekStats.total) * 100 : 0,
      monthConversion: monthStats.total > 0 ? (monthStats.approved / monthStats.total) * 100 : 0,
      topProducts,
      recentTrend: trend,
      abandonedCarts,
      pendingSales,
      canceledSales,
      chargebacks,
      avgTicket: monthStats.approved > 0 ? monthStats.revenue / monthStats.approved : 0,
      peakDay,
      worstDay,
    };
  }

  private async getPeriodStats(userId: string, range: DateRange) {
    const [total, approved, revenue] = await Promise.all([
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _sum: { transTotalValue: true },
      }),
    ]);

    return {
      total,
      approved,
      revenue: revenue._sum.transTotalValue || 0,
    };
  }

  private async getTopProductsData(userId: string, range: DateRange) {
    const products = await prisma.sale.groupBy({
      by: ['productName'],
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: range.start, lte: range.end },
      },
      _count: true,
      _sum: { transTotalValue: true },
      orderBy: { _count: { productName: 'desc' } },
      take: 5,
    });

    return products.map(p => ({
      name: p.productName,
      count: p._count,
      revenue: p._sum.transTotalValue || 0,
    }));
  }

  private async getAbandonedCartsCount(userId: string): Promise<number> {
    return prisma.abandon.count({
      where: { gatewayConfig: { userId } },
    });
  }

  private async getPendingSalesCount(userId: string): Promise<number> {
    return prisma.sale.count({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
      },
    });
  }

  private async getCanceledSalesCount(userId: string): Promise<number> {
    return prisma.sale.count({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.CANCELADA,
      },
    });
  }

  private async getChargebacksCount(userId: string): Promise<number> {
    return prisma.sale.count({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.CHARGEBACK,
      },
    });
  }

  private async getDailySalesData(userId: string, range: DateRange) {
    const sales = await prisma.sale.findMany({
      where: {
        gatewayConfig: { userId },
        transCreateDate: { gte: range.start, lte: range.end },
      },
      select: {
        transCreateDate: true,
        transStatusCode: true,
        transTotalValue: true,
      },
    });

    // Group by day
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

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  private calculateTrend(dailyData: Array<{ date: string; approved: number }>): 'up' | 'down' | 'stable' {
    if (dailyData.length < 3) return 'stable';

    const sorted = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
    const recentHalf = sorted.slice(Math.floor(sorted.length / 2));
    const olderHalf = sorted.slice(0, Math.floor(sorted.length / 2));

    const recentAvg = recentHalf.reduce((sum, d) => sum + d.approved, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, d) => sum + d.approved, 0) / olderHalf.length;

    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  }

  private findPeakAndWorstDays(dailyData: Array<{ date: string; approved: number }>) {
    if (dailyData.length === 0) {
      return { peakDay: 'N/A', worstDay: 'N/A' };
    }

    const sorted = [...dailyData].sort((a, b) => b.approved - a.approved);
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const peakDate = new Date(sorted[0].date);
    const worstDate = new Date(sorted[sorted.length - 1].date);

    return {
      peakDay: weekDays[peakDate.getDay()],
      worstDay: weekDays[worstDate.getDay()],
    };
  }

  private getLast7DaysRange(): DateRange {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }

  // AI Analysis with OpenAI
  private async getAIAnalysis(
    userId: string,
    userMessage: string,
    analysisType: 'analysis' | 'strategy' | 'problems' | 'opportunities' | 'general'
  ): Promise<QueryResult> {
    try {
      const data = await this.getFullAnalyticsData(userId);

      if (!this.openai) {
        return this.getFallbackAnalysis(data, analysisType);
      }

      const systemPrompt = this.getSystemPrompt(analysisType);
      const userPrompt = this.getUserPrompt(data, userMessage, analysisType);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || 'Não foi possível gerar a análise.';

      return {
        intent: 'AI_ANALYSIS',
        data: data as unknown as Record<string, unknown>,
        response,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      const data = await this.getFullAnalyticsData(userId);
      return this.getFallbackAnalysis(data, analysisType);
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `Você é um consultor de negócios especializado em vendas digitais e e-commerce.
Você está analisando dados de vendas de um infoprodutor brasileiro.
Use linguagem direta, prática e motivacional.
Formate a resposta para Telegram/WhatsApp com emojis apropriados.
Seja conciso mas informativo. Limite a resposta a 2000 caracteres.`;

    const typePrompts: Record<string, string> = {
      analysis: `${basePrompt}
Foque em fornecer uma análise clara e objetiva do cenário atual das vendas.
Destaque os pontos mais importantes e tendências visíveis nos dados.`,

      strategy: `${basePrompt}
Foque em estratégias acionáveis e próximos passos concretos.
Dê recomendações específicas que podem ser implementadas imediatamente.`,

      problems: `${basePrompt}
Foque em identificar problemas, riscos e áreas que precisam de atenção.
Seja honesto sobre pontos fracos mas ofereça soluções.`,

      opportunities: `${basePrompt}
Foque em oportunidades de crescimento e potenciais não explorados.
Identifique onde há margem para escalar e melhorar.`,

      general: `${basePrompt}
Responda à pergunta do usuário de forma completa usando os dados disponíveis.
Se a pergunta não for clara, faça uma análise geral útil.`,
    };

    return typePrompts[analysisType] || typePrompts.general;
  }

  private getUserPrompt(data: FullAnalyticsData, userMessage: string, analysisType: string): string {
    const formatCurrency = (value: number) => `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return `Pergunta do usuário: "${userMessage}"

📊 DADOS DO NEGÓCIO:

💰 FATURAMENTO:
- Hoje: ${formatCurrency(data.todayRevenue)}
- Ontem: ${formatCurrency(data.yesterdayRevenue)}
- Esta semana: ${formatCurrency(data.weekRevenue)}
- Este mês: ${formatCurrency(data.monthRevenue)}
- Mês passado: ${formatCurrency(data.lastMonthRevenue)}

📦 VENDAS:
- Hoje: ${data.todaySales} total, ${data.todayApproved} aprovadas
- Esta semana: ${data.weekSales} total, ${data.weekApproved} aprovadas
- Este mês: ${data.monthSales} total, ${data.monthApproved} aprovadas

📈 TAXAS DE CONVERSÃO:
- Hoje: ${data.todayConversion.toFixed(1)}%
- Semana: ${data.weekConversion.toFixed(1)}%
- Mês: ${data.monthConversion.toFixed(1)}%

🎫 TICKET MÉDIO: ${formatCurrency(data.avgTicket)}

🏆 TOP 5 PRODUTOS:
${data.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.count} vendas, ${formatCurrency(p.revenue)}`).join('\n')}

⚠️ ATENÇÃO:
- Carrinhos abandonados: ${data.abandonedCarts}
- Vendas pendentes: ${data.pendingSales}
- Cancelamentos: ${data.canceledSales}
- Chargebacks: ${data.chargebacks}

📅 PADRÕES:
- Tendência recente: ${data.recentTrend === 'up' ? 'Alta 📈' : data.recentTrend === 'down' ? 'Baixa 📉' : 'Estável ➡️'}
- Melhor dia da semana: ${data.peakDay}
- Pior dia da semana: ${data.worstDay}

${analysisType === 'analysis' ? 'Forneça uma análise completa do cenário atual.' : ''}
${analysisType === 'strategy' ? 'Sugira estratégias e próximos passos.' : ''}
${analysisType === 'problems' ? 'Identifique problemas e riscos.' : ''}
${analysisType === 'opportunities' ? 'Identifique oportunidades de crescimento.' : ''}`;
  }

  private getFallbackAnalysis(data: FullAnalyticsData, analysisType: string): QueryResult {
    const formatCurrency = (value: number) => `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    let response = '';

    if (analysisType === 'analysis' || analysisType === 'general') {
      const monthChange = data.lastMonthRevenue > 0
        ? ((data.monthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue * 100).toFixed(1)
        : '0';
      const isPositive = parseFloat(monthChange) >= 0;

      response = `🔍 *Análise do Seu Negócio*\n\n`;
      response += `💰 *Faturamento do Mês:* ${formatCurrency(data.monthRevenue)}\n`;
      response += `${isPositive ? '📈' : '📉'} ${monthChange}% vs mês passado\n\n`;
      response += `📊 *Conversão:* ${data.monthConversion.toFixed(1)}%\n`;
      response += `🎫 *Ticket Médio:* ${formatCurrency(data.avgTicket)}\n\n`;
      response += `🏆 *Top Produto:* ${data.topProducts[0]?.name || 'N/A'}\n`;
      response += `📅 *Melhor dia:* ${data.peakDay}\n\n`;

      if (data.abandonedCarts > 10) {
        response += `⚠️ *Atenção:* ${data.abandonedCarts} carrinhos abandonados\n`;
      }
      if (data.chargebacks > 0) {
        response += `🚨 *Alerta:* ${data.chargebacks} chargebacks\n`;
      }
    } else if (analysisType === 'strategy') {
      response = `🎯 *Estratégias Sugeridas*\n\n`;

      if (data.abandonedCarts > 5) {
        response += `1️⃣ *Recuperar carrinhos:* Você tem ${data.abandonedCarts} abandonos. Configure emails/WhatsApp de recuperação.\n\n`;
      }

      if (data.monthConversion < 30) {
        response += `2️⃣ *Melhorar conversão:* Taxa de ${data.monthConversion.toFixed(1)}% pode ser otimizada. Revise sua página de vendas.\n\n`;
      }

      response += `3️⃣ *Foco no top produto:* "${data.topProducts[0]?.name || 'N/A'}" é seu melhor vendedor. Considere criar upsells.\n\n`;
      response += `4️⃣ *Aproveite ${data.peakDay}:* Concentre campanhas nesse dia para maximizar resultados.`;
    } else if (analysisType === 'problems') {
      response = `⚠️ *Pontos de Atenção*\n\n`;

      const issues = [];

      if (data.recentTrend === 'down') {
        issues.push(`📉 Vendas em tendência de queda`);
      }
      if (data.monthConversion < 20) {
        issues.push(`❌ Conversão baixa: ${data.monthConversion.toFixed(1)}%`);
      }
      if (data.abandonedCarts > 10) {
        issues.push(`🛒 ${data.abandonedCarts} carrinhos abandonados`);
      }
      if (data.chargebacks > 0) {
        issues.push(`🚨 ${data.chargebacks} chargebacks - risco de bloqueio`);
      }
      if (data.canceledSales > data.monthApproved * 0.1) {
        issues.push(`❌ Alta taxa de cancelamento`);
      }

      if (issues.length === 0) {
        response += `✅ Nenhum problema crítico identificado!\n\nSeus indicadores estão saudáveis.`;
      } else {
        response += issues.join('\n\n');
      }
    } else if (analysisType === 'opportunities') {
      response = `🚀 *Oportunidades de Crescimento*\n\n`;

      response += `1️⃣ *Recuperação de carrinhos:*\n`;
      response += `   Potencial de ${formatCurrency(data.abandonedCarts * data.avgTicket)} em vendas recuperáveis\n\n`;

      response += `2️⃣ *Dia de maior conversão:*\n`;
      response += `   Aumente investimento em tráfego às ${data.peakDay}s\n\n`;

      if (data.topProducts.length > 1) {
        response += `3️⃣ *Cross-sell:*\n`;
        response += `   Combine "${data.topProducts[0]?.name}" com "${data.topProducts[1]?.name}" em uma oferta\n\n`;
      }

      response += `4️⃣ *Ticket médio:*\n`;
      response += `   Crie order bumps para aumentar de ${formatCurrency(data.avgTicket)}`;
    }

    return {
      intent: 'AI_ANALYSIS',
      data: data as unknown as Record<string, unknown>,
      response,
    };
  }

  // Helper: Format currency
  private formatCurrency(value: number): string {
    return `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }

  // Helper: Get date ranges
  private getTodayRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }

  private getYesterdayRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    return { start, end };
  }

  private getWeekRange(): DateRange {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }

  private getLastWeekRange(): DateRange {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff - 7, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff - 1, 23, 59, 59);
    return { start, end };
  }

  private getMonthRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
  }

  private getLastMonthRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }

  // Query handlers
  private async getRevenue(userId: string, range: DateRange): Promise<QueryResult> {
    const result = await prisma.sale.aggregate({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: range.start, lte: range.end },
      },
      _sum: { transTotalValue: true },
      _count: true,
    });

    const revenue = result._sum.transTotalValue || 0;
    const count = result._count || 0;

    return {
      intent: 'REVENUE_TODAY',
      data: { revenue, count, range },
      response: `💰 *Faturamento*\n\n${this.formatCurrency(revenue)}\n\n✅ ${count} vendas aprovadas`,
    };
  }

  private async getSalesCount(userId: string, range: DateRange): Promise<QueryResult> {
    const [total, approved, pending, canceled] = await Promise.all([
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.CANCELADA,
          transCreateDate: { gte: range.start, lte: range.end },
        },
      }),
    ]);

    const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0';

    return {
      intent: 'SALES_TODAY',
      data: { total, approved, pending, canceled, conversionRate },
      response: `📊 *Vendas*\n\n📦 Total: ${total}\n✅ Aprovadas: ${approved}\n⏳ Pendentes: ${pending}\n❌ Canceladas: ${canceled}\n\n📈 Conversão: ${conversionRate}%`,
    };
  }

  private async getApprovedSales(userId: string): Promise<QueryResult> {
    const todayRange = this.getTodayRange();
    const weekRange = this.getWeekRange();
    const monthRange = this.getMonthRange();

    const [today, week, month] = await Promise.all([
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: todayRange.start, lte: todayRange.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: weekRange.start, lte: weekRange.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: monthRange.start, lte: monthRange.end },
        },
      }),
    ]);

    return {
      intent: 'APPROVED_SALES',
      data: { today, week, month },
      response: `✅ *Vendas Aprovadas*\n\n📅 Hoje: ${today}\n📆 Esta semana: ${week}\n🗓️ Este mês: ${month}`,
    };
  }

  private async getPendingSales(userId: string): Promise<QueryResult> {
    const count = await prisma.sale.count({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
      },
    });

    const totalValue = await prisma.sale.aggregate({
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
      },
      _sum: { transTotalValue: true },
    });

    return {
      intent: 'PENDING_SALES',
      data: { count, value: totalValue._sum.transTotalValue },
      response: `⏳ *Vendas Pendentes*\n\n📦 Total: ${count}\n💰 Valor: ${this.formatCurrency(totalValue._sum.transTotalValue || 0)}`,
    };
  }

  private async getCanceledSales(userId: string): Promise<QueryResult> {
    const todayRange = this.getTodayRange();
    const weekRange = this.getWeekRange();

    const [today, week] = await Promise.all([
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.CANCELADA,
          transCreateDate: { gte: todayRange.start, lte: todayRange.end },
        },
      }),
      prisma.sale.count({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.CANCELADA,
          transCreateDate: { gte: weekRange.start, lte: weekRange.end },
        },
      }),
    ]);

    return {
      intent: 'CANCELED_SALES',
      data: { today, week },
      response: `❌ *Vendas Canceladas*\n\n📅 Hoje: ${today}\n📆 Esta semana: ${week}`,
    };
  }

  private async getTopProducts(userId: string): Promise<QueryResult> {
    const monthRange = this.getMonthRange();

    const products = await prisma.sale.groupBy({
      by: ['productName'],
      where: {
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: monthRange.start, lte: monthRange.end },
      },
      _count: true,
      _sum: { transTotalValue: true },
      orderBy: { _count: { productName: 'desc' } },
      take: 5,
    });

    let response = `🏆 *Top Produtos do Mês*\n\n`;
    products.forEach((p, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📦';
      const name = p.productName.length > 25 ? p.productName.substring(0, 25) + '...' : p.productName;
      response += `${emoji} ${name}\n   ${p._count} vendas | ${this.formatCurrency(p._sum.transTotalValue || 0)}\n\n`;
    });

    return {
      intent: 'TOP_PRODUCTS',
      data: { products },
      response,
    };
  }

  private async compareToYesterday(userId: string): Promise<QueryResult> {
    const todayRange = this.getTodayRange();
    const yesterdayRange = this.getYesterdayRange();

    const [todayData, yesterdayData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: todayRange.start, lte: todayRange.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: yesterdayRange.start, lte: yesterdayRange.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
    ]);

    const todayRevenue = todayData._sum.transTotalValue || 0;
    const yesterdayRevenue = yesterdayData._sum.transTotalValue || 0;
    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : '0';

    const todayCount = todayData._count || 0;
    const yesterdayCount = yesterdayData._count || 0;
    const countChange = yesterdayCount > 0
      ? ((todayCount - yesterdayCount) / yesterdayCount * 100).toFixed(1)
      : '0';

    const revenueEmoji = parseFloat(revenueChange) >= 0 ? '📈' : '📉';
    const countEmoji = parseFloat(countChange) >= 0 ? '📈' : '📉';

    return {
      intent: 'COMPARE_TODAY_YESTERDAY',
      data: { todayRevenue, yesterdayRevenue, todayCount, yesterdayCount },
      response: `📊 *Hoje vs Ontem*\n\n💰 *Faturamento*\nHoje: ${this.formatCurrency(todayRevenue)}\nOntem: ${this.formatCurrency(yesterdayRevenue)}\n${revenueEmoji} ${revenueChange}%\n\n📦 *Vendas Aprovadas*\nHoje: ${todayCount}\nOntem: ${yesterdayCount}\n${countEmoji} ${countChange}%`,
    };
  }

  private async compareWeeks(userId: string): Promise<QueryResult> {
    const thisWeek = this.getWeekRange();
    const lastWeek = this.getLastWeekRange();

    const [thisWeekData, lastWeekData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: thisWeek.start, lte: thisWeek.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: lastWeek.start, lte: lastWeek.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
    ]);

    const thisRevenue = thisWeekData._sum.transTotalValue || 0;
    const lastRevenue = lastWeekData._sum.transTotalValue || 0;
    const change = lastRevenue > 0
      ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)
      : '0';

    const emoji = parseFloat(change) >= 0 ? '📈' : '📉';

    return {
      intent: 'COMPARE_WEEK',
      data: { thisRevenue, lastRevenue, thisCount: thisWeekData._count, lastCount: lastWeekData._count },
      response: `📊 *Esta Semana vs Semana Passada*\n\n💰 *Faturamento*\nEsta semana: ${this.formatCurrency(thisRevenue)}\nSemana passada: ${this.formatCurrency(lastRevenue)}\n${emoji} ${change}%\n\n📦 *Vendas*\nEsta semana: ${thisWeekData._count || 0}\nSemana passada: ${lastWeekData._count || 0}`,
    };
  }

  private async compareMonths(userId: string): Promise<QueryResult> {
    const thisMonth = this.getMonthRange();
    const lastMonth = this.getLastMonthRange();

    const [thisMonthData, lastMonthData] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: thisMonth.start, lte: thisMonth.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: lastMonth.start, lte: lastMonth.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
    ]);

    const thisRevenue = thisMonthData._sum.transTotalValue || 0;
    const lastRevenue = lastMonthData._sum.transTotalValue || 0;
    const change = lastRevenue > 0
      ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)
      : '0';

    const emoji = parseFloat(change) >= 0 ? '📈' : '📉';

    return {
      intent: 'COMPARE_MONTH',
      data: { thisRevenue, lastRevenue },
      response: `📊 *Este Mês vs Mês Passado*\n\n💰 *Faturamento*\nEste mês: ${this.formatCurrency(thisRevenue)}\nMês passado: ${this.formatCurrency(lastRevenue)}\n${emoji} ${change}%\n\n📦 *Vendas Aprovadas*\nEste mês: ${thisMonthData._count || 0}\nMês passado: ${lastMonthData._count || 0}`,
    };
  }

  private async getDailySummary(userId: string): Promise<QueryResult> {
    const range = this.getTodayRange();

    const [salesData, revenue] = await Promise.all([
      prisma.sale.groupBy({
        by: ['transStatusCode'],
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _sum: { transTotalValue: true },
      }),
    ]);

    const total = salesData.reduce((acc, s) => acc + s._count, 0);
    const approved = salesData.find(s => s.transStatusCode === SALE_STATUS.PAGAMENTO_APROVADO)?._count || 0;
    const pending = salesData.find(s => s.transStatusCode === SALE_STATUS.AGUARDANDO_PAGAMENTO)?._count || 0;
    const canceled = salesData.find(s => s.transStatusCode === SALE_STATUS.CANCELADA)?._count || 0;
    const conversion = total > 0 ? ((approved / total) * 100).toFixed(1) : '0';

    return {
      intent: 'DAILY_SUMMARY',
      data: { total, approved, pending, canceled, revenue: revenue._sum.transTotalValue },
      response: `📊 *Resumo de Hoje*\n\n💰 Faturamento: ${this.formatCurrency(revenue._sum.transTotalValue || 0)}\n\n📦 Total de vendas: ${total}\n✅ Aprovadas: ${approved}\n⏳ Pendentes: ${pending}\n❌ Canceladas: ${canceled}\n\n📈 Taxa de conversão: ${conversion}%`,
    };
  }

  private async getWeeklySummary(userId: string): Promise<QueryResult> {
    const range = this.getWeekRange();

    const [salesData, revenue, topProduct] = await Promise.all([
      prisma.sale.groupBy({
        by: ['transStatusCode'],
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _sum: { transTotalValue: true },
      }),
      prisma.sale.groupBy({
        by: ['productName'],
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _count: true,
        orderBy: { _count: { productName: 'desc' } },
        take: 1,
      }),
    ]);

    const total = salesData.reduce((acc, s) => acc + s._count, 0);
    const approved = salesData.find(s => s.transStatusCode === SALE_STATUS.PAGAMENTO_APROVADO)?._count || 0;
    const avgTicket = approved > 0 ? (revenue._sum.transTotalValue || 0) / approved : 0;

    return {
      intent: 'WEEKLY_SUMMARY',
      data: { total, approved, revenue: revenue._sum.transTotalValue, topProduct },
      response: `📊 *Resumo da Semana*\n\n💰 Faturamento: ${this.formatCurrency(revenue._sum.transTotalValue || 0)}\n🎫 Ticket médio: ${this.formatCurrency(avgTicket)}\n\n📦 Total de vendas: ${total}\n✅ Aprovadas: ${approved}\n\n🏆 Produto mais vendido:\n${topProduct[0]?.productName || 'N/A'}`,
    };
  }

  private async getMonthlySummary(userId: string): Promise<QueryResult> {
    const range = this.getMonthRange();
    const lastMonth = this.getLastMonthRange();

    const [thisMonthRevenue, lastMonthRevenue, salesData, topProducts] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _sum: { transTotalValue: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: lastMonth.start, lte: lastMonth.end },
        },
        _sum: { transTotalValue: true },
      }),
      prisma.sale.groupBy({
        by: ['transStatusCode'],
        where: {
          gatewayConfig: { userId },
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _count: true,
      }),
      prisma.sale.groupBy({
        by: ['productName'],
        where: {
          gatewayConfig: { userId },
          transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
          transCreateDate: { gte: range.start, lte: range.end },
        },
        _count: true,
        orderBy: { _count: { productName: 'desc' } },
        take: 3,
      }),
    ]);

    const thisRevenue = thisMonthRevenue._sum.transTotalValue || 0;
    const lastRevenue = lastMonthRevenue._sum.transTotalValue || 0;
    const change = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : '0';
    const changeEmoji = parseFloat(change) >= 0 ? '📈' : '📉';

    const total = salesData.reduce((acc, s) => acc + s._count, 0);
    const approved = thisMonthRevenue._count || 0;
    const avgTicket = approved > 0 ? thisRevenue / approved : 0;

    let topProductsText = '';
    topProducts.forEach((p, i) => {
      const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      topProductsText += `${emoji} ${p.productName.substring(0, 20)}... (${p._count})\n`;
    });

    return {
      intent: 'MONTHLY_SUMMARY',
      data: { thisRevenue, lastRevenue, total, approved, topProducts },
      response: `📊 *Resumo do Mês*\n\n💰 Faturamento: ${this.formatCurrency(thisRevenue)}\n${changeEmoji} ${change}% vs mês anterior\n\n🎫 Ticket médio: ${this.formatCurrency(avgTicket)}\n📦 Vendas aprovadas: ${approved}\n\n🏆 *Top 3 Produtos:*\n${topProductsText}`,
    };
  }

  private getHelpResponse(): QueryResult {
    return {
      intent: 'HELP',
      data: {},
      response: `🤖 *Dashboard IA - Comandos*\n\n💰 *Faturamento:*\n• "Quanto faturei hoje?"\n• "Faturamento da semana"\n• "Receita do mês"\n\n📊 *Vendas:*\n• "Quantas vendas hoje?"\n• "Vendas aprovadas"\n• "Vendas pendentes"\n\n📈 *Comparativos:*\n• "Compara hoje com ontem"\n• "Compara semanas"\n• "Compara meses"\n\n📝 *Resumos:*\n• "Resumo do dia"\n• "Resumo da semana"\n• "Resumo do mês"\n\n🧠 *Análise IA:*\n• "Analise meu cenário"\n• "Quais estratégias usar?"\n• "Tem algum problema?"\n• "Oportunidades de crescer"\n\n🏆 *Produtos:*\n• "Produtos mais vendidos"\n• "Top produtos"`,
    };
  }

  private getUnknownResponse(message: string): QueryResult {
    return {
      intent: 'UNKNOWN',
      data: { originalMessage: message },
      response: `🤔 Não entendi sua pergunta.\n\nDigite *ajuda* para ver os comandos disponíveis.\n\n💡 Dica: Pergunte "analise meu cenário" para uma análise completa com IA!`,
    };
  }
}

export const aiQueryService = new AIQueryService();
