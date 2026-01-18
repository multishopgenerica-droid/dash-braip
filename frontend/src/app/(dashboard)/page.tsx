"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  PercentIcon,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percentage";
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percentage"
      ? formatPercentage(value)
      : formatNumber(value);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formattedValue}
          </p>
        </div>
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm font-medium ${
              change >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            vs. mes anterior
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => analyticsService.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Visao geral do seu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Faturamento Total"
          value={metrics?.revenue?.total || 0}
          change={metrics?.trends?.revenueGrowth}
          icon={DollarSign}
          format="currency"
        />
        <StatsCard
          title="Vendas Aprovadas"
          value={metrics?.sales?.approved || 0}
          change={metrics?.trends?.salesGrowth}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Carrinhos Abandonados"
          value={metrics?.abandons?.total || 0}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Taxa de Conversao"
          value={metrics?.conversion?.rate || 0}
          icon={PercentIcon}
          format="percentage"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumo de Vendas
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Total de Vendas
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(metrics?.sales?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Aprovadas</span>
              <span className="font-medium text-green-500">
                {formatNumber(metrics?.sales?.approved || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Pendentes</span>
              <span className="font-medium text-yellow-500">
                {formatNumber(metrics?.sales?.pending || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Canceladas</span>
              <span className="font-medium text-red-500">
                {formatNumber(metrics?.sales?.canceled || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Chargebacks
              </span>
              <span className="font-medium text-red-500">
                {formatNumber(metrics?.sales?.chargebacks || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metricas Financeiras
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Faturamento Bruto
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(metrics?.revenue?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Ticket Medio
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(metrics?.revenue?.ticketMedio || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Taxa de Conversao
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPercentage(metrics?.conversion?.rate || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">
                Taxa de Chargeback
              </span>
              <span className="font-medium text-red-500">
                {formatPercentage(metrics?.conversion?.chargebackRate || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
