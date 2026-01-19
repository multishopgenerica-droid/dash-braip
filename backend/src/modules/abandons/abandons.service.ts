import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { parseDate, getDateRangeFromPeriod, startOfDay, endOfDay } from '../../shared/utils/date';
import { AppError } from '../../shared/middlewares/error.middleware';
import { AbandonsQueryDTO } from './abandons.dto';

export async function listAbandons(
  userId: string,
  query: AbandonsQueryDTO
): Promise<PaginatedResult<unknown>> {
  const { skip, take, page } = getPaginationParams(query);

  const where: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
  };

  if (query.gatewayId) {
    where.gatewayConfigId = query.gatewayId;
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
    ];
  }

  const [abandons, total] = await Promise.all([
    prisma.abandon.findMany({
      where,
      skip,
      take,
      orderBy: { transCreateDate: 'desc' },
      include: {
        gatewayConfig: {
          select: { gateway: true },
        },
      },
    }),
    prisma.abandon.count({ where }),
  ]);

  return createPaginatedResult(abandons, total, page, take);
}

export async function getAbandonById(userId: string, abandonId: string): Promise<unknown> {
  const abandon = await prisma.abandon.findFirst({
    where: {
      id: abandonId,
      gatewayConfig: { userId },
    },
    include: {
      gatewayConfig: {
        select: { gateway: true },
      },
    },
  });

  if (!abandon) {
    throw new AppError(404, 'Abandono nao encontrado');
  }

  return abandon;
}

interface StatsFilter {
  gatewayId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAbandonsStats(userId: string, filters: StatsFilter = {}): Promise<unknown> {
  const where: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
  };

  if (filters.gatewayId) {
    where.gatewayConfigId = filters.gatewayId;
  }

  // Apply date filter if provided
  if (filters.startDate && filters.endDate) {
    const start = parseDate(filters.startDate);
    const end = parseDate(filters.endDate);
    if (start && end) {
      where.transCreateDate = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    }
  }

  const total = await prisma.abandon.count({ where });

  // Today's abandons (within the filtered period if applicable)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayWhere: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: { gte: today, lt: tomorrow },
  };
  if (filters.gatewayId) {
    todayWhere.gatewayConfigId = filters.gatewayId;
  }

  const todayAbandons = await prisma.abandon.count({ where: todayWhere });

  // This week's abandons
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekWhere: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: { gte: weekStart },
  };
  if (filters.gatewayId) {
    weekWhere.gatewayConfigId = filters.gatewayId;
  }

  const weekAbandons = await prisma.abandon.count({ where: weekWhere });

  // This month's abandons
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthWhere: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: { gte: monthStart },
  };
  if (filters.gatewayId) {
    monthWhere.gatewayConfigId = filters.gatewayId;
  }

  const monthAbandons = await prisma.abandon.count({ where: monthWhere });

  return {
    total,
    today: todayAbandons,
    thisWeek: weekAbandons,
    thisMonth: monthAbandons,
  };
}

export async function getAbandonsByProduct(
  userId: string,
  gatewayId?: string
): Promise<unknown> {
  const where: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const result = await prisma.abandon.groupBy({
    by: ['productKey', 'productName'],
    where,
    _count: true,
    orderBy: {
      _count: {
        productKey: 'desc',
      },
    },
    take: 10,
  });

  return result.map((item) => ({
    productKey: item.productKey,
    productName: item.productName,
    count: item._count,
  }));
}

export async function getAbandonsByPeriod(
  userId: string,
  period: string = 'last30days',
  gatewayId?: string
): Promise<unknown> {
  const { start, end } = getDateRangeFromPeriod(period);

  const where: Prisma.AbandonWhereInput = {
    gatewayConfig: { userId },
    transCreateDate: {
      gte: start,
      lte: end,
    },
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const abandons = await prisma.abandon.findMany({
    where,
    select: {
      transCreateDate: true,
    },
    orderBy: { transCreateDate: 'asc' },
  });

  // Group by date
  const grouped: Record<string, number> = {};

  for (const abandon of abandons) {
    const dateKey = abandon.transCreateDate.toISOString().split('T')[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + 1;
  }

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count,
  }));
}
