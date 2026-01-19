import api from "./api";
import { DashboardMetrics } from "@/types/api.types";

export interface AnalyticsFilter {
  period?: string;
  startDate?: string;
  endDate?: string;
  gatewayId?: string;
  productKey?: string;
}

export interface SalesByPeriod {
  date: string;
  total: number;
  approved: number;
  revenue: number;
}

export interface SalesByStatus {
  transStatusCode: number;
  _count: number;
  _sum: { transTotalValue: number | null };
}

export interface SalesByProduct {
  productKey: string;
  productName: string;
  _count: number;
  _sum: { transTotalValue: number | null };
}

export interface RealtimeMetrics {
  lastHourSales: number;
  lastHourApproved: number;
  lastHourRevenue: number;
  timestamp: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
}

export interface AffiliateStats {
  affiliates: Affiliate[];
  summary: {
    totalAffiliates: number;
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

export interface SalesBySourceData {
  affiliate: { count: number; revenue: number };
  direct: { count: number; revenue: number };
}

export interface Plan {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
}

export interface ProductWithPlans {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  totalAbandons: number;
  conversionRate: number;
  plans: Plan[];
}

export interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  count: number;
  revenue: number;
}

export interface HeatmapResponse {
  heatmapData: HeatmapData[];
}

export const analyticsService = {
  async getDashboard(filters?: AnalyticsFilter): Promise<DashboardMetrics> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.period) params.period = filters.period;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.productKey) params.productKey = filters.productKey;
    const response = await api.get("/api/analytics/dashboard", { params });
    return response.data.data;
  },

  async getRevenue(filters?: AnalyticsFilter): Promise<{ date: string; revenue: number }[]> {
    const params: Record<string, string> = {};
    if (filters?.period) params.period = filters.period;
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/analytics/revenue", { params });
    return response.data.data;
  },

  async getSalesByPeriod(filters?: AnalyticsFilter): Promise<SalesByPeriod[]> {
    const params: Record<string, string> = {};
    if (filters?.period) params.period = filters.period;
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.productKey) params.productKey = filters.productKey;
    const response = await api.get("/api/sales/by-period", { params });
    return response.data.data;
  },

  async getSalesByStatus(filters?: AnalyticsFilter): Promise<SalesByStatus[]> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.period) params.period = filters.period;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.productKey) params.productKey = filters.productKey;
    const response = await api.get("/api/sales/by-status", { params });
    return response.data.data;
  },

  async getSalesByProduct(filters?: AnalyticsFilter): Promise<SalesByProduct[]> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.period) params.period = filters.period;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/sales/by-product", { params });
    return response.data.data;
  },

  async getFunnel(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/funnel", { params });
    return response.data.data;
  },

  async getComparison(gatewayId?: string): Promise<unknown> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/comparison", { params });
    return response.data.data;
  },

  async getRealtime(gatewayId?: string): Promise<RealtimeMetrics> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/analytics/realtime", { params });
    return response.data.data;
  },

  async getProducts(gatewayId?: string): Promise<{ productKey: string; productName: string }[]> {
    const params = gatewayId ? { gatewayId } : {};
    const response = await api.get("/api/sales/by-product", { params });
    return response.data.data.map((p: SalesByProduct) => ({
      productKey: p.productKey,
      productName: p.productName,
    }));
  },

  async getAffiliates(filters?: AnalyticsFilter): Promise<AffiliateStats> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/analytics/affiliates", { params });
    return response.data.data;
  },

  async getSalesBySource(filters?: AnalyticsFilter): Promise<SalesBySourceData> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/analytics/sales-by-source", { params });
    return response.data.data;
  },

  async getProductsWithPlans(filters?: AnalyticsFilter): Promise<ProductWithPlans[]> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    const response = await api.get("/api/analytics/products-plans", { params });
    return response.data.data;
  },

  async getHeatmap(filters?: AnalyticsFilter): Promise<HeatmapResponse> {
    const params: Record<string, string> = {};
    if (filters?.gatewayId) params.gatewayId = filters.gatewayId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    const response = await api.get("/api/analytics/heatmap", { params });
    return response.data.data;
  },
};
