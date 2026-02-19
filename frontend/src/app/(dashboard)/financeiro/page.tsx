'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialService, formatCurrency, MacroView, MonthlyTrend, SummaryCards } from '@/services/financial.service';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Wrench,
  Receipt,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
} from 'lucide-react';
import { PeriodFilter, getDefaultPeriod, PeriodValue } from '@/components/financial/PeriodFilter';

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const variantStyles = {
    default: 'bg-zinc-800/50 border-zinc-700',
    success: 'bg-emerald-900/20 border-emerald-700/50',
    danger: 'bg-red-900/20 border-red-700/50',
    warning: 'bg-amber-900/20 border-amber-700/50',
  };

  return (
    <div className={`rounded-xl border p-6 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trend >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}
              <span className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-zinc-500 text-sm">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="rounded-full bg-zinc-700/50 p-3">
          <Icon className="h-6 w-6 text-zinc-300" />
        </div>
      </div>
    </div>
  );
}

function CostBreakdownCard({ macroView }: { macroView: MacroView }) {
  const costs = [
    { label: 'Despesas', value: macroView.costs.expenses, color: 'bg-blue-500' },
    { label: 'Folha de Pagamento', value: macroView.costs.payroll, color: 'bg-purple-500' },
    { label: 'Ferramentas', value: macroView.costs.tools, color: 'bg-amber-500' },
    { label: 'Tráfego', value: macroView.costs.traffic, color: 'bg-rose-500' },
  ];

  const total = macroView.costs.total;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Breakdown de Custos</h3>
      <div className="space-y-4">
        {costs.map((cost) => {
          const percentage = total > 0 ? (cost.value / total) * 100 : 0;
          return (
            <div key={cost.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">{cost.label}</span>
                <span className="text-white">{formatCurrency(cost.value)}</span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cost.color} rounded-full`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-700">
        <div className="flex justify-between">
          <span className="text-zinc-400 font-medium">Total</span>
          <span className="text-white font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function TrendChart({ trends }: { trends: MonthlyTrend[] }) {
  const maxRevenue = trends.length > 0 ? Math.max(...trends.map((t) => t.revenue)) : 0;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tendência Mensal</h3>
      <div className="flex items-end gap-2 h-48">
        {trends.map((trend) => {
          const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
          const profitPercentage = trend.revenue > 0 ? (trend.profit / trend.revenue) * 100 : 0;
          const monthIndex = parseInt(trend.month.split('-')[1], 10) - 1;

          return (
            <div key={trend.month} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${profitPercentage >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${formatCurrency(trend.revenue)} (Lucro: ${formatCurrency(trend.profit)})`}
              />
              <span className="text-xs text-zinc-500 mt-2">
                {MONTH_NAMES[monthIndex] || trend.month.split('-')[1]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-xs text-zinc-400">Lucro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs text-zinc-400">Prejuízo</span>
        </div>
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<PeriodValue>(getDefaultPeriod);
  const [isExporting, setIsExporting] = useState(false);

  const { data: macroView, isLoading: loadingMacro, isError: errorMacro } = useQuery({
    queryKey: ['financial', 'macro', period.startDate, period.endDate],
    queryFn: () => financialService.getMacroView(period.startDate, period.endDate),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trends, isLoading: loadingTrends, isError: errorTrends } = useQuery({
    queryKey: ['financial', 'trends'],
    queryFn: () => financialService.getMonthlyTrend(6),
    staleTime: 5 * 60 * 1000,
  });

  const { data: summary, isLoading: loadingSummary, isError: errorSummary } = useQuery({
    queryKey: ['financial', 'summary', period.startDate, period.endDate],
    queryFn: () => financialService.getSummaryCards(period.startDate, period.endDate),
    staleTime: 5 * 60 * 1000,
  });

  const handleExportReport = async (type: 'summary' | 'detailed' = 'detailed') => {
    setIsExporting(true);
    try {
      const blob = await financialService.generateReport({
        type,
        startDate: period.startDate,
        endDate: period.endDate,
        format: 'csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-financeiro-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const profitMargin = macroView ? (Number(macroView.profit.margin) || 0) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-zinc-400">Visão macro da operação</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <button
            onClick={() => handleExportReport('detailed')}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Relatório
          </button>
        </div>
      </div>

      {/* Main Stats */}
      {errorMacro ? (
        <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-6 text-center">
          <p className="text-red-400">Erro ao carregar dados financeiros. Tente novamente mais tarde.</p>
        </div>
      ) : loadingMacro ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Faturamento"
            value={macroView ? formatCurrency(macroView.revenue.total) : 'R$ 0,00'}
            icon={DollarSign}
            variant="default"
          />
          <StatCard
            title="Custos Totais"
            value={macroView ? formatCurrency(macroView.costs.total) : 'R$ 0,00'}
            icon={TrendingDown}
            variant="danger"
          />
          <StatCard
            title="Lucro Líquido"
            value={macroView ? formatCurrency(macroView.profit.net) : 'R$ 0,00'}
            icon={macroView && macroView.profit.net >= 0 ? TrendingUp : TrendingDown}
            variant={macroView && macroView.profit.net >= 0 ? 'success' : 'danger'}
          />
          <StatCard
            title="Margem de Lucro"
            value={`${profitMargin.toFixed(1)}%`}
            icon={Target}
            variant={profitMargin >= 20 ? 'success' : profitMargin >= 0 ? 'warning' : 'danger'}
          />
        </div>
      )}

      {/* Summary Cards */}
      {errorSummary ? (
        <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-6 text-center">
          <p className="text-red-400">Erro ao carregar resumo. Tente novamente mais tarde.</p>
        </div>
      ) : loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-purple-900/50 p-3">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Funcionarios Ativos</p>
              <p className="text-xl font-bold text-white">{summary?.activeEmployees || 0}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-amber-900/50 p-3">
              <Wrench className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Ferramentas Ativas</p>
              <p className="text-xl font-bold text-white">{summary?.activeTools || 0}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-rose-900/50 p-3">
              <Receipt className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Despesas Pendentes</p>
              <p className="text-xl font-bold text-white">{summary?.pendingExpenses || 0}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-blue-900/50 p-3">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Trafego do Mes</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(summary?.monthlyTrafficSpend || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {errorMacro ? (
          <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-6 text-center">
            <p className="text-red-400">Erro ao carregar breakdown de custos.</p>
          </div>
        ) : loadingMacro ? (
          <div className="h-64 bg-zinc-800 rounded-xl animate-pulse" />
        ) : macroView ? (
          <CostBreakdownCard macroView={macroView} />
        ) : null}
        {errorTrends ? (
          <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-6 text-center">
            <p className="text-red-400">Erro ao carregar tendencia mensal.</p>
          </div>
        ) : loadingTrends ? (
          <div className="h-64 bg-zinc-800 rounded-xl animate-pulse" />
        ) : trends ? (
          <TrendChart trends={trends} />
        ) : null}
      </div>
    </div>
  );
}
