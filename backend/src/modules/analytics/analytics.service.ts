import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getDateRangeFromPeriod, subDays, subMonths, startOfDay, endOfDay } from '../../shared/utils/date';
import { SALE_STATUS } from '../../shared/constants/status-codes';

interface DateFilter {
  startDate?: string;
  endDate?: string;
  productKey?: string;
}

interface DashboardMetrics {
  sales: {
    total: number;
    approved: number;
    pending: number;
    canceled: number;
    chargebacks: number;
    refunds: number;
  };
  revenue: {
    total: number;
    approved: number;
    ticketMedio: number;
  };
  abandons: {
    total: number;
    today: number;
  };
  conversion: {
    rate: number;
    chargebackRate: number;
  };
  trends: {
    salesGrowth: number;
    revenueGrowth: number;
  };
}

export async function getDashboardMetrics(
  userId: string,
  gatewayId?: string,
  dateFilter?: DateFilter
): Promise<DashboardMetrics> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  // Apply date filters
  if (dateFilter?.startDate || dateFilter?.endDate) {
    where.transCreateDate = {};
    if (dateFilter.startDate) {
      where.transCreateDate.gte = new Date(dateFilter.startDate + 'T00:00:00');
    }
    if (dateFilter.endDate) {
      where.transCreateDate.lte = new Date(dateFilter.endDate + 'T23:59:59');
    }
  }

  // Apply product filter
  if (dateFilter?.productKey) {
    where.productKey = dateFilter.productKey;
  }

  // Current period metrics
  const [
    totalSales,
    approvedSales,
    pendingSales,
    canceledSales,
    chargebacks,
    refunds,
  ] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.CANCELADA } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.CHARGEBACK } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.DEVOLVIDA } }),
  ]);

  // Revenue
  const revenueData = await prisma.sale.aggregate({
    where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO },
    _sum: { transTotalValue: true },
  });

  const totalRevenue = revenueData._sum.transTotalValue || 0;
  const ticketMedio = approvedSales > 0 ? totalRevenue / approvedSales : 0;

  // Abandons
  const abandonWhere: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
  };
  if (gatewayId) {
    abandonWhere.gatewayConfigId = gatewayId;
  }

  const today = startOfDay(new Date());
  const [totalAbandons, todayAbandons] = await Promise.all([
    prisma.abandon.count({ where: abandonWhere }),
    prisma.abandon.count({
      where: { ...abandonWhere, transCreateDate: { gte: today } },
    }),
  ]);

  // Conversion rates
  const conversionRate = totalSales > 0 ? (approvedSales / totalSales) * 100 : 0;
  const chargebackRate = approvedSales > 0 ? (chargebacks / approvedSales) * 100 : 0;

  // Growth comparison (this month vs last month)
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const lastMonthStart = subMonths(thisMonthStart, 1);
  const lastMonthEnd = new Date(thisMonthStart);
  lastMonthEnd.setSeconds(lastMonthEnd.getSeconds() - 1);

  const [thisMonthSales, lastMonthSales] = await Promise.all([
    prisma.sale.count({
      where: {
        ...where,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: thisMonthStart },
      },
    }),
    prisma.sale.count({
      where: {
        ...where,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
  ]);

  const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        ...where,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: thisMonthStart },
      },
      _sum: { transTotalValue: true },
    }),
    prisma.sale.aggregate({
      where: {
        ...where,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
        transCreateDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { transTotalValue: true },
    }),
  ]);

  const salesGrowth = lastMonthSales > 0
    ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
    : 0;

  const lastMonthRevenueValue = lastMonthRevenue._sum.transTotalValue || 0;
  const thisMonthRevenueValue = thisMonthRevenue._sum.transTotalValue || 0;
  const revenueGrowth = lastMonthRevenueValue > 0
    ? ((thisMonthRevenueValue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100
    : 0;

  return {
    sales: {
      total: totalSales,
      approved: approvedSales,
      pending: pendingSales,
      canceled: canceledSales,
      chargebacks,
      refunds,
    },
    revenue: {
      total: totalRevenue,
      approved: totalRevenue,
      ticketMedio: Math.round(ticketMedio),
    },
    abandons: {
      total: totalAbandons,
      today: todayAbandons,
    },
    conversion: {
      rate: parseFloat(conversionRate.toFixed(2)),
      chargebackRate: parseFloat(chargebackRate.toFixed(2)),
    },
    trends: {
      salesGrowth: parseFloat(salesGrowth.toFixed(2)),
      revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
    },
  };
}

export async function getRevenueByPeriod(
  userId: string,
  period: string = 'last30days',
  gatewayId?: string
): Promise<unknown[]> {
  const { start, end } = getDateRangeFromPeriod(period);

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
    transCreateDate: { gte: start, lte: end },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      transCreateDate: true,
      transTotalValue: true,
    },
    orderBy: { transCreateDate: 'asc' },
  });

  const grouped: Record<string, number> = {};

  for (const sale of sales) {
    const dateKey = sale.transCreateDate.toISOString().split('T')[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + sale.transTotalValue;
  }

  return Object.entries(grouped).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

export async function getConversionFunnel(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const abandonWhere: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    abandonWhere.gatewayConfigId = gatewayId;
  }

  const [abandons, checkouts, approved] = await Promise.all([
    prisma.abandon.count({ where: abandonWhere }),
    prisma.sale.count({ where }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO } }),
  ]);

  const totalVisitors = abandons + checkouts;

  return {
    stages: [
      {
        name: 'Visitantes',
        count: totalVisitors,
        percentage: 100,
      },
      {
        name: 'Checkout Iniciado',
        count: checkouts,
        percentage: totalVisitors > 0 ? ((checkouts / totalVisitors) * 100).toFixed(2) : 0,
      },
      {
        name: 'Compra Aprovada',
        count: approved,
        percentage: totalVisitors > 0 ? ((approved / totalVisitors) * 100).toFixed(2) : 0,
      },
    ],
    dropoff: {
      abandonRate: totalVisitors > 0 ? ((abandons / totalVisitors) * 100).toFixed(2) : 0,
      checkoutDropoff: checkouts > 0 ? (((checkouts - approved) / checkouts) * 100).toFixed(2) : 0,
    },
  };
}

export async function getComparison(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const lastWeek = subDays(today, 7);

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  // Today vs Yesterday
  const [todaySales, yesterdaySales] = await Promise.all([
    prisma.sale.count({
      where: { ...where, transCreateDate: { gte: startOfDay(today) } },
    }),
    prisma.sale.count({
      where: {
        ...where,
        transCreateDate: { gte: startOfDay(yesterday), lt: startOfDay(today) },
      },
    }),
  ]);

  // This week vs Last week
  const weekStart = subDays(today, 7);
  const lastWeekStart = subDays(today, 14);

  const [thisWeekSales, lastWeekSales] = await Promise.all([
    prisma.sale.count({
      where: { ...where, transCreateDate: { gte: weekStart } },
    }),
    prisma.sale.count({
      where: { ...where, transCreateDate: { gte: lastWeekStart, lt: weekStart } },
    }),
  ]);

  return {
    daily: {
      today: todaySales,
      yesterday: yesterdaySales,
      change: yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0,
    },
    weekly: {
      thisWeek: thisWeekSales,
      lastWeek: lastWeekSales,
      change: lastWeekSales > 0 ? ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100 : 0,
    },
  };
}

export async function getRealtimeMetrics(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: { gte: oneHourAgo },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const [recentSales, recentApproved] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO } }),
  ]);

  const revenue = await prisma.sale.aggregate({
    where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO },
    _sum: { transTotalValue: true },
  });

  return {
    lastHour: {
      sales: recentSales,
      approved: recentApproved,
      revenue: revenue._sum.transTotalValue || 0,
    },
    timestamp: now.toISOString(),
  };
}

// ==================== AFFILIATE ANALYTICS ====================

export async function getAffiliateStats(
  userId: string,
  gatewayId?: string,
  dateFilter?: DateFilter
): Promise<unknown> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: gatewayId ? { id: gatewayId, userId } : { userId },
  });

  if (!gateway) {
    return { affiliates: [], summary: { totalAffiliates: 0, totalSales: 0, totalRevenue: 0, totalCommission: 0 } };
  }

  // Build date condition for raw query
  let dateCondition = '';
  if (dateFilter?.startDate && dateFilter?.endDate) {
    const startDateStr = dateFilter.startDate + ' 00:00:00';
    const endDateStr = dateFilter.endDate + ' 23:59:59';
    dateCondition = `AND s."transCreateDate" >= '${startDateStr}'::timestamp AND s."transCreateDate" <= '${endDateStr}'::timestamp`;
  }

  // Query to get affiliate stats from sales with commissions
  // This extracts affiliate info from the commissions JSON field
  const affiliateQuery = await prisma.$queryRawUnsafe<Array<{
    affiliate_name: string;
    affiliate_email: string | null;
    total_sales: bigint;
    total_revenue: bigint;
    total_commission: bigint;
  }>>(
    `WITH affiliate_sales AS (
      SELECT
        s.id,
        s."transValue",
        (c->>'name') as affiliate_name,
        (c->>'email') as affiliate_email,
        COALESCE((c->>'value')::numeric, 0) as commission_value
      FROM sales s,
      jsonb_array_elements(s.commissions::jsonb) as c
      WHERE s."gatewayConfigId" = $1
        AND s."transStatus" IN ('Aprovado', 'Pagamento Aprovado')
        AND c->>'type' = 'Afiliado'
        ${dateCondition}
    )
    SELECT
      affiliate_name,
      affiliate_email,
      COUNT(*)::bigint as total_sales,
      SUM("transValue")::bigint as total_revenue,
      SUM(commission_value)::bigint as total_commission
    FROM affiliate_sales
    WHERE affiliate_name IS NOT NULL
    GROUP BY affiliate_name, affiliate_email
    ORDER BY total_sales DESC
    LIMIT 50`,
    gateway.id
  );

  // Calculate summary
  const totalAffiliates = affiliateQuery.length;
  const totalSales = affiliateQuery.reduce((sum, a) => sum + Number(a.total_sales), 0);
  const totalRevenue = affiliateQuery.reduce((sum, a) => sum + Number(a.total_revenue), 0);
  const totalCommission = affiliateQuery.reduce((sum, a) => sum + Number(a.total_commission), 0);

  return {
    affiliates: affiliateQuery.map((a, index) => ({
      id: `affiliate-${index}`,
      name: a.affiliate_name,
      email: a.affiliate_email,
      phone: null,
      totalSales: Number(a.total_sales),
      totalRevenue: Number(a.total_revenue),
      totalCommission: Number(a.total_commission),
    })),
    summary: {
      totalAffiliates,
      totalSales,
      totalRevenue,
      totalCommission,
    },
  };
}

export async function getSalesBySource(
  userId: string,
  gatewayId?: string,
  dateFilter?: DateFilter
): Promise<unknown> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: gatewayId ? { id: gatewayId, userId } : { userId },
  });

  if (!gateway) {
    return { affiliate: { count: 0, revenue: 0 }, direct: { count: 0, revenue: 0 } };
  }

  // Build date condition for raw query
  let dateCondition = '';
  if (dateFilter?.startDate && dateFilter?.endDate) {
    const startDateStr = dateFilter.startDate + ' 00:00:00';
    const endDateStr = dateFilter.endDate + ' 23:59:59';
    dateCondition = `AND s."transCreateDate" >= '${startDateStr}'::timestamp AND s."transCreateDate" <= '${endDateStr}'::timestamp`;
  }

  // Raw query for affiliate vs direct sales
  const result = await prisma.$queryRawUnsafe<Array<{ fonte: string; quantidade: bigint; valor_total: bigint }>>(
    `SELECT
      CASE
        WHEN s.commissions::text LIKE '%"type": "Afiliado"%' THEN 'Afiliado'
        ELSE 'Produtor'
      END as fonte,
      COUNT(*)::bigint as quantidade,
      COALESCE(SUM(s."transValue"), 0)::bigint as valor_total
    FROM sales s
    WHERE s."gatewayConfigId" = $1
      AND s."transStatus" IN ('Aprovado', 'Pagamento Aprovado')
      ${dateCondition}
    GROUP BY 1`,
    gateway.id
  );

  const affiliateSales = result.find(r => r.fonte === 'Afiliado');
  const directSales = result.find(r => r.fonte === 'Produtor');

  return {
    affiliate: {
      count: Number(affiliateSales?.quantidade || 0),
      revenue: Number(affiliateSales?.valor_total || 0),
    },
    direct: {
      count: Number(directSales?.quantidade || 0),
      revenue: Number(directSales?.valor_total || 0),
    },
  };
}

export async function getProductsWithPlans(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: gatewayId ? { id: gatewayId, userId } : { userId },
  });

  if (!gateway) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: { gatewayConfigId: gateway.id },
    include: {
      plans: {
        orderBy: { totalSales: 'desc' },
      },
    },
    orderBy: { totalSales: 'desc' },
  });

  return products.map(p => ({
    id: p.id,
    name: p.name,
    totalSales: p.totalSales,
    totalRevenue: p.totalRevenue,
    totalAbandons: p.totalAbandons,
    conversionRate: p.conversionRate,
    plans: p.plans.map(pl => ({
      id: pl.id,
      name: pl.planName,
      totalSales: pl.totalSales,
      totalRevenue: pl.totalRevenue,
    })),
  }));
}

// ==================== HEATMAP ====================

export async function getSalesHeatmap(
  userId: string,
  gatewayId?: string,
  dateFilter?: DateFilter
): Promise<{ heatmapData: Array<{ dayOfWeek: number; hour: number; count: number; revenue: number }> }> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  if (dateFilter?.startDate || dateFilter?.endDate) {
    where.transCreateDate = {};
    if (dateFilter.startDate) {
      where.transCreateDate.gte = new Date(dateFilter.startDate + 'T00:00:00');
    }
    if (dateFilter.endDate) {
      where.transCreateDate.lte = new Date(dateFilter.endDate + 'T23:59:59');
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      transCreateDate: true,
      transTotalValue: true,
    },
  });

  // Group by day of week (0-6, Sunday-Saturday) and hour (0-23)
  const heatmap: Record<string, { count: number; revenue: number }> = {};

  for (const sale of sales) {
    const date = new Date(sale.transCreateDate);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;

    if (!heatmap[key]) {
      heatmap[key] = { count: 0, revenue: 0 };
    }
    heatmap[key].count += 1;
    heatmap[key].revenue += sale.transTotalValue;
  }

  // Convert to array format
  const heatmapData = Object.entries(heatmap).map(([key, data]) => {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    return {
      dayOfWeek,
      hour,
      count: data.count,
      revenue: data.revenue,
    };
  });

  return { heatmapData };
}

export async function getFullDashboard(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const [
    metrics,
    affiliateStats,
    salesBySource,
    productsWithPlans,
    comparison,
    funnel,
  ] = await Promise.all([
    getDashboardMetrics(userId, gatewayId),
    getAffiliateStats(userId, gatewayId),
    getSalesBySource(userId, gatewayId),
    getProductsWithPlans(userId, gatewayId),
    getComparison(userId, gatewayId),
    getConversionFunnel(userId, gatewayId),
  ]);

  return {
    metrics,
    affiliateStats,
    salesBySource,
    productsWithPlans,
    comparison,
    funnel,
  };
}
