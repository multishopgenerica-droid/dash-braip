"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Users,
  Building2,
  Megaphone,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Zap,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import { analyticsService, AnalyticsFilter, Affiliate } from "@/services/analytics.service";
import { salesService } from "@/services/sales.service";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SkeletonKPICard, SkeletonChart, SkeletonTable } from "@/components/ui/skeleton";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

// Period options
const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "last7days", label: "7 dias" },
  { value: "last30days", label: "30 dias" },
  { value: "thisMonth", label: "Este mês" },
  { value: "lastMonth", label: "Mês passado" },
  { value: "custom", label: "Personalizado" },
];

// Status labels and colors
const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Aguardando", color: "#F59E0B" },
  2: { label: "Aprovado", color: "#10B981" },
  3: { label: "Cancelado", color: "#EF4444" },
  4: { label: "Chargeback", color: "#DC2626" },
  5: { label: "Devolvido", color: "#F97316" },
  6: { label: "Em Análise", color: "#3B82F6" },
  7: { label: "Estorno", color: "#8B5CF6" },
  8: { label: "Processando", color: "#6B7280" },
};

// Chart tooltip styles
const tooltipStyle = {
  backgroundColor: "rgba(23, 23, 23, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
};

const tooltipLabelStyle = {
  color: "#a3a3a3",
  fontSize: "12px",
  marginBottom: "4px",
};

// Period Selector Component
function PeriodSelector({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
      {PERIOD_OPTIONS.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
            selected === option.value
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {selected === option.value && (
            <motion.div
              layoutId="period-indicator"
              className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// Source Metric Card
function SourceMetricCard({
  title,
  icon: Icon,
  count,
  revenue,
  percentage,
  color,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  revenue: number;
  percentage: number;
  color: "purple" | "blue";
  delay?: number;
}) {
  const colors = {
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      iconBg: "bg-purple-500",
      text: "text-purple-600 dark:text-purple-400",
      badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    },
  };

  const styles = colors[color];

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-xl p-5 border border-neutral-200 dark:border-neutral-800",
        styles.bg
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2.5 rounded-xl", styles.iconBg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatNumber(count)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", styles.text)}>
          {formatCurrency(revenue)}
        </span>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", styles.badge)}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
}

// Affiliate Row Component
function AffiliateRow({
  affiliate,
  index,
}: {
  affiliate: Affiliate;
  index: number;
}) {
  const medals = ["bg-yellow-400", "bg-neutral-300", "bg-orange-400"];
  const medalBg = index < 3 ? medals[index] : "bg-neutral-200 dark:bg-neutral-700";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            index < 3 ? "text-white" : "text-neutral-500 dark:text-neutral-400",
            medalBg
          )}
        >
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[180px]">
            {affiliate.name}
          </p>
          <p className="text-xs text-neutral-500 truncate">{affiliate.email}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          {formatNumber(affiliate.totalSales)} vendas
        </p>
        <p className="text-xs text-emerald-600">{formatCurrency(affiliate.totalCommission)}</p>
      </div>
    </motion.div>
  );
}

// Quick Stat Item
function QuickStatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className={cn("text-sm font-semibold", color)}>{value}</span>
    </div>
  );
}

// Recent Sale Item
function RecentSaleItem({
  sale,
  index,
}: {
  sale: {
    id: string;
    clientName: string;
    productName: string;
    transTotalValue: number;
    transCreateDate: string;
  };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {sale.clientName?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
          {sale.clientName}
        </p>
        <p className="text-xs text-neutral-500 truncate">{sale.productName}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-emerald-600">
          {formatCurrency(sale.transTotalValue)}
        </p>
        <p className="text-xs text-neutral-400">
          {formatDateTime(sale.transCreateDate)}
        </p>
      </div>
    </motion.div>
  );
}

// Product Accordion Item
function ProductAccordionItem({
  product,
  isExpanded,
  onToggle,
}: {
  product: {
    id: string;
    name: string;
    totalSales: number;
    totalRevenue: number;
    plans?: { id: string; name: string; totalSales: number; totalRevenue: number }[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <motion.button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">{product.name}</p>
            <p className="text-xs text-neutral-500">
              {product.plans?.length || 0} planos • {formatNumber(product.totalSales)} vendas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-emerald-600">
            {formatCurrency(product.totalRevenue)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && product.plans && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 p-3">
              <div className="space-y-2">
                {product.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 px-3 bg-white dark:bg-neutral-900 rounded-lg"
                  >
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 break-words" title={plan.name}>
                      {plan.name}
                    </span>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0">
                      <span className="text-neutral-500 whitespace-nowrap">{formatNumber(plan.totalSales)} vendas</span>
                      <span className="font-medium text-emerald-600 whitespace-nowrap">{formatCurrency(plan.totalRevenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showAllAffiliates, setShowAllAffiliates] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "today":
        return {
          startDate: format(now, "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "last7days":
        return {
          startDate: format(subDays(now, 6), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "last30days":
        return {
          startDate: format(subDays(now, 29), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
        };
      case "thisMonth":
        return {
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          endDate: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      case "custom":
        return {
          startDate: customStartDate || format(subDays(now, 30), "yyyy-MM-dd"),
          endDate: customEndDate || format(now, "yyyy-MM-dd"),
        };
      default:
        return {};
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  const filters: AnalyticsFilter = {
    ...dateRange,
    productKey: selectedProduct || undefined,
  };

  // Queries
  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery({
    queryKey: ["dashboard-metrics", filters],
    queryFn: () => analyticsService.getDashboard(filters),
  });

  const { data: salesByPeriod, isLoading: salesByPeriodLoading } = useQuery({
    queryKey: ["sales-by-period", filters],
    queryFn: () => analyticsService.getSalesByPeriod(filters),
  });

  const { data: salesByStatus } = useQuery({
    queryKey: ["sales-by-status", filters],
    queryFn: () => analyticsService.getSalesByStatus(filters),
  });

  const { data: salesByProduct } = useQuery({
    queryKey: ["sales-by-product", filters],
    queryFn: () => analyticsService.getSalesByProduct(filters),
  });

  const { data: recentSales } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => salesService.getRecent(5),
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => analyticsService.getProducts(),
  });

  const { data: affiliateStats } = useQuery({
    queryKey: ["affiliate-stats", filters],
    queryFn: () => analyticsService.getAffiliates(filters),
  });

  const { data: salesBySource } = useQuery({
    queryKey: ["sales-by-source", filters],
    queryFn: () => analyticsService.getSalesBySource(filters),
  });

  const { data: productsWithPlans } = useQuery({
    queryKey: ["products-with-plans"],
    queryFn: () => analyticsService.getProductsWithPlans(),
  });

  // Format chart data
  const areaChartData = useMemo(() => {
    if (!salesByPeriod) return [];
    return salesByPeriod.map((item) => ({
      date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
      Vendas: item.total,
      Aprovadas: item.approved,
      Faturamento: item.revenue / 100,
    }));
  }, [salesByPeriod]);

  const pieChartData = useMemo(() => {
    if (!salesByStatus) return [];
    return salesByStatus
      .filter((item) => item._count > 0)
      .map((item) => ({
        name: STATUS_CONFIG[item.transStatusCode]?.label || `Status ${item.transStatusCode}`,
        value: item._count,
        color: STATUS_CONFIG[item.transStatusCode]?.color || "#6B7280",
      }));
  }, [salesByStatus]);

  // Calculate sales by source percentages
  const sourceTotal = (salesBySource?.affiliate?.count || 0) + (salesBySource?.direct?.count || 0);
  const affiliatePercentage = sourceTotal > 0 ? ((salesBySource?.affiliate?.count || 0) / sourceTotal) * 100 : 0;
  const directPercentage = sourceTotal > 0 ? ((salesBySource?.direct?.count || 0) / sourceTotal) * 100 : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Visão geral do seu negócio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} />

          {/* Custom Date Range */}
          <AnimatePresence>
            {selectedPeriod === "custom" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm",
                    "bg-white dark:bg-neutral-800",
                    "border border-neutral-200 dark:border-neutral-700",
                    "text-neutral-700 dark:text-neutral-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                />
                <span className="text-neutral-400">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm",
                    "bg-white dark:bg-neutral-800",
                    "border border-neutral-200 dark:border-neutral-700",
                    "text-neutral-700 dark:text-neutral-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium",
              "bg-white dark:bg-neutral-800",
              "border border-neutral-200 dark:border-neutral-700",
              "text-neutral-700 dark:text-neutral-300",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all"
            )}
          >
            <option value="">Todos os produtos</option>
            {products?.map((product) => (
              <option key={product.productKey} value={product.productKey}>
                {product.productName}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Faturamento Aprovado"
          value={formatCurrency(metrics?.revenue?.approved || 0)}
          subtitle={metrics?.revenue?.pending ? `+ ${formatCurrency(metrics.revenue.pending)} pendente` : undefined}
          icon={DollarSign}
          trend={metrics?.trends?.revenueGrowth}
          variant="success"
          loading={metricsLoading}
        />
        <KPICard
          title="Vendas Aprovadas"
          value={formatNumber(metrics?.sales?.approved || 0)}
          icon={ShoppingCart}
          trend={metrics?.trends?.salesGrowth}
          variant="primary"
          loading={metricsLoading}
        />
        <KPICard
          title="Vendas Pendentes"
          value={formatNumber(metrics?.sales?.pending || 0)}
          subtitle={metrics?.revenue?.pending ? formatCurrency(metrics.revenue.pending) : "Aguardando pagamento"}
          icon={Clock}
          variant="warning"
          loading={metricsLoading}
        />
        <KPICard
          title="Canceladas"
          value={formatNumber(metrics?.sales?.canceled || 0)}
          subtitle={`${formatNumber(metrics?.sales?.chargebacks || 0)} chargebacks`}
          icon={XCircle}
          variant="error"
          loading={metricsLoading}
        />
      </motion.div>

      {/* Sales by Source */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader
            title="Vendas por Origem"
            description="Comparação entre vendas de afiliados e vendas diretas"
            action={
              <div className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                <Activity className="h-3 w-3" />
                <span>Tempo real</span>
              </div>
            }
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SourceMetricCard
                title="Vendas de Afiliados"
                icon={Megaphone}
                count={salesBySource?.affiliate?.count || 0}
                revenue={salesBySource?.affiliate?.revenue || 0}
                percentage={affiliatePercentage}
                color="purple"
              />
              <SourceMetricCard
                title="Vendas Diretas (Produtor)"
                icon={Building2}
                count={salesBySource?.direct?.count || 0}
                revenue={salesBySource?.direct?.revenue || 0}
                percentage={directPercentage}
                color="blue"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-6 pb-2">
            <CardHeader
              title="Vendas por Período"
              description="Acompanhe a evolução das suas vendas"
            />
          </div>
          <div className="h-80 px-2">
            {salesByPeriodLoading ? (
              <div className="p-4">
                <SkeletonChart />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAprovadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ stroke: "rgba(59, 130, 246, 0.2)", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Vendas"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVendas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Aprovadas"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAprovadas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Pie Chart */}
        <Card padding="none">
          <div className="p-6 pb-2">
            <CardHeader title="Status das Vendas" description="Distribuição por status" />
          </div>
          <div className="h-72 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value: number, name: string) => [formatNumber(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {pieChartData.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-neutral-500">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Affiliates and Products */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Affiliates */}
        <Card>
          <CardHeader
            title="Top Afiliados"
            description="Melhores vendedores do período"
            action={
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Users className="h-4 w-4" />
                <span>{affiliateStats?.summary?.totalAffiliates || 0}</span>
              </div>
            }
          />
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="text-center">
                <p className="text-xs text-neutral-500">Total Vendas</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  {formatNumber(affiliateStats?.summary?.totalSales || 0)}
                </p>
              </div>
              <div className="text-center border-x border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500">Receita</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(affiliateStats?.summary?.totalRevenue || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Comissões</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(affiliateStats?.summary?.totalCommission || 0)}
                </p>
              </div>
            </div>

            {/* Affiliates List */}
            <div className="space-y-1">
              {affiliateStats?.affiliates
                ?.slice(0, showAllAffiliates ? 10 : 5)
                .map((affiliate, index) => (
                  <AffiliateRow key={affiliate.id} affiliate={affiliate} index={index} />
                ))}
            </div>

            {(affiliateStats?.affiliates?.length || 0) > 5 && (
              <motion.button
                onClick={() => setShowAllAffiliates(!showAllAffiliates)}
                className="w-full mt-4 py-2.5 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1 rounded-lg hover:bg-primary/5 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {showAllAffiliates ? (
                  <>
                    Ver menos <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver mais afiliados <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            )}
          </CardContent>
        </Card>

        {/* Products with Plans */}
        <Card>
          <CardHeader
            title="Produtos e Planos"
            description="Performance por produto"
            action={
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Package className="h-4 w-4" />
                <span>{productsWithPlans?.filter((p) => p.totalSales > 0).length || 0}</span>
              </div>
            }
          />
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {productsWithPlans
                ?.filter((p) => p.totalSales > 0)
                .map((product) => (
                  <ProductAccordionItem
                    key={product.id}
                    product={product}
                    isExpanded={expandedProduct === product.id}
                    onToggle={() =>
                      setExpandedProduct(expandedProduct === product.id ? null : product.id)
                    }
                  />
                ))}

              {(!productsWithPlans || productsWithPlans.filter((p) => p.totalSales > 0).length === 0) && (
                <div className="text-center py-8 text-neutral-500">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto com vendas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader title="Resumo Rápido" description="Métricas principais" />
          <CardContent>
            <div className="space-y-1">
              <QuickStatItem
                label="Total de Vendas"
                value={formatNumber(metrics?.sales?.total || 0)}
                color="text-neutral-900 dark:text-white"
              />
              <QuickStatItem
                label="Ticket Médio"
                value={formatCurrency(metrics?.revenue?.ticketMedio || 0)}
                color="text-blue-600"
              />
              <QuickStatItem
                label="Taxa de Conversão"
                value={`${(metrics?.conversion?.rate || 0).toFixed(1)}%`}
                color="text-emerald-600"
              />
              <QuickStatItem
                label="Taxa de Chargeback"
                value={`${(metrics?.conversion?.chargebackRate || 0).toFixed(2)}%`}
                color="text-red-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Vendas Recentes"
            description="Últimas transações aprovadas"
            action={
              <motion.button
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                whileHover={{ x: 2 }}
              >
                Ver todas <ArrowUpRight className="h-3 w-3" />
              </motion.button>
            }
          />
          <CardContent>
            <div className="space-y-1">
              {recentSales?.slice(0, 5).map((sale, index) => (
                <RecentSaleItem key={sale.id} sale={sale} index={index} />
              ))}
              {(!recentSales || recentSales.length === 0) && (
                <div className="text-center py-8 text-neutral-500">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma venda recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
