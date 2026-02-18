import { prisma } from '../../../config/database';
import { CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeFilterDTO } from '../dto/employee.dto';
import { EmployeeRole, EmployeeStatus } from '@prisma/client';

export class EmployeeService {
  async create(userId: string, data: CreateEmployeeDTO) {
    return prisma.employee.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        role: data.role as EmployeeRole,
        status: data.status as EmployeeStatus,
        salary: data.salary,
        bonus: data.bonus || 0,
        benefits: data.benefits || 0,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        paymentDay: data.paymentDay || 5,
        notes: data.notes,
      },
    });
  }

  async findAll(userId: string, filters: EmployeeFilterDTO) {
    const { page, limit, role, status } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (role) where.role = role;
    if (status) where.status = status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    return prisma.employee.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateEmployeeDTO) {
    const employee = await this.findById(userId, id);
    if (!employee) return null;

    return prisma.employee.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.document !== undefined && { document: data.document }),
        ...(data.role && { role: data.role as EmployeeRole }),
        ...(data.status && { status: data.status as EmployeeStatus }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.bonus !== undefined && { bonus: data.bonus }),
        ...(data.benefits !== undefined && { benefits: data.benefits }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.paymentDay !== undefined && { paymentDay: data.paymentDay }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const employee = await this.findById(userId, id);
    if (!employee) return null;

    await prisma.expense.updateMany({
      where: { employeeId: id },
      data: { employeeId: null },
    });

    return prisma.employee.delete({ where: { id } });
  }

  async getMonthlyPayroll(userId: string) {
    const result = await prisma.employee.aggregate({
      where: {
        userId,
        status: 'ATIVO',
      },
      _sum: {
        salary: true,
        bonus: true,
        benefits: true,
      },
    });

    return {
      salaries: result._sum.salary || 0,
      bonuses: result._sum.bonus || 0,
      benefits: result._sum.benefits || 0,
      total: (result._sum.salary || 0) + (result._sum.bonus || 0) + (result._sum.benefits || 0),
    };
  }

  async getByRole(userId: string) {
    const result = await prisma.employee.groupBy({
      by: ['role'],
      where: { userId, status: 'ATIVO' },
      _count: true,
      _sum: { salary: true },
    });

    return result.map(item => ({
      role: item.role,
      count: item._count,
      totalSalary: item._sum.salary || 0,
    }));
  }
}

export const employeeService = new EmployeeService();
