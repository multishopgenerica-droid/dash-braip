import { prisma } from '../../../config/database';
import { expenseService } from './expense.service';
import { employeeService } from './employee.service';
import { toolService } from './tool.service';
import { trafficService } from './traffic.service';

// Status code for approved payment
const PAGAMENTO_APROVADO = 2;

export class FinancialDashboardService {
  async getMacroView(userId: string, startDate?: Date, endDate?: Date) {
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get revenue from approved sales (via gatewayConfig relation)
    const salesRevenue = await prisma.sale.aggregate({
      where: {
        gatewayConfig: { userId },
        transStatusCode: PAGAMENTO_APROVADO,
        transCreateDate: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      },
      _sum: {
        transValue: true,
      },
    });

    // Get expenses total (excluding cancelled)
    const expenses = await prisma.expense.aggregate({
      where: {
        userId,
        status: { not: 'CANCELADO' },
        dueDate: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get payroll (monthly estimate)
    const payroll = await employeeService.getMonthlyPayroll(userId);

    // Get tools cost (monthly estimate)
    const toolsCost = await toolService.getMonthlyToolsCost(userId);

    // Get traffic spend
    const trafficSpend = await prisma.trafficSpend.aggregate({
      where: {
        userId,
        date: {
          gte: defaultStartDate,
          lte: defaultEndDate,
        },
      },
      _sum: {
        spend: true,
        revenue: true,
      },
    });

    const revenue = salesRevenue._sum?.transValue || 0;
    const expensesTotal = expenses._sum?.amount || 0;
    const payrollTotal = payroll.total;
    const toolsTotal = toolsCost;
    const trafficTotal = trafficSpend._sum?.spend || 0;
    const trafficRevenue = trafficSpend._sum?.revenue || 0;

    const totalCosts = expensesTotal + payrollTotal + toolsTotal + trafficTotal;
    const totalRevenue = revenue + trafficRevenue;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

    return {
      period: {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      },
      revenue: {
        sales: revenue,
        trafficRevenue,
        total: revenue + trafficRevenue,
      },
      costs: {
        expenses: expensesTotal,
        payroll: payrollTotal,
        tools: toolsTotal,
        traffic: trafficTotal,
        total: totalCosts,
      },
      profit: {
        net: netProfit,
        margin: profitMargin,
      },
      breakdown: {
        expensesByCategory: await expenseService.getTotalByCategory(userId, defaultStartDate, defaultEndDate),
        employeesByRole: await employeeService.getByRole(userId),
        toolsByCategory: await toolService.getByCategory(userId),
        trafficByPlatform: await trafficService.getByPlatform(userId, defaultStartDate, defaultEndDate),
      },
    };
  }

  async getMonthlyTrend(userId: string, months: number = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const [salesRevenue, expenses, traffic, payroll, toolsCost] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            gatewayConfig: { userId },
            transStatusCode: PAGAMENTO_APROVADO,
            transCreateDate: { gte: startDate, lte: endDate },
          },
          _sum: { transValue: true },
        }),
        prisma.expense.aggregate({
          where: {
            userId,
            status: { not: 'CANCELADO' },
            dueDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.trafficSpend.aggregate({
          where: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { spend: true },
        }),
        employeeService.getMonthlyPayroll(userId),
        toolService.getMonthlyToolsCost(userId),
      ]);

      const revenue = salesRevenue._sum?.transValue || 0;
      const expenseTotal = expenses._sum?.amount || 0;
      const trafficTotal = traffic._sum?.spend || 0;
      const payrollTotal = payroll.total;
      const toolsTotal = toolsCost;

      trends.push({
        month: `${year}-${String(month).padStart(2, '0')}`,
        revenue,
        expenses: expenseTotal,
        traffic: trafficTotal,
        payroll: payrollTotal,
        tools: toolsTotal,
        profit: revenue - expenseTotal - trafficTotal - payrollTotal - toolsTotal,
      });
    }

    return trends;
  }

  async getSummaryCards(userId: string, startDate?: Date, endDate?: Date) {
    const now = new Date();
    const startOfMonth = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [activeEmployees, activeTools, pendingExpenses, totalTrafficSpend] = await Promise.all([
      prisma.employee.count({ where: { userId, status: 'ATIVO' } }),
      prisma.tool.count({ where: { userId, isActive: true } }),
      prisma.expense.count({
        where: {
          userId,
          status: 'PENDENTE',
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.trafficSpend.aggregate({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { spend: true },
      }),
    ]);

    return {
      activeEmployees,
      activeTools,
      pendingExpenses,
      monthlyTrafficSpend: totalTrafficSpend._sum?.spend || 0,
    };
  }
}

export const financialDashboardService = new FinancialDashboardService();
