import { prisma } from '../../../config/database';
import { CreateExpenseDTO, UpdateExpenseDTO, ExpenseFilterDTO } from '../dto/expense.dto';
import { ExpenseCategory, ExpenseStatus, RecurrenceType } from '@prisma/client';

export class ExpenseService {
  async create(userId: string, data: CreateExpenseDTO) {
    return prisma.expense.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        category: data.category as ExpenseCategory,
        status: data.status as ExpenseStatus,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
        recurrence: data.recurrence as RecurrenceType,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        employeeId: data.employeeId || null,
        toolId: data.toolId || null,
        notes: data.notes,
      },
    });
  }

  async findAll(userId: string, filters: ExpenseFilterDTO) {
    const { page, limit, category, status, recurrence, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (category) where.category = category;
    if (status) where.status = status;
    if (recurrence) where.recurrence = recurrence;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) (where.dueDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.dueDate as Record<string, Date>).lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    return prisma.expense.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateExpenseDTO) {
    const expense = await this.findById(userId, id);
    if (!expense) return null;

    return prisma.expense.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category && { category: data.category as ExpenseCategory }),
        ...(data.status && { status: data.status as ExpenseStatus }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.paidAt !== undefined && { paidAt: data.paidAt ? new Date(data.paidAt) : null }),
        ...(data.recurrence && { recurrence: data.recurrence as RecurrenceType }),
        ...(data.recurrenceEndDate !== undefined && { recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null }),
        ...(data.employeeId !== undefined && { employeeId: data.employeeId || null }),
        ...(data.toolId !== undefined && { toolId: data.toolId || null }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const expense = await this.findById(userId, id);
    if (!expense) return null;

    return prisma.expense.delete({ where: { id } });
  }

  async getTotalByCategory(userId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { userId, status: { not: 'CANCELADO' } };

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) (where.dueDate as Record<string, Date>).gte = startDate;
      if (endDate) (where.dueDate as Record<string, Date>).lte = endDate;
    }

    const result = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });

    return result.map(item => ({
      category: item.category,
      total: item._sum.amount || 0,
    }));
  }

  async getMonthlyTotal(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.expense.aggregate({
      where: {
        userId,
        status: { not: 'CANCELADO' },
        dueDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }
}

export const expenseService = new ExpenseService();
