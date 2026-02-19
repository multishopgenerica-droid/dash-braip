import { prisma } from '../../../config/database';
import { financialDashboardService } from './dashboard.service';

export type ReportType = 'summary' | 'detailed' | 'expenses' | 'traffic';
export type ReportFormat = 'csv' | 'json';

export interface ReportOptions {
  type: ReportType;
  startDate?: Date;
  endDate?: Date;
  format: ReportFormat;
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function arrayToCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export class ReportService {
  async generateReport(userId: string, options: ReportOptions): Promise<{ data: string | object; filename: string }> {
    const now = new Date();
    const startDate = options.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = options.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    switch (options.type) {
      case 'summary':
        return this.generateSummaryReport(userId, startDate, endDate, options.format, startStr, endStr);
      case 'detailed':
        return this.generateDetailedReport(userId, startDate, endDate, options.format, startStr, endStr);
      case 'expenses':
        return this.generateExpensesReport(userId, startDate, endDate, options.format, startStr, endStr);
      case 'traffic':
        return this.generateTrafficReport(userId, startDate, endDate, options.format, startStr, endStr);
      default:
        throw new Error(`Tipo de relatório inválido: ${options.type}`);
    }
  }

  private async generateSummaryReport(userId: string, startDate: Date, endDate: Date, format: ReportFormat, startStr: string, endStr: string) {
    const macro = await financialDashboardService.getMacroView(userId, startDate, endDate);

    if (format === 'csv') {
      const headers = ['Métrica', 'Valor (R$)'];
      const rows: (string | number)[][] = [
        ['Faturamento - Vendas', formatCentsToBRL(macro.revenue.sales)],
        ['Faturamento - Tráfego', formatCentsToBRL(macro.revenue.trafficRevenue)],
        ['Faturamento - Total', formatCentsToBRL(macro.revenue.total)],
        ['Custos - Despesas', formatCentsToBRL(macro.costs.expenses)],
        ['Custos - Folha de Pagamento', formatCentsToBRL(macro.costs.payroll)],
        ['Custos - Ferramentas', formatCentsToBRL(macro.costs.tools)],
        ['Custos - Tráfego', formatCentsToBRL(macro.costs.traffic)],
        ['Custos - Total', formatCentsToBRL(macro.costs.total)],
        ['Lucro Líquido', formatCentsToBRL(macro.profit.net)],
        ['Margem de Lucro (%)', String(macro.profit.margin)],
      ];
      return { data: arrayToCSV(headers, rows), filename: `relatorio-resumo-${startStr}-${endStr}.csv` };
    }

    return { data: macro, filename: `relatorio-resumo-${startStr}-${endStr}.json` };
  }

  private async generateDetailedReport(userId: string, startDate: Date, endDate: Date, format: ReportFormat, startStr: string, endStr: string) {
    const macro = await financialDashboardService.getMacroView(userId, startDate, endDate);

    if (format === 'csv') {
      const lines: string[] = [];

      // KPIs section
      lines.push('=== RESUMO FINANCEIRO ===');
      lines.push('Métrica,Valor (R$)');
      lines.push(`Faturamento Total,${formatCentsToBRL(macro.revenue.total)}`);
      lines.push(`Custos Totais,${formatCentsToBRL(macro.costs.total)}`);
      lines.push(`Lucro Líquido,${formatCentsToBRL(macro.profit.net)}`);
      lines.push(`Margem de Lucro (%),${macro.profit.margin}`);
      lines.push('');

      // Expenses by category
      lines.push('=== DESPESAS POR CATEGORIA ===');
      lines.push('Categoria,Total (R$)');
      for (const cat of macro.breakdown.expensesByCategory) {
        lines.push(`${escapeCSV(cat.category)},${formatCentsToBRL(cat.total)}`);
      }
      lines.push('');

      // Employees by role
      lines.push('=== FUNCIONÁRIOS POR CARGO ===');
      lines.push('Cargo,Quantidade,Salário Total (R$)');
      for (const emp of macro.breakdown.employeesByRole) {
        lines.push(`${escapeCSV(emp.role)},${emp.count},${formatCentsToBRL(emp.totalSalary)}`);
      }
      lines.push('');

      // Tools by category
      lines.push('=== FERRAMENTAS POR CATEGORIA ===');
      lines.push('Categoria,Quantidade,Custo Total (R$)');
      for (const tool of macro.breakdown.toolsByCategory) {
        lines.push(`${escapeCSV(tool.category)},${tool.count},${formatCentsToBRL(tool.totalCost)}`);
      }
      lines.push('');

      // Traffic by platform
      lines.push('=== TRÁFEGO POR PLATAFORMA ===');
      lines.push('Plataforma,Gasto (R$),Impressões,Cliques,Conversões,Receita (R$),ROAS');
      for (const t of macro.breakdown.trafficByPlatform) {
        lines.push(`${escapeCSV(t.platform)},${formatCentsToBRL(t.spend)},${t.impressions},${t.clicks},${t.conversions},${formatCentsToBRL(t.revenue)},${t.roas}`);
      }

      return { data: lines.join('\n'), filename: `relatorio-detalhado-${startStr}-${endStr}.csv` };
    }

    return { data: macro, filename: `relatorio-detalhado-${startStr}-${endStr}.json` };
  }

  private async generateExpensesReport(userId: string, startDate: Date, endDate: Date, format: ReportFormat, startStr: string, endStr: string) {
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        dueDate: { gte: startDate, lte: endDate },
      },
      orderBy: { dueDate: 'asc' },
      include: { employee: true, tool: true },
    });

    if (format === 'csv') {
      const headers = ['Nome', 'Categoria', 'Status', 'Valor (R$)', 'Vencimento', 'Pago em', 'Recorrência', 'Observações'];
      const rows = expenses.map(e => [
        e.name,
        e.category,
        e.status,
        formatCentsToBRL(e.amount),
        e.dueDate ? new Date(e.dueDate).toLocaleDateString('pt-BR') : '',
        e.paidAt ? new Date(e.paidAt).toLocaleDateString('pt-BR') : '',
        e.recurrence,
        e.notes || '',
      ]);
      return { data: arrayToCSV(headers, rows), filename: `relatorio-despesas-${startStr}-${endStr}.csv` };
    }

    return { data: expenses, filename: `relatorio-despesas-${startStr}-${endStr}.json` };
  }

  private async generateTrafficReport(userId: string, startDate: Date, endDate: Date, format: ReportFormat, startStr: string, endStr: string) {
    const traffic = await prisma.trafficSpend.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    if (format === 'csv') {
      const headers = ['Plataforma', 'Campanha', 'Data', 'Gasto (R$)', 'Impressões', 'Cliques', 'Conversões', 'Receita (R$)', 'ROAS'];
      const rows = traffic.map(t => [
        t.platform,
        t.campaignName || '',
        new Date(t.date).toLocaleDateString('pt-BR'),
        formatCentsToBRL(t.spend),
        t.impressions,
        t.clicks,
        t.conversions,
        formatCentsToBRL(t.revenue),
        t.spend > 0 ? (t.revenue / t.spend).toFixed(2) : '0',
      ]);
      return { data: arrayToCSV(headers, rows), filename: `relatorio-trafego-${startStr}-${endStr}.csv` };
    }

    return { data: traffic, filename: `relatorio-trafego-${startStr}-${endStr}.json` };
  }
}

export const reportService = new ReportService();
