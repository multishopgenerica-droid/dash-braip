import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { parseDate, getDateRangeFromPeriod, startOfDay, endOfDay } from '../../shared/utils/date';
import { AppError } from '../../shared/middlewares/error.middleware';
import { SALE_STATUS, SALE_STATUS_LABELS, PAYMENT_TYPE_LABELS } from '../../shared/constants/status-codes';
import { SalesQueryDTO } from './sales.dto';

// Helper function to map sale data with readable labels
function mapSaleWithLabels(sale: Record<string, unknown>): Record<string, unknown> {
  return {
    ...sale,
    paymentTypeName: PAYMENT_TYPE_LABELS[sale.paymentType as number] || `Tipo ${sale.paymentType}`,
    transStatusName: SALE_STATUS_LABELS[sale.transStatusCode as number] || sale.transStatus,
  };
}

export async function listSales(
  userId: string,
  query: SalesQueryDTO
): Promise<PaginatedResult<unknown>> {
  const { skip, take, page } = getPaginationParams(query);

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (query.gatewayId) {
    where.gatewayConfigId = query.gatewayId;
  }

  if (query.status) {
    where.transStatusCode = parseInt(query.status, 10);
  }

  if (query.productKey) {
    where.productKey = query.productKey;
  }

  if (query.startDate && query.endDate) {
    const start = parseDate(query.startDate);
    const end = parseDate(query.endDate);
    if (start && end) {
      where.transCreateDate = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    }
  }

  if (query.search) {
    where.OR = [
      { clientName: { contains: query.search, mode: 'insensitive' } },
      { clientEmail: { contains: query.search, mode: 'insensitive' } },
      { productName: { contains: query.search, mode: 'insensitive' } },
      { transKey: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take,
      orderBy: { transCreateDate: 'desc' },
      include: {
        items: true,
        gatewayConfig: {
          select: { gateway: true },
        },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  // Map sales with readable labels
  const salesWithLabels = sales.map(sale => mapSaleWithLabels(sale as unknown as Record<string, unknown>));

  return createPaginatedResult(salesWithLabels, total, page, take);
}

export async function getSaleById(userId: string, saleId: string): Promise<unknown> {
  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      gatewayConfig: { userId },
    },
    include: {
      items: true,
      gatewayConfig: {
        select: { gateway: true },
      },
    },
  });

  if (!sale) {
    throw new AppError(404, 'Venda nao encontrada');
  }

  return mapSaleWithLabels(sale as unknown as Record<string, unknown>);
}

export async function getSalesStats(userId: string, gatewayId?: string): Promise<unknown> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const [total, approved, pending, canceled, chargebacks] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.CANCELADA } }),
    prisma.sale.count({ where: { ...where, transStatusCode: SALE_STATUS.CHARGEBACK } }),
  ]);

  const revenue = await prisma.sale.aggregate({
    where: { ...where, transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO },
    _sum: { transValue: true },
  });

  return {
    total,
    approved,
    pending,
    canceled,
    chargebacks,
    totalRevenue: revenue._sum.transValue || 0,
    conversionRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
  };
}

interface FilterOptions {
  gatewayId?: string;
  startDate?: string;
  endDate?: string;
  productKey?: string;
  period?: string;
}

export async function getSalesByStatus(userId: string, options: FilterOptions = {}): Promise<unknown> {
  const { gatewayId, startDate, endDate, productKey } = options;

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  if (startDate && endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start && end) {
      where.transCreateDate = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    }
  }

  if (productKey) {
    where.productKey = productKey;
  }

  const result = await prisma.sale.groupBy({
    by: ['transStatusCode'],
    where,
    _count: true,
    _sum: {
      transValue: true,
    },
  });

  return result.map((item) => ({
    transStatusCode: item.transStatusCode,
    _count: item._count,
    _sum: { transValue: item._sum.transValue || 0 },
  }));
}

export async function getSalesByProduct(
  userId: string,
  options: FilterOptions = {}
): Promise<unknown> {
  const { gatewayId, startDate, endDate } = options;

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  if (startDate && endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start && end) {
      where.transCreateDate = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    }
  }

  const result = await prisma.sale.groupBy({
    by: ['productKey', 'productName'],
    where,
    _count: true,
    _sum: {
      transValue: true,
    },
    orderBy: {
      _count: {
        productKey: 'desc',
      },
    },
  });

  return result.map((item) => ({
    productKey: item.productKey,
    productName: item.productName,
    _count: item._count,
    _sum: { transValue: item._sum.transValue || 0 },
  }));
}

export async function getSalesByPeriod(
  userId: string,
  options: FilterOptions = {}
): Promise<unknown> {
  const { period = 'last30days', gatewayId, startDate, endDate, productKey } = options;

  let dateFilter: { gte: Date; lte: Date };

  if (startDate && endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start && end) {
      dateFilter = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    } else {
      const range = getDateRangeFromPeriod(period);
      dateFilter = { gte: range.start, lte: range.end };
    }
  } else {
    const range = getDateRangeFromPeriod(period);
    dateFilter = { gte: range.start, lte: range.end };
  }

  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: dateFilter,
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  if (productKey) {
    where.productKey = productKey;
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      transCreateDate: true,
      transStatusCode: true,
      transValue: true,
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
      grouped[dateKey].revenue += sale.transValue;
    }
  }

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    ...data,
  }));
}

export async function getRecentSales(
  userId: string,
  limit: number = 10,
  gatewayId?: string
): Promise<unknown[]> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const sales = await prisma.sale.findMany({
    where,
    take: limit,
    orderBy: { transCreateDate: 'desc' },
    select: {
      id: true,
      transKey: true,
      productName: true,
      clientName: true,
      transTotalValue: true,
      transStatusCode: true,
      transStatus: true,
      transCreateDate: true,
      paymentType: true,
    },
  });

  return sales.map(sale => mapSaleWithLabels(sale as unknown as Record<string, unknown>));
}
