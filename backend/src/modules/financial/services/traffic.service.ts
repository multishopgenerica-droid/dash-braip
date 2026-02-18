import { prisma } from '../../../config/database';
import { CreateTrafficSpendDTO, UpdateTrafficSpendDTO, TrafficFilterDTO } from '../dto/traffic.dto';
import { TrafficPlatform } from '@prisma/client';

export class TrafficService {
  async create(userId: string, data: CreateTrafficSpendDTO) {
    const dateValue = new Date(data.date);

    // Verificar duplicata antes de inserir (campaignId pode ser NULL, e NULL != NULL no PostgreSQL)
    const existing = await prisma.trafficSpend.findFirst({
      where: {
        userId,
        platform: data.platform as TrafficPlatform,
        date: dateValue,
        campaignName: data.campaignName || null,
      },
    });
    if (existing) {
      throw new Error('DUPLICATE_TRAFFIC_SPEND');
    }

    return prisma.trafficSpend.create({
      data: {
        userId,
        platform: data.platform as TrafficPlatform,
        campaignName: data.campaignName,
        date: dateValue,
        spend: data.spend,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        conversions: data.conversions || 0,
        revenue: data.revenue || 0,
        notes: data.notes,
      },
    });
  }

  async findAll(userId: string, filters: TrafficFilterDTO) {
    const { page, limit, platform, campaignName, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (platform) where.platform = platform;
    if (campaignName) where.campaignName = { contains: campaignName, mode: 'insensitive' };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
    }

    const [trafficSpends, total] = await Promise.all([
      prisma.trafficSpend.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trafficSpend.count({ where }),
    ]);

    return {
      data: trafficSpends,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    return prisma.trafficSpend.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateTrafficSpendDTO) {
    const traffic = await this.findById(userId, id);
    if (!traffic) return null;

    return prisma.trafficSpend.update({
      where: { id },
      data: {
        ...(data.platform && { platform: data.platform as TrafficPlatform }),
        ...(data.campaignName !== undefined && { campaignName: data.campaignName }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.spend !== undefined && { spend: data.spend }),
        ...(data.impressions !== undefined && { impressions: data.impressions }),
        ...(data.clicks !== undefined && { clicks: data.clicks }),
        ...(data.conversions !== undefined && { conversions: data.conversions }),
        ...(data.revenue !== undefined && { revenue: data.revenue }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const traffic = await this.findById(userId, id);
    if (!traffic) return null;

    return prisma.trafficSpend.delete({ where: { id } });
  }

  async getByPlatform(userId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, Date>).gte = startDate;
      if (endDate) (where.date as Record<string, Date>).lte = endDate;
    }

    const result = await prisma.trafficSpend.groupBy({
      by: ['platform'],
      where,
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    return result.map(item => ({
      platform: item.platform,
      spend: item._sum.spend || 0,
      impressions: item._sum.impressions || 0,
      clicks: item._sum.clicks || 0,
      conversions: item._sum.conversions || 0,
      revenue: item._sum.revenue || 0,
      roas: item._sum.spend ? ((item._sum.revenue || 0) / item._sum.spend).toFixed(2) : '0.00',
    }));
  }

  async getMonthlySpend(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.trafficSpend.aggregate({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        spend: true,
        revenue: true,
        conversions: true,
      },
    });

    return {
      spend: result._sum.spend || 0,
      revenue: result._sum.revenue || 0,
      conversions: result._sum.conversions || 0,
      roas: result._sum.spend ? ((result._sum.revenue || 0) / result._sum.spend).toFixed(2) : '0.00',
    };
  }

  async getDailySpend(userId: string, startDate: Date, endDate: Date) {
    const result = await prisma.trafficSpend.groupBy({
      by: ['date'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        spend: true,
        revenue: true,
        conversions: true,
      },
      orderBy: { date: 'asc' },
    });

    return result.map(item => ({
      date: item.date,
      spend: item._sum.spend || 0,
      revenue: item._sum.revenue || 0,
      conversions: item._sum.conversions || 0,
    }));
  }
}

export const trafficService = new TrafficService();
