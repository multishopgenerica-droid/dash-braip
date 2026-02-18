"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Filter,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";
import { analyticsService, Affiliate, HeatmapData } from "@/services/analytics.service";
import { gatewaysService } from "@/services/gateways.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { format, subDays, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

// ==================== COMPARISON CARD ====================
function ComparisonCard({
  title,
  icon: Icon,
  current,
  previous,
  currentLabel,
  previousLabel,
  format: formatType = "number",
}: {
  title: string;
  icon: React.ElementType;
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  format?: "number" | "currency";
}) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (value: number) =>
    formatType === "currency" ? formatCurrency(value) : formatNumber(value);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">{previousLabel}</p>
          <p className="text-xl font-bold text-gray-600 dark:text-gray-300">
            {formatValue(previous)}
          </p>
        </div>
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">{currentLabel}</p>
          <p className="text-xl font-bold text-primary">
            {formatValue(current)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}
        <span
          className={`text-lg font-bold ${
            isPositive ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isPositive ? "+" : ""}{change.toFixed(1)}%
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">
          {isPositive ? "crescimento" : "queda"}
        </span>
      </div>
    </div>
  );
}

// ==================== HEATMAP COMPONENT ====================
const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function SalesHeatmap({ data }: { data: HeatmapData[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-700";
    const intensity = count / maxCount;
    if (intensity < 0.2) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (intensity < 0.4) return "bg-emerald-200 dark:bg-emerald-800/40";
    if (intensity < 0.6) return "bg-emerald-300 dark:bg-emerald-700/50";
    if (intensity < 0.8) return "bg-emerald-400 dark:bg-emerald-600/60";
    return "bg-emerald-500 dark:bg-emerald-500";
  };

  const getValue = (day: number, hour: number) => {
    const item = data.find(d => d.dayOfWeek === day && d.hour === hour);
    return item ? item.count : 0;
  };

  const getRevenue = (day: number, hour: number) => {
    const item = data.find(d => d.dayOfWeek === day && d.hour === hour);
    return item ? item.revenue : 0;
  };

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <div className="min-w-[800px]">
        {/* Header - Hours */}
        <div className="flex mb-2">
          <div className="w-12"></div>
          {HOURS.map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-500">
              {hour}h
            </div>
          ))}
        </div>

        {/* Rows - Days */}
        {DAYS_OF_WEEK.map((day, dayIndex) => (
          <div key={day} className="flex mb-1">
            <div className="w-12 text-xs text-gray-500 flex items-center">{day}</div>
            {HOURS.map(hour => {
              const count = getValue(dayIndex, hour);
              const revenue = getRevenue(dayIndex, hour);
              return (
                <div
                  key={hour}
                  className={`flex-1 h-8 mx-0.5 rounded ${getColor(count)} cursor-pointer transition-all hover:scale-110 hover:z-10 relative group`}
                >
                  {/* Tooltip */}
                  <div className={`absolute ${dayIndex <= 1 ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 hidden group-hover:block z-[9999]`}>
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <p className="font-semibold">{day} às {hour}h</p>
                      <p>{count} vendas</p>
                      <p>{formatCurrency(revenue)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs text-gray-500">Menos</span>
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700"></div>
          <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-800/40"></div>
          <div className="w-4 h-4 rounded bg-emerald-300 dark:bg-emerald-700/50"></div>
          <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-600/60"></div>
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-xs text-gray-500">Mais</span>
        </div>
      </div>
    </div>
  );
}

// ==================== AFFILIATE TABLE ====================
function AffiliateTable({ affiliates, currentLabel, page = 1, limit = 20 }: { affiliates: Affiliate[]; currentLabel: string; page?: number; limit?: number }) {
  if (affiliates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum afiliado encontrado no período selecionado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">#</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Afiliado</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Vendas</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Faturamento</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Comissão</th>
          </tr>
        </thead>
        <tbody>
          {affiliates.map((affiliate, index) => (
            <tr key={affiliate.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="py-3 px-4">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  (page - 1) * limit + index === 0 ? "bg-yellow-100 text-yellow-700" :
                  (page - 1) * limit + index === 1 ? "bg-gray-100 text-gray-700" :
                  (page - 1) * limit + index === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {(page - 1) * limit + index + 1}
                </span>
              </td>
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900 dark:text-white">{affiliate.name}</p>
                {affiliate.email && (
                  <p className="text-xs text-gray-500">{affiliate.email}</p>
                )}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                {formatNumber(affiliate.totalSales)}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-blue-600">
                {formatCurrency(affiliate.totalRevenue)}
              </td>
              <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                {formatCurrency(affiliate.totalCommission)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== EXPORT FUNCTIONS ====================
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const value = row[h];
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

function exportToPDF(elementId: string, filename: string) {
  // Using browser print functionality as a simple PDF export
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          h1, h2, h3 { color: #333; }
          .card { border: 1px solid #ddd; padding: 16px; margin: 10px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Vendas</h1>
        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ==================== TYPES ====================
type ComparisonType = "daily" | "weekly" | "monthly" | "quarterly" | "semester" | "yearly" | "custom";

const COMPARISON_OPTIONS: { key: ComparisonType; label: string }[] = [
  { key: "daily", label: "Hoje vs Ontem" },
  { key: "weekly", label: "Esta Semana vs Anterior" },
  { key: "monthly", label: "Este Mês vs Anterior" },
  { key: "quarterly", label: "Este Trimestre vs Anterior" },
  { key: "semester", label: "Últimos 6 Meses vs Anteriores" },
  { key: "yearly", label: "Este Ano vs Ano Passado" },
  { key: "custom", label: "Personalizado" },
];

// ==================== MAIN PAGE ====================
export default function RelatoriosPage() {
  const [selectedComparison, setSelectedComparison] = useState<ComparisonType>("monthly");
  const [customCurrentStart, setCustomCurrentStart] = useState("");
  const [customCurrentEnd, setCustomCurrentEnd] = useState("");
  const [customPreviousStart, setCustomPreviousStart] = useState("");
  const [customPreviousEnd, setCustomPreviousEnd] = useState("");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [affiliatePage, setAffiliatePage] = useState(1);
  const [affiliateLimit, setAffiliateLimit] = useState(20);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateSearchDebounced, setAffiliateSearchDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setAffiliateSearchDebounced(affiliateSearch);
      setAffiliatePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [affiliateSearch]);

  const today = new Date();
  const yesterday = subDays(today, 1);

  // Weekly
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

  // Monthly
  const thisMonthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  // Quarterly
  const thisQuarterStart = startOfQuarter(today);
  const lastQuarterStart = startOfQuarter(subMonths(today, 3));
  const lastQuarterEnd = endOfQuarter(subMonths(today, 3));

  // Semester (6 months)
  const thisSemesterStart = subMonths(today, 6);
  const lastSemesterStart = subMonths(today, 12);
  const lastSemesterEnd = subMonths(today, 6);

  // Yearly
  const thisYearStart = startOfYear(today);
  const lastYearStart = startOfYear(subYears(today, 1));
  const lastYearEnd = endOfYear(subYears(today, 1));

  // Get date ranges based on selection
  const getDateRanges = () => {
    switch (selectedComparison) {
      case "daily":
        return {
          current: { start: today, end: today },
          previous: { start: yesterday, end: yesterday },
          currentLabel: "Hoje",
          previousLabel: "Ontem",
        };
      case "weekly":
        return {
          current: { start: thisWeekStart, end: today },
          previous: { start: lastWeekStart, end: lastWeekEnd },
          currentLabel: "Esta Semana",
          previousLabel: "Semana Passada",
        };
      case "monthly":
        return {
          current: { start: thisMonthStart, end: today },
          previous: { start: lastMonthStart, end: lastMonthEnd },
          currentLabel: "Este Mês",
          previousLabel: "Mês Passado",
        };
      case "quarterly":
        return {
          current: { start: thisQuarterStart, end: today },
          previous: { start: lastQuarterStart, end: lastQuarterEnd },
          currentLabel: "Este Trimestre",
          previousLabel: "Trimestre Anterior",
        };
      case "semester":
        return {
          current: { start: thisSemesterStart, end: today },
          previous: { start: lastSemesterStart, end: lastSemesterEnd },
          currentLabel: "Últimos 6 Meses",
          previousLabel: "6 Meses Anteriores",
        };
      case "yearly":
        return {
          current: { start: thisYearStart, end: today },
          previous: { start: lastYearStart, end: lastYearEnd },
          currentLabel: "Este Ano",
          previousLabel: "Ano Passado",
        };
      case "custom":
        return {
          current: {
            start: customCurrentStart ? new Date(customCurrentStart) : today,
            end: customCurrentEnd ? new Date(customCurrentEnd) : today
          },
          previous: {
            start: customPreviousStart ? new Date(customPreviousStart) : yesterday,
            end: customPreviousEnd ? new Date(customPreviousEnd) : yesterday
          },
          currentLabel: "Período Atual",
          previousLabel: "Período Anterior",
        };
      default:
        return {
          current: { start: today, end: today },
          previous: { start: yesterday, end: yesterday },
          currentLabel: "Atual",
          previousLabel: "Anterior",
        };
    }
  };

  const dateRanges = getDateRanges();

  // Fetch gateways
  const { data: gateways } = useQuery({
    queryKey: ["gateways"],
    queryFn: gatewaysService.list,
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["products", selectedGateway],
    queryFn: () => analyticsService.getProducts(selectedGateway || undefined),
  });

  // Build filters
  const buildFilters = () => ({
    startDate: format(dateRanges.current.start, "yyyy-MM-dd"),
    endDate: format(dateRanges.current.end, "yyyy-MM-dd"),
    gatewayId: selectedGateway || undefined,
    productKey: selectedProduct || undefined,
  });

  // Current period data
  const { data: currentData, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ["report-current", selectedComparison, customCurrentStart, customCurrentEnd, selectedGateway, selectedProduct],
    queryFn: () =>
      analyticsService.getSalesByPeriod({
        startDate: format(dateRanges.current.start, "yyyy-MM-dd"),
        endDate: format(dateRanges.current.end, "yyyy-MM-dd"),
        gatewayId: selectedGateway || undefined,
        productKey: selectedProduct || undefined,
      }),
  });

  // Previous period data
  const { data: previousData, isLoading: isLoadingPrevious } = useQuery({
    queryKey: ["report-previous", selectedComparison, customPreviousStart, customPreviousEnd, selectedGateway, selectedProduct],
    queryFn: () =>
      analyticsService.getSalesByPeriod({
        startDate: format(dateRanges.previous.start, "yyyy-MM-dd"),
        endDate: format(dateRanges.previous.end, "yyyy-MM-dd"),
        gatewayId: selectedGateway || undefined,
        productKey: selectedProduct || undefined,
      }),
  });

  // Affiliates data
  const { data: affiliatesData, isLoading: isLoadingAffiliates } = useQuery({
    queryKey: ["affiliates", selectedComparison, customCurrentStart, customCurrentEnd, selectedGateway, affiliatePage, affiliateLimit, affiliateSearchDebounced],
    queryFn: () =>
      analyticsService.getAffiliates({
        startDate: format(dateRanges.current.start, "yyyy-MM-dd"),
        endDate: format(dateRanges.current.end, "yyyy-MM-dd"),
        gatewayId: selectedGateway || undefined,
        page: affiliatePage,
        limit: affiliateLimit,
        search: affiliateSearchDebounced || undefined,
      }),
  });

  // Heatmap data
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ["heatmap", selectedComparison, customCurrentStart, customCurrentEnd, selectedGateway],
    queryFn: () =>
      analyticsService.getHeatmap({
        startDate: format(dateRanges.current.start, "yyyy-MM-dd"),
        endDate: format(dateRanges.current.end, "yyyy-MM-dd"),
        gatewayId: selectedGateway || undefined,
      }),
  });

  // Calculate totals
  const sumData = (data: typeof currentData) => {
    if (!data) return { sales: 0, approved: 0, revenue: 0 };
    return data.reduce(
      (acc, item) => ({
        sales: acc.sales + item.total,
        approved: acc.approved + item.approved,
        revenue: acc.revenue + item.revenue,
      }),
      { sales: 0, approved: 0, revenue: 0 }
    );
  };

  const currentTotals = sumData(currentData);
  const previousTotals = sumData(previousData);

  // Chart data
  const chartData = useMemo(() => {
    if (!currentData) return [];
    return currentData.map((item) => ({
      date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
      vendas: item.total,
      aprovadas: item.approved,
      faturamento: item.revenue / 100,
    }));
  }, [currentData]);

  const isLoading = isLoadingCurrent || isLoadingPrevious;

  // Export handlers
  const handleExportCSV = () => {
    const exportData = chartData.map(item => ({
      Data: item.date,
      "Total Vendas": item.vendas,
      "Vendas Aprovadas": item.aprovadas,
      "Faturamento (R$)": (item.faturamento * 100).toFixed(2),
    }));
    exportToCSV(exportData, `relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportToPDF("report-content", `relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}`);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios e Comparativos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Compare o desempenho em diferentes períodos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || selectedGateway || selectedProduct
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {(selectedGateway || selectedProduct) && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {[selectedGateway, selectedProduct].filter(Boolean).length}
              </span>
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Exportar
              <ChevronDown className="h-4 w-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Exportar Excel/CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  Exportar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-primary/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Gateway
              </label>
              <select
                value={selectedGateway}
                onChange={(e) => {
                  setSelectedGateway(e.target.value);
                  setSelectedProduct("");
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos os Gateways</option>
                {gateways?.map((gw) => (
                  <option key={gw.id} value={gw.id}>
                    {gw.gateway} {gw.isActive ? "" : "(Inativo)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Produto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos os Produtos</option>
                {products?.map((p) => (
                  <option key={p.productKey} value={p.productKey}>
                    {p.productName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedGateway || selectedProduct) && (
            <button
              onClick={() => {
                setSelectedGateway("");
                setSelectedProduct("");
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Comparison Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {COMPARISON_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedComparison(option.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedComparison === option.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {selectedComparison === "custom" && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Período Atual</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Início</label>
                    <input
                      type="date"
                      value={customCurrentStart}
                      onChange={(e) => setCustomCurrentStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Fim</label>
                    <input
                      type="date"
                      value={customCurrentEnd}
                      onChange={(e) => setCustomCurrentEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Período Anterior (para comparação)</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Início</label>
                    <input
                      type="date"
                      value={customPreviousStart}
                      onChange={(e) => setCustomPreviousStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Fim</label>
                    <input
                      type="date"
                      value={customPreviousEnd}
                      onChange={(e) => setCustomPreviousEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div id="report-content" ref={reportRef}>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <ComparisonCard
              title="Vendas Totais"
              icon={ShoppingCart}
              current={currentTotals.sales}
              previous={previousTotals.sales}
              currentLabel={dateRanges.currentLabel}
              previousLabel={dateRanges.previousLabel}
            />
            <ComparisonCard
              title="Vendas Aprovadas"
              icon={TrendingUp}
              current={currentTotals.approved}
              previous={previousTotals.approved}
              currentLabel={dateRanges.currentLabel}
              previousLabel={dateRanges.previousLabel}
            />
            <ComparisonCard
              title="Faturamento"
              icon={DollarSign}
              current={currentTotals.revenue}
              previous={previousTotals.revenue}
              currentLabel={dateRanges.currentLabel}
              previousLabel={dateRanges.previousLabel}
              format="currency"
            />
          </div>

          {/* Summary Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumo do Período: {dateRanges.currentLabel}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{currentTotals.sales}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vendas Totais</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600">{currentTotals.approved}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovadas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(currentTotals.revenue)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Faturamento</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">
                  {currentTotals.sales > 0
                    ? ((currentTotals.approved / currentTotals.sales) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversão</p>
              </div>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mapa de Calor: Vendas por Hora e Dia da Semana
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Identifique os melhores horários e dias para vendas
            </p>
            {isLoadingHeatmap ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : heatmapData?.heatmapData && heatmapData.heatmapData.length > 0 ? (
              <SalesHeatmap data={heatmapData.heatmapData} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Sem dados suficientes para gerar o heatmap
              </div>
            )}
          </div>

          {/* Affiliates Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top Afiliados - {dateRanges.currentLabel}
                </h3>
                {affiliatesData?.summary && (
                  <p className="text-sm text-gray-500 mt-1">
                    {affiliatesData.summary.totalAffiliates} afiliados | {formatNumber(affiliatesData.summary.totalSales)} vendas | {formatCurrency(affiliatesData.summary.totalCommission)} em comissões
                  </p>
                )}
              </div>
            </div>

            {/* Search + Items per page */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar afiliado por nome..."
                  value={affiliateSearch}
                  onChange={(e) => setAffiliateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={affiliateLimit}
                onChange={(e) => {
                  setAffiliateLimit(Number(e.target.value));
                  setAffiliatePage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>

            {isLoadingAffiliates ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <AffiliateTable
                  affiliates={affiliatesData?.affiliates || []}
                  currentLabel={dateRanges.currentLabel}
                  page={affiliatePage}
                  limit={affiliateLimit}
                />

                {/* Pagination Controls */}
                {affiliatesData?.pagination && affiliatesData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                      Exibindo {((affiliatePage - 1) * affiliateLimit) + 1}-{Math.min(affiliatePage * affiliateLimit, affiliatesData.pagination.totalItems)} de {affiliatesData.pagination.totalItems} afiliados
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAffiliatePage(p => Math.max(1, p - 1))}
                        disabled={affiliatePage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                        {affiliatePage} / {affiliatesData.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setAffiliatePage(p => Math.min(affiliatesData.pagination!.totalPages, p + 1))}
                        disabled={affiliatePage >= affiliatesData.pagination.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Charts Section */}
          {chartData.length > 0 && (
            <>
              {/* Bar Chart - Comparativo Diário */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Comparativo Diário de Vendas
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                          borderRadius: "12px",
                          color: "#F9FAFB",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="vendas"
                        fill="#3B82F6"
                        name="Total Vendas"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="aprovadas"
                        fill="#10B981"
                        name="Aprovadas"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Composed Chart - Vendas e Faturamento */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Evolução: Vendas vs Faturamento
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                          borderRadius: "12px",
                          color: "#F9FAFB",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "Faturamento" ? formatCurrency(value * 100) : value,
                          name
                        ]}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="aprovadas"
                        fill="#10B981"
                        name="Vendas Aprovadas"
                        radius={[4, 4, 0, 0]}
                        fillOpacity={0.8}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="faturamento"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Faturamento"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two columns: Pie Chart and Area Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Pie Chart - Distribuição */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Distribuição de Vendas
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Aprovadas", value: currentTotals.approved, color: "#10B981" },
                            { name: "Pendentes", value: currentTotals.sales - currentTotals.approved, color: "#F59E0B" },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: "Aprovadas", value: currentTotals.approved, color: "#10B981" },
                            { name: "Pendentes", value: currentTotals.sales - currentTotals.approved, color: "#F59E0B" },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                          formatter={(value: number) => [formatNumber(value), "Vendas"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Area Chart - Tendência */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tendência de Vendas
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorAprovadas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="vendas"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorVendas)"
                          name="Total"
                        />
                        <Area
                          type="monotone"
                          dataKey="aprovadas"
                          stroke="#10B981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAprovadas)"
                          name="Aprovadas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Radial Progress - Meta de Conversão */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Indicadores de Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="100%"
                          barSize={10}
                          data={[
                            {
                              name: "Conversão",
                              value: currentTotals.sales > 0
                                ? Math.round((currentTotals.approved / currentTotals.sales) * 100)
                                : 0,
                              fill: "#10B981",
                            },
                          ]}
                          startAngle={180}
                          endAngle={0}
                        >
                          <RadialBar
                            background={{ fill: "#374151" }}
                            dataKey="value"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {currentTotals.sales > 0
                        ? ((currentTotals.approved / currentTotals.sales) * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Taxa de Conversão</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="100%"
                          barSize={10}
                          data={[
                            {
                              name: "Crescimento",
                              value: Math.min(Math.abs(
                                previousTotals.sales > 0
                                  ? ((currentTotals.sales - previousTotals.sales) / previousTotals.sales) * 100
                                  : 0
                              ), 100),
                              fill: currentTotals.sales >= previousTotals.sales ? "#3B82F6" : "#EF4444",
                            },
                          ]}
                          startAngle={180}
                          endAngle={0}
                        >
                          <RadialBar
                            background={{ fill: "#374151" }}
                            dataKey="value"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-2xl font-bold ${currentTotals.sales >= previousTotals.sales ? "text-blue-600" : "text-red-500"}`}>
                      {previousTotals.sales > 0
                        ? `${currentTotals.sales >= previousTotals.sales ? "+" : ""}${(((currentTotals.sales - previousTotals.sales) / previousTotals.sales) * 100).toFixed(1)}%`
                        : "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">Crescimento em Vendas</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="100%"
                          barSize={10}
                          data={[
                            {
                              name: "Receita",
                              value: Math.min(Math.abs(
                                previousTotals.revenue > 0
                                  ? ((currentTotals.revenue - previousTotals.revenue) / previousTotals.revenue) * 100
                                  : 0
                              ), 100),
                              fill: currentTotals.revenue >= previousTotals.revenue ? "#8B5CF6" : "#EF4444",
                            },
                          ]}
                          startAngle={180}
                          endAngle={0}
                        >
                          <RadialBar
                            background={{ fill: "#374151" }}
                            dataKey="value"
                            cornerRadius={10}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-2xl font-bold ${currentTotals.revenue >= previousTotals.revenue ? "text-purple-600" : "text-red-500"}`}>
                      {previousTotals.revenue > 0
                        ? `${currentTotals.revenue >= previousTotals.revenue ? "+" : ""}${(((currentTotals.revenue - previousTotals.revenue) / previousTotals.revenue) * 100).toFixed(1)}%`
                        : "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">Crescimento em Receita</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Detailed Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Comparativo Detalhado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">{dateRanges.previousLabel}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Total de Vendas</span>
                    <span className="font-bold">{formatNumber(previousTotals.sales)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Aprovadas</span>
                    <span className="font-bold text-emerald-600">{formatNumber(previousTotals.approved)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Faturamento</span>
                    <span className="font-bold text-blue-600">{formatCurrency(previousTotals.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Ticket Médio</span>
                    <span className="font-bold">
                      {formatCurrency(previousTotals.approved > 0 ? previousTotals.revenue / previousTotals.approved : 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">{dateRanges.currentLabel}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Total de Vendas</span>
                    <span className="font-bold">{formatNumber(currentTotals.sales)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Aprovadas</span>
                    <span className="font-bold text-emerald-600">{formatNumber(currentTotals.approved)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Faturamento</span>
                    <span className="font-bold text-blue-600">{formatCurrency(currentTotals.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Ticket Médio</span>
                    <span className="font-bold">
                      {formatCurrency(currentTotals.approved > 0 ? currentTotals.revenue / currentTotals.approved : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Insights Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">Melhor dia do período</p>
                <p className="text-xl font-bold">
                  {chartData.length > 0
                    ? chartData.reduce((best, day) =>
                        day.aprovadas > (best?.aprovadas || 0) ? day : best
                      ).date
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">Média diária</p>
                <p className="text-xl font-bold">
                  {chartData.length > 0
                    ? formatNumber(
                        Math.round(
                          chartData.reduce((sum, day) => sum + day.vendas, 0) /
                            chartData.length
                        )
                      )
                    : 0}{" "}
                  vendas
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">Taxa de conversão</p>
                <p className="text-xl font-bold">
                  {currentTotals.sales > 0
                    ? ((currentTotals.approved / currentTotals.sales) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
