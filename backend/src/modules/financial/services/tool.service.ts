import { prisma } from '../../../config/database';
import { CreateToolDTO, UpdateToolDTO, ToolFilterDTO } from '../dto/tool.dto';
import { ToolCategory, RecurrenceType, Tool } from '@prisma/client';

export class ToolService {
  async create(userId: string, data: CreateToolDTO) {
    return prisma.tool.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        category: data.category as ToolCategory,
        monthlyCost: data.monthlyCost,
        annualCost: data.annualCost,
        recurrence: data.recurrence as RecurrenceType,
        billingDate: data.billingDate ? new Date(data.billingDate) : null,
        isActive: data.isActive ?? true,
        loginUrl: data.loginUrl,
        notes: data.notes,
      },
    });
  }

  async findAll(userId: string, filters: ToolFilterDTO) {
    const { page, limit, category, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.tool.count({ where }),
    ]);

    return {
      data: tools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    return prisma.tool.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateToolDTO) {
    const tool = await this.findById(userId, id);
    if (!tool) return null;

    return prisma.tool.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category as ToolCategory }),
        ...(data.monthlyCost !== undefined && { monthlyCost: data.monthlyCost }),
        ...(data.annualCost !== undefined && { annualCost: data.annualCost }),
        ...(data.recurrence && { recurrence: data.recurrence as RecurrenceType }),
        ...(data.billingDate !== undefined && { billingDate: data.billingDate ? new Date(data.billingDate) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.loginUrl !== undefined && { loginUrl: data.loginUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const tool = await this.findById(userId, id);
    if (!tool) return null;

    return prisma.tool.delete({ where: { id } });
  }

  async getMonthlyToolsCost(userId: string) {
    const tools = await prisma.tool.findMany({
      where: { userId, isActive: true },
    });

    let monthlyTotal = 0;

    tools.forEach((tool: Tool) => {
      switch (tool.recurrence) {
        case 'MENSAL':
          monthlyTotal += tool.monthlyCost;
          break;
        case 'ANUAL':
          monthlyTotal += Math.round(tool.monthlyCost / 12);
          break;
        case 'SEMESTRAL':
          monthlyTotal += Math.round(tool.monthlyCost / 6);
          break;
        case 'TRIMESTRAL':
          monthlyTotal += Math.round(tool.monthlyCost / 3);
          break;
        case 'SEMANAL':
          monthlyTotal += tool.monthlyCost * 4;
          break;
        case 'QUINZENAL':
          monthlyTotal += tool.monthlyCost * 2;
          break;
        case 'DIARIO':
          monthlyTotal += tool.monthlyCost * 30;
          break;
        default:
          monthlyTotal += tool.monthlyCost;
      }
    });

    return monthlyTotal;
  }

  async getByCategory(userId: string) {
    const result = await prisma.tool.groupBy({
      by: ['category'],
      where: { userId, isActive: true },
      _count: true,
      _sum: { monthlyCost: true },
    });

    return result.map((item: { category: ToolCategory; _count: number; _sum: { monthlyCost: number | null } }) => ({
      category: item.category,
      count: item._count,
      totalCost: item._sum.monthlyCost || 0,
    }));
  }
}

export const toolService = new ToolService();
